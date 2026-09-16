import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, stores } from "@/db/schema";
import { isAdmin, penggunaSaatIni } from "@/lib/auth";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

async function tokoSaya(userId: number) {
  const rows = await db.select().from(stores).where(eq(stores.ownerId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const milikSaya = url.searchParams.get("milikSaya");
  if (milikSaya) {
    const user = await penggunaSaatIni();
    if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
    const toko = await tokoSaya(user.id);
    if (!toko) return NextResponse.json({ items: [] });
    const items = await db.select().from(products).where(eq(products.storeId, toko.id));
    return NextResponse.json({ items, toko });
  }
  const items = await db
    .select({
      id: products.id,
      nama: products.nama,
      slug: products.slug,
      harga: products.harga,
      stok: products.stok,
      satuan: products.satuan,
      emoji: products.emoji,
      imageUrl: products.imageUrl,
      kategori: categories.nama,
      toko: stores.nama,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(and(eq(products.aktif, true), eq(stores.status, "aktif")));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "pedagang" && !isAdmin(user)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  const toko = await tokoSaya(user.id);
  if (!toko) return NextResponse.json({ error: "Toko belum tersedia." }, { status: 400 });
  if (toko.status !== "aktif") {
    return NextResponse.json(
      { error: "Toko Anda belum di-ACC oleh Owner/Admin." },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const nama = String(body.nama ?? "").trim();
  const harga = Number(body.harga ?? 0);
  const categoryId = Number(body.categoryId ?? 0);
  if (!nama || harga <= 0 || !categoryId) {
    return NextResponse.json({ error: "Nama, harga, dan kategori wajib diisi." }, { status: 400 });
  }
  const inserted = await db
    .insert(products)
    .values({
      storeId: toko.id,
      categoryId,
      nama,
      slug: `${slugify(nama)}-${Date.now().toString(36)}`,
      deskripsi: String(body.deskripsi ?? ""),
      harga,
      stok: Number(body.stok ?? 0),
      satuan: String(body.satuan ?? "pcs"),
      emoji: String(body.emoji ?? "🛒"),
      aktif: true,
    })
    .returning();
  return NextResponse.json({ ok: true, produk: inserted[0] });
}

export async function PATCH(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id ?? 0);
  const toko = await tokoSaya(user.id);
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const p = rows[0];
  if (!p) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  if (!isAdmin(user) && (!toko || toko.id !== p.storeId)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  await db
    .update(products)
    .set({
      nama: body.nama != null ? String(body.nama) : p.nama,
      deskripsi: body.deskripsi != null ? String(body.deskripsi) : p.deskripsi,
      harga: body.harga != null ? Number(body.harga) : p.harga,
      stok: body.stok != null ? Number(body.stok) : p.stok,
      satuan: body.satuan != null ? String(body.satuan) : p.satuan,
      emoji: body.emoji != null ? String(body.emoji) : p.emoji,
      categoryId: body.categoryId != null ? Number(body.categoryId) : p.categoryId,
      aktif: body.aktif != null ? Boolean(body.aktif) : p.aktif,
    })
    .where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id ?? 0);
  const toko = await tokoSaya(user.id);
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const p = rows[0];
  if (!p) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  if (!isAdmin(user) && (!toko || toko.id !== p.storeId)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}
