import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: {
        lot_id: string;
    };
};

export async function GET(req: Request, { params }: Params) {
    try {
        const { lot_id } = await params;

        const lot = await prisma.drug_Lot.findUnique({
            where: {
                lot_id,
            },
        });

        if (!lot) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลรายได้" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: lot });
    } catch (error: any) {
        console.error("Get patient by id error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}
