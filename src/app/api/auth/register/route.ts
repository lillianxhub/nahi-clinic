import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { username, password_hash } = await req.json();

        if (!username || !password_hash) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" },
                { status: 400 },
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Username นี้มีอยู่แล้ว" },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password_hash, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password_hash: hashedPassword,
            },
        });

        return NextResponse.json({
            message: "เพิ่มผู้ใช้งานสำเร็จ",
            user: {
                id: newUser.user_id,
                username: newUser.username,
            },
        });
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error: error.message },
            { status: 500 },
        );
    }
}
