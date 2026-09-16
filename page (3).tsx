"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { useAuth } from "@/components/AuthContext";
import { COMPANY, ROLE_LABEL, STATUS_KIRIM, STATUS_PESANAN } from "@/lib/company";
import { rupiah, tanggalJam } from "@/lib/format";

type Pengguna = { id: number; nama: string; email: string; telepon: string | null; role: string; status: string; emailVerified: boolean; createdAt: string };
type Toko = { id: number; nama: string; ownerId: number; status: string; alamat: string | null; lat: number | null; lng: number | null };
type Pesanan = { kode: string; total: number; status: string; statusPembayaran: string; buktiUrl: string | null; namaPenerima: string; alamatPenerima: string; createdAt: string };
type Kirim = {
  kirim: { id: number; resi: string; status: string; kurirLat: number | null; kurirLng: number | null; pickupLat: number | null; pickupLng: number | null; tujuanLat: number | null; tujuanLng: number | null };
  pesanan: { kode: string; namaPenerima: string };
  toko: { nama: string };
};

export default function DashboardAdmin() {
  const { user, memuat } = useAuth();
  const [tab, setTab] = useState<"ringkas" | "acc" | "pengguna" | "pesanan" | "logistik" | "perusahaan">("ringkas");
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [toko, setToko] = useState<Toko[]>([]);
  const [pesanan, setPesanan] = useState<Pesanan[]>([]);
  const [kirim, setKirim] = useState<Kirim[]>([]);
  const [pesan, setPesan] = useState("");
  const [lihatBukti, setLihatBukti] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const [a, o, k] = await Promise.all([
      fetch("/api/admin", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/kurir", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setPengguna(a.pengguna ?? []);
    setToko(a.toko ?? []);
    setPesanan(o.items ?? []);
    setKirim(k.semua ?? []);
  }, []);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "owner")) void muat();
  }, [user, muat]);

  if (!memuat && (!user || (user.role !== "admin" && user.role !== "owner"))) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🔐</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-800">Khusus Owner & Admin</h1>
        <p className="mt-1.5 text-sm text-slate-500">Masuk dengan akun Owner/Admin BH9 Store.</p>
        <Link href="/masuk" className="mt-5 inline-block rounded-xl bg-bh9-600 px-6 py-2.5 text-sm font-bold text-white">Masuk</Link>
      </div>
    );
  }

  const aksiUser = async (userId: number, aksi: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi, userId, ...extra }),
    });
    setPesan(r.ok ? "Perubahan tersimpan ✓" : "Gagal memproses");
    await muat();
  };

  const aksiPesanan = async (kode: string, aksi: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, aksi }),
    });
    await muat();
  };

  const pending = pengguna.filter((p) => p.status === "pending");
  const perluVerifikasi = pesanan.filter((p) => p.statusPembayaran === "menunggu_verifikasi");
  const omzet = pesanan.filter((p) => p.statusPembayaran === "lunas").reduce((a, p) => a + p.total, 0);
  const titikLogistik = [
    { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo Pusat", tipe: "depo" as const },
    ...toko.filter((t) => t.lat && t.status === "aktif").map((t) => ({ lat: t.lat!, lng: t.lng!, label: t.nama, tipe: "toko" as const })),
    ...kirim.filter((k) => k.kirim.kurirLat).map((k) => ({ lat: k.kirim.kurirLat!, lng: k.kirim.kurirLng!, label: `Kurir ${k.kirim.resi}`, tipe: "kurir" as const })),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-bh9-800 to-bh9-600 p-5 text-white shadow">
        <p className="text-[11px] font-semibold text-bh9-100">MASTER DASHBOARD OPERASIONAL</p>
        <h1 className="text-xl font-extrabold">👑 {user?.role === "owner" ? "Owner" : "Admin"} BH9 Store</h1>
        <p className="text-xs text-bh9-100">{COMPANY.alamatSingkat}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[
            { n: pengguna.length, l: "Pengguna" },
            { n: pending.length, l: "Menunggu ACC" },
            { n: pesanan.length, l: "Pesanan" },
            { n: rupiah(omzet), l: "Omzet Lunas" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/15 py-2">
              <p className="text-base font-extrabold">{s.n}</p>
              <p className="text-[10px]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {[
          { id: "ringkas", l: "📊 Ringkasan" },
          { id: "acc", l: `✅ Verifikasi ACC (${pending.length})` },
          { id: "pengguna", l: "👥 Pengguna" },
          { id: "pesanan", l: `🧾 Pesanan & Pembayaran (${perluVerifikasi.length})` },
          { id: "logistik", l: "🛵 Logistik" },
          { id: "perusahaan", l: "🏢 Data Perusahaan" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${tab === t.id ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {pesan && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{pesan}</p>}

      {tab === "ringkas" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Pedagang aktif", v: pengguna.filter((p) => p.role === "pedagang" && p.status === "aktif").length, w: "text-emerald-600" },
            { l: "Kurir aktif", v: pengguna.filter((p) => p.role === "kurir" && p.status === "aktif").length, w: "text-amber-600" },
            { l: "Konsumen", v: pengguna.filter((p) => p.role === "konsumen").length, w: "text-bh9-700" },
            { l: "Pesanan selesai", v: pesanan.filter((p) => p.status === "selesai").length, w: "text-slate-700" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{s.l}</p>
              <p className={`text-2xl font-extrabold ${s.w}`}>{s.v}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-4">
            <h3 className="text-sm font-bold text-slate-700">Laporan Keuangan Ringkas</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-xl bg-slate-50 p-3">Omzet lunas: <b className="text-emerald-600">{rupiah(omzet)}</b></p>
              <p className="rounded-xl bg-slate-50 p-3">Total ongkir: <b className="text-bh9-700">{rupiah(pesanan.reduce((a) => a, 0))}</b></p>
              <p className="rounded-xl bg-slate-50 p-3">Menunggu pembayaran: <b className="text-amber-600">{pesanan.filter((p) => p.statusPembayaran === "belum_bayar").length}</b></p>
            </div>
          </div>
        </div>
      )}

      {tab === "acc" && (
        <div className="space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{p.nama}</p>
                <p className="text-[11px] text-slate-600">{p.email} • {p.telepon}</p>
                <p className="text-[11px] text-slate-500">
                  {ROLE_LABEL[p.role]} • Email {p.emailVerified ? "terverifikasi ✓" : "belum verifikasi"} • {tanggalJam(p.createdAt)}
                </p>
              </div>
              <button onClick={() => aksiUser(p.id, "acc")} className="rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-bold text-white">✓ ACC / Setujui</button>
              <button onClick={() => aksiUser(p.id, "tolak")} className="rounded-lg border border-rose-300 px-4 py-2 text-[11px] font-bold text-rose-600">✕ Tolak</button>
            </div>
          ))}
          {pending.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Tidak ada pendaftar menunggu persetujuan.</p>}
        </div>
      )}

      {tab === "pengguna" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pengguna.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-slate-700">{p.nama}</td>
                  <td className="p-3 text-slate-500">{p.email}</td>
                  <td className="p-3">
                    <select
                      value={p.role}
                      onChange={(e) => aksiUser(p.id, "ubah-role", { role: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                    >
                      {["konsumen", "pedagang", "kurir", "admin", "owner"].map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.status === "aktif" ? "bg-emerald-100 text-emerald-700" : p.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>{p.status}</span>
                  </td>
                  <td className="p-3">
                    {p.status !== "aktif" ? (
                      <button onClick={() => aksiUser(p.id, "aktifkan")} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">Aktifkan</button>
                    ) : (
                      <button onClick={() => aksiUser(p.id, "nonaktif")} className="rounded-lg border border-slate-300 px-2.5 py-1 text-[10px] font-bold text-slate-600">Nonaktifkan</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "pesanan" && (
        <div className="space-y-2">
          {pesanan.map((o) => (
            <div key={o.kode} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{o.kode}</p>
                  <p className="text-[11px] text-slate-500">{tanggalJam(o.createdAt)} • {o.namaPenerima}</p>
                  <p className="text-[11px] text-slate-500">📍 {o.alamatPenerima}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_PESANAN[o.status]?.kelas}`}>{STATUS_PESANAN[o.status]?.label}</span>
                  <p className="mt-1 text-sm font-extrabold text-bh9-700">{rupiah(o.total)}</p>
                  <p className="text-[10px] text-slate-500">Bayar: {o.statusPembayaran}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/pesanan/${o.kode}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700">Detail</Link>
                {o.buktiUrl && (
                  <button onClick={() => setLihatBukti(o.buktiUrl)} className="rounded-lg bg-sky-100 px-3 py-1.5 text-[11px] font-bold text-sky-700">🧾 Lihat Bukti</button>
                )}
                {o.statusPembayaran === "menunggu_verifikasi" && (
                  <>
                    <button onClick={() => aksiPesanan(o.kode, "verifikasi-bayar")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">✓ Validasi Pembayaran</button>
                    <button onClick={() => aksiPesanan(o.kode, "tolak-bayar")} className="rounded-lg border border-rose-300 px-3 py-1.5 text-[11px] font-bold text-rose-600">✕ Tolak Bukti</button>
                  </>
                )}
                {o.status === "diproses" && (
                  <button onClick={() => aksiPesanan(o.kode, "siap-pickup")} className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">📦 Tawarkan ke Kurir</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logistik" && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-extrabold text-slate-800">Peta Operasional Real-time</h2>
            <PetaInteraktif titik={titikLogistik} tinggi={300} zoomAwal={14} />
          </div>
          <div className="space-y-2">
            {kirim.map((k) => (
              <div key={k.kirim.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-slate-800">{k.kirim.resi}</p>
                  <p className="text-[11px] text-slate-500">{k.toko.nama} → {k.pesanan.namaPenerima} • {k.pesanan.kode}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_KIRIM[k.kirim.status]?.kelas}`}>
                  {STATUS_KIRIM[k.kirim.status]?.label ?? k.kirim.status}
                </span>
              </div>
            ))}
            {kirim.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Belum ada pengiriman.</p>}
          </div>
        </div>
      )}

      {tab === "perusahaan" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">Data Perusahaan</h2>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div><dt className="font-semibold text-slate-700">Nama Platform</dt><dd>{COMPANY.nama}</dd></div>
              <div><dt className="font-semibold text-slate-700">Jasa Kirim</dt><dd>{COMPANY.logistik}</dd></div>
              <div><dt className="font-semibold text-slate-700">Tagline</dt><dd>{COMPANY.tagline1} — {COMPANY.tagline2}</dd></div>
              <div><dt className="font-semibold text-slate-700">Alamat Depo</dt><dd>{COMPANY.alamat}</dd></div>
              <div><dt className="font-semibold text-slate-700">Email</dt><dd>{COMPANY.email}</dd></div>
              <div><dt className="font-semibold text-slate-700">WhatsApp</dt><dd>{COMPANY.whatsappNomor}</dd></div>
              <div><dt className="font-semibold text-slate-700">TikTok</dt><dd>{COMPANY.tiktok}</dd></div>
              <div><dt className="font-semibold text-slate-700">QRIS Merchant</dt><dd>{COMPANY.qris.merchant} — NMID {COMPANY.qris.nmid}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">Toko Mitra Terdaftar</h2>
            <div className="mt-3 space-y-2">
              {toko.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                  <span className="font-semibold text-slate-700">{t.nama}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {lihatBukti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setLihatBukti(null)}>
          <div className="max-h-[85vh] max-w-lg overflow-auto rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lihatBukti} alt="Bukti transfer" className="w-full rounded-xl" />
            <button className="mt-3 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
