"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { COMPANY, STATUS_KIRIM, STATUS_PESANAN } from "@/lib/company";
import { rupiah, tanggalJam } from "@/lib/format";

type Data = {
  pesanan: {
    kode: string;
    total: number;
    subtotal: number;
    ongkir: number;
    biayaLayanan: number;
    status: string;
    statusPembayaran: string;
    metodeKirim: string;
    namaPenerima: string;
    teleponPenerima: string;
    alamatPenerima: string;
    catatan: string | null;
    buktiUrl: string | null;
    lat: number | null;
    lng: number | null;
    createdAt: string;
  };
  items: { id: number; nama: string; harga: number; qty: number; subtotal: number }[];
  kirim: {
    id: number;
    resi: string;
    status: string;
    pickupLat: number | null;
    pickupLng: number | null;
    tujuanLat: number | null;
    tujuanLng: number | null;
    kurirLat: number | null;
    kurirLng: number | null;
    jarakKm: number | null;
  } | null;
  jejak: { id: number; status: string; keterangan: string; createdAt: string }[];
  toko: { nama: string; alamat: string | null; lat: number | null; lng: number | null } | null;
};

export default function DetailPesanan() {
  const { kode } = useParams<{ kode: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [bukti, setBukti] = useState<string>("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const muat = useCallback(async () => {
    const r = await fetch(`/api/orders?kode=${kode}`, { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }, [kode]);

  useEffect(() => {
    void muat();
    const t = setInterval(muat, 10000); // live tracking polling
    return () => clearInterval(t);
  }, [muat]);

  const aksi = async (nama: string, extra: Record<string, unknown> = {}) => {
    setProses(true);
    const r = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, aksi: nama, ...extra }),
    });
    const d = await r.json();
    setProses(false);
    setPesan(r.ok ? "Berhasil diperbarui." : d.error);
    await muat();
  };

  if (!data) return <p className="p-8 text-center text-sm text-slate-500">Memuat pesanan…</p>;

  const o = data.pesanan;
  const st = STATUS_PESANAN[o.status] ?? { label: o.status, kelas: "bg-slate-100" };
  const titik = [
    ...(data.kirim?.pickupLat
      ? [{ lat: data.kirim.pickupLat, lng: data.kirim.pickupLng!, label: data.toko?.nama ?? "Toko", tipe: "toko" as const }]
      : []),
    ...(data.kirim?.kurirLat
      ? [{ lat: data.kirim.kurirLat, lng: data.kirim.kurirLng!, label: "Kurir BH9", tipe: "kurir" as const }]
      : []),
    ...(o.lat ? [{ lat: o.lat, lng: o.lng!, label: "Tujuan", tipe: "tujuan" as const }] : []),
  ];

  return (
    <div className="space-y-4">
      <Link href="/pesanan" className="text-xs font-semibold text-slate-500">← Kembali ke daftar pesanan</Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">{o.kode}</h1>
            <p className="text-[11px] text-slate-500">{tanggalJam(o.createdAt)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${st.kelas}`}>{st.label}</span>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <p>👤 {o.namaPenerima} • {o.teleponPenerima}</p>
          <p>🏪 {data.toko?.nama}</p>
          <p className="sm:col-span-2">📍 {o.alamatPenerima}</p>
          {o.catatan && <p className="sm:col-span-2">📝 {o.catatan}</p>}
          {data.kirim && <p>🚚 Resi: <b>{data.kirim.resi}</b> ({data.kirim.jarakKm} km)</p>}
        </div>
      </div>

      {/* PEMBAYARAN */}
      {o.statusPembayaran !== "lunas" && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-extrabold text-amber-900">💳 Pembayaran QRIS / DANA</h2>
          <p className="mt-1 text-xs text-amber-800">
            Total yang harus dibayar: <b className="text-base">{rupiah(o.total)}</b>
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
              <Image src="/api/qris" alt="Barcode DANA BH9 Store" width={200} height={200} className="mx-auto h-44 w-44" unoptimized />
              <p className="mt-1 text-[10px] font-bold text-slate-700">{COMPANY.qris.merchant}</p>
              <p className="text-[9px] text-slate-500">NMID: {COMPANY.qris.nmid} {COMPANY.qris.kode}</p>
              <p className="text-[9px] text-slate-500">DANA: {COMPANY.qris.dana}</p>
            </div>
            <div>
              <ol className="list-inside list-decimal space-y-1 text-xs text-amber-900">
                <li>Scan barcode di samping dengan aplikasi DANA / m-banking (QRIS).</li>
                <li>Transfer tepat sebesar {rupiah(o.total)}.</li>
                <li>Unggah bukti transfer di bawah ini.</li>
                <li>Admin BH9 Store memvalidasi, pesanan langsung diproses.</li>
              </ol>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setBukti(String(reader.result));
                  reader.readAsDataURL(f);
                }}
                className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-bh9-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              />
              {bukti && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bukti} alt="Pratinjau bukti" className="mt-2 h-28 rounded-xl border border-amber-200 object-cover" />
              )}
              <button
                disabled={!bukti || proses}
                onClick={() => aksi("bukti", { buktiUrl: bukti })}
                className="mt-3 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Unggah Bukti Transfer
              </button>
              {o.statusPembayaran === "menunggu_verifikasi" && (
                <p className="mt-2 rounded-lg bg-white p-2 text-[11px] font-semibold text-sky-700">
                  ⏳ Bukti sudah dikirim. Menunggu validasi admin.
                </p>
              )}
              {o.statusPembayaran === "ditolak" && (
                <p className="mt-2 rounded-lg bg-white p-2 text-[11px] font-semibold text-rose-700">
                  ❌ Bukti ditolak admin. Silakan unggah ulang bukti yang valid.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIVE TRACKING */}
      {data.kirim && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">🛵 Live Tracking BH9 EXPRESS</h2>
              <p className="text-[11px] text-slate-500">Diperbarui otomatis tiap 10 detik</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_KIRIM[data.kirim.status]?.kelas}`}>
              {STATUS_KIRIM[data.kirim.status]?.label ?? data.kirim.status}
            </span>
          </div>
          <div className="p-4">
            <PetaInteraktif titik={titik} tinggi={260} zoomAwal={15} garis />
            <ol className="mt-4 space-y-3">
              {data.jejak.map((j, i) => (
                <li key={j.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-bh9-600 denyut" : "bg-slate-300"}`} />
                    {i < data.jejak.length - 1 && <span className="h-full w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-semibold text-slate-700">{j.keterangan}</p>
                    <p className="text-[10px] text-slate-400">{tanggalJam(j.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* RINCIAN */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-800">Rincian Produk</h2>
        <div className="mt-3 space-y-2">
          {data.items.map((i) => (
            <div key={i.id} className="flex justify-between text-xs">
              <span className="text-slate-700">{i.nama} <span className="text-slate-400">× {i.qty}</span></span>
              <span className="font-semibold text-slate-700">{rupiah(i.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-dashed border-slate-200 pt-3 text-xs">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{rupiah(o.subtotal)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Ongkir</span><span>{rupiah(o.ongkir)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Biaya layanan</span><span>{rupiah(o.biayaLayanan)}</span></div>
          <div className="flex justify-between pt-1 text-base font-extrabold text-bh9-700"><span>Total</span><span>{rupiah(o.total)}</span></div>
        </div>
      </div>

      {pesan && <p className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-600">{pesan}</p>}

      <div className="flex flex-wrap gap-2">
        {o.status === "dikirim" && (
          <button onClick={() => aksi("selesai")} disabled={proses} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">
            ✓ Pesanan Diterima
          </button>
        )}
        {["menunggu_pembayaran", "menunggu_verifikasi"].includes(o.status) && (
          <button onClick={() => aksi("batal")} disabled={proses} className="rounded-xl border border-rose-300 px-4 py-2.5 text-xs font-bold text-rose-600">
            Batalkan Pesanan
          </button>
        )}
        <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-700">
          💬 Hubungi Admin
        </a>
      </div>
    </div>
  );
}
