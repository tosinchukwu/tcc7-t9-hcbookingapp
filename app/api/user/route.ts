import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { wallet },
      select: { name: true, wallet: true, role: true },
    });

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
