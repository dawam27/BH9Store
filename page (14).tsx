import Image from "next/image";
import Link from "next/link";
import PetaInteraktif from "@/components/PetaInteraktif";
import { COMPANY, KATEGORI_INDUK, ROLE_LABEL } from "@/lib/company";

export const metadata = { title: "Tentang BH9 Store & BH9 EXPRESS" };

const ALUR = [
  { n: "1", t: "Konsumen belanja", d: "Pilih produk lintas pedagang, checkout, pin lokasi tujuan di peta." },
  { n: "2", t: "Bayar QRIS/DANA", d: "Scan barcode BH9 Store lalu unggah bukti transfer." },
  { n: "3", t: "Admin validasi", d: "Owner/Admin memverifikasi pembayaran, pesanan diteruskan ke pedagang." },
  { n: "4", t: "Pedagang siapkan", d: "Pedagang menekan Siap Pickup, tugas ditawarkan ke kurir." },
  { n: "5", t: "Kurir pickup", d: "Kurir BH9 EXPRESS menerima/menolak tugas, ambil barang di toko." },
  { n: "6", t: "Live tracking", d: "Posisi kurir dipantau real-time sampai paket diterima konsumen." },
];

export default function HalamanTentang() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-44 w-full sm:h-56">
          <Image src="/images/hero-village.jpg" alt="BH9 Store" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-bh9-900/85 to-bh9-900/20" />
          <div className="absolute bottom-4 left-5 text-white">
            <h1 className="text-2xl font-extrabold">Tentang BH9 Store</h1>
            <p className="text-xs text-bh9-100">{COMPANY.tagline1} • {COMPANY.tagline2}</p>
          </div>
        </div>
        <div className="p-5 text-sm leading-relaxed text-slate-600">
          <p>
            <b>BH9 Store</b> adalah marketplace warga yang mempertemukan pedagang, petani, dan UMKM Desa Lamban Sigatal
            dengan konsumen di Pauh Timur dan sekitarnya. Seluruh pengiriman ditangani jasa kirim lokal resmi kami,{" "}
            <b className="text-bh9-700">BH9 EXPRESS</b>, dengan sistem pickup dari toko mitra dan pelacakan berbasis peta.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {KATEGORI_INDUK.map((k) => (
          <Link key={k.slug} href={`/produk?induk=${k.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-2xl">{k.ikon}</span>
            <p className="mt-1 text-sm font-extrabold text-slate-800">{k.nama}</p>
            <p className="text-[11px] leading-snug text-slate-500">{k.deskripsi}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-800">Alur Kerja Sistem</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALUR.map((a) => (
            <div key={a.n} className="rounded-2xl bg-slate-50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-bh9-600 text-sm font-extrabold text-white">{a.n}</span>
              <p className="mt-2 text-sm font-bold text-slate-800">{a.t}</p>
              <p className="text-[11px] leading-snug text-slate-500">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-800">Empat Hak Akses Pengguna</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { r: "konsumen", i: "🙋", d: "Belanja lintas pedagang, checkout, bayar, lacak pesanan." },
            { r: "pedagang", i: "🏪", d: "Dashboard toko mandiri: CRUD produk, pin lokasi pickup, kelola pesanan. Perlu ACC Owner/Admin." },
            { r: "kurir", i: "🛵", d: "Daftar tugas pickup, terima/tolak tugas, navigasi & live tracking. Perlu ACC Owner/Admin." },
            { r: "owner", i: "👑", d: "Kontrol penuh: manajemen pengguna, ACC mitra & kurir, verifikasi pembayaran, laporan keuangan." },
          ].map((x) => (
            <div key={x.r} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xl">{x.i}</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{ROLE_LABEL[x.r]}</p>
              <p className="text-[11px] leading-snug text-slate-500">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-2">
          <div className="p-5">
            <h2 className="text-lg font-extrabold text-slate-800">Kantor Pusat & Depo</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{COMPANY.alamat}</p>
            <div className="mt-4 space-y-1.5 text-sm text-slate-600">
              <p>✉️ {COMPANY.email}</p>
              <p>📞 {COMPANY.whatsappNomor}</p>
              <p>🎵 TikTok {COMPANY.tiktok}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">💬 Chat Admin</a>
              <a href={COMPANY.tiktokUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Ikuti TikTok</a>
            </div>
          </div>
          <div className="p-4 lg:p-5">
            <PetaInteraktif
              titik={[{ lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo Pusat BH9", tipe: "depo" }]}
              tinggi={280}
              zoomAwal={15}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
