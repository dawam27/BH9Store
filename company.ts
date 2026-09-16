export const COMPANY = {
  nama: "BH9 Store",
  logistik: "BH9 EXPRESS",
  tagline1: "Dari Kito untuk Kito",
  tagline2: "Tempat Belanjo warga Pauh Timur dan sekitarnya",
  alamat:
    "Jl. Inpres RT. 04, Dusun 2, Desa Lamban Sigatal, Kec. Pauh, Kab. Sarolangun, Jambi 37491",
  alamatSingkat: "Jl. Inpres RT.04, Lamban Sigatal, Pauh, Sarolangun, Jambi",
  kodePos: "37491",
  whatsapp: "https://wa.me/6285218059394",
  whatsappNomor: "+62 852-1805-9394",
  email: "bh9storept@gmail.com",
  tiktok: "@bh9store",
  tiktokUrl: "https://www.tiktok.com/@bh9store",
  depo: { lat: -2.5551, lng: 102.6982, nama: "Depo Pusat BH9 EXPRESS" },
  qris: {
    merchant: "BHATIN SEMBILAN ARCH",
    nmid: "ID1026586959672",
    kode: "A01",
    dana: "0852-1805-9394 a.n. BH9 Store",
  },
  ongkir: {
    dasar: 5000,
    perKm: 2000,
    minimum: 5000,
    gratisDiAtas: 250000,
  },
  biayaLayanan: 1000,
};

export const KATEGORI_INDUK = [
  {
    slug: "pertanian",
    nama: "Pertanian & Hasil Pertanian",
    ringkas: "Pertanian",
    ikon: "🌾",
    warna: "from-emerald-500 to-green-600",
    gambar: "/images/kat-pertanian.jpg",
    deskripsi:
      "Sarana tani hulu (benih, pupuk, pestisida, alat) sampai hasil panen segar hilir dari petani Pauh.",
  },
  {
    slug: "makanan-minuman",
    nama: "Makanan & Minuman",
    ringkas: "Makanan & Minuman",
    ikon: "🍜",
    warna: "from-amber-500 to-orange-600",
    gambar: "/images/kat-makanan.jpg",
    deskripsi:
      "Camilan, kopi & seduhan lokal, bumbu masak instan, hingga frozen food siap masak.",
  },
  {
    slug: "sembako",
    nama: "Sembako",
    ringkas: "Sembako",
    ikon: "🛒",
    warna: "from-blue-600 to-indigo-700",
    gambar: "/images/kat-sembako.jpg",
    deskripsi:
      "Sembilan bahan pokok: beras, minyak goreng, gula, garam, tepung, dan telur segar.",
  },
] as const;

export const ROLE_LABEL: Record<string, string> = {
  konsumen: "Konsumen / Pembeli",
  pedagang: "Pedagang / Mitra",
  kurir: "Kurir BH9 EXPRESS",
  admin: "Admin",
  owner: "Owner",
};

export const STATUS_PESANAN: Record<string, { label: string; kelas: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", kelas: "bg-amber-100 text-amber-700" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", kelas: "bg-sky-100 text-sky-700" },
  diproses: { label: "Diproses Pedagang", kelas: "bg-indigo-100 text-indigo-700" },
  siap_pickup: { label: "Siap Pickup", kelas: "bg-violet-100 text-violet-700" },
  dikirim: { label: "Sedang Dikirim", kelas: "bg-blue-100 text-blue-700" },
  selesai: { label: "Selesai", kelas: "bg-emerald-100 text-emerald-700" },
  dibatalkan: { label: "Dibatalkan", kelas: "bg-rose-100 text-rose-700" },
};

export const STATUS_KIRIM: Record<string, { label: string; kelas: string }> = {
  menunggu_kurir: { label: "Menunggu Kurir", kelas: "bg-slate-100 text-slate-600" },
  ditawarkan: { label: "Ditawarkan ke Kurir", kelas: "bg-amber-100 text-amber-700" },
  diterima: { label: "Diterima Kurir", kelas: "bg-sky-100 text-sky-700" },
  ditolak: { label: "Ditolak Kurir", kelas: "bg-rose-100 text-rose-700" },
  pickup: { label: "Pickup di Toko", kelas: "bg-violet-100 text-violet-700" },
  dalam_perjalanan: { label: "Dalam Perjalanan", kelas: "bg-blue-100 text-blue-700" },
  selesai: { label: "Terkirim", kelas: "bg-emerald-100 text-emerald-700" },
};
