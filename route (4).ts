import { NextResponse } from "next/server";
import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, shipments, stores, trackingEvents } from "@/db/schema";
import { isAdmin, penggunaSaatIni } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "kurir" && !isAdmin(user)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const daftar = await db
    .select({
      kirim: shipments,
      pesanan: orders,
      toko: stores,
    })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(
      isAdmin(user)
        ? inArray(shipments.status, [
            "menunggu_kurir",
            "ditawarkan",
            "diterima",
            "pickup",
            "dalam_perjalanan",
            "selesai",
          ])
        : or(eq(shipments.kurirId, user.id), isNull(shipments.kurirId))
    )
    .orderBy(desc(shipments.createdAt));

  const tersedia = daftar.filter(
    (d) => d.kirim.status === "ditawarkan" && !d.kirim.kurirId
  );
  const tugasSaya = daftar.filter((d) => d.kirim.kurirId === user.id);
  return NextResponse.json({ tersedia, tugasSaya, semua: daftar });
}

export async function POST(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "kurir" && !isAdmin(user)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  if (user.status !== "aktif") {
    return NextResponse.json({ error: "Akun kurir belum di-ACC Owner/Admin." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const id = Number(body.shipmentId ?? 0);
  const aksi = String(body.aksi ?? "");
  const rows = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });

  const catat = (status: string, keterangan: string, lat?: number | null, lng?: number | null) =>
    db.insert(trackingEvents).values({ shipmentId: s.id, status, keterangan, lat, lng });

  if (aksi === "terima") {
    if (s.kurirId && s.kurirId !== user.id) {
      return NextResponse.json({ error: "Tugas sudah diambil kurir lain." }, { status: 400 });
    }
    await db
      .update(shipments)
      .set({ kurirId: user.id, status: "diterima", updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await catat("diterima", `Tugas diterima kurir ${user.nama}. Menuju toko untuk pickup.`, s.pickupLat, s.pickupLng);
    return NextResponse.json({ ok: true });
  }

  if (aksi === "tolak") {
    await db
      .update(shipments)
      .set({ status: "ditawarkan", kurirId: null, alasanTolak: String(body.alasan ?? "Ditolak kurir"), updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await catat("ditolak", `Tugas ditolak oleh kurir ${user.nama}. Dialihkan ke kurir lain.`);
    return NextResponse.json({ ok: true });
  }

  if (aksi === "pickup") {
    await db
      .update(shipments)
      .set({ status: "pickup", kurirLat: s.pickupLat, kurirLng: s.pickupLng, updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await catat("pickup", "Barang sudah diambil kurir dari toko mitra.", s.pickupLat, s.pickupLng);
    return NextResponse.json({ ok: true });
  }

  if (aksi === "jalan") {
    await db
      .update(shipments)
      .set({ status: "dalam_perjalanan", updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await db.update(orders).set({ status: "dikirim" }).where(eq(orders.id, s.orderId));
    await catat("dalam_perjalanan", "Kurir dalam perjalanan menuju alamat konsumen.", s.kurirLat, s.kurirLng);
    return NextResponse.json({ ok: true });
  }

  if (aksi === "posisi") {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    await db
      .update(shipments)
      .set({ kurirLat: lat, kurirLng: lng, updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await catat("dalam_perjalanan", "Posisi kurir diperbarui (live tracking).", lat, lng);
    return NextResponse.json({ ok: true });
  }

  if (aksi === "selesai") {
    await db
      .update(shipments)
      .set({ status: "selesai", kurirLat: s.tujuanLat, kurirLng: s.tujuanLng, updatedAt: new Date() })
      .where(eq(shipments.id, s.id));
    await db.update(orders).set({ status: "selesai" }).where(eq(orders.id, s.orderId));
    await catat("selesai", "Paket berhasil diserahkan ke penerima.", s.tujuanLat, s.tujuanLng);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
