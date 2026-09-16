"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartContext";
import type { ProdukPublik } from "@/lib/queries";

export default function TombolBeli({ p }: { p: ProdukPublik }) {
  const { tambah } = useCart();
  const [qty, setQty] = useState(1);
  const [pesan, setPesan] = useState("");
  const router = useRouter();

  const item = {
    productId: p.id,
    nama: p.nama,
    harga: p.harga,
    emoji: p.emoji ?? "🛒",
    satuan: p.satuan,
    toko: p.tokoNama,
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600">Jumlah</span>
        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-lg text-slate-600 hover:bg-slate-50">−</button>
          <span className="w-10 text-center text-sm font-bold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(p.stok || 99, q + 1))} className="px-3 py-1.5 text-lg text-slate-600 hover:bg-slate-50">+</button>
        </div>
        <span className="text-xs text-slate-500">maks {p.stok}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          disabled={p.stok <= 0}
          onClick={() => {
            tambah(item, qty);
            setPesan("Produk ditambahkan ke keranjang ✓");
            setTimeout(() => setPesan(""), 1600);
          }}
          className="flex-1 rounded-xl border-2 border-bh9-600 px-4 py-2.5 text-sm font-bold text-bh9-700 hover:bg-bh9-50 disabled:opacity-40"
        >
          + Keranjang
        </button>
        <button
          disabled={p.stok <= 0}
          onClick={() => {
            tambah(item, qty);
            router.push("/checkout");
          }}
          className="flex-1 rounded-xl bg-bh9-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-bh9-700 disabled:opacity-40"
        >
          Beli Sekarang
        </button>
      </div>
      {pesan && <p className="mt-2 text-xs font-semibold text-emerald-600">{pesan}</p>}
    </div>
  );
}
