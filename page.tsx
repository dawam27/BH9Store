"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { useAuth } from "@/components/AuthContext";
import { COMPANY, ROLE_LABEL } from "@/lib/company";

export default function HalamanAkun() {
  const { user, memuat, muatUlang, keluar } = useAuth();
  const [form, setForm] = useState({ nama: "", telepon: "", alamat: "" });
  const [lat, setLat] = useState(COMPANY.depo.lat);
  const [lng, setLng] = useState(COMPANY.depo.lng);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    if (user) {
      setForm({ nama: user.nama, telepon: user.telepon ?? "", alamat: user.alamat ?? "" });
      if (user.lat && user.lng) {
        setLat(user.lat);
        setLng(user.lng);
      }
    }
  }, [user]);

  if (!memuat && !user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">👤</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-800">Belum masuk</h1>
        <Link href="/masuk" className="mt-5 inline-block rounded-xl bg-bh9-600 px-6 py-2.5 text-sm font-bold text-white">Masuk</Link>
      </div>
    );
  }
  if (!user) return <p className="p-8 text-center text-sm text-slate-500">Memuat…</p>;

  const simpan = async () => {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "perbarui-profil", ...form, lat, lng }),
    });
    setPesan(r.ok ? "Profil tersimpan ✓" : "Gagal menyimpan");
    await muatUlang();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-bh9-700 to-bh9-500 p-5 text-white shadow">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold">
            {user.nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-extrabold">{user.nama}</p>
            <p className="text-xs text-bh9-100">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
              {ROLE_LABEL[user.role]} • {user.status === "aktif" ? "Aktif" : "Pending ACC"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-800">Profil & Alamat Utama</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Nama</span>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">No. WhatsApp</span>
            <input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-slate-600">Alamat lengkap</span>
          <textarea rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
        </label>
        <p className="mb-2 mt-3 text-xs font-semibold text-slate-600">Pin lokasi rumah</p>
        <PetaInteraktif
          titik={[{ lat, lng, label: "Rumah Saya", tipe: "tujuan" }]}
          tinggi={230}
          zoomAwal={15}
          bisaPilih
          onPilih={(la, ln) => { setLat(la); setLng(ln); }}
        />
        <div className="mt-3 flex items-center gap-2">
          <button onClick={simpan} className="rounded-xl bg-bh9-600 px-5 py-2.5 text-sm font-bold text-white">Simpan Perubahan</button>
          {pesan && <span className="text-xs font-semibold text-emerald-600">{pesan}</span>}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/pesanan" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">📦 Pesanan Saya</Link>
        <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">💬 Bantuan Admin</a>
      </div>

      <button onClick={() => keluar().then(() => location.assign("/"))} className="w-full rounded-2xl border border-rose-200 bg-white p-3.5 text-sm font-bold text-rose-600">
        Keluar dari akun
      </button>
    </div>
  );
}
