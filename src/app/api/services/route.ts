import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        const where: any = {
            deleted_at: null,
        };

        if (q) {
            where.service_name = { contains: q, mode: 'insensitive' };
        }

        const services = await prisma.service.findMany({
            where,
            orderBy: { service_name: "asc" },
        });

        return NextResponse.json({ data: services });
    } catch (error: any) {
        console.error("Get services error:", error);
        return NextResponse.json(
            { 
                message: "Internal server error",
                error: error.message,
                stack: error.stack
            },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { service_name, price } = body;

        if (!service_name || price === undefined) {
            return NextResponse.json(
                { message: "กรุณากรอกชื่อบริการและราคา" },
                { status: 400 },
            );
        }

        const service = await prisma.service.create({
            data: {
                service_name,
                price: Number(price),
            },
        });

        return NextResponse.json({ data: service }, { status: 201 });
    } catch (error: any) {
        console.error("Create service error:", error);
        return NextResponse.json(
            { 
                message: "Internal server error",
                error: error.message,
                stack: error.stack
            },
            { status: 500 },
        );
    }
}
