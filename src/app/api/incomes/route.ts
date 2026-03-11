import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/utils/pagination";
import { getOrderBy } from "@/utils/prismaQuery";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const { page, pageSize, skip, take } = getPagination(searchParams);
        const orderBy = getOrderBy(searchParams);

        const incomes = await prisma.income.findMany({
            skip,
            take,
            orderBy,
            where: { deleted_at: null },
            include: {
                visit: {
                    include: {
                        patient: {
                            select: {
                                patient_id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
            },
        });

        const total = await prisma.income.count({
            where: { deleted_at: null },
        });
        const pageCount = Math.ceil(total / pageSize);

        return NextResponse.json({
            data: incomes,
            meta: { pagination: { page, pageSize, pageCount, total } },
        });
    } catch (error: any) {
        console.error("Get incomes error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}
