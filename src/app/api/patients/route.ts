import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getPagination } from "@/utils/pagination";
import { getOrderBy, getInclude } from "@/utils/prismaQuery";

export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams;

    const { page, pageSize, skip, take } = getPagination(searchParams);

    const orderBy = getOrderBy(searchParams);
    const include = getInclude(searchParams, ["visits"]);

    const patients = await prisma.patient.findMany({
      skip,
      take,
      orderBy,
      include,
      where: { deleted_at: null },
    });

    const total = await prisma.patient.count({
      where: { deleted_at: null },
    });

    const pageCount = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: patients,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total,
        },
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. หา patient ล่าสุด
    const lastPatient = await prisma.patient.findFirst({
      where: {
        hospital_number: {
          not: null,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        hospital_number: true,
      },
    });

    // 2. generate HN ใหม่
    let nextNumber = 1;

    if (lastPatient?.hospital_number) {
      const lastNumber = parseInt(
        lastPatient.hospital_number.replace("HN", ""),
        10,
      );
      nextNumber = lastNumber + 1;
    }

    const hospitalNumber = `HN${nextNumber.toString().padStart(5, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        hospital_number: hospitalNumber,
        first_name: body.first_name,
        last_name: body.last_name,
        gender: body.gender,
        phone: body.phone,
        address: body.address,
        birth_date: body.birth_date ? new Date(body.birth_date) : null,
        allergy: body.allergy,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
