"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthContext";

export default function HalamanMasuk() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [proses, setProses] = useState(false);
  const router = useRouter();
  const { muatUlang } = useAuth();

  const masuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setProses(true);
    setError("");
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "masuk", email, password }),
    });
    const d = await r.json();
    setProses(false);
    if (!r.ok) {
      if (d.butuhVerifikasi) {
        router.push(`/verifikasi?email=${encodeURIComponent(d.email)}`);
        return;
      }
      setError(d.error);
      return;
    }
    await muatUlang();
    router.push(
      d.role === "pedagang"
        ? "/dashboard/pedagang"
        : d.role === "kurir"
        ? "/dashboard/kurir"
        : d.role === "admin" || d.role === "owner"
        ? "/dashboard/admin"
        : "/"
    );
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-center"><Logo ukuran={56} teks={false} /></div>
        <h1 className="mt-3 text-center text-xl font-extrabold text-slate-800">Masuk ke BH9 Store</h1>
        <p className="mt-1 text-center text-xs text-slate-500">Dari Kito untuk Kito</p>

        <form onSubmit={masuk} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Kata sandi</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-600">{error}</p>}
          <button disabled={proses} className="w-full rounded-xl bg-bh9-600 py-3 text-sm font-bold text-white hover:bg-bh9-700 disabled:opacity-60">
            {proses ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-bh9-700">Daftar sekarang</Link>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-[11px] text-slate-600">
        <p className="font-bold text-slate-700">Akun demo (kata sandi: bh9store123)</p>
        <ul className="mt-1.5 space-y-0.5">
          <li>👑 owner@bh9store.id — Owner (kontrol penuh)</li>
          <li>🛠️ admin@bh9store.id — Admin operasional</li>
          <li>🏪 pedagang1@bh9store.id — Pedagang/Mitra</li>
          <li>🛵 kurir1@bh9store.id — Kurir BH9 EXPRESS</li>
          <li>🙋 konsumen@bh9store.id — Konsumen</li>
        </ul>
      </div>
    </div>
  );
}
