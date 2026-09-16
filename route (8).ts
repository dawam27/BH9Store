import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  orderItems,
  orders,
  products,
  settings,
  shipments,
  stores,
  trackingEvents,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-dynamic";

const KATEGORI: { nama: string; induk: string; ikon: string }[] = [
  { nama: "Benih & Bibit Unggul", induk: "pertanian", ikon: "🌱" },
  { nama: "Pupuk (Organik/NPK/Urea)", induk: "pertanian", ikon: "🧪" },
  { nama: "Pestisida", induk: "pertanian", ikon: "🧴" },
  { nama: "Alat Pertanian", induk: "pertanian", ikon: "🛠️" },
  { nama: "Sayuran Segar", induk: "pertanian", ikon: "🥬" },
  { nama: "Buah Lokal", induk: "pertanian", ikon: "🍍" },
  { nama: "Palawija", induk: "pertanian", ikon: "🌽" },
  { nama: "Olahan Tani", induk: "pertanian", ikon: "🍯" },
  { nama: "Camilan & Makanan Ringan", induk: "makanan-minuman", ikon: "🍪" },
  { nama: "Minuman & Seduhan", induk: "makanan-minuman", ikon: "☕" },
  { nama: "Bumbu Masak Instan", induk: "makanan-minuman", ikon: "🌶️" },
  { nama: "Makanan Beku (Frozen)", induk: "makanan-minuman", ikon: "🧊" },
  { nama: "Beras", induk: "sembako", ikon: "🍚" },
  { nama: "Minyak Goreng", induk: "sembako", ikon: "🛢️" },
  { nama: "Gula Pasir", induk: "sembako", ikon: "🧂" },
  { nama: "Garam Beryodium", induk: "sembako", ikon: "🧂" },
  { nama: "Tepung", induk: "sembako", ikon: "🌾" },
  { nama: "Telur Ayam Segar", induk: "sembako", ikon: "🥚" },
];

const PRODUK: {
  nama: string;
  kat: string;
  harga: number;
  coret?: number;
  stok: number;
  satuan: string;
  emoji: string;
  toko: number;
  desk: string;
}[] = [
  { nama: "Benih Cabai Rawit Unggul 10gr", kat: "Benih & Bibit Unggul", harga: 25000, coret: 32000, stok: 120, satuan: "pack", emoji: "🌶️", toko: 0, desk: "Benih cabai rawit daya tumbuh 95%, cocok untuk lahan Pauh." },
  { nama: "Bibit Sawit Unggul Siap Tanam", kat: "Benih & Bibit Unggul", harga: 45000, stok: 60, satuan: "batang", emoji: "🌴", toko: 0, desk: "Bibit bersertifikat umur 8 bulan." },
  { nama: "Pupuk NPK Mutiara 16-16-16 5kg", kat: "Pupuk (Organik/NPK/Urea)", harga: 95000, coret: 110000, stok: 80, satuan: "sak", emoji: "🧪", toko: 0, desk: "Pupuk majemuk untuk semua fase tanaman." },
  { nama: "Pupuk Urea Subsidi 5kg", kat: "Pupuk (Organik/NPK/Urea)", harga: 38000, stok: 100, satuan: "sak", emoji: "🧫", toko: 0, desk: "Sumber nitrogen tinggi untuk fase vegetatif." },
  { nama: "Pupuk Kandang Organik 10kg", kat: "Pupuk (Organik/NPK/Urea)", harga: 30000, stok: 70, satuan: "karung", emoji: "🌿", toko: 0, desk: "Kompos matang bebas bau, memperbaiki struktur tanah." },
  { nama: "Pestisida Hayati Anti Hama 500ml", kat: "Pestisida", harga: 48000, stok: 45, satuan: "botol", emoji: "🧴", toko: 0, desk: "Aman untuk tanaman sayur dan buah." },
  { nama: "Cangkul Baja Gagang Kayu", kat: "Alat Pertanian", harga: 85000, stok: 25, satuan: "unit", emoji: "🛠️", toko: 0, desk: "Baja tempa kuat, gagang kayu keras." },
  { nama: "Sprayer Manual 16 Liter", kat: "Alat Pertanian", harga: 235000, coret: 265000, stok: 15, satuan: "unit", emoji: "🎒", toko: 0, desk: "Tangki kuat dengan nozzle kabut halus." },

  { nama: "Cabai Merah Keriting Segar 1kg", kat: "Sayuran Segar", harga: 42000, stok: 40, satuan: "kg", emoji: "🌶️", toko: 1, desk: "Panen pagi dari kebun warga Pauh Timur." },
  { nama: "Bawang Merah Lokal 1kg", kat: "Sayuran Segar", harga: 36000, stok: 55, satuan: "kg", emoji: "🧅", toko: 1, desk: "Bawang merah pilihan, kering matang." },
  { nama: "Tomat Segar Grade A 1kg", kat: "Sayuran Segar", harga: 18000, stok: 60, satuan: "kg", emoji: "🍅", toko: 1, desk: "Tomat padat, cocok sambal & masakan." },
  { nama: "Kangkung Segar Ikat", kat: "Sayuran Segar", harga: 4000, stok: 100, satuan: "ikat", emoji: "🥬", toko: 1, desk: "Dipetik pagi hari, masih segar berembun." },
  { nama: "Duku Sarolangun 1kg", kat: "Buah Lokal", harga: 25000, stok: 35, satuan: "kg", emoji: "🍈", toko: 1, desk: "Duku manis khas Sarolangun musim panen." },
  { nama: "Pisang Kepok Sisir", kat: "Buah Lokal", harga: 20000, stok: 40, satuan: "sisir", emoji: "🍌", toko: 1, desk: "Pisang kepok tua, cocok digoreng/rebus." },
  { nama: "Jagung Pipilan Kering 5kg", kat: "Palawija", harga: 45000, stok: 30, satuan: "karung", emoji: "🌽", toko: 1, desk: "Jagung kering kadar air rendah." },
  { nama: "Kacang Tanah Lokal 1kg", kat: "Palawija", harga: 28000, stok: 25, satuan: "kg", emoji: "🥜", toko: 1, desk: "Kacang tanah pilihan hasil petani lokal." },
  { nama: "Beras Merah Organik 2kg", kat: "Olahan Tani", harga: 48000, coret: 55000, stok: 30, satuan: "pack", emoji: "🍚", toko: 1, desk: "Tanpa pestisida kimia, pulen dan sehat." },
  { nama: "Gula Aren Cetak 1kg", kat: "Olahan Tani", harga: 32000, stok: 50, satuan: "kg", emoji: "🟤", toko: 1, desk: "Gula aren murni tanpa campuran." },
  { nama: "Madu Hutan Murni 500ml", kat: "Olahan Tani", harga: 120000, coret: 140000, stok: 20, satuan: "botol", emoji: "🍯", toko: 1, desk: "Madu hutan asli Jambi, panen lestari." },

  { nama: "Keripik Singkong Balado 250gr", kat: "Camilan & Makanan Ringan", harga: 15000, stok: 80, satuan: "pack", emoji: "🍟", toko: 2, desk: "Camilan renyah produksi UMKM Pauh." },
  { nama: "Kerupuk Ikan Sungai 200gr", kat: "Camilan & Makanan Ringan", harga: 18000, stok: 60, satuan: "pack", emoji: "🍘", toko: 2, desk: "Gurih asli ikan sungai Batanghari." },
  { nama: "Kopi Robusta Bubuk Lokal 250gr", kat: "Minuman & Seduhan", harga: 35000, coret: 40000, stok: 45, satuan: "pack", emoji: "☕", toko: 2, desk: "Roasting medium, aroma kuat khas Jambi." },
  { nama: "Teh Hijau Celup Isi 25", kat: "Minuman & Seduhan", harga: 12000, stok: 70, satuan: "box", emoji: "🍵", toko: 2, desk: "Teh hijau segar untuk harian." },
  { nama: "Wedang Jahe Herbal Instan", kat: "Minuman & Seduhan", harga: 22000, stok: 40, satuan: "pack", emoji: "🫖", toko: 2, desk: "Jahe merah instan penghangat badan." },
  { nama: "Bumbu Rendang Instan 100gr", kat: "Bumbu Masak Instan", harga: 13000, stok: 65, satuan: "pack", emoji: "🍛", toko: 2, desk: "Bumbu lengkap tinggal masak." },
  { nama: "Sambal Lokal Pedas 200ml", kat: "Bumbu Masak Instan", harga: 20000, stok: 50, satuan: "botol", emoji: "🌶️", toko: 2, desk: "Sambal rumahan pedas nagih." },
  { nama: "Nugget Ayam Frozen 500gr", kat: "Makanan Beku (Frozen)", harga: 35000, stok: 30, satuan: "pack", emoji: "🍗", toko: 2, desk: "Frozen food praktis, tersedia cold pack." },
  { nama: "Bakso Sapi Frozen 500gr", kat: "Makanan Beku (Frozen)", harga: 42000, stok: 28, satuan: "pack", emoji: "🧊", toko: 2, desk: "Bakso kenyal isi 30 butir." },

  { nama: "Beras Putih Premium 5kg", kat: "Beras", harga: 68000, coret: 75000, stok: 90, satuan: "sak", emoji: "🍚", toko: 3, desk: "Pulen wangi, sortir bersih." },
  { nama: "Beras Putih Premium 10kg", kat: "Beras", harga: 132000, stok: 60, satuan: "sak", emoji: "🍚", toko: 3, desk: "Hemat untuk kebutuhan keluarga sebulan." },
  { nama: "Beras Merah Sehat 5kg", kat: "Beras", harga: 95000, stok: 35, satuan: "sak", emoji: "🌾", toko: 3, desk: "Indeks glikemik rendah, cocok diet." },
  { nama: "Minyak Goreng Pouch 2L", kat: "Minyak Goreng", harga: 36000, coret: 39000, stok: 120, satuan: "pouch", emoji: "🛢️", toko: 3, desk: "Minyak sawit jernih dua kali penyaringan." },
  { nama: "Minyak Goreng Curah 1L", kat: "Minyak Goreng", harga: 16000, stok: 150, satuan: "liter", emoji: "🫗", toko: 3, desk: "Curah takaran pas untuk warung." },
  { nama: "Gula Pasir Kristal 1kg", kat: "Gula Pasir", harga: 17000, stok: 140, satuan: "kg", emoji: "🍬", toko: 3, desk: "Butiran putih bersih." },
  { nama: "Garam Beryodium 500gr", kat: "Garam Beryodium", harga: 5000, stok: 200, satuan: "pack", emoji: "🧂", toko: 3, desk: "Beryodium sesuai standar SNI." },
  { nama: "Tepung Terigu Serbaguna 1kg", kat: "Tepung", harga: 13000, stok: 110, satuan: "kg", emoji: "🌾", toko: 3, desk: "Protein sedang untuk gorengan & kue." },
  { nama: "Tepung Beras 500gr", kat: "Tepung", harga: 9000, stok: 80, satuan: "pack", emoji: "🥣", toko: 3, desk: "Halus untuk kue tradisional." },
  { nama: "Telur Ayam Segar 1kg", kat: "Telur Ayam Segar", harga: 29000, stok: 100, satuan: "kg", emoji: "🥚", toko: 3, desk: "Telur segar peternak lokal, isi ±16 butir." },
];

export async function POST() {
  const sudah = await db.select().from(settings).where(eq(settings.kunci, "seed")).limit(1);
  if (sudah.length > 0) {
    return NextResponse.json({ ok: true, pesan: "Data sudah tersedia." });
  }

  // Kategori
  const katRows = await db
    .insert(categories)
    .values(
      KATEGORI.map((k, i) => ({
        nama: k.nama,
        slug: slugify(k.nama),
        induk: k.induk,
        ikon: k.ikon,
        urutan: i,
      }))
    )
    .returning();
  const katByNama = new Map(katRows.map((k) => [k.nama, k.id]));

  const pass = hashPassword("bh9store123");
  const akun = [
    { nama: "Owner BH9 Store", email: "owner@bh9store.id", role: "owner", status: "aktif" },
    { nama: "Admin Operasional", email: "admin@bh9store.id", role: "admin", status: "aktif" },
    { nama: "Budi Tani", email: "pedagang1@bh9store.id", role: "pedagang", status: "aktif" },
    { nama: "Sari Kebun", email: "pedagang2@bh9store.id", role: "pedagang", status: "aktif" },
    { nama: "Warung Mak Ijah", email: "pedagang3@bh9store.id", role: "pedagang", status: "aktif" },
    { nama: "Toko Sembako Jaya", email: "pedagang4@bh9store.id", role: "pedagang", status: "aktif" },
    { nama: "Rian Kurir", email: "kurir1@bh9store.id", role: "kurir", status: "aktif" },
    { nama: "Doni Kurir", email: "kurir2@bh9store.id", role: "kurir", status: "pending" },
    { nama: "Siti Konsumen", email: "konsumen@bh9store.id", role: "konsumen", status: "aktif" },
    { nama: "Hendra Mitra Baru", email: "pedagang5@bh9store.id", role: "pedagang", status: "pending" },
  ];
  const userRows = await db
    .insert(users)
    .values(
      akun.map((a, i) => ({
        nama: a.nama,
        email: a.email,
        telepon: "0852180593" + String(10 + i),
        passwordHash: pass,
        role: a.role,
        status: a.status,
        emailVerified: true,
        alamat: "Desa Lamban Sigatal, Kec. Pauh, Sarolangun",
        lat: COMPANY.depo.lat + (i % 5) * 0.004,
        lng: COMPANY.depo.lng + (i % 4) * 0.005,
      }))
    )
    .returning();
  const byEmail = new Map(userRows.map((u) => [u.email, u]));

  const dataToko = [
    { email: "pedagang1@bh9store.id", nama: "Tani Makmur Pauh", desk: "Sarana produksi pertanian hulu: benih, pupuk, pestisida, dan alat tani.", lat: -2.5502, lng: 102.6935, status: "aktif" },
    { email: "pedagang2@bh9store.id", nama: "Kebun Sari Segar", desk: "Hasil panen segar & olahan tani warga Pauh Timur.", lat: -2.5589, lng: 102.7031, status: "aktif" },
    { email: "pedagang3@bh9store.id", nama: "Warung Mak Ijah", desk: "Camilan, minuman seduhan, bumbu instan, dan frozen food.", lat: -2.5533, lng: 102.6998, status: "aktif" },
    { email: "pedagang4@bh9store.id", nama: "Sembako Jaya Lamban Sigatal", desk: "Sembilan bahan pokok lengkap harga grosir.", lat: -2.5571, lng: 102.6949, status: "aktif" },
    { email: "pedagang5@bh9store.id", nama: "Kios Hendra (Menunggu ACC)", desk: "Calon mitra baru BH9 Store.", lat: -2.5605, lng: 102.7004, status: "pending" },
  ];
  const tokoRows = await db
    .insert(stores)
    .values(
      dataToko.map((t) => ({
        ownerId: byEmail.get(t.email)!.id,
        nama: t.nama,
        slug: slugify(t.nama),
        deskripsi: t.desk,
        alamat: "Jl. Inpres, Dusun 2, Lamban Sigatal, Pauh, Sarolangun",
        telepon: "085218059394",
        lat: t.lat,
        lng: t.lng,
        status: t.status,
      }))
    )
    .returning();

  await db.insert(products).values(
    PRODUK.map((p) => ({
      storeId: tokoRows[p.toko].id,
      categoryId: katByNama.get(p.kat)!,
      nama: p.nama,
      slug: slugify(p.nama),
      deskripsi: p.desk,
      harga: p.harga,
      hargaCoret: p.coret ?? null,
      stok: p.stok,
      satuan: p.satuan,
      emoji: p.emoji,
      aktif: true,
      terjual: Math.floor(Math.random() * 90) + 5,
    }))
  );

  // Contoh pesanan berjalan untuk demo live tracking
  const konsumen = byEmail.get("konsumen@bh9store.id")!;
  const produkDemo = (await db.select().from(products).limit(2));
  const subtotal = produkDemo.reduce((a, p) => a + p.harga, 0);
  const ordDemo = await db
    .insert(orders)
    .values({
      kode: "BH9-DEMO01",
      userId: konsumen.id,
      storeId: produkDemo[0].storeId,
      subtotal,
      ongkir: 9000,
      biayaLayanan: COMPANY.biayaLayanan,
      total: subtotal + 9000 + COMPANY.biayaLayanan,
      status: "dikirim",
      statusPembayaran: "lunas",
      metodeKirim: "bh9-express",
      metodePembayaran: "dana-qris",
      namaPenerima: "Siti Konsumen",
      teleponPenerima: "085218059394",
      alamatPenerima: "Dusun 2 RT 04, Lamban Sigatal, Pauh, Sarolangun",
      lat: -2.5615,
      lng: 102.7052,
      catatan: "Titip di teras bila tidak ada orang.",
    })
    .returning();
  await db.insert(orderItems).values(
    produkDemo.map((p) => ({
      orderId: ordDemo[0].id,
      productId: p.id,
      nama: p.nama,
      harga: p.harga,
      qty: 1,
      subtotal: p.harga,
    }))
  );
  const kirimDemo = await db
    .insert(shipments)
    .values({
      orderId: ordDemo[0].id,
      resi: "BX100000001",
      kurirId: byEmail.get("kurir1@bh9store.id")!.id,
      status: "dalam_perjalanan",
      pickupLat: -2.5502,
      pickupLng: 102.6935,
      tujuanLat: -2.5615,
      tujuanLng: 102.7052,
      kurirLat: -2.5558,
      kurirLng: 102.6994,
      jarakKm: 2.1,
      ongkir: 9000,
    })
    .returning();
  await db.insert(trackingEvents).values([
    { shipmentId: kirimDemo[0].id, status: "menunggu_kurir", keterangan: "Pesanan dibuat konsumen." },
    { shipmentId: kirimDemo[0].id, status: "ditawarkan", keterangan: "Pedagang menyatakan barang siap pickup." },
    { shipmentId: kirimDemo[0].id, status: "diterima", keterangan: "Kurir Rian menerima tugas pickup." },
    { shipmentId: kirimDemo[0].id, status: "pickup", keterangan: "Barang diambil dari Tani Makmur Pauh.", lat: -2.5502, lng: 102.6935 },
    { shipmentId: kirimDemo[0].id, status: "dalam_perjalanan", keterangan: "Kurir menuju alamat konsumen.", lat: -2.5558, lng: 102.6994 },
  ]);

  await db.insert(settings).values([
    { kunci: "seed", nilai: new Date().toISOString() },
    { kunci: "nama_perusahaan", nilai: COMPANY.nama },
    { kunci: "alamat_depo", nilai: COMPANY.alamat },
  ]);

  return NextResponse.json({ ok: true, pesan: "Seed berhasil." });
}
