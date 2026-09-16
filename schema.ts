import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * BH9 Store & BH9 EXPRESS — Skema Database
 * Role: konsumen | pedagang | kurir | admin | owner
 * Status akun: pending | aktif | ditolak | nonaktif
 */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    nama: text("nama").notNull(),
    email: text("email").notNull(),
    telepon: text("telepon"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("konsumen"),
    status: text("status").notNull().default("aktif"),
    emailVerified: boolean("email_verified").notNull().default(false),
    otpCode: text("otp_code"),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    alamat: text("alamat"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    catatanAdmin: text("catatan_admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id").notNull(),
    nama: text("nama").notNull(),
    slug: text("slug").notNull(),
    deskripsi: text("deskripsi"),
    alamat: text("alamat"),
    telepon: text("telepon"),
    lat: doublePrecision("lat").default(-2.5551),
    lng: doublePrecision("lng").default(102.6982),
    status: text("status").notNull().default("pending"),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("stores_slug_idx").on(t.slug),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    nama: text("nama").notNull(),
    slug: text("slug").notNull(),
    induk: text("induk").notNull(), // pertanian | makanan-minuman | sembako
    ikon: text("ikon"),
    deskripsi: text("deskripsi"),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
  })
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").notNull(),
    categoryId: integer("category_id").notNull(),
    nama: text("nama").notNull(),
    slug: text("slug").notNull(),
    deskripsi: text("deskripsi"),
    harga: integer("harga").notNull().default(0),
    hargaCoret: integer("harga_coret"),
    stok: integer("stok").notNull().default(0),
    satuan: text("satuan").notNull().default("pcs"),
    emoji: text("emoji").default("🛒"),
    imageUrl: text("image_url"),
    aktif: boolean("aktif").notNull().default(true),
    terjual: integer("terjual").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    kode: text("kode").notNull(),
    userId: integer("user_id").notNull(),
    storeId: integer("store_id").notNull(),
    subtotal: integer("subtotal").notNull().default(0),
    ongkir: integer("ongkir").notNull().default(0),
    biayaLayanan: integer("biaya_layanan").notNull().default(0),
    total: integer("total").notNull().default(0),
    /** menunggu_pembayaran | menunggu_verifikasi | diproses | siap_pickup | dikirim | selesai | dibatalkan */
    status: text("status").notNull().default("menunggu_pembayaran"),
    metodeKirim: text("metode_kirim").notNull().default("bh9-express"),
    metodePembayaran: text("metode_pembayaran").notNull().default("dana-qris"),
    /** belum_bayar | menunggu_verifikasi | lunas | ditolak */
    statusPembayaran: text("status_pembayaran").notNull().default("belum_bayar"),
    buktiUrl: text("bukti_url"),
    namaPenerima: text("nama_penerima").notNull(),
    teleponPenerima: text("telepon_penerima").notNull(),
    alamatPenerima: text("alamat_penerima").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    kodeIdx: uniqueIndex("orders_kode_idx").on(t.kode),
  })
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  nama: text("nama").notNull(),
  harga: integer("harga").notNull(),
  qty: integer("qty").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const shipments = pgTable(
  "shipments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    resi: text("resi").notNull(),
    kurirId: integer("kurir_id"),
    /** menunggu_kurir | ditawarkan | diterima | ditolak | pickup | dalam_perjalanan | selesai */
    status: text("status").notNull().default("menunggu_kurir"),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),
    tujuanLat: doublePrecision("tujuan_lat"),
    tujuanLng: doublePrecision("tujuan_lng"),
    kurirLat: doublePrecision("kurir_lat"),
    kurirLng: doublePrecision("kurir_lng"),
    jarakKm: doublePrecision("jarak_km").default(0),
    ongkir: integer("ongkir").notNull().default(0),
    alasanTolak: text("alasan_tolak"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resiIdx: uniqueIndex("shipments_resi_idx").on(t.resi),
  })
);

export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").notNull(),
  status: text("status").notNull(),
  keterangan: text("keterangan").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    kunci: text("kunci").notNull(),
    nilai: text("nilai").notNull(),
  },
  (t) => ({
    kunciIdx: uniqueIndex("settings_kunci_idx").on(t.kunci),
  })
);
