import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET – fetch doctor profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const doctor = await prisma.user.findUnique({
      where: { wallet },
      select: {
        id: true,
        name: true,
        email: true,
        wallet: true,
        specialty: true,
        hospital: true,
        location: true,
        bio: true,
        rating: true,
        yearsExperience: true,
        isActive: true,
        autoConfirm: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("❌ GET /api/doctors/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT – create or update doctor profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("📨 PUT /api/doctors/profile body:", body);

    const {
      wallet,
      name,
      email,
      specialty,
      hospital,
      location,
      bio,
      yearsExperience,
      autoConfirm,
    } = body;

    // Validate required fields
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!specialty) {
      return NextResponse.json(
        { error: "Specialty is required" },
        { status: 400 }
      );
    }

    // Parse yearsExperience safely
    let parsedYears = null;
    if (yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== "") {
      parsedYears = parseInt(yearsExperience);
      if (isNaN(parsedYears)) {
        return NextResponse.json(
          { error: "Years of experience must be a valid number" },
          { status: 400 }
        );
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { wallet },
    });

    let updatedUser;

    if (existingUser) {
      // Update existing user
      updatedUser = await prisma.user.update({
        where: { wallet },
        data: {
          name,
          email: email || null,
          specialty,
          hospital: hospital || null,
          location: location || null,
          bio: bio || null,
          yearsExperience: parsedYears,
          autoConfirm: autoConfirm ?? false,
          role: "DOCTOR",
        },
      });
      console.log("✅ Doctor profile updated:", updatedUser.id);
    } else {
      // Create new doctor
      updatedUser = await prisma.user.create({
        data: {
          wallet,
          name,
          email: email || null,
          specialty,
          hospital: hospital || null,
          location: location || null,
          bio: bio || null,
          yearsExperience: parsedYears,
          autoConfirm: autoConfirm ?? false,
          role: "DOCTOR",
        },
      });
      console.log("✅ New doctor created:", updatedUser.id);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("❌ PUT /api/doctors/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + (error as Error).message },
      { status: 500 }
    );
  }
}