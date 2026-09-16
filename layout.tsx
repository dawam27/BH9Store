import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";
import { AuthProvider } from "@/components/AuthContext";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "BH9 Store & BH9 EXPRESS — Dari Kito untuk Kito",
  description: `${COMPANY.tagline2}. Belanja sembako, hasil tani, makanan & minuman dengan pengiriman lokal BH9 EXPRESS.`,
  icons: { icon: "/images/bh9-logo.png", apple: "/images/bh9-logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b33cc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 pb-24 pt-4 md:pb-10">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
