"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

export default function BottomNav() {
  const path = usePathname();
  const { jumlah } = useCart();
  const { user } = useAuth();

  const akunHref = user
    ? user.role === "pedagang"
      ? "/dashboard/pedagang"
      : user.role === "kurir"
      ? "/dashboard/kurir"
      : user.role === "admin" || user.role === "owner"
      ? "/dashboard/admin"
      : "/akun"
    : "/masuk";

  const item = [
    { href: "/", label: "Beranda", ikon: "🏠" },
    { href: "/produk", label: "Katalog", ikon: "🧺" },
    { href: "/keranjang", label: "Keranjang", ikon: "🛒", badge: jumlah },
    { href: "/pesanan", label: "Pesanan", ikon: "📦" },
    { href: akunHref, label: user ? "Akun" : "Masuk", ikon: "👤" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg">
        {item.map((i) => {
          const aktif = path === i.href;
          return (
            <Link
              key={i.label}
              href={i.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                aktif ? "text-bh9-700" : "text-slate-500"
              }`}
            >
              <span className="relative text-lg">
                {i.ikon}
                {!!i.badge && i.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {i.badge}
                  </span>
                )}
              </span>
              {i.label}
              {aktif && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-bh9-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
