import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ patient_id: string }>;
};

export async function GET(_: Request, { params }: Params) {
    try {
        const { patient_id } = await params;

        const patient = await prisma.patient.findFirst({
            where: {
                patient_id: patient_id,
                deleted_at: null,
            },
            include: {
                visits: {
                    where: { deleted_at: null },
                    orderBy: { visit_date: "desc" },
                    take: 5,
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลผู้ป่วย" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: patient });
    } catch (error) {
        console.error("Get patient error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { patient_id } = await params;
        const body = await req.json();

        const existing = await prisma.patient.findFirst({
            where: {
                patient_id: patient_id,
                deleted_at: null,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลผู้ป่วย" },
                { status: 404 },
            );
        }

        const patient = await prisma.patient.update({
            where: { patient_id: patient_id },
            data: {
                first_name: body.first_name,
                last_name: body.last_name,
                gender: body.gender,
                phone: body.phone,
                address: body.address,
                citizen_number: body.citizen_number,
                birth_date: body.birth_date
                    ? new Date(body.birth_date)
                    : undefined,
                allergy: body.allergy,
            },
        });

        return NextResponse.json({ data: patient });
    } catch (error: any) {
        console.error("Update patient error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: Params) {
    try {
        const { patient_id } = await params;

        const existing = await prisma.patient.findFirst({
            where: {
                patient_id: patient_id,
                deleted_at: null,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลผู้ป่วย" },
                { status: 404 },
            );
        }

        await prisma.patient.update({
            where: { patient_id: patient_id },
            data: {
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ message: "ลบผู้ป่วยสำเร็จ" });
    } catch (error: any) {
        console.error("Delete patient error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
