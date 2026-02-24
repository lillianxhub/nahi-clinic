import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const q = searchParams.get("q"); // search patient name
        const month = searchParams.get("month"); // optional: YYYY-MM

        const where: any = {
            deleted_at: null,
        };

        // filter by month
        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);

            where.visit_date = {
                gte: start,
                lt: end,
            };
        }

        // search patient name
        if (q) {
            where.patient = {
                OR: [
                    { first_name: { contains: q } },
                    { last_name: { contains: q } },
                    { hospital_number: { contains: q } },
                ],
            };
        }

        const visits = await prisma.visit.findMany({
            where,
            orderBy: { visit_date: "desc" },
            include: {
                patient: {
                    select: {
                        patient_id: true,
                        first_name: true,
                        last_name: true,
                        hospital_number: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: visits });
    } catch (error: any) {
        console.error("Get treatments error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const treatment = await prisma.visit.create({
            data: {
                patient_id: body.patient_id, // ได้จาก dropdown/search
                visit_date: new Date(body.visit_date),
                symptom: body.symptom,
                diagnosis: body.diagnosis,
            },
        });

        return NextResponse.json(treatment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
