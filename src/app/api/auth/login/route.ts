import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signJWT } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { username, password_hash } = await req.json();

        if (!username || !password_hash) {
            return NextResponse.json(
                { message: "กรุณากรอก username และ password" },
                { status: 400 },
            );
        }

        // ตรวจสอบ username ใน DB
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || user.deleted_at) {
            return NextResponse.json(
                { message: "ไม่พบผู้ใช้งาน หรือ password ไม่ถูกต้อง" },
                { status: 401 },
            );
        }

        // ตรวจสอบ password
        const isPasswordValid = await bcrypt.compare(
            password_hash,
            user.password_hash,
        );

        // fallback to plain text for existing users (migration path)
        const isPlainValid = password_hash === user.password_hash;

        if (!isPasswordValid && !isPlainValid) {
            return NextResponse.json(
                { message: "ไม่พบผู้ใช้งาน หรือ password ไม่ถูกต้อง" },
                { status: 401 },
            );
        }

        // Generate JWT
        const token = await signJWT({
            userId: user.user_id,
            username: user.username,
        });

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

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
            { status: 500 },
        );
    }
}
