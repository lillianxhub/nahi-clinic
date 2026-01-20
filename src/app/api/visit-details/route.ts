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

        const visitDetail = await prisma.visit_Detail.findMany({
            skip,
            take,
            orderBy,
            include,
            where: { deleted_at: null },
        });

        const total = await prisma.visit_Detail.count({
            where: { deleted_at: null },
        });

        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: visitDetail,
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
        console.error("Get visit detail error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const visitDetail = await prisma.visit_Detail.create({
            data: {
                visit_id: body.visit_id,
                item_type: body.item_type,
                description: body.description,
                unit_price: body.unit_price,
                quantity: body.quantity,
            }
        })

        return NextResponse.json(visitDetail, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}