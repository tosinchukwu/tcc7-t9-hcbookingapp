import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const patientWallet = searchParams.get("patientWallet");
  const doctorId = searchParams.get("doctorId");
  const status = searchParams.get("status");
  const id = searchParams.get("id");

  // If fetching a single appointment by ID
  if (id) {
    try {
      let appointment = await prisma.appointment.findUnique({
        where: { id: id },
        include: {
          patient: true,
          doctor: true,
          availability: true,
        },
      });

      // If not found by UUID, try by chainAppointmentId (numeric)
      if (!appointment && !isNaN(Number(id))) {
        const chainId = BigInt(id);
        appointment = await prisma.appointment.findFirst({
          where: { chainAppointmentId: chainId },
          include: {
            patient: true,
            doctor: true,
            availability: true,
          },
        });
      }

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      const serialized = serializeBigInt(appointment);
      return NextResponse.json(serialized);
    } catch (error) {
      console.error("GET appointment error:", error);
      return NextResponse.json(
        { error: "Failed to fetch appointment" },
        { status: 500 }
      );
    }
  }

  // Otherwise, fetch multiple appointments with filters
  const where: any = {};

  // Patient filtering
  if (patientId) {
    const user = await prisma.user.findUnique({ where: { id: patientId } });
    if (user) {
      where.patientId = user.id;
    } else {
      const userByWallet = await prisma.user.findUnique({ where: { wallet: patientId } });
      if (userByWallet) where.patientId = userByWallet.id;
      else return NextResponse.json([]);
    }
  } else if (patientWallet) {
    const user = await prisma.user.findUnique({ where: { wallet: patientWallet } });
    if (user) where.patientId = user.id;
    else return NextResponse.json([]);
  }

  // Doctor filtering
  if (doctorId) {
    const doctor = await prisma.user.findUnique({ where: { wallet: doctorId } });
    where.doctorId = doctor ? doctor.id : doctorId;
  }

  if (status) where.status = status;

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        availability: true,
      },
      orderBy: { date: "asc" },
    });
    const serialized = serializeBigInt(appointments);
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      chainAppointmentId,
      patientWallet,
      patientName,
      doctorId,
      doctorAddress,
      date,
      description,
      status,
      availabilityId,
      txHash,
      blockNumber,
      isConfirmed,
      isCompleted,
    } = body;

    // Validation - support both chainAppointmentId and id
    const appointmentId = chainAppointmentId !== undefined ? chainAppointmentId : body.id;
    
    const missingFields: string[] = [];
    if (appointmentId === undefined || appointmentId === null)
      missingFields.push("appointmentId");
    if (!patientWallet && !body.patientAddress) missingFields.push("patientWallet");
    if (!doctorId && !doctorAddress) missingFields.push("doctorId");
    if (!date) missingFields.push("date");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Find or create patient
    const patientWalletAddress = patientWallet || body.patientAddress;
    let patient = await prisma.user.findUnique({
      where: { wallet: patientWalletAddress },
    });
    if (!patient) {
      patient = await prisma.user.create({
        data: {
          wallet: patientWalletAddress,
          name: patientName || "Patient",
          role: "PATIENT",
        },
      });
    } else {
      if (patientName && patient.name !== patientName) {
        patient = await prisma.user.update({
          where: { wallet: patientWalletAddress },
          data: { name: patientName },
        });
      }
    }

    // Find or create doctor
    const doctorWalletAddress = doctorAddress || body.doctorAddress;
    let doctor;
    if (doctorId) {
      doctor = await prisma.user.findUnique({
        where: { id: doctorId },
      });
    } else if (doctorWalletAddress) {
      doctor = await prisma.user.findUnique({
        where: { wallet: doctorWalletAddress },
      });
    }

    if (!doctor) {
      // Create doctor if not found
      doctor = await prisma.user.create({
        data: {
          wallet: doctorWalletAddress,
          name: `Doctor ${doctorWalletAddress?.slice(0, 6)}...${doctorWalletAddress?.slice(-4)}`,
          role: "DOCTOR",
        },
      });
    }

    let finalStatus = status || (doctor?.autoConfirm ? "CONFIRMED" : "PENDING");
    
    // If isConfirmed or isCompleted from contract
    if (isConfirmed === true) finalStatus = "CONFIRMED";
    if (isCompleted === true) finalStatus = "COMPLETED";

    // Check availability slot
    if (availabilityId) {
      const slot = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });
      if (!slot) {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 });
      }
      if (slot.isBooked) {
        return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
      }
      await prisma.availability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      });
    }

    // Create appointment with all fields
    const appointment = await prisma.appointment.create({
      data: {
        chainAppointmentId: BigInt(appointmentId),
        patientId: patient.id,
        doctorId: doctor.id,
        date: new Date(Number(date) * 1000),
        description: description || "",
        status: finalStatus as any,
        availabilityId: availabilityId || null,
        txHash: txHash || null,
        blockNumber: blockNumber ? Number(blockNumber) : null,
        isConfirmed: isConfirmed || false,
        isCompleted: isCompleted || false,
      },
      include: {
        patient: true,
        doctor: true,
        availability: true,
      },
    });

    const serialized = serializeBigInt(appointment);
    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { error: "Failed to create appointment: " + (error as Error).message },
      { status: 500 }
    );
  }
}
