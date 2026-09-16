"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { ROLE_LABEL } from "@/lib/company";

const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Katalog" },
  { href: "/ekspres", label: "BH9 EXPRESS" },
  { href: "/tentang", label: "Tentang" },
];

export default function Header() {
  const { jumlah } = useCart();
  const { user, keluar } = useAuth();
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const router = useRouter();
  const path = usePathname();

  const dashboardHref =
    user?.role === "pedagang"
      ? "/dashboard/pedagang"
      : user?.role === "kurir"
      ? "/dashboard/kurir"
      : user?.role === "admin" || user?.role === "owner"
      ? "/dashboard/admin"
      : "/pesanan";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                path === m.href
                  ? "bg-bh9-50 text-bh9-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/produk?q=${encodeURIComponent(cari)}`);
          }}
          className="ml-auto hidden flex-1 md:block md:max-w-xs"
        >
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari produk, toko, kategori…"
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-bh9-400 focus:bg-white"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-2">
          <Link
            href="/keranjang"
            className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Keranjang"
          >
            <span className="text-xl">🛒</span>
            {jumlah > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {jumlah}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setBuka((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bh9-600 text-xs font-bold text-white">
                  {user.nama.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-xs font-semibold text-slate-700 sm:block">
                  {user.nama.split(" ")[0]}
                </span>
              </button>
              {buka && (
                <div
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  onMouseLeave={() => setBuka(false)}
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{user.nama}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-bh9-100 px-2 py-0.5 text-[10px] font-bold text-bh9-700">
                      {ROLE_LABEL[user.role] ?? user.role}
                      {user.status !== "aktif" ? " • Pending" : ""}
                    </span>
                  </div>
                  <Link href={dashboardHref} onClick={() => setBuka(false)} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    📊 Dashboard Saya
                  </Link>
                  <Link href="/pesanan" onClick={() => setBuka(false)} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    📦 Pesanan Saya
                  </Link>
                  <Link href="/akun" onClick={() => setBuka(false)} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    ⚙️ Profil & Alamat
                  </Link>
                  <button
                    onClick={async () => {
                      await keluar();
                      setBuka(false);
                      router.push("/");
                      router.refresh();
                    }}
                    className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    ⏻ Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/masuk"
              className="rounded-xl bg-bh9-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-bh9-700"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
