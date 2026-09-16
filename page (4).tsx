"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { useAuth } from "@/components/AuthContext";
import { COMPANY, STATUS_KIRIM } from "@/lib/company";
import { rupiah, tanggalJam } from "@/lib/format";

type Tugas = {
  kirim: {
    id: number; resi: string; status: string; jarakKm: number | null; ongkir: number;
    pickupLat: number | null; pickupLng: number | null;
    tujuanLat: number | null; tujuanLng: number | null;
    kurirLat: number | null; kurirLng: number | null; kurirId: number | null;
  };
  pesanan: { kode: string; total: number; namaPenerima: string; teleponPenerima: string; alamatPenerima: string; catatan: string | null; createdAt: string };
  toko: { nama: string; alamat: string | null };
};

export default function DashboardKurir() {
  const { user, memuat } = useAuth();
  const [tersedia, setTersedia] = useState<Tugas[]>([]);
  const [tugasSaya, setTugasSaya] = useState<Tugas[]>([]);
  const [tab, setTab] = useState<"tersedia" | "saya">("tersedia");
  const [pesan, setPesan] = useState("");

  const muat = useCallback(async () => {
    const r = await fetch("/api/kurir", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setTersedia(d.tersedia ?? []);
    setTugasSaya(d.tugasSaya ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    void muat();
    const t = setInterval(muat, 12000);
    return () => clearInterval(t);
  }, [user, muat]);

  if (!memuat && !user) return <Info judul="Masuk sebagai kurir" teks="Halaman khusus kurir BH9 EXPRESS." />;
  if (user && user.role !== "kurir" && user.role !== "admin" && user.role !== "owner")
    return <Info judul="Akses ditolak" teks="Akun Anda bukan kurir BH9 EXPRESS." />;
  if (user && user.role === "kurir" && user.status !== "aktif")
    return (
      <Info
        judul="Akun Pending ⏳"
        teks="Email terverifikasi. Akun kurir Anda menunggu persetujuan (ACC) Owner/Admin sebelum dapat menerima tugas pickup."
      />
    );

  const aksi = async (shipmentId: number, nama: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch("/api/kurir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentId, aksi: nama, ...extra }),
    });
    const d = await r.json();
    setPesan(r.ok ? "Status tugas diperbarui ✓" : d.error);
    await muat();
  };

  const kirimPosisi = (id: number) => {
    if (!navigator.geolocation) {
      setPesan("Perangkat tidak mendukung GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => aksi(id, "posisi", { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPesan("Izin lokasi ditolak. Aktifkan GPS untuk live tracking.")
    );
  };

  const daftar = tab === "tersedia" ? tersedia : tugasSaya;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow">
        <p className="text-[11px] font-semibold text-amber-50">DASHBOARD KURIR</p>
        <h1 className="text-xl font-extrabold">🛵 BH9 EXPRESS</h1>
        <p className="text-xs text-amber-50">{user?.nama} • Depo: {COMPANY.alamatSingkat}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/20 py-2"><p className="text-lg font-extrabold">{tersedia.length}</p><p className="text-[10px]">Tugas Tersedia</p></div>
          <div className="rounded-xl bg-white/20 py-2"><p className="text-lg font-extrabold">{tugasSaya.filter((t) => t.kirim.status !== "selesai").length}</p><p className="text-[10px]">Sedang Jalan</p></div>
          <div className="rounded-xl bg-white/20 py-2"><p className="text-lg font-extrabold">{tugasSaya.filter((t) => t.kirim.status === "selesai").length}</p><p className="text-[10px]">Selesai</p></div>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: "tersedia", l: `📥 Tugas Pickup (${tersedia.length})` },
          { id: "saya", l: `🧭 Tugas Saya (${tugasSaya.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold ${tab === t.id ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {pesan && <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">{pesan}</p>}

      <div className="space-y-3">
        {daftar.map((t) => {
          const st = STATUS_KIRIM[t.kirim.status] ?? { label: t.kirim.status, kelas: "bg-slate-100" };
          const titik = [
            ...(t.kirim.pickupLat ? [{ lat: t.kirim.pickupLat, lng: t.kirim.pickupLng!, label: t.toko.nama, tipe: "toko" as const }] : []),
            ...(t.kirim.kurirLat ? [{ lat: t.kirim.kurirLat, lng: t.kirim.kurirLng!, label: "Saya", tipe: "kurir" as const }] : []),
            ...(t.kirim.tujuanLat ? [{ lat: t.kirim.tujuanLat, lng: t.kirim.tujuanLng!, label: t.pesanan.namaPenerima, tipe: "tujuan" as const }] : []),
          ];
          return (
            <div key={t.kirim.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800">{t.kirim.resi}</p>
                  <p className="text-[11px] text-slate-500">Pesanan {t.pesanan.kode} • {tanggalJam(t.pesanan.createdAt)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.kelas}`}>{st.label}</span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="space-y-2 text-xs text-slate-600">
                  <p>🏪 <b>Pickup:</b> {t.toko.nama}<br /><span className="text-slate-500">{t.toko.alamat}</span></p>
                  <p>📍 <b>Tujuan:</b> {t.pesanan.namaPenerima} ({t.pesanan.teleponPenerima})<br /><span className="text-slate-500">{t.pesanan.alamatPenerima}</span></p>
                  {t.pesanan.catatan && <p>📝 {t.pesanan.catatan}</p>}
                  <p>📏 Jarak: <b>{t.kirim.jarakKm} km</b> • Ongkir: <b className="text-bh9-700">{rupiah(t.kirim.ongkir)}</b></p>
                  <p>💰 Nilai pesanan: {rupiah(t.pesanan.total)}</p>
                </div>
                <PetaInteraktif titik={titik} tinggi={180} zoomAwal={15} garis />
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
                {t.kirim.status === "ditawarkan" && !t.kirim.kurirId && (
                  <>
                    <button onClick={() => aksi(t.kirim.id, "terima")} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white">✓ Terima Tugas</button>
                    <button onClick={() => aksi(t.kirim.id, "tolak")} className="rounded-lg border border-rose-300 px-3.5 py-2 text-[11px] font-bold text-rose-600">✕ Tolak</button>
                  </>
                )}
                {t.kirim.status === "diterima" && (
                  <button onClick={() => aksi(t.kirim.id, "pickup")} className="rounded-lg bg-violet-600 px-3.5 py-2 text-[11px] font-bold text-white">📦 Sudah Pickup di Toko</button>
                )}
                {t.kirim.status === "pickup" && (
                  <button onClick={() => aksi(t.kirim.id, "jalan")} className="rounded-lg bg-blue-600 px-3.5 py-2 text-[11px] font-bold text-white">🛵 Mulai Perjalanan</button>
                )}
                {["pickup", "dalam_perjalanan"].includes(t.kirim.status) && (
                  <>
                    <button onClick={() => kirimPosisi(t.kirim.id)} className="rounded-lg bg-slate-800 px-3.5 py-2 text-[11px] font-bold text-white">📡 Kirim Posisi (GPS)</button>
                    <button onClick={() => aksi(t.kirim.id, "selesai")} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white">✓ Paket Terkirim</button>
                  </>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${t.kirim.tujuanLat},${t.kirim.tujuanLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-600"
                >
                  🧭 Navigasi Lapangan
                </a>
                <Link href={`/pesanan/${t.pesanan.kode}`} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-600">Detail</Link>
              </div>
            </div>
          );
        })}
        {daftar.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">🛵</p>
            <p className="mt-2 text-sm text-slate-500">
              {tab === "tersedia" ? "Belum ada tugas pickup yang ditawarkan." : "Belum ada tugas yang Anda ambil."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ judul, teks }: { judul: string; teks: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-4xl">🛵</p>
      <h1 className="mt-3 text-lg font-extrabold text-slate-800">{judul}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{teks}</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-bh9-600 px-6 py-2.5 text-sm font-bold text-white">Kembali ke Beranda</Link>
    </div>
  );
}
