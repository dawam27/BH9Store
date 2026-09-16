import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.select().from(categories).orderBy(categories.urutan);
  return NextResponse.json({ items });
}
