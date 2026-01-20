import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getInclude } from "@/utils/prismaQuery";

type Params = {
    params: {
        visit_id: string;
    };
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { visit_id } = await params;

        const searchParams = new URL(req.url).searchParams;
        const include = getInclude(searchParams, [
            "patient",
            "visitDetails",
            "drugUsages",
            "incomes",
        ]);

        const visit = await prisma.visit.findUnique({
            where: {
                visit_id,
            },
            include,
        });

        if (!visit) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลผู้ป่วย" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: visit });
    } catch (error: any) {
        console.error("Get visit by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { visit_id } = await params;
        const body = await req.json();

        const Updatevisit = await prisma.visit.update({
            where: {
                visit_id,
            },
            data: {
                visit_date: body.visit_date,
                symptom: body.symptom,
                diagnosis: body.diagnosis,
                note: body.note,
            },
        });

        return NextResponse.json({ data: Updatevisit });
    } catch (error: any) {
        console.error("Update visit by id error: ", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { visit_id } = await params;

        const deletedvisit = await prisma.visit.update({
            where: {
                visit_id,
            },
            data: {
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ data: deletedvisit });
    } catch (error: any) {
        console.error("Delete visit by id error: ", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
