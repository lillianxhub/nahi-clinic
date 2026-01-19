import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const visits = await prisma.visit.findMany({
            where: {
                visit_date: {
                    gte: start,
                    lte: end
                },
            },
            select: {
                visit_date: true,
            },
        });

        const chartData = [];

        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);

            const dateStr = current.toLocaleDateString("th-TH");

            const count = visits.filter(v =>
                v.visit_date.getDate() === current.getDate() &&
                v.visit_date.getMonth() === current.getMonth() &&
                v.visit_date.getFullYear() === current.getFullYear()
            ).length;

            chartData.push({
                date: dateStr,
                count: count
            });
        }

        return NextResponse.json({
            data: chartData
        });
    } catch (error) {
        console.log("Patient Chart API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}