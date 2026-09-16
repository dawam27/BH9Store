"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PetaInteraktif from "@/components/PetaInteraktif";
import { useAuth } from "@/components/AuthContext";
import { COMPANY, STATUS_PESANAN } from "@/lib/company";
import { rupiah, tanggalJam } from "@/lib/format";

type Produk = {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  satuan: string;
  emoji: string | null;
  categoryId: number;
  aktif: boolean;
  terjual: number;
  deskripsi: string | null;
};
type Toko = {
  id: number;
  nama: string;
  deskripsi: string | null;
  alamat: string | null;
  telepon: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
};
type Kategori = { id: number; nama: string; induk: string; ikon: string | null };
type Pesanan = {
  kode: string; total: number; status: string; statusPembayaran: string;
  namaPenerima: string; alamatPenerima: string; createdAt: string;
};

const KOSONG = { id: 0, nama: "", harga: 0, stok: 0, satuan: "pcs", emoji: "🛒", categoryId: 0, deskripsi: "" };

export default function DashboardPedagang() {
  const { user, memuat } = useAuth();
  const [tab, setTab] = useState<"ringkas" | "produk" | "pesanan" | "toko">("ringkas");
  const [produk, setProduk] = useState<Produk[]>([]);
  const [toko, setToko] = useState<Toko | null>(null);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [pesanan, setPesanan] = useState<Pesanan[]>([]);
  const [form, setForm] = useState<typeof KOSONG>(KOSONG);
  const [formToko, setFormToko] = useState({ nama: "", deskripsi: "", alamat: "", telepon: "" });
  const [lat, setLat] = useState(COMPANY.depo.lat);
  const [lng, setLng] = useState(COMPANY.depo.lng);
  const [pesan, setPesan] = useState("");

  const muat = useCallback(async () => {
    const [p, k, o] = await Promise.all([
      fetch("/api/products?milikSaya=1", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setProduk(p.items ?? []);
    setKategori(k.items ?? []);
    setPesanan(o.items ?? []);
    if (p.toko) {
      setToko(p.toko);
      setFormToko({
        nama: p.toko.nama ?? "",
        deskripsi: p.toko.deskripsi ?? "",
        alamat: p.toko.alamat ?? "",
        telepon: p.toko.telepon ?? "",
      });
      setLat(p.toko.lat ?? COMPANY.depo.lat);
      setLng(p.toko.lng ?? COMPANY.depo.lng);
    }
  }, []);

  useEffect(() => {
    if (user) void muat();
  }, [user, muat]);

  if (!memuat && !user) {
    return <Pemberitahuan judul="Masuk sebagai pedagang" teks="Halaman ini khusus mitra pedagang BH9 Store." />;
  }
  if (user && user.role !== "pedagang") {
    return <Pemberitahuan judul="Akses ditolak" teks="Akun Anda bukan pedagang/mitra." />;
  }
  if (user && user.status !== "aktif") {
    return (
      <Pemberitahuan
        judul="Akun Pending ⏳"
        teks="Email sudah terverifikasi. Akun pedagang Anda sedang menunggu persetujuan (ACC) Owner/Admin BH9 Store. Anda akan dapat mengelola produk setelah disetujui."
      />
    );
  }

  const simpanProduk = async () => {
    const metode = form.id ? "PATCH" : "POST";
    const r = await fetch("/api/products", {
      method: metode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setPesan(r.ok ? "Produk tersimpan ✓" : d.error);
    if (r.ok) {
      setForm(KOSONG);
      await muat();
    }
  };

  const hapusProduk = async (id: number) => {
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await muat();
  };

  const simpanToko = async () => {
    const r = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formToko, lat, lng }),
    });
    setPesan(r.ok ? "Profil toko & pin lokasi tersimpan ✓" : "Gagal menyimpan");
    await muat();
  };

  const aksiPesanan = async (kode: string, aksi: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, aksi }),
    });
    await muat();
  };

  const omzet = pesanan.filter((p) => p.status === "selesai").reduce((a, p) => a + p.total, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow">
        <p className="text-[11px] font-semibold text-emerald-100">DASHBOARD PEDAGANG / MITRA</p>
        <h1 className="text-xl font-extrabold">{toko?.nama ?? "Toko Saya"}</h1>
        <p className="text-xs text-emerald-100">{toko?.alamat}</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { n: produk.length, l: "Produk" },
            { n: pesanan.length, l: "Pesanan" },
            { n: pesanan.filter((p) => ["diproses", "menunggu_verifikasi"].includes(p.status)).length, l: "Perlu Aksi" },
            { n: produk.reduce((a, p) => a + p.terjual, 0), l: "Terjual" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/15 py-2">
              <p className="text-lg font-extrabold">{s.n}</p>
              <p className="text-[10px]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {[
          { id: "ringkas", l: "📊 Ringkasan" },
          { id: "produk", l: "📦 Produk" },
          { id: "pesanan", l: "🧾 Pesanan" },
          { id: "toko", l: "🏪 Profil & Pin Lokasi" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
              tab === t.id ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {pesan && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{pesan}</p>}

      {tab === "ringkas" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Omzet pesanan selesai</p>
            <p className="text-2xl font-extrabold text-emerald-600">{rupiah(omzet)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Stok menipis (&lt; 10)</p>
            <p className="text-2xl font-extrabold text-amber-600">{produk.filter((p) => p.stok < 10).length} produk</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
            <p className="mb-2 text-sm font-bold text-slate-700">Alur kerja pedagang</p>
            <ol className="list-inside list-decimal space-y-1 text-xs text-slate-600">
              <li>Tambahkan produk & tentukan pin lokasi toko (titik pickup).</li>
              <li>Pesanan masuk → admin verifikasi pembayaran konsumen.</li>
              <li>Siapkan barang → tekan <b>Siap Pickup</b> agar tugas ditawarkan ke kurir BH9 EXPRESS.</li>
              <li>Kurir pickup & antar, status terpantau live oleh semua pihak.</li>
            </ol>
          </div>
        </div>
      )}

      {tab === "produk" && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">{form.id ? "Edit Produk" : "Tambah Produk"}</h2>
            <div className="mt-3 space-y-2.5">
              <input placeholder="Nama produk" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value={0}>Pilih kategori…</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>{k.ikon} {k.nama}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Harga (Rp)" value={form.harga || ""} onChange={(e) => setForm({ ...form, harga: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <input type="number" placeholder="Stok" value={form.stok || ""} onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Satuan (kg/pcs)" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <input placeholder="Emoji" value={form.emoji ?? ""} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <textarea rows={3} placeholder="Deskripsi produk" value={form.deskripsi ?? ""} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <div className="flex gap-2">
                <button onClick={simpanProduk} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                  {form.id ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
                {form.id > 0 && (
                  <button onClick={() => setForm(KOSONG)} className="rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600">Batal</button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {produk.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-slate-800">{p.nama}</p>
                  <p className="text-xs text-slate-500">{rupiah(p.harga)} / {p.satuan} • stok {p.stok} • terjual {p.terjual}</p>
                </div>
                <button onClick={() => setForm({ id: p.id, nama: p.nama, harga: p.harga, stok: p.stok, satuan: p.satuan, emoji: p.emoji ?? "🛒", categoryId: p.categoryId, deskripsi: p.deskripsi ?? "" })} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700">Edit</button>
                <button onClick={() => hapusProduk(p.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600">Hapus</button>
              </div>
            ))}
            {produk.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Belum ada produk.</p>}
          </div>
        </div>
      )}

      {tab === "pesanan" && (
        <div className="space-y-2">
          {pesanan.map((o) => (
            <div key={o.kode} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{o.kode}</p>
                  <p className="text-[11px] text-slate-500">{tanggalJam(o.createdAt)} • {o.namaPenerima}</p>
                  <p className="text-[11px] text-slate-500">📍 {o.alamatPenerima}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_PESANAN[o.status]?.kelas}`}>
                    {STATUS_PESANAN[o.status]?.label}
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-bh9-700">{rupiah(o.total)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/pesanan/${o.kode}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700">Detail</Link>
                {o.status === "diproses" && (
                  <button onClick={() => aksiPesanan(o.kode, "siap-pickup")} className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
                    📦 Siap Pickup (panggil kurir)
                  </button>
                )}
              </div>
            </div>
          ))}
          {pesanan.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Belum ada pesanan masuk.</p>}
        </div>
      )}

      {tab === "toko" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800">Profil Toko & Titik Pickup</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input placeholder="Nama toko" value={formToko.nama} onChange={(e) => setFormToko({ ...formToko, nama: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <input placeholder="No. WhatsApp toko" value={formToko.telepon} onChange={(e) => setFormToko({ ...formToko, telepon: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <input placeholder="Alamat toko" value={formToko.alamat} onChange={(e) => setFormToko({ ...formToko, alamat: e.target.value })} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <textarea rows={2} placeholder="Deskripsi toko" value={formToko.deskripsi} onChange={(e) => setFormToko({ ...formToko, deskripsi: e.target.value })} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <p className="mb-2 mt-3 text-xs font-semibold text-slate-600">Pin lokasi toko (titik pickup kurir)</p>
          <PetaInteraktif
            titik={[
              { lat: COMPANY.depo.lat, lng: COMPANY.depo.lng, label: "Depo BH9", tipe: "depo" },
              { lat, lng, label: formToko.nama || "Toko Saya", tipe: "toko" },
            ]}
            tinggi={260}
            zoomAwal={15}
            bisaPilih
            onPilih={(la, ln) => { setLat(la); setLng(ln); }}
          />
          <button onClick={simpanToko} className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Simpan Profil Toko</button>
        </div>
      )}
    </div>
  );
}

function Pemberitahuan({ judul, teks }: { judul: string; teks: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-4xl">🏪</p>
      <h1 className="mt-3 text-lg font-extrabold text-slate-800">{judul}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{teks}</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-bh9-600 px-6 py-2.5 text-sm font-bold text-white">Kembali ke Beranda</Link>
    </div>
  );
}
