import Image from "next/image";
import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import PetaInteraktif from "@/components/PetaInteraktif";
import { COMPANY, KATEGORI_INDUK } from "@/lib/company";
import { daftarProduk, statistik, tokoAktif } from "@/lib/queries";
import type { ProdukPublik } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Beranda() {
  let terlaris: ProdukPublik[] = [];
  let terbaru: ProdukPublik[] = [];
  let stat = { produk: 0, toko: 0, pengguna: 0, pesanan: 0 };
  let toko: Awaited<ReturnType<typeof tokoAktif>> = [];
  try {
    [terlaris, terbaru, stat, toko] = await Promise.all([
      daftarProduk({ terlaris: true, limit: 10 }),
      daftarProduk({ limit: 10 }),
      statistik(),
      tokoAktif(),
    ]);
  } catch {
    // database belum siap
  }

  const titikPeta = [
    { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo BH9 EXPRESS", tipe: "depo" as const },
    ...toko.slice(0, 6).map((t) => ({
      lat: t.lat ?? COMPANY.depo.lat,
      lng: t.lng ?? COMPANY.depo.lng,
      label: t.nama,
      tipe: "toko" as const,
    })),
  ];

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="animasi-naik overflow-hidden rounded-3xl bg-gradient-to-br from-bh9-800 via-bh9-700 to-bh9-600 text-white shadow-lg">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur">
              📍 Pauh Timur, Sarolangun — Jambi
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              Belanja Lokal, <span className="text-emas-400">Tumbuh Bersama BH9</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-bh9-100 sm:text-base">
              {COMPANY.tagline2}. Sembako, hasil tani segar, makanan & minuman — diantar cepat oleh{" "}
              <b className="text-white">BH9 EXPRESS</b>.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/produk" className="rounded-xl bg-emas-500 px-5 py-2.5 text-sm font-bold text-bh9-900 shadow hover:bg-emas-400">
                Belanja Sekarang →
              </Link>
              <Link href="/ekspres" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/25">
                🛵 Lacak Paket
              </Link>
            </div>
            <div className="mt-6 grid max-w-md grid-cols-4 gap-2 text-center">
              {[
                { n: stat.produk, l: "Produk" },
                { n: stat.toko, l: "Toko Mitra" },
                { n: stat.pesanan, l: "Pesanan" },
                { n: stat.pengguna, l: "Pengguna" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
                  <p className="text-lg font-extrabold text-emas-400">{s.n}</p>
                  <p className="text-[10px] text-bh9-100">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-48 overflow-hidden rounded-2xl ring-1 ring-white/20 sm:h-64 lg:h-72">
            <Image
              src="/images/hero-village.jpg"
              alt="Toko desa BH9 Store"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bh9-900/80 to-transparent p-3">
              <p className="text-xs font-semibold">“{COMPANY.tagline1}”</p>
            </div>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { i: "🏪", t: "Produk Lokal", d: "Langsung dari warga & UMKM" },
          { i: "🌱", t: "Harga Bersahabat", d: "Tanpa perantara panjang" },
          { i: "🛵", t: "BH9 EXPRESS", d: "Antar cepat area Pauh" },
          { i: "🛡️", t: "Transaksi Aman", d: "Diverifikasi admin" },
        ].map((k) => (
          <div key={k.t} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="text-2xl">{k.i}</span>
            <p className="mt-1.5 text-sm font-bold text-slate-800">{k.t}</p>
            <p className="text-[11px] leading-snug text-slate-500">{k.d}</p>
          </div>
        ))}
      </section>

      {/* KATEGORI */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Kategori Utama</h2>
            <p className="text-xs text-slate-500">Tiga pilar katalog BH9 Store</p>
          </div>
          <Link href="/produk" className="text-xs font-bold text-bh9-700">Lihat semua →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {KATEGORI_INDUK.map((k) => (
            <Link
              key={k.slug}
              href={`/produk?induk=${k.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-32 w-full">
                <Image src={k.gambar} alt={k.nama} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className={`absolute inset-0 bg-gradient-to-t ${k.warna} opacity-70`} />
                <div className="absolute bottom-2 left-3 text-white">
                  <p className="text-xl">{k.ikon}</p>
                  <p className="text-sm font-extrabold drop-shadow">{k.nama}</p>
                </div>
              </div>
              <p className="p-3 text-[11px] leading-snug text-slate-600">{k.deskripsi}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* TERLARIS */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-extrabold text-slate-800">🔥 Produk Terlaris</h2>
          <Link href="/produk" className="text-xs font-bold text-bh9-700">Lihat semua →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {terlaris.map((p) => (
            <KartuProduk key={p.id} p={p} />
          ))}
          {terlaris.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Katalog sedang disiapkan.
            </p>
          )}
        </div>
      </section>

      {/* PETA */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-6">
            <span className="rounded-full bg-bh9-50 px-3 py-1 text-[11px] font-bold text-bh9-700">
              PETA JARINGAN
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-slate-800">
              Depo Pusat & Titik Toko Mitra
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{COMPANY.alamat}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>🏢 Depo pusat sebagai basis kurir BH9 EXPRESS</li>
              <li>🏪 Titik pickup toko mitra terdaftar</li>
              <li>📍 Titik tujuan konsumen ditentukan saat checkout</li>
              <li>🛵 Live tracking dipantau konsumen, pedagang, kurir & admin</li>
            </ul>
            <Link href="/ekspres" className="mt-5 inline-block rounded-xl bg-bh9-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-bh9-700">
              Pelajari BH9 EXPRESS
            </Link>
          </div>
          <div className="p-4 lg:p-6">
            <PetaInteraktif titik={titikPeta} tinggi={300} zoomAwal={14} />
          </div>
        </div>
      </section>

      {/* TERBARU */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-slate-800">🆕 Baru Ditambahkan Mitra</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {terbaru.slice(0, 5).map((p) => (
            <KartuProduk key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* CTA MITRA */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow">
          <h3 className="text-lg font-extrabold">Punya usaha di Pauh? 🏪</h3>
          <p className="mt-1.5 text-sm text-emerald-50">
            Daftar jadi Pedagang/Mitra. Setelah verifikasi email & ACC Owner, Anda dapat dashboard toko mandiri + pin lokasi pickup.
          </p>
          <Link href="/daftar?role=pedagang" className="mt-4 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700">
            Daftar Mitra
          </Link>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow">
          <h3 className="text-lg font-extrabold">Gabung Kurir BH9 EXPRESS 🛵</h3>
          <p className="mt-1.5 text-sm text-amber-50">
            Terima tugas pickup dari toko mitra, antar ke warga sekitar, dan dapat penghasilan harian.
          </p>
          <Link href="/daftar?role=kurir" className="mt-4 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-orange-700">
            Daftar Kurir
          </Link>
        </div>
      </section>
    </div>
  );
}
