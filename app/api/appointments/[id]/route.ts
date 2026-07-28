import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 GET /api/appointments/[id] – looking for:", params.id);
    
    let appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: true,
        availability: true,
      },
    });

    // If not found by UUID, try to find by chainAppointmentId (numeric)
    if (!appointment && !isNaN(Number(params.id))) {
      const chainId = BigInt(params.id);
      console.log("🔍 Trying by chainAppointmentId:", chainId.toString());
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
      console.log("❌ Appointment not found for ID:", params.id);
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    console.log("✅ Appointment found:", appointment.id);
    const serialized = serializeBigInt(appointment);
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("❌ GET appointment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      status, 
      date, 
      description, 
      isConfirmed, 
      isCompleted, 
      txHash, 
      blockNumber,
      doctorComment // 👈 New field
    } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    let finalStatus = status;
    
    // If isConfirmed or isCompleted from contract, update status accordingly
    if (isConfirmed === true) finalStatus = "CONFIRMED";
    if (isCompleted === true) finalStatus = "COMPLETED";
    
    if (finalStatus && !validStatuses.includes(finalStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const data: any = {};
    if (finalStatus) data.status = finalStatus;
    if (date) data.date = new Date(date);
    if (description) data.description = description;
    if (isConfirmed !== undefined) data.isConfirmed = isConfirmed;
    if (isCompleted !== undefined) data.isCompleted = isCompleted;
    if (txHash) data.txHash = txHash;
    if (blockNumber) data.blockNumber = Number(blockNumber);
    if (doctorComment !== undefined) data.doctorComment = doctorComment; // 👈 Store doctor comment

    let appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });
    if (!appointment && !isNaN(Number(params.id))) {
      const chainId = BigInt(params.id);
      appointment = await prisma.appointment.findFirst({
        where: { chainAppointmentId: chainId },
      });
    }
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data,
      include: { patient: true, doctor: true },
    });

    const serialized = serializeBigInt(updated);
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("PUT appointment error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    let appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });
    if (!appointment && !isNaN(Number(params.id))) {
      const chainId = BigInt(params.id);
      appointment = await prisma.appointment.findFirst({
        where: { chainAppointmentId: chainId },
      });
    }
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await prisma.appointment.delete({ where: { id: appointment.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE appointment error:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
