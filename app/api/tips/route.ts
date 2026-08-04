import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tips = await prisma.tip.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tips);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tips" }, { status: 500 });
  }
}
