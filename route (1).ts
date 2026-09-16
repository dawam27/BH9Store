import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores, users } from "@/db/schema";
import {
  buatOtp,
  buatSesi,
  hapusSesi,
  hashPassword,
  penggunaSaatIni,
  verifyPassword,
} from "@/lib/auth";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await penggunaSaatIni();
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const aksi = String(body.aksi ?? "");

  if (aksi === "daftar") {
    const nama = String(body.nama ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telepon = String(body.telepon ?? "").trim();
    const password = String(body.password ?? "");
    const role = ["konsumen", "pedagang", "kurir"].includes(body.role) ? body.role : "konsumen";
    const namaToko = String(body.namaToko ?? "").trim();

    if (!nama || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi (min. 6 karakter) wajib diisi." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    const ada = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (ada.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    const otp = buatOtp();
    const status = role === "konsumen" ? "aktif" : "pending";
    const inserted = await db
      .insert(users)
      .values({
        nama,
        email,
        telepon,
        passwordHash: hashPassword(password),
        role,
        status,
        emailVerified: false,
        otpCode: otp,
        otpExpiresAt: new Date(Date.now() + 1000 * 60 * 30),
      })
      .returning({ id: users.id });

    if (role === "pedagang") {
      const dasar = slugify(namaToko || `toko-${nama}`);
      await db.insert(stores).values({
        ownerId: inserted[0].id,
        nama: namaToko || `Toko ${nama}`,
        slug: `${dasar}-${inserted[0].id}`,
        deskripsi: "Mitra pedagang BH9 Store.",
        alamat: "Pauh, Sarolangun, Jambi",
        telepon,
        status: "pending",
      });
    }

    return NextResponse.json({
      ok: true,
      email,
      role,
      otp, // mode demo: kode juga ditampilkan di layar
      pesan: "Kode verifikasi 6 digit telah dikirim ke email Anda.",
    });
  }

  if (aksi === "verifikasi") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const kode = String(body.kode ?? "").trim();
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const u = rows[0];
    if (!u) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    if (u.emailVerified) return NextResponse.json({ ok: true, sudah: true, role: u.role });
    if (!u.otpCode || u.otpCode !== kode) {
      return NextResponse.json({ error: "Kode verifikasi salah." }, { status: 400 });
    }
    if (u.otpExpiresAt && u.otpExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Kode kedaluwarsa, minta kode baru." }, { status: 400 });
    }
    await db
      .update(users)
      .set({ emailVerified: true, otpCode: null, otpExpiresAt: null })
      .where(eq(users.id, u.id));
    await buatSesi(u.id);
    return NextResponse.json({ ok: true, role: u.role, status: u.status });
  }

  if (aksi === "kirim-ulang") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    const otp = buatOtp();
    await db
      .update(users)
      .set({ otpCode: otp, otpExpiresAt: new Date(Date.now() + 1000 * 60 * 30) })
      .where(eq(users.id, rows[0].id));
    return NextResponse.json({ ok: true, otp, pesan: "Kode baru terkirim." });
  }

  if (aksi === "masuk") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const u = rows[0];
    if (!u || !verifyPassword(password, u.passwordHash)) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }
    if (!u.emailVerified) {
      return NextResponse.json(
        { error: "Email belum diverifikasi.", butuhVerifikasi: true, email: u.email },
        { status: 403 }
      );
    }
    if (u.status === "nonaktif" || u.status === "ditolak") {
      return NextResponse.json(
        { error: "Akun Anda tidak aktif. Hubungi admin BH9 Store." },
        { status: 403 }
      );
    }
    await buatSesi(u.id);
    return NextResponse.json({ ok: true, role: u.role, status: u.status });
  }

  if (aksi === "keluar") {
    await hapusSesi();
    return NextResponse.json({ ok: true });
  }

  if (aksi === "perbarui-profil") {
    const user = await penggunaSaatIni();
    if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
    await db
      .update(users)
      .set({
        nama: String(body.nama ?? user.nama),
        telepon: String(body.telepon ?? user.telepon ?? ""),
        alamat: String(body.alamat ?? user.alamat ?? ""),
        lat: body.lat != null ? Number(body.lat) : user.lat,
        lng: body.lng != null ? Number(body.lng) : user.lng,
      })
      .where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
