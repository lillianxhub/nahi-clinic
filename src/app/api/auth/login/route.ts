import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { username, password_hash } = await req.json();

        if (!username || !password_hash) {
            return NextResponse.json(
                { message: "กรุณากรอก username และ password" },
                { status: 400 }
            );
        }

        // ตรวจสอบ username/password ใน DB แบบตรง ๆ
        const user = await prisma.user.findFirst({
            where: { username, password_hash },
        });

        if (!user) {
            return NextResponse.json(
                { message: "ไม่พบผู้ใช้งาน หรือ password ไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: "Login สำเร็จ",
            user: {
                id: user.user_id,
                username: user.username,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    }
}
