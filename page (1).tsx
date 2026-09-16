"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { COMPANY } from "@/lib/company";
import { rupiah } from "@/lib/format";
import { hitungOngkir, jarakKm } from "@/lib/geo";

export default function HalamanCheckout() {
  const { items, subtotal, kosongkan, siap } = useCart();
  const { user, memuat } = useAuth();
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [metode, setMetode] = useState<"bh9-express" | "ambil-sendiri">("bh9-express");
  const [lat, setLat] = useState(COMPANY.depo.lat + 0.004);
  const [lng, setLng] = useState(COMPANY.depo.lng + 0.005);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setNama((n) => n || user.nama);
      setTelepon((t) => t || user.telepon || "");
      setAlamat((a) => a || user.alamat || "");
      if (user.lat && user.lng) {
        setLat(user.lat);
        setLng(user.lng);
      }
    }
  }, [user]);

  const km = useMemo(() => jarakKm(COMPANY.depo.lat, COMPANY.depo.lng, lat, lng) || 1, [lat, lng]);
  const ongkir = metode === "bh9-express" ? hitungOngkir(km, subtotal) : 0;
  const total = subtotal + ongkir + COMPANY.biayaLayanan;

  const kirim = async () => {
    setError("");
    if (!nama || !telepon || !alamat) {
      setError("Lengkapi nama, nomor WhatsApp, dan alamat pengiriman.");
      return;
    }
    setProses(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        namaPenerima: nama,
        teleponPenerima: telepon,
        alamatPenerima: alamat,
        catatan,
        metodeKirim: metode,
        lat,
        lng,
      }),
    });
    const d = await r.json();
    setProses(false);
    if (!r.ok) {
      setError(d.error ?? "Gagal membuat pesanan.");
      return;
    }
    kosongkan();
    router.push(`/pesanan/${d.kode[0]}`);
  };

  if (!memuat && !user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🔐</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-800">Masuk dulu untuk checkout</h1>
        <p className="mt-1 text-sm text-slate-500">Akun diperlukan agar pesanan dapat dilacak.</p>
        <div className="mt-5 flex gap-2">
          <Link href="/masuk" className="flex-1 rounded-xl bg-bh9-600 py-2.5 text-sm font-bold text-white">Masuk</Link>
          <Link href="/daftar" className="flex-1 rounded-xl border border-bh9-600 py-2.5 text-sm font-bold text-bh9-700">Daftar</Link>
        </div>
      </div>
    );
  }

  if (siap && items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-4xl">🧺</p>
        <p className="mt-2 font-semibold text-slate-700">Keranjang kosong</p>
        <Link href="/produk" className="mt-4 inline-block rounded-xl bg-bh9-600 px-5 py-2.5 text-sm font-bold text-white">
          Belanja Dulu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Checkout</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">1. Data Penerima</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Nama penerima</span>
                <input value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Nomor WhatsApp</span>
                <input value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="08xxxxxxxxxx" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-600">Alamat lengkap (Dusun/RT/patokan)</span>
              <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-600">Catatan untuk kurir (opsional)</span>
              <input value={catatan} onChange={(e) => setCatatan(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-bh9-400" />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">2. Titik Peta Tujuan</h2>
            <p className="mb-3 mt-0.5 text-xs text-slate-500">
              Ketuk peta untuk memindahkan pin lokasi rumah Anda. Jarak dari depo: <b>{km} km</b>
            </p>
            <PetaInteraktif
              titik={[
                { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo BH9", tipe: "depo" },
                { lat, lng, label: "Alamat Saya", tipe: "tujuan" },
              ]}
              tinggi={260}
              zoomAwal={15}
              bisaPilih
              garis
              onPilih={(la, ln) => {
                setLat(la);
                setLng(ln);
              }}
            />
            <div className="mt-2 flex gap-2 text-[11px] text-slate-500">
              <span className="rounded-lg bg-slate-100 px-2 py-1">Lat: {lat.toFixed(5)}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1">Lng: {lng.toFixed(5)}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">3. Metode Pengiriman</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setMetode("bh9-express")}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  metode === "bh9-express" ? "border-bh9-600 bg-bh9-50" : "border-slate-200"
                }`}
              >
                <p className="text-sm font-bold text-slate-800">🛵 BH9 EXPRESS</p>
                <p className="text-[11px] text-slate-500">Kurir lokal, pickup dari toko mitra</p>
                <p className="mt-1 text-sm font-extrabold text-bh9-700">{rupiah(hitungOngkir(km, subtotal))}</p>
              </button>
              <button
                onClick={() => setMetode("ambil-sendiri")}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  metode === "ambil-sendiri" ? "border-bh9-600 bg-bh9-50" : "border-slate-200"
                }`}
              >
                <p className="text-sm font-bold text-slate-800">🏪 Ambil Sendiri</p>
                <p className="text-[11px] text-slate-500">Ambil langsung di toko mitra</p>
                <p className="mt-1 text-sm font-extrabold text-emerald-600">Gratis</p>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">4. Metode Pembayaran</h2>
            <div className="mt-3 rounded-xl border-2 border-bh9-600 bg-bh9-50 p-3">
              <p className="text-sm font-bold text-slate-800">💳 QRIS / DANA BH9 Store</p>
              <p className="text-[11px] text-slate-600">
                Scan barcode DANA milik BH9 Store lalu unggah bukti transfer. Pesanan divalidasi admin.
              </p>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Barcode & tombol unggah bukti tersedia setelah pesanan dibuat.
            </p>
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <h2 className="text-sm font-extrabold text-slate-800">Ringkasan Pesanan</h2>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-2 text-xs">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg">{i.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-semibold text-slate-700">{i.nama}</span>
                  <span className="text-slate-500">{i.qty} × {rupiah(i.harga)}</span>
                </span>
                <span className="font-bold text-slate-700">{rupiah(i.qty * i.harga)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-3 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Ongkir</span><span>{rupiah(ongkir)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Biaya layanan</span><span>{rupiah(COMPANY.biayaLayanan)}</span></div>
            <div className="flex justify-between pt-1 text-base font-extrabold text-bh9-700"><span>Total</span><span>{rupiah(total)}</span></div>
          </div>
          {error && <p className="rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-600">{error}</p>}
          <button
            onClick={kirim}
            disabled={proses}
            className="w-full rounded-xl bg-bh9-600 py-3 text-sm font-bold text-white hover:bg-bh9-700 disabled:opacity-60"
          >
            {proses ? "Memproses…" : "Buat Pesanan & Bayar"}
          </button>
          <p className="text-center text-[10px] text-slate-400">
            Pesanan dari toko berbeda otomatis dipisah menjadi beberapa nomor pesanan.
          </p>
        </aside>
      </div>
    </div>
  );
}
