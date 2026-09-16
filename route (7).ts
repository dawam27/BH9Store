import QRCode from "qrcode";
import { COMPANY } from "@/lib/company";

export const dynamic = "force-static";

export async function GET() {
  const payload = [
    "BH9 STORE - PEMBAYARAN QRIS / DANA",
    `Merchant: ${COMPANY.qris.merchant}`,
    `NMID: ${COMPANY.qris.nmid} ${COMPANY.qris.kode}`,
    `DANA: ${COMPANY.qris.dana}`,
    `WA: ${COMPANY.whatsappNomor}`,
  ].join("\n");

  const buffer = await QRCode.toBuffer(payload, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#0B3FA8", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
