import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Income categories are removed in the new schema.
// Income is now 1-1 with Visit. This endpoint returns an empty array for backward compatibility.
export async function GET() {
    try {
        return NextResponse.json([]);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
