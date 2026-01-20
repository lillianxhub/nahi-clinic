import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { getOrderBy, getInclude } from "@/utils/prismaQuery";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;

        const { page, pageSize, skip, take } = getPagination(searchParams);

        const orderBy = getOrderBy(searchParams);
        const include = getInclude(searchParams, [
            "visit",
            "drug",
            "income",
        ]);

        const drugUsages = await prisma.drug_Usage.findMany({
            skip,
            take,
            orderBy,
            include,
            where: { deleted_at: null },
        });

        const total = await prisma.drug_Usage.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: drugUsages,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount,
                    total,
                },
            },
        });
    } catch (error: any) {
        console.error("Get drug usages error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const drugUsage = await prisma.drug_Usage.create({
            data: {
                visit_id: body.visit_id,
                lot_id: body.lot_id,
                quantity: body.quantity,
                used_at: body.used_at
            }
        })

        await prisma.drug_Lot.update({
            where: {
                lot_id: body.lot_id,
            },
            data: {
                qty_remaining: {
                    decrement: body.quantity,
                },
            }
        })

        return NextResponse.json(drugUsage, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}