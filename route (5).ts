import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, shipments, stores, trackingEvents } from "@/db/schema";
import { isAdmin, penggunaSaatIni } from "@/lib/auth";
import { hitungOngkir, jarakKm } from "@/lib/geo";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

function kodePesanan() {
  return "BH9-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
}
function nomorResi() {
  return "BX" + Math.floor(Math.random() * 900000000 + 100000000);
}

export async function GET(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const url = new URL(req.url);
  const kode = url.searchParams.get("kode");

  if (kode) {
    const rows = await db.select().from(orders).where(eq(orders.kode, kode)).limit(1);
    const o = rows[0];
    if (!o) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    const kirim = (await db.select().from(shipments).where(eq(shipments.orderId, o.id)).limit(1))[0];
    const jejak = kirim
      ? await db
          .select()
          .from(trackingEvents)
          .where(eq(trackingEvents.shipmentId, kirim.id))
          .orderBy(desc(trackingEvents.createdAt))
      : [];
    const toko = (await db.select().from(stores).where(eq(stores.id, o.storeId)).limit(1))[0];
    return NextResponse.json({ pesanan: o, items, kirim, jejak, toko });
  }

  let daftar;
  if (isAdmin(user)) {
    daftar = await db.select().from(orders).orderBy(desc(orders.createdAt));
  } else if (user.role === "pedagang") {
    const toko = (await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1))[0];
    daftar = toko
      ? await db.select().from(orders).where(eq(orders.storeId, toko.id)).orderBy(desc(orders.createdAt))
      : [];
  } else {
    daftar = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  }
  return NextResponse.json({ items: daftar });
}

export async function POST(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk checkout." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const keranjang: { productId: number; qty: number }[] = Array.isArray(body.items) ? body.items : [];
  if (keranjang.length === 0) {
    return NextResponse.json({ error: "Keranjang kosong." }, { status: 400 });
  }
  const namaPenerima = String(body.namaPenerima ?? "").trim();
  const teleponPenerima = String(body.teleponPenerima ?? "").trim();
  const alamatPenerima = String(body.alamatPenerima ?? "").trim();
  const lat = Number(body.lat ?? COMPANY.depo.lat);
  const lng = Number(body.lng ?? COMPANY.depo.lng);
  const metodeKirim = body.metodeKirim === "ambil-sendiri" ? "ambil-sendiri" : "bh9-express";
  if (!namaPenerima || !teleponPenerima || !alamatPenerima) {
    return NextResponse.json({ error: "Data penerima wajib lengkap." }, { status: 400 });
  }

  const ids = keranjang.map((i) => Number(i.productId));
  const daftarProduk = await db.select().from(products).where(inArray(products.id, ids));
  if (daftarProduk.length === 0) {
    return NextResponse.json({ error: "Produk tidak valid." }, { status: 400 });
  }

  const perToko = new Map<number, { productId: number; qty: number }[]>();
  for (const item of keranjang) {
    const p = daftarProduk.find((x) => x.id === Number(item.productId));
    if (!p) continue;
    const list = perToko.get(p.storeId) ?? [];
    list.push({ productId: p.id, qty: Math.max(1, Number(item.qty) || 1) });
    perToko.set(p.storeId, list);
  }

  const hasil: string[] = [];
  for (const [storeId, list] of perToko) {
    const toko = (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0];
    let subtotal = 0;
    const baris = list.map((it) => {
      const p = daftarProduk.find((x) => x.id === it.productId)!;
      const sub = p.harga * it.qty;
      subtotal += sub;
      return { productId: p.id, nama: p.nama, harga: p.harga, qty: it.qty, subtotal: sub };
    });
    const km =
      toko?.lat != null && toko?.lng != null ? jarakKm(toko.lat, toko.lng, lat, lng) : 2;
    const ongkir = metodeKirim === "ambil-sendiri" ? 0 : hitungOngkir(km, subtotal);
    const biayaLayanan = COMPANY.biayaLayanan;
    const total = subtotal + ongkir + biayaLayanan;
    const kode = kodePesanan();

    const inserted = await db
      .insert(orders)
      .values({
        kode,
        userId: user.id,
        storeId,
        subtotal,
        ongkir,
        biayaLayanan,
        total,
        status: "menunggu_pembayaran",
        statusPembayaran: "belum_bayar",
        metodeKirim,
        metodePembayaran: "dana-qris",
        namaPenerima,
        teleponPenerima,
        alamatPenerima,
        lat,
        lng,
        catatan: String(body.catatan ?? ""),
      })
      .returning({ id: orders.id });

    const orderId = inserted[0].id;
    await db.insert(orderItems).values(baris.map((b) => ({ ...b, orderId })));
    for (const b of baris) {
      const p = daftarProduk.find((x) => x.id === b.productId)!;
      await db
        .update(products)
        .set({ stok: Math.max(0, p.stok - b.qty), terjual: p.terjual + b.qty })
        .where(eq(products.id, b.productId));
    }

    if (metodeKirim === "bh9-express") {
      const kirim = await db
        .insert(shipments)
        .values({
          orderId,
          resi: nomorResi(),
          status: "menunggu_kurir",
          pickupLat: toko?.lat ?? COMPANY.depo.lat,
          pickupLng: toko?.lng ?? COMPANY.depo.lng,
          tujuanLat: lat,
          tujuanLng: lng,
          jarakKm: km,
          ongkir,
        })
        .returning({ id: shipments.id });
      await db.insert(trackingEvents).values({
        shipmentId: kirim[0].id,
        status: "menunggu_kurir",
        keterangan: "Pesanan dibuat. Menunggu pembayaran & penugasan kurir BH9 EXPRESS.",
        lat: toko?.lat,
        lng: toko?.lng,
      });
    }
    hasil.push(kode);
  }

  return NextResponse.json({ ok: true, kode: hasil });
}

export async function PATCH(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const kode = String(body.kode ?? "");
  const aksi = String(body.aksi ?? "");
  const rows = await db.select().from(orders).where(eq(orders.kode, kode)).limit(1);
  const o = rows[0];
  if (!o) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  const kirim = (await db.select().from(shipments).where(eq(shipments.orderId, o.id)).limit(1))[0];

  const catat = async (status: string, keterangan: string) => {
    if (kirim) {
      await db.insert(trackingEvents).values({ shipmentId: kirim.id, status, keterangan });
    }
  };

  if (aksi === "bukti") {
    if (o.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const buktiUrl = String(body.buktiUrl ?? "");
    if (!buktiUrl) return NextResponse.json({ error: "Bukti transfer wajib diunggah." }, { status: 400 });
    await db
      .update(orders)
      .set({ buktiUrl, statusPembayaran: "menunggu_verifikasi", status: "menunggu_verifikasi" })
      .where(eq(orders.id, o.id));
    await catat("menunggu_kurir", "Bukti pembayaran diunggah, menunggu verifikasi admin.");
    return NextResponse.json({ ok: true });
  }

  if (aksi === "verifikasi-bayar" || aksi === "tolak-bayar") {
    if (!isAdmin(user)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const lunas = aksi === "verifikasi-bayar";
    await db
      .update(orders)
      .set({
        statusPembayaran: lunas ? "lunas" : "ditolak",
        status: lunas ? "diproses" : "menunggu_pembayaran",
      })
      .where(eq(orders.id, o.id));
    await catat(
      "menunggu_kurir",
      lunas ? "Pembayaran terverifikasi admin. Pesanan diteruskan ke pedagang." : "Bukti pembayaran ditolak admin."
    );
    return NextResponse.json({ ok: true });
  }

  if (aksi === "siap-pickup") {
    const toko = (await db.select().from(stores).where(eq(stores.id, o.storeId)).limit(1))[0];
    if (!isAdmin(user) && toko?.ownerId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    await db.update(orders).set({ status: "siap_pickup" }).where(eq(orders.id, o.id));
    if (kirim) {
      await db.update(shipments).set({ status: "ditawarkan", updatedAt: new Date() }).where(eq(shipments.id, kirim.id));
      await catat("ditawarkan", "Barang siap diambil. Tugas pickup ditawarkan ke kurir BH9 EXPRESS.");
    }
    return NextResponse.json({ ok: true });
  }

  if (aksi === "selesai") {
    if (o.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    await db.update(orders).set({ status: "selesai" }).where(eq(orders.id, o.id));
    if (kirim) await db.update(shipments).set({ status: "selesai" }).where(eq(shipments.id, kirim.id));
    await catat("selesai", "Pesanan diterima konsumen. Transaksi selesai.");
    return NextResponse.json({ ok: true });
  }

  if (aksi === "batal") {
    if (o.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    await db.update(orders).set({ status: "dibatalkan" }).where(eq(orders.id, o.id));
    await catat("menunggu_kurir", "Pesanan dibatalkan.");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
