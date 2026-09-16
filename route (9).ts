import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { penggunaSaatIni } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const rows = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
  return NextResponse.json({ toko: rows[0] ?? null });
}

export async function PATCH(req: Request) {
  const user = await penggunaSaatIni();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const rows = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
  const toko = rows[0];
  if (!toko) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  await db
    .update(stores)
    .set({
      nama: body.nama != null ? String(body.nama) : toko.nama,
      deskripsi: body.deskripsi != null ? String(body.deskripsi) : toko.deskripsi,
      alamat: body.alamat != null ? String(body.alamat) : toko.alamat,
      telepon: body.telepon != null ? String(body.telepon) : toko.telepon,
      lat: body.lat != null ? Number(body.lat) : toko.lat,
      lng: body.lng != null ? Number(body.lng) : toko.lng,
    })
    .where(eq(stores.id, toko.id));
  return NextResponse.json({ ok: true });
}
