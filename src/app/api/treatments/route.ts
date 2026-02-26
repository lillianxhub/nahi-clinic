import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const q = searchParams.get("q"); // search patient name
        const month = searchParams.get("month"); // optional: YYYY-MM
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const skip = (page - 1) * pageSize;

        const where: any = {
            deleted_at: null,
        };

        // filter by month
        if (month) {
            const start = new Date(`${month}-01`);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);

            where.visit_date = {
                gte: start,
                lt: end,
            };
        }

        // search patient name
        if (q) {
            where.patient = {
                OR: [
                    { first_name: { contains: q } },
                    { last_name: { contains: q } },
                    { hospital_number: { contains: q } },
                ],
            };
        }

        const [visits, total] = await Promise.all([
            prisma.visit.findMany({
                where,
                orderBy: { visit_date: "desc" },
                include: {
                    patient: {
                        select: {
                            patient_id: true,
                            first_name: true,
                            last_name: true,
                            hospital_number: true,
                        },
                    },
                },
                skip,
                take: pageSize,
            }),
            prisma.visit.count({ where }),
        ]);

        return NextResponse.json({
            data: visits,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount: Math.ceil(total / pageSize),
                    total,
                },
            },
        });
    } catch (error: any) {
        console.error("Get treatments error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.patient_id || !body.visit_date || !body.symptom || !body.diagnosis) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ สร้างการรักษา
      const treatment = await tx.visit.create({
        data: {
          patient_id: body.patient_id,
          visit_date: new Date(body.visit_date),
          symptom: body.symptom,
          diagnosis: body.diagnosis,
        },
      });

      // 2️⃣ สร้างรายรับจากการรักษา
      const income = await tx.income.create({
        data: {
          visit_id: treatment.visit_id,
          amount: body.amount ?? 0,          // หรือคำนวณจาก treatment
          income_date: new Date(),
          payment_method: body.payment_method,
        },
      });

      return { treatment, income };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Create treatment + income error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
