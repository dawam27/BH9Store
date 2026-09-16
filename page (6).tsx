"use client";

import Image from "next/image";
import { useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { COMPANY, STATUS_KIRIM } from "@/lib/company";
import { tanggalJam } from "@/lib/format";

type Hasil = {
  resi: string;
  status: string;
  kode: string;
  toko: { nama: string; lat: number | null; lng: number | null };
  tujuan: { nama: string; alamat: string; lat: number | null; lng: number | null };
  kurir: { nama: string; telepon: string | null } | null;
  posisiKurir: { lat: number | null; lng: number | null };
  jarakKm: number | null;
  jejak: { id: number; keterangan: string; createdAt: string }[];
};

export default function HalamanEkspres() {
  const [resi, setResi] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState("");
  const [proses, setProses] = useState(false);

  const lacak = async (e: React.FormEvent) => {
    e.preventDefault();
    setProses(true);
    setError("");
    setHasil(null);
    const r = await fetch(`/api/track?resi=${encodeURIComponent(resi.trim())}`);
    const d = await r.json();
    setProses(false);
    if (!r.ok) setError(d.error);
    else setHasil(d);
  };

  const titik = hasil
    ? [
        ...(hasil.toko.lat ? [{ lat: hasil.toko.lat, lng: hasil.toko.lng!, label: hasil.toko.nama, tipe: "toko" as const }] : []),
        ...(hasil.posisiKurir.lat ? [{ lat: hasil.posisiKurir.lat, lng: hasil.posisiKurir.lng!, label: "Kurir", tipe: "kurir" as const }] : []),
        ...(hasil.tujuan.lat ? [{ lat: hasil.tujuan.lat, lng: hasil.tujuan.lng!, label: hasil.tujuan.nama, tipe: "tujuan" as const }] : []),
      ]
    : [
        { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo BH9 EXPRESS", tipe: "depo" as const },
      ];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-bh9-800 via-bh9-700 to-bh9-500 p-6 text-white shadow">
        <div className="flex items-center gap-3">
          <Image src="/images/bh9-logo.png" alt="BH9 EXPRESS" width={56} height={56} className="rounded-2xl ring-1 ring-white/30" />
          <div>
            <h1 className="text-2xl font-extrabold">BH9 EXPRESS</h1>
            <p className="text-xs text-bh9-100">Jasa kirim lokal resmi BH9 Store — {COMPANY.tagline1}</p>
          </div>
        </div>
        <form onSubmit={lacak} className="mt-5 flex gap-2">
          <input
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            placeholder="Masukkan nomor resi, cth: BX100000001"
            className="w-full rounded-xl border-0 px-4 py-3 text-sm text-slate-800 outline-none"
          />
          <button disabled={proses} className="shrink-0 rounded-xl bg-emas-500 px-5 py-3 text-sm font-bold text-bh9-900">
            {proses ? "…" : "Lacak"}
          </button>
        </form>
        {error && <p className="mt-2 rounded-lg bg-white/15 p-2 text-xs font-semibold">{error}</p>}
      </section>

      {hasil && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
            <div>
              <p className="text-sm font-extrabold text-slate-800">{hasil.resi}</p>
              <p className="text-[11px] text-slate-500">Pesanan {hasil.kode} • {hasil.jarakKm} km</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_KIRIM[hasil.status]?.kelas}`}>
              {STATUS_KIRIM[hasil.status]?.label ?? hasil.status}
            </span>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div>
              <PetaInteraktif titik={titik} tinggi={260} zoomAwal={15} garis />
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>🏪 Pickup: <b>{hasil.toko.nama}</b></p>
                <p>📍 Tujuan: <b>{hasil.tujuan.nama}</b> — {hasil.tujuan.alamat}</p>
                <p>🛵 Kurir: <b>{hasil.kurir?.nama ?? "Belum ditugaskan"}</b></p>
              </div>
            </div>
            <ol className="space-y-3">
              {hasil.jejak.map((j, i) => (
                <li key={j.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-bh9-600 denyut" : "bg-slate-300"}`} />
                    {i < hasil.jejak.length - 1 && <span className="h-full w-px flex-1 bg-slate-200" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{j.keterangan}</p>
                    <p className="text-[10px] text-slate-400">{tanggalJam(j.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { i: "📦", t: "Pickup di Toko Mitra", d: "Kurir menjemput barang langsung ke titik pin lokasi pedagang." },
          { i: "🧭", t: "Navigasi Lapangan", d: "Kurir dibekali peta rute & tombol navigasi ke alamat konsumen." },
          { i: "📡", t: "Live Tracking", d: "Posisi kurir dipantau real-time oleh konsumen, pedagang, dan admin." },
        ].map((k) => (
          <div key={k.t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-2xl">{k.i}</span>
            <p className="mt-1.5 text-sm font-bold text-slate-800">{k.t}</p>
            <p className="text-[11px] leading-snug text-slate-500">{k.d}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-800">Tarif Ongkir BH9 EXPRESS</h2>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>• Biaya dasar Rp{COMPANY.ongkir.dasar.toLocaleString("id-ID")} + Rp{COMPANY.ongkir.perKm.toLocaleString("id-ID")}/km</li>
          <li>• Minimum ongkir Rp{COMPANY.ongkir.minimum.toLocaleString("id-ID")}</li>
          <li>• GRATIS ONGKIR untuk belanja di atas Rp{COMPANY.ongkir.gratisDiAtas.toLocaleString("id-ID")}</li>
          <li>• Area layanan: Pauh Timur, Lamban Sigatal, dan sekitarnya (Kab. Sarolangun)</li>
        </ul>
      </section>
    </div>
  );
}
