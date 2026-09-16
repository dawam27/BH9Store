"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Logo from "@/components/Logo";

const PERAN = [
  { id: "konsumen", nama: "Konsumen", ikon: "🙋", ket: "Langsung belanja & lacak pesanan" },
  { id: "pedagang", nama: "Pedagang / Mitra", ikon: "🏪", ket: "Perlu ACC Owner/Admin" },
  { id: "kurir", nama: "Kurir BH9 EXPRESS", ikon: "🛵", ket: "Perlu ACC Owner/Admin" },
];

function FormDaftar() {
  const sp = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState(sp.get("role") ?? "konsumen");
  const [form, setForm] = useState({ nama: "", email: "", telepon: "", password: "", namaToko: "" });
  const [error, setError] = useState("");
  const [proses, setProses] = useState(false);

  const ubah = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const daftar = async (e: React.FormEvent) => {
    e.preventDefault();
    setProses(true);
    setError("");
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "daftar", role, ...form }),
    });
    const d = await r.json();
    setProses(false);
    if (!r.ok) {
      setError(d.error);
      return;
    }
    router.push(`/verifikasi?email=${encodeURIComponent(d.email)}&kode=${d.otp}`);
  };

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-center"><Logo ukuran={56} teks={false} /></div>
        <h1 className="mt-3 text-center text-xl font-extrabold text-slate-800">Buat Akun Baru</h1>
        <p className="mt-1 text-center text-xs text-slate-500">
          Verifikasi email wajib — akun aktif setelah email dikonfirmasi.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {PERAN.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setRole(p.id)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                role === p.id ? "border-bh9-600 bg-bh9-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{p.ikon}</span>
              <p className="mt-1 text-xs font-bold text-slate-800">{p.nama}</p>
              <p className="text-[10px] leading-snug text-slate-500">{p.ket}</p>
            </button>
          ))}
        </div>

        <form onSubmit={daftar} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Nama lengkap</span>
            <input required value={form.nama} onChange={(e) => ubah("nama", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
          {role === "pedagang" && (
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Nama toko / usaha</span>
              <input required value={form.namaToko} onChange={(e) => ubah("namaToko", e.target.value)} placeholder="cth: Warung Mak Ijah" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Email aktif</span>
              <input type="email" required value={form.email} onChange={(e) => ubah("email", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">No. WhatsApp</span>
              <input value={form.telepon} onChange={(e) => ubah("telepon", e.target.value)} placeholder="08xxxxxxxxxx" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Kata sandi (min. 6 karakter)</span>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => ubah("password", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>

          {role !== "konsumen" && (
            <p className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800">
              ⚠️ Setelah verifikasi email, status akun <b>PENDING</b> sampai disetujui (ACC) Owner/Admin BH9 Store.
            </p>
          )}
          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-600">{error}</p>}
          <button disabled={proses} className="w-full rounded-xl bg-bh9-600 py-3 text-sm font-bold text-white hover:bg-bh9-700 disabled:opacity-60">
            {proses ? "Mengirim kode…" : "Daftar & Kirim Kode Verifikasi"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Sudah punya akun? <Link href="/masuk" className="font-bold text-bh9-700">Masuk</Link>
        </p>
      </div>
    </div>
  );
}

export default function HalamanDaftar() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-slate-500">Memuat…</p>}>
      <FormDaftar />
    </Suspense>
  );
}
