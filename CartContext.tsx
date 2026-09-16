"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ItemKeranjang = {
  productId: number;
  nama: string;
  harga: number;
  qty: number;
  emoji: string;
  satuan: string;
  toko: string;
};

type Konteks = {
  items: ItemKeranjang[];
  tambah: (i: Omit<ItemKeranjang, "qty">, qty?: number) => void;
  ubahQty: (productId: number, qty: number) => void;
  hapus: (productId: number) => void;
  kosongkan: () => void;
  jumlah: number;
  subtotal: number;
  siap: boolean;
};

const CartCtx = createContext<Konteks | null>(null);
const KUNCI = "bh9_keranjang";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemKeranjang[]>([]);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KUNCI);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setSiap(true);
  }, []);

  useEffect(() => {
    if (siap) localStorage.setItem(KUNCI, JSON.stringify(items));
  }, [items, siap]);

  const tambah = useCallback((i: Omit<ItemKeranjang, "qty">, qty = 1) => {
    setItems((prev) => {
      const ada = prev.find((p) => p.productId === i.productId);
      if (ada) {
        return prev.map((p) => (p.productId === i.productId ? { ...p, qty: p.qty + qty } : p));
      }
      return [...prev, { ...i, qty }];
    });
  }, []);

  const ubahQty = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.productId === productId ? { ...p, qty: Math.max(0, qty) } : p))
        .filter((p) => p.qty > 0)
    );
  }, []);

  const hapus = useCallback(
    (productId: number) => setItems((prev) => prev.filter((p) => p.productId !== productId)),
    []
  );
  const kosongkan = useCallback(() => setItems([]), []);

  const nilai = useMemo<Konteks>(
    () => ({
      items,
      tambah,
      ubahQty,
      hapus,
      kosongkan,
      jumlah: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.harga, 0),
      siap,
    }),
    [items, tambah, ubahQty, hapus, kosongkan, siap]
  );

  return <CartCtx.Provider value={nilai}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
