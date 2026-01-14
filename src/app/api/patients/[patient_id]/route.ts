import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
    params: {
        patient_id: string;
    };
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { patient_id } = await params;

        const patient = await prisma.patient.findUnique({
            where: {
                patient_id,
            },
            include: {
                visits: true,
            },
        });

        if (!patient) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลผู้ป่วย" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: patient });
    } catch (error: any) {
        console.error("Get patient by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const { patient_id } = await params;
        const body = await req.json();

        const UpdatePatient = await prisma.patient.update({
            where: {
                patient_id,
            },
            data: {
                first_name: body.first_name,
                last_name: body.last_name,
                gender: body.gender,
                phone: body.phone,
                address: body.address,
                birth_date: body.birth_date,
            },
        });

        return NextResponse.json({ data: UpdatePatient });
    } catch (error: any) {
        console.error("Update patient by id error: ", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { patient_id } = await params;

        const deletedPatient = await prisma.patient.update({
            where: {
                patient_id,
            },
            data: {
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ data: deletedPatient });
    } catch (error: any) {
        console.error("Delete patient by id error: ", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
