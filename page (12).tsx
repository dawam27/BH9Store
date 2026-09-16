import Link from "next/link";
import { notFound } from "next/navigation";
import PetaInteraktif from "@/components/PetaInteraktif";
import KartuProduk from "@/components/KartuProduk";
import TombolBeli from "./TombolBeli";
import { rupiah } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { daftarProduk, produkBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DetailProduk({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await produkBySlug(slug).catch(() => null);
  if (!p) notFound();
  const terkait = (await daftarProduk({ kategori: p.kategoriSlug, limit: 6 }).catch(() => [])).filter(
    (x) => x.id !== p.id
  );

  return (
    <div className="space-y-6">
      <nav className="text-[11px] text-slate-500">
        <Link href="/" className="hover:text-bh9-700">Beranda</Link> ·{" "}
        <Link href={`/produk?induk=${p.induk}`} className="hover:text-bh9-700">{p.induk}</Link> ·{" "}
        <span className="text-slate-700">{p.nama}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-bh9-50 via-white to-emerald-50 text-[7rem] shadow-sm">
          {p.emoji ?? "🛒"}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="rounded-full bg-bh9-50 px-2.5 py-1 text-[10px] font-bold text-bh9-700">
            {p.kategoriNama}
          </span>
          <h1 className="mt-2 text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{p.nama}</h1>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-2xl font-extrabold text-bh9-700">{rupiah(p.harga)}</span>
            <span className="pb-1 text-xs text-slate-500">/ {p.satuan}</span>
            {p.hargaCoret && p.hargaCoret > p.harga && (
              <span className="pb-1 text-sm text-slate-400 line-through">{rupiah(p.hargaCoret)}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
            <span>📦 Stok: <b>{p.stok}</b></span>
            <span>✅ Terjual: <b>{p.terjual}</b></span>
            <span>🏪 {p.tokoNama}</span>
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {p.deskripsi || "Produk pilihan dari mitra BH9 Store."}
          </p>

          <TombolBeli p={p} />

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-slate-50 p-2.5">🛵 Dikirim BH9 EXPRESS dari toko mitra</div>
            <div className="rounded-xl bg-slate-50 p-2.5">💳 Bayar QRIS/DANA + upload bukti</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-extrabold text-slate-800">📍 Titik Pickup Toko Mitra</h2>
          <p className="text-xs text-slate-500">{p.tokoNama} — {p.tokoAlamat}</p>
        </div>
        <div className="p-4">
          <PetaInteraktif
            titik={[
              { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo BH9 EXPRESS", tipe: "depo" },
              { lat: p.tokoLat ?? COMPANY.depo.lat, lng: p.tokoLng ?? COMPANY.depo.lng, label: p.tokoNama, tipe: "toko" },
            ]}
            tinggi={240}
            zoomAwal={14}
          />
        </div>
      </div>

      {terkait.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-slate-800">Produk Serupa</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {terkait.slice(0, 5).map((x) => (
              <KartuProduk key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
