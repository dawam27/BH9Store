import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, orders, products, stores, users } from "@/db/schema";

export type ProdukPublik = {
  id: number;
  nama: string;
  slug: string;
  deskripsi: string | null;
  harga: number;
  hargaCoret: number | null;
  stok: number;
  satuan: string;
  emoji: string | null;
  terjual: number;
  kategoriNama: string;
  kategoriSlug: string;
  induk: string;
  tokoId: number;
  tokoNama: string;
  tokoSlug: string;
  tokoLat: number | null;
  tokoLng: number | null;
  tokoAlamat: string | null;
};

const pilih = {
  id: products.id,
  nama: products.nama,
  slug: products.slug,
  deskripsi: products.deskripsi,
  harga: products.harga,
  hargaCoret: products.hargaCoret,
  stok: products.stok,
  satuan: products.satuan,
  emoji: products.emoji,
  terjual: products.terjual,
  kategoriNama: categories.nama,
  kategoriSlug: categories.slug,
  induk: categories.induk,
  tokoId: stores.id,
  tokoNama: stores.nama,
  tokoSlug: stores.slug,
  tokoLat: stores.lat,
  tokoLng: stores.lng,
  tokoAlamat: stores.alamat,
};

export async function daftarProduk(opsi: {
  induk?: string;
  kategori?: string;
  q?: string;
  limit?: number;
  terlaris?: boolean;
}): Promise<ProdukPublik[]> {
  const syarat = [eq(products.aktif, true), eq(stores.status, "aktif")];
  if (opsi.induk) syarat.push(eq(categories.induk, opsi.induk));
  if (opsi.kategori) syarat.push(eq(categories.slug, opsi.kategori));
  if (opsi.q) {
    const key = `%${opsi.q}%`;
    const cocok = or(
      ilike(products.nama, key),
      ilike(products.deskripsi, key),
      ilike(categories.nama, key),
      ilike(stores.nama, key)
    );
    if (cocok) syarat.push(cocok);
  }
  const q = db
    .select(pilih)
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(and(...syarat))
    .orderBy(opsi.terlaris ? desc(products.terjual) : desc(products.createdAt))
    .limit(opsi.limit ?? 100);
  return (await q) as ProdukPublik[];
}

export async function produkBySlug(slug: string): Promise<ProdukPublik | null> {
  const rows = await db
    .select(pilih)
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(eq(products.slug, slug))
    .limit(1);
  return (rows[0] as ProdukPublik) ?? null;
}

export async function semuaKategori() {
  return db.select().from(categories).orderBy(categories.urutan);
}

export async function statistik() {
  const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  const [t] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(stores)
    .where(eq(stores.status, "aktif"));
  const [u] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  const [o] = await db.select({ n: sql<number>`count(*)::int` }).from(orders);
  return { produk: p?.n ?? 0, toko: t?.n ?? 0, pengguna: u?.n ?? 0, pesanan: o?.n ?? 0 };
}

export async function tokoAktif() {
  return db.select().from(stores).where(eq(stores.status, "aktif"));
}
