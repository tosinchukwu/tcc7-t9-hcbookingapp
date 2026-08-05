// app/api/admin/check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet required" }, { status: 400 });
  }

  const normalizedWallet = wallet.toLowerCase();

  // Check DB (case‑insensitive)
  const settings = await prisma.hospitalSettings.findFirst();
  const isAdmin = settings?.adminWallets?.some(
    (w: string) => w.toLowerCase() === normalizedWallet
  ) || false;

  // Check env var (case‑insensitive)
  const envAdmin = process.env.NEXT_PUBLIC_ADMIN_WALLET;
  const isEnvAdmin = envAdmin?.toLowerCase() === normalizedWallet;

  return NextResponse.json({ isAdmin: isAdmin || isEnvAdmin });
}