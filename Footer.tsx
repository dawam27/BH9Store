import Link from "next/link";
import Logo from "./Logo";
import { COMPANY, KATEGORI_INDUK } from "@/lib/company";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo ukuran={44} />
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {COMPANY.tagline2}. Marketplace warga dengan jasa antar lokal{" "}
            <span className="font-semibold text-bh9-700">{COMPANY.logistik}</span>.
          </p>
          <div className="mt-3 flex gap-2">
            <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
              💬 WhatsApp
            </a>
            <a href={COMPANY.tiktokUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
              🎵 {COMPANY.tiktok}
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800">Kategori</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {KATEGORI_INDUK.map((k) => (
              <li key={k.slug}>
                <Link href={`/produk?induk=${k.slug}`} className="hover:text-bh9-700">
                  {k.ikon} {k.nama}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800">Layanan</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/ekspres" className="hover:text-bh9-700">Lacak Paket BH9 EXPRESS</Link></li>
            <li><Link href="/daftar?role=pedagang" className="hover:text-bh9-700">Daftar Jadi Pedagang/Mitra</Link></li>
            <li><Link href="/daftar?role=kurir" className="hover:text-bh9-700">Gabung Jadi Kurir</Link></li>
            <li><Link href="/tentang" className="hover:text-bh9-700">Tentang & Bantuan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800">Kantor Pusat / Depo</h4>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{COMPANY.alamat}</p>
          <p className="mt-2 text-sm text-slate-600">✉️ {COMPANY.email}</p>
          <p className="text-sm text-slate-600">📞 {COMPANY.whatsappNomor}</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {COMPANY.nama} • {COMPANY.logistik} — {COMPANY.tagline1}
      </div>
    </footer>
  );
}
