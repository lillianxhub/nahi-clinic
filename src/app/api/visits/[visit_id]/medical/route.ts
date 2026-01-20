import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { visit_id: string } }) {
    try {
        const { visit_id } = params;
        const body = await req.json();

        const visit = await prisma.visit.update({
            where: {
                visit_id,
            },
            data: {
                diagnosis: body.diagnosis,
                note: body.note,
                updated_at: new Date(),
            }
        })

        return NextResponse.json(visit);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}