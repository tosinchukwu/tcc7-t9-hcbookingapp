import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminWallet } from "@/lib/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  if (!wallet || !(await isAdminWallet(wallet))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(doctors);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  if (!wallet || !(await isAdminWallet(wallet))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, wallet: doctorWallet, specialty, hospital, location, bio, yearsExperience, rating, isActive } = body;

  const newDoctor = await prisma.user.create({
    data: {
      name,
      email,
      wallet: doctorWallet,
      role: "DOCTOR",
      specialty,
      hospital,
      location,
      bio,
      yearsExperience: parseInt(yearsExperience) || 0,
      rating: parseFloat(rating) || 0,
      isActive: isActive !== undefined ? isActive : true,
      autoConfirm: false,
    },
  });
  return NextResponse.json(newDoctor, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  if (!wallet || !(await isAdminWallet(wallet))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, email, specialty, hospital, location, bio, yearsExperience, rating, isActive } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      specialty,
      hospital,
      location,
      bio,
      yearsExperience: parseInt(yearsExperience) || 0,
      rating: parseFloat(rating) || 0,
      isActive,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const id = searchParams.get("id");
  if (!wallet || !(await isAdminWallet(wallet))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}