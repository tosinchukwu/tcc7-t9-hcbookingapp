import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminWallet } from "@/lib/admin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    if (!wallet || !(await isAdminWallet(wallet))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalAppointments = await prisma.appointment.count();
    const pending = await prisma.appointment.count({ where: { status: "PENDING" } });
    const confirmed = await prisma.appointment.count({ where: { status: "CONFIRMED" } });
    const completed = await prisma.appointment.count({ where: { status: "COMPLETED" } });
    const cancelled = await prisma.appointment.count({ where: { status: "CANCELLED" } });

    const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
    const totalPatients = await prisma.user.count({ where: { role: "PATIENT" } });

    return NextResponse.json({
        totalAppointments,
        pending,
        confirmed,
        completed,
        cancelled,
        totalDoctors,
        totalPatients,
    });
}