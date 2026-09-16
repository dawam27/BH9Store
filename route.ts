import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, stores, users } from "@/db/schema";
import { isAdmin, penggunaSaatIni } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await penggunaSaatIni();
  if (!isAdmin(user)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const semuaUser = await db.select().from(users).orderBy(desc(users.createdAt));
  const semuaToko = await db.select().from(stores).orderBy(desc(stores.createdAt));
  return NextResponse.json({
    pengguna: semuaUser.map((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      telepon: u.telepon,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    })),
    toko: semuaToko,
  });
}

export async function POST(req: Request) {
  const user = await penggunaSaatIni();
  if (!isAdmin(user)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const aksi = String(body.aksi ?? "");
  const userId = Number(body.userId ?? 0);

  if (aksi === "acc" || aksi === "tolak" || aksi === "nonaktif" || aksi === "aktifkan") {
    const status =
      aksi === "acc" || aksi === "aktifkan" ? "aktif" : aksi === "tolak" ? "ditolak" : "nonaktif";
    await db
      .update(users)
      .set({ status, catatanAdmin: String(body.catatan ?? "") })
      .where(eq(users.id, userId));
    const toko = (await db.select().from(stores).where(eq(stores.ownerId, userId)).limit(1))[0];
    if (toko) {
      await db.update(stores).set({ status }).where(eq(stores.id, toko.id));
    }
    return NextResponse.json({ ok: true, status });
  }

  if (aksi === "ubah-role") {
    const role = String(body.role ?? "konsumen");
    await db.update(users).set({ role }).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  }

  if (aksi === "hapus-produk") {
    await db.delete(products).where(eq(products.id, Number(body.productId ?? 0)));
    return NextResponse.json({ ok: true });
  }

  if (aksi === "batalkan-pesanan") {
    await db.update(orders).set({ status: "dibatalkan" }).where(eq(orders.kode, String(body.kode ?? "")));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
