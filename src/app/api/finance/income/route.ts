import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if(body.visit_id){
            const visit = await prisma.visit.findUnique({
                where: {
                    visit_id: body.visit_id,
                },
            });

            if (!visit) {
                return NextResponse.json({ message: "Visit not found" }, { status: 404 });
            }
        }

        if(!body.income_date){
            return NextResponse.json({ message: "Income date is required" }, { status: 400 });
        } else if(!body.amount){
            return NextResponse.json({ message: "Amount is required" }, { status: 400 });
        } else if(!body.payment_method){
            return NextResponse.json({ message: "Payment method is required" }, { status: 400 });
        }

        const income = await prisma.income.create({
            data: {
                visit_id: body.visit_id,
                income_date: body.income_date,
                amount: body.amount,
                payment_method: body.payment_method,
                receipt_no: body.receipt_no,
            },
        });

        return NextResponse.json(income, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}