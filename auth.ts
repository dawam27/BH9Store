import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "bh9_sesi";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(":");
    if (!salt || !key) return false;
    const derived = scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, "hex");
    return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

export function buatOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type SesiUser = {
  id: number;
  nama: string;
  email: string;
  telepon: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  alamat: string | null;
  lat: number | null;
  lng: number | null;
};

export async function buatSesi(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  jar.delete(SESSION_COOKIE);
}

export async function penggunaSaatIni(): Promise<SesiUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      nama: users.nama,
      email: users.email,
      telepon: users.telepon,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      alamat: users.alamat,
      lat: users.lat,
      lng: users.lng,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export function isAdmin(user: SesiUser | null): boolean {
  return !!user && (user.role === "admin" || user.role === "owner");
}

export async function butuhRole(roles: string[]): Promise<SesiUser | null> {
  const user = await penggunaSaatIni();
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}
