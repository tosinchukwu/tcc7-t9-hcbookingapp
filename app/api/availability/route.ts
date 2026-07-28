import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId required" }, { status: 400 });
    }
    const slots = await prisma.availability.findMany({
      where: { doctorId, isBooked: false },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(slots);
  } catch (error) {
    console.error("GET /api/availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { doctorId, date, startTime, endTime } = body;

    // 1. Validate required fields
    if (!doctorId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Validate doctor exists and is a DOCTOR
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return NextResponse.json({ error: "Invalid doctor" }, { status: 400 });
    }

    // 3. Prevent past dates
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate < today) {
      return NextResponse.json(
        { error: "Cannot create a slot in the past" },
        { status: 400 }
      );
    }

    // 4. If the slot is today, check that the start time hasn't already passed
    if (slotDate.getTime() === today.getTime()) {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutesTotal = startHours * 60 + startMinutes;
      // Allow a 5‑minute grace period
      if (startMinutesTotal < currentMinutes - 5) {
        return NextResponse.json(
          { error: "Start time has already passed" },
          { status: 400 }
        );
      }
    }

    // 5. Prevent overlapping slots for the same doctor on the same day
    const existingSlot = await prisma.availability.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        OR: [
          // New slot overlaps with existing slot start or end
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          // New slot completely contains existing slot
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "This time slot overlaps with an existing slot" },
        { status: 409 }
      );
    }

    // 6. Create the slot
    const slot = await prisma.availability.create({
      data: {
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        isBooked: false,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("POST /api/availability error:", error);
    return NextResponse.json(
      { error: "Failed to create slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await prisma.availability.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/availability error:", error);
    return NextResponse.json(
      { error: "Failed to delete slot" },
      { status: 500 }
    );
  }
}
