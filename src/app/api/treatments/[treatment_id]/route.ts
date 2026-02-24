import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ treatment_id: string }>;
};

export async function GET(_: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;

        const visit = await prisma.visit.findFirst({
            where: {
                visit_id: treatment_id,
                deleted_at: null,
            },
            include: {
                patient: {
                    select: {
                        patient_id: true,
                        hospital_number: true,
                        first_name: true,
                        last_name: true,
                        allergy: true,
                    },
                },
                visitDetails: true,
            },
        });

        if (!visit) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: visit });
    } catch (error) {
        console.error("Get treatment by id error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;
        const body = await req.json();

        const existing = await prisma.visit.findFirst({
            where: {
                visit_id: treatment_id,
                deleted_at: null,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        const data: any = {};
        if (body.symptom !== undefined) data.symptom = body.symptom;
        if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis;
        if (body.note !== undefined) data.note = body.note;

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { message: "ไม่มีข้อมูลสำหรับอัปเดต" },
                { status: 400 },
            );
        }

        const visit = await prisma.visit.update({
            where: { visit_id: treatment_id },
            data,
        });

        return NextResponse.json({ data: visit });
    } catch (error) {
        console.error("Patch treatment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { treatment_id } = await params;

        const existing = await prisma.visit.findFirst({
            where: {
                visit_id: treatment_id,
                deleted_at: null,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการรักษา" },
                { status: 404 },
            );
        }

        const visit = await prisma.visit.update({
            where: { visit_id: treatment_id },
            data: {
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ data: visit });
    } catch (error) {
        console.error("Delete treatment error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}
