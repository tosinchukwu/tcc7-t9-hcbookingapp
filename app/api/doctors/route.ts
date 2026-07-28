import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR", isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        hospital: true,
        location: true,
        wallet: true,
        rating: true,
        bio: true,
        yearsExperience: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
