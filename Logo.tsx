import Image from "next/image";
import Link from "next/link";

export default function Logo({
  ukuran = 40,
  teks = true,
  terang = false,
}: {
  ukuran?: number;
  teks?: boolean;
  terang?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/images/bh9-logo.png"
        alt="Logo BH9 Store"
        width={ukuran}
        height={ukuran}
        className="rounded-xl shadow-sm ring-1 ring-black/5"
        priority
      />
      {teks && (
        <span className="leading-tight">
          <span
            className={`block text-[15px] font-extrabold tracking-tight ${
              terang ? "text-white" : "text-bh9-800"
            }`}
          >
            BH9 <span className="text-emas-500">Store</span>
          </span>
          <span
            className={`block text-[10px] font-medium ${
              terang ? "text-bh9-100" : "text-slate-500"
            }`}
          >
            Dari Kito untuk Kito
          </span>
        </span>
      )}
    </Link>
  );
}
