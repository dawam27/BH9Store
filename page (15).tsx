"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthContext";
import { COMPANY } from "@/lib/company";

function IsiVerifikasi() {
  const sp = useSearchParams();
  const router = useRouter();
  const { muatUlang } = useAuth();
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [kode, setKode] = useState("");
  const [kodeDemo, setKodeDemo] = useState(sp.get("kode") ?? "");
  const [error, setError] = useState("");
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (sp.get("kode")) setKode(sp.get("kode")!);
  }, [sp]);

  const verifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setProses(true);
    setError("");
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "verifikasi", email, kode }),
    });
    const d = await r.json();
    setProses(false);
    if (!r.ok) {
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

  const kirimUlang = async () => {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "kirim-ulang", email }),
    });
    const d = await r.json();
    if (r.ok) {
      setKodeDemo(d.otp);
      setError("");
    } else setError(d.error);
  };

  return (
    <div className="mx-auto max-w-md py-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-center"><Logo ukuran={56} teks={false} /></div>
        <h1 className="mt-3 text-center text-xl font-extrabold text-slate-800">Verifikasi Email</h1>
        <p className="mt-1 text-center text-xs text-slate-500">
          Masukkan kode OTP 6 digit yang dikirim ke email Anda.
        </p>

        {kodeDemo && (
          <div className="mt-4 rounded-2xl bg-bh9-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-bh9-700">
              MODE DEMO — kode verifikasi Anda (email SMTP belum aktif):
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-[0.35em] text-bh9-800">{kodeDemo}</p>
          </div>
        )}

        <form onSubmit={verifikasi} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Kode OTP</span>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={kode}
              onChange={(e) => setKode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-xl font-extrabold tracking-[0.5em] outline-none focus:border-bh9-400"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-600">{error}</p>}
          <button disabled={proses} className="w-full rounded-xl bg-bh9-600 py-3 text-sm font-bold text-white hover:bg-bh9-700 disabled:opacity-60">
            {proses ? "Memverifikasi…" : "Konfirmasi & Aktifkan Akun"}
          </button>
        </form>

        <button onClick={kirimUlang} className="mt-3 w-full text-center text-xs font-semibold text-bh9-700 hover:underline">
          Kirim ulang kode verifikasi
        </button>
        <p className="mt-3 text-center text-[10px] text-slate-400">
          Kendala verifikasi? Hubungi {COMPANY.email}
        </p>
      </div>
    </div>
  );
}

export default function HalamanVerifikasi() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-slate-500">Memuat…</p>}>
      <IsiVerifikasi />
    </Suspense>
  );
}
