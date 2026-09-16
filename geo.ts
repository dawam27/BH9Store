import { COMPANY } from "./company";

export function jarakKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
}

export function hitungOngkir(km: number, subtotal: number): number {
  if (subtotal >= COMPANY.ongkir.gratisDiAtas) return 0;
  const biaya = COMPANY.ongkir.dasar + Math.ceil(km) * COMPANY.ongkir.perKm;
  return Math.max(COMPANY.ongkir.minimum, Math.round(biaya / 500) * 500);
}

export function estimasiMenit(km: number): number {
  return Math.max(15, Math.round(km * 4) + 10);
}
