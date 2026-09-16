"use client";

import Link from "next/link";
import { useState } from "react";
import { rupiah } from "@/lib/format";
import { useCart } from "./CartContext";
import type { ProdukPublik } from "@/lib/queries";

export default function KartuProduk({ p }: { p: ProdukPublik }) {
  const { tambah } = useCart();
  const [tambahkan, setTambahkan] = useState(false);
  const diskon =
    p.hargaCoret && p.hargaCoret > p.harga
      ? Math.round(((p.hargaCoret - p.harga) / p.hargaCoret) * 100)
      : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/produk/${p.slug}`} className="relative block">
        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-bh9-50 via-white to-emerald-50 text-5xl sm:text-6xl">
          <span className="transition group-hover:scale-110">{p.emoji ?? "🛒"}</span>
        </div>
        {diskon > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{diskon}%
          </span>
        )}
        {p.stok <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-bold text-slate-600">
            Stok Habis
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/produk/${p.slug}`} className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 hover:text-bh9-700">
          {p.nama}
        </Link>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[15px] font-extrabold text-bh9-700">{rupiah(p.harga)}</span>
          {diskon > 0 && (
            <span className="text-[11px] text-slate-400 line-through">{rupiah(p.hargaCoret!)}</span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          per {p.satuan} • terjual {p.terjual}
        </p>
        <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">🏪 {p.tokoNama}</p>
        <button
          disabled={p.stok <= 0}
          onClick={() => {
            tambah({
              productId: p.id,
              nama: p.nama,
              harga: p.harga,
              emoji: p.emoji ?? "🛒",
              satuan: p.satuan,
              toko: p.tokoNama,
            });
            setTambahkan(true);
            setTimeout(() => setTambahkan(false), 1200);
          }}
          className={`mt-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
            tambahkan ? "bg-emerald-500 text-white" : "bg-bh9-600 text-white hover:bg-bh9-700"
          }`}
        >
          {p.stok <= 0 ? "Habis" : tambahkan ? "✓ Masuk keranjang" : "+ Keranjang"}
        </button>
      </div>
    </div>
  );
}
