import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminWallet } from "@/lib/admin";

export async function GET() {
  try {
    let settings = await prisma.hospitalSettings.findFirst();
    if (!settings) {
      const initialAdmin = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0x040495b88ABD76E4f184F18A642BCC492e9D4E99";
      settings = await prisma.hospitalSettings.create({
        data: {
          name: "MEDCRUSH BLOCKCHAIN HOSPITAL",
          email: "medcrush@gmail.com",
          phone: "08023000000",
          address: "2, Hospital Road, Benin",
          adminWallets: initialAdmin ? [initialAdmin] : [],
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching hospital settings:", error);
    return NextResponse.json({
      name: "MEDCRUSH BLOCKCHAIN HOSPITAL",
      email: "medcrush@gmail.com",
      phone: "08023000000",
      address: "2, Hospital Road, Benin",
      adminWallets: [process.env.NEXT_PUBLIC_ADMIN_WALLET || ""].filter(Boolean),
    });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    if (!wallet || !(await isAdminWallet(wallet))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, adminWallets, ...data } = body;

    let settings = await prisma.hospitalSettings.findFirst();
    if (!settings) {
      settings = await prisma.hospitalSettings.create({
        data: {
          name: "MEDCRUSH BLOCKCHAIN HOSPITAL",
          adminWallets: [],
        },
      });
    }

    const updateData = {
      ...data,
      adminWallets: Array.isArray(adminWallets) ? adminWallets : [],
    };

    const updated = await prisma.hospitalSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating hospital settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings: " + (error as Error).message },
      { status: 500 }
    );
  }
}