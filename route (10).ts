import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shipments, stores, trackingEvents, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const resi = (url.searchParams.get("resi") ?? "").trim().toUpperCase();
  if (!resi) return NextResponse.json({ error: "Nomor resi wajib diisi." }, { status: 400 });
  const rows = await db
    .select({ kirim: shipments, pesanan: orders, toko: stores })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(eq(shipments.resi, resi))
    .limit(1);
  const data = rows[0];
  if (!data) return NextResponse.json({ error: "Resi tidak ditemukan." }, { status: 404 });
  const jejak = await db
    .select()
    .from(trackingEvents)
    .where(eq(trackingEvents.shipmentId, data.kirim.id))
    .orderBy(desc(trackingEvents.createdAt));
  let kurir: { nama: string; telepon: string | null } | null = null;
  if (data.kirim.kurirId) {
    const k = (await db.select().from(users).where(eq(users.id, data.kirim.kurirId)).limit(1))[0];
    if (k) kurir = { nama: k.nama, telepon: k.telepon };
  }
  return NextResponse.json({
    resi: data.kirim.resi,
    status: data.kirim.status,
    kode: data.pesanan.kode,
    toko: { nama: data.toko.nama, lat: data.kirim.pickupLat, lng: data.kirim.pickupLng },
    tujuan: {
      alamat: data.pesanan.alamatPenerima,
      nama: data.pesanan.namaPenerima,
      lat: data.kirim.tujuanLat,
      lng: data.kirim.tujuanLng,
    },
    kurir,
    posisiKurir: { lat: data.kirim.kurirLat, lng: data.kirim.kurirLng },
    jarakKm: data.kirim.jarakKm,
    jejak,
  });
}
