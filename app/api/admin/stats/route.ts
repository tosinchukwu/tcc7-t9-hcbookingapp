import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminWallet } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const admin = await isAdminWallet(wallet);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Get all counts with recent appointments ---
    const [
      totalAppointments,
      pending,
      confirmed,
      completed,
      cancelled,
      totalDoctors,
      totalPatients,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.appointment.findMany({
        take: 5, // Only 5 most recent
        orderBy: { date: "desc" },
        include: {
          patient: {
            select: { name: true },
          },
          doctor: {
            select: { name: true },
          },
        },
      }),
    ]);

    // --- Map recent appointments ---
    const recent = recentAppointments.map((appt) => ({
      id: appt.id,
      patientName: appt.patient?.name || "Unknown Patient",
      doctorName: appt.doctor?.name || "Unknown Doctor",
      date: appt.date.toISOString(),
      status: appt.status,
    }));

    return NextResponse.json({
      totalAppointments,
      pending,
      confirmed,
      completed,
      cancelled,
      totalDoctors,
      totalPatients,
      recentAppointments: recent,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}