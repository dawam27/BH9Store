"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { STATUS_PESANAN } from "@/lib/company";
import { rupiah, tanggalJam } from "@/lib/format";

type Pesanan = {
  kode: string;
  total: number;
  status: string;
  statusPembayaran: string;
  metodeKirim: string;
  createdAt: string;
  alamatPenerima: string;
};

export default function HalamanPesanan() {
  const { user, memuat } = useAuth();
  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  if (!memuat && !user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">📦</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-800">Masuk untuk melihat pesanan</h1>
        <Link href="/masuk" className="mt-5 inline-block rounded-xl bg-bh9-600 px-6 py-2.5 text-sm font-bold text-white">Masuk</Link>
      </div>
    );
  }

  const tampil = filter === "semua" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Pesanan Saya</h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {["semua", ...Object.keys(STATUS_PESANAN)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              filter === s ? "bg-bh9-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {s === "semua" ? "Semua" : STATUS_PESANAN[s].label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Memuat pesanan…</p>}

      <div className="space-y-3">
        {tampil.map((o) => {
          const st = STATUS_PESANAN[o.status] ?? { label: o.status, kelas: "bg-slate-100 text-slate-600" };
          return (
            <Link
              key={o.kode}
              href={`/pesanan/${o.kode}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-bh9-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800">{o.kode}</p>
                  <p className="text-[11px] text-slate-500">{tanggalJam(o.createdAt)}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">📍 {o.alamatPenerima}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.kelas}`}>{st.label}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5">
                <span className="text-[11px] text-slate-500">
                  {o.metodeKirim === "bh9-express" ? "🛵 BH9 EXPRESS" : "🏪 Ambil sendiri"}
                </span>
                <span className="text-sm font-extrabold text-bh9-700">{rupiah(o.total)}</span>
              </div>
            </Link>
          );
        })}
        {!loading && tampil.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">🗂️</p>
            <p className="mt-2 text-sm text-slate-500">Belum ada pesanan pada filter ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
