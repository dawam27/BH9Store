import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import { KATEGORI_INDUK } from "@/lib/company";
import { daftarProduk, semuaKategori } from "@/lib/queries";
import type { ProdukPublik } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HalamanKatalog({
  searchParams,
}: {
  searchParams: Promise<{ induk?: string; kategori?: string; q?: string }>;
}) {
  const sp = await searchParams;
  let items: ProdukPublik[] = [];
  let kategori: Awaited<ReturnType<typeof semuaKategori>> = [];
  try {
    [items, kategori] = await Promise.all([
      daftarProduk({ induk: sp.induk, kategori: sp.kategori, q: sp.q, limit: 200 }),
      semuaKategori(),
    ]);
  } catch {}

  const indukAktif = sp.induk;
  const subKategori = kategori.filter((k) => !indukAktif || k.induk === indukAktif);
  const judul = indukAktif
    ? KATEGORI_INDUK.find((k) => k.slug === indukAktif)?.nama ?? "Katalog"
    : sp.q
    ? `Hasil pencarian "${sp.q}"`
    : "Semua Produk";

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const gabung = { induk: sp.induk, kategori: sp.kategori, q: sp.q, ...patch };
    Object.entries(gabung).forEach(([k, v]) => v && p.set(k, v));
    return `/produk${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-bh9-700 to-bh9-500 p-5 text-white shadow">
        <h1 className="text-xl font-extrabold">{judul}</h1>
        <p className="mt-1 text-xs text-bh9-100">{items.length} produk tersedia dari mitra BH9 Store</p>
        <form action="/produk" className="mt-3 flex gap-2">
          {sp.induk && <input type="hidden" name="induk" value={sp.induk} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Cari produk…"
            className="w-full rounded-xl border-0 px-4 py-2.5 text-sm text-slate-800 outline-none"
          />
          <button className="rounded-xl bg-emas-500 px-4 py-2.5 text-sm font-bold text-bh9-900">Cari</button>
        </form>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={qs({ induk: undefined, kategori: undefined })}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
            !indukAktif ? "border-bh9-600 bg-bh9-600 text-white" : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          Semua
        </Link>
        {KATEGORI_INDUK.map((k) => (
          <Link
            key={k.slug}
            href={qs({ induk: k.slug, kategori: undefined })}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              indukAktif === k.slug
                ? "border-bh9-600 bg-bh9-600 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {k.ikon} {k.ringkas}
          </Link>
        ))}
      </div>

      {subKategori.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Link
            href={qs({ kategori: undefined })}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
              !sp.kategori ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            Semua Sub-kategori
          </Link>
          {subKategori.map((k) => (
            <Link
              key={k.id}
              href={qs({ kategori: k.slug, induk: k.induk })}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                sp.kategori === k.slug ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {k.ikon} {k.nama}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p) => (
          <KartuProduk key={p.id} p={p} />
        ))}
      </div>
      {items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-semibold text-slate-700">Produk tidak ditemukan</p>
          <p className="text-sm text-slate-500">Coba kata kunci atau kategori lain.</p>
        </div>
      )}
    </div>
  );
}
