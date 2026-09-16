"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Pengguna = {
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

type Konteks = {
  user: Pengguna | null;
  memuat: boolean;
  muatUlang: () => Promise<void>;
  keluar: () => Promise<void>;
};

const Ctx = createContext<Konteks | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Pengguna | null>(null);
  const [memuat, setMemuat] = useState(true);

  const muatUlang = useCallback(async () => {
    try {
      const r = await fetch("/api/auth", { cache: "no-store" });
      const d = await r.json();
      setUser(d.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muatUlang();
  }, [muatUlang]);

  const keluar = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: "keluar" }),
    });
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, memuat, muatUlang, keluar }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
