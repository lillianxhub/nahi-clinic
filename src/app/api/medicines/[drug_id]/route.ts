import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    drug_id: string;
  };
};

export async function GET(req: Request, { params }: Params) {
  try {
    const { drug_id } = await params;

    if (!drug_id) {
      return NextResponse.json(
        { message: "drug_id ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const drug = await prisma.drug.findUnique({
      where: {
        drug_id,
      },
      include: {
        category: true,
        lots: {
          orderBy: {
            expire_date: "asc",
          },
        },
      },
    });

    if (!drug) {
      return NextResponse.json({ message: "ไม่พบข้อมูลยา" }, { status: 404 });
    }

    return NextResponse.json({
      data: drug,
    });
  } catch (error) {
    console.error("Get medicine detail error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
