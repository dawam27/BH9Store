"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Titik = {
  lat: number;
  lng: number;
  label: string;
  tipe?: "depo" | "toko" | "tujuan" | "kurir";
  warna?: string;
};

const IKON: Record<string, { emoji: string; bg: string }> = {
  depo: { emoji: "🏢", bg: "bg-blue-700" },
  toko: { emoji: "🏪", bg: "bg-emerald-600" },
  tujuan: { emoji: "📍", bg: "bg-rose-600" },
  kurir: { emoji: "🛵", bg: "bg-amber-500" },
};

function lngToX(lng: number, z: number) {
  return ((lng + 180) / 360) * 256 * 2 ** z;
}
function latToY(lat: number, z: number) {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z;
}
function xToLng(x: number, z: number) {
  return (x / (256 * 2 ** z)) * 360 - 180;
}
function yToLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / (256 * 2 ** z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export default function PetaInteraktif({
  titik = [],
  zoomAwal = 14,
  tinggi = 280,
  bisaPilih = false,
  onPilih,
  garis = false,
}: {
  titik?: Titik[];
  zoomAwal?: number;
  tinggi?: number;
  bisaPilih?: boolean;
  onPilih?: (lat: number, lng: number) => void;
  garis?: boolean;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [ukuran, setUkuran] = useState({ w: 360, h: tinggi });
  const [zoom, setZoom] = useState(zoomAwal);
  const pusatAwal = useMemo(() => {
    if (titik.length === 0) return { lat: -2.5551, lng: 102.6982 };
    const lat = titik.reduce((a, t) => a + t.lat, 0) / titik.length;
    const lng = titik.reduce((a, t) => a + t.lng, 0) / titik.length;
    return { lat, lng };
  }, [titik]);
  const [pusat, setPusat] = useState(pusatAwal);
  const [geser, setGeser] = useState<{ x: number; y: number } | null>(null);
  const kunciTitik = titik.map((t) => `${t.lat},${t.lng}`).join("|");

  useEffect(() => {
    setPusat(pusatAwal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciTitik]);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const ukur = () => setUkuran({ w: el.clientWidth || 360, h: tinggi });
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tinggi]);

  const cx = lngToX(pusat.lng, zoom);
  const cy = latToY(pusat.lat, zoom);
  const originX = cx - ukuran.w / 2;
  const originY = cy - ukuran.h / 2;

  const tiles = useMemo(() => {
    const maks = 2 ** zoom;
    const t0x = Math.floor(originX / 256);
    const t0y = Math.floor(originY / 256);
    const t1x = Math.floor((originX + ukuran.w) / 256);
    const t1y = Math.floor((originY + ukuran.h) / 256);
    const hasil: { key: string; url: string; left: number; top: number }[] = [];
    for (let x = t0x; x <= t1x; x++) {
      for (let y = t0y; y <= t1y; y++) {
        if (y < 0 || y >= maks) continue;
        const xw = ((x % maks) + maks) % maks;
        hasil.push({
          key: `${zoom}-${x}-${y}`,
          url: `https://tile.openstreetmap.org/${zoom}/${xw}/${y}.png`,
          left: x * 256 - originX,
          top: y * 256 - originY,
        });
      }
    }
    return hasil;
  }, [zoom, originX, originY, ukuran.w, ukuran.h]);

  const posisi = useCallback(
    (t: { lat: number; lng: number }) => ({
      left: lngToX(t.lng, zoom) - originX,
      top: latToY(t.lat, zoom) - originY,
    }),
    [zoom, originX, originY]
  );

  const mulaiGeser = (x: number, y: number) => setGeser({ x, y });
  const lanjutGeser = (x: number, y: number) => {
    if (!geser) return;
    const dx = x - geser.x;
    const dy = y - geser.y;
    setGeser({ x, y });
    setPusat({
      lat: yToLat(cy - dy, zoom),
      lng: xToLng(cx - dx, zoom),
    });
  };

  const klik = (e: React.MouseEvent) => {
    if (!bisaPilih || !onPilih || !wadah.current) return;
    const r = wadah.current.getBoundingClientRect();
    const px = originX + (e.clientX - r.left);
    const py = originY + (e.clientY - r.top);
    onPilih(
      Math.round(yToLat(py, zoom) * 1e6) / 1e6,
      Math.round(xToLng(px, zoom) * 1e6) / 1e6
    );
  };

  return (
    <div
      ref={wadah}
      style={{ height: tinggi }}
      className="relative w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#e2f0ff,#eef7ee)]"
      onMouseDown={(e) => mulaiGeser(e.clientX, e.clientY)}
      onMouseMove={(e) => lanjutGeser(e.clientX, e.clientY)}
      onMouseUp={() => setGeser(null)}
      onMouseLeave={() => setGeser(null)}
      onTouchStart={(e) => mulaiGeser(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => lanjutGeser(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={() => setGeser(null)}
      onClick={klik}
    >
      {tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.key}
          src={t.url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute h-64 w-64 max-w-none opacity-95"
          style={{ left: t.left, top: t.top }}
          onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
        />
      ))}

      {garis && titik.length > 1 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <polyline
            points={titik.map((t) => { const p = posisi(t); return `${p.left},${p.top}`; }).join(" ")}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={4}
            strokeDasharray="10 8"
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
      )}

      {titik.map((t, i) => {
        const p = posisi(t);
        const ik = IKON[t.tipe ?? "tujuan"];
        return (
          <div
            key={i}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: p.left, top: p.top }}
          >
            <div className="flex flex-col items-center">
              <span className="whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow ring-1 ring-slate-200">
                {t.label}
              </span>
              <span
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-lg ring-2 ring-white ${ik.bg}`}
              >
                {ik.emoji}
              </span>
              <span className="h-2 w-0.5 bg-slate-500/70" />
            </div>
          </div>
        );
      })}

      <div className="absolute right-2 top-2 z-20 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(18, z + 1)); }}
          className="h-8 w-8 text-lg font-bold text-slate-600 hover:bg-slate-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(5, z - 1)); }}
          className="h-8 w-8 border-t border-slate-200 text-lg font-bold text-slate-600 hover:bg-slate-50"
        >
          −
        </button>
      </div>

      {bisaPilih && (
        <div className="absolute bottom-2 left-2 z-20 rounded-lg bg-blue-700/90 px-2.5 py-1 text-[11px] font-medium text-white shadow">
          Ketuk peta untuk menaruh pin lokasi
        </div>
      )}
      <div className="absolute bottom-1 right-2 z-20 text-[9px] text-slate-500">© OpenStreetMap</div>
    </div>
  );
}
