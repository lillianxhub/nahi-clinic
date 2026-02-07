import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { user_id: session.userId as string },
        select: {
            user_id: true,
            username: true,
        },
    });

    if (!user) {
        return NextResponse.json(
            { message: "User not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ user });
}
