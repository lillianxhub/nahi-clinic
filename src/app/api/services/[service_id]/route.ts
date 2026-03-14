import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{ service_id: string }>;
};

export async function GET(_: Request, { params }: Params) {
    try {
        const { service_id } = await params;

        const service = await prisma.service.findFirst({
            where: {
                service_id,
                deleted_at: null,
            },
        });

        if (!service) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลบริการ" },
                { status: 404 },
            );
        }

        return NextResponse.json({ data: service });
    } catch (error: any) {
        console.error("Get service by id error:", error);
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

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { service_id } = await params;
        const body = await req.json();
        const { service_name, price, is_active } = body;

        const service = await prisma.service.update({
            where: { service_id },
            data: {
                service_name: service_name || undefined,
                price: price !== undefined ? Number(price) : undefined,
                is_active: is_active !== undefined ? is_active : undefined,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ data: service });
    } catch (error: any) {
        console.error("Patch service error:", error);
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

export async function DELETE(_: Request, { params }: Params) {
    try {
        const { service_id } = await params;

        await prisma.service.update({
            where: { service_id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        return NextResponse.json({ data: { success: true } });
    } catch (error: any) {
        console.error("Delete service error:", error);
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
