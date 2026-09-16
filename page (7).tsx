"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { rupiah } from "@/lib/format";
import { COMPANY } from "@/lib/company";

export default function HalamanKeranjang() {
  const { items, ubahQty, hapus, subtotal, kosongkan, siap } = useCart();

  const perToko = items.reduce<Record<string, typeof items>>((acc, i) => {
    (acc[i.toko] ||= []).push(i);
    return acc;
  }, {});

  if (siap && items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-800">Keranjang masih kosong</h1>
        <p className="mt-1 text-sm text-slate-500">Yuk belanja produk warga Pauh Timur.</p>
        <Link href="/produk" className="mt-5 inline-block rounded-xl bg-bh9-600 px-5 py-2.5 text-sm font-bold text-white">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Keranjang Belanja</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {Object.entries(perToko).map(([toko, daftar]) => (
            <div key={toko} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span>🏪</span>
                <span className="text-sm font-bold text-slate-700">{toko}</span>
              </div>
              {daftar.map((i) => (
                <div key={i.productId} className="flex gap-3 border-b border-slate-100 p-3 last:border-0">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bh9-50 to-emerald-50 text-3xl">
                    {i.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">{i.nama}</p>
                    <p className="text-xs text-slate-500">{rupiah(i.harga)} / {i.satuan}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
                        <button onClick={() => ubahQty(i.productId, i.qty - 1)} className="px-2.5 py-1 text-slate-600 hover:bg-slate-50">−</button>
                        <span className="w-8 text-center text-xs font-bold">{i.qty}</span>
                        <button onClick={() => ubahQty(i.productId, i.qty + 1)} className="px-2.5 py-1 text-slate-600 hover:bg-slate-50">+</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-bh9-700">{rupiah(i.harga * i.qty)}</span>
                        <button onClick={() => hapus(i.productId)} className="text-xs font-semibold text-rose-500 hover:underline">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <button onClick={kosongkan} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
            Kosongkan keranjang
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <h2 className="text-sm font-extrabold text-slate-800">Ringkasan Belanja</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal produk</span>
              <span className="font-semibold">{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ongkir BH9 EXPRESS</span>
              <span className="text-xs">dihitung saat checkout</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya layanan</span>
              <span className="font-semibold">{rupiah(COMPANY.biayaLayanan)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-dashed border-slate-200 pt-3">
            <span className="text-sm font-bold text-slate-700">Estimasi Total</span>
            <span className="text-lg font-extrabold text-bh9-700">{rupiah(subtotal + COMPANY.biayaLayanan)}</span>
          </div>
          <Link href="/checkout" className="mt-4 block rounded-xl bg-bh9-600 py-3 text-center text-sm font-bold text-white hover:bg-bh9-700">
            Lanjut ke Checkout →
          </Link>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Gratis ongkir untuk belanja di atas {rupiah(COMPANY.ongkir.gratisDiAtas)}
          </p>
        </aside>
      </div>
    </div>
  );
}
