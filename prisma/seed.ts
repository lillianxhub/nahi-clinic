import { prisma } from "../src/lib/prisma";
import {
    Gender,
    ProductType,
    VisitStatus,
    PaymentMethod,
    ExpenseType,
} from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const TOTAL_DAYS = 365;

function daysAgo(days: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCitizenId(index: number): string {
    const prefix = "1";
    const province = Math.floor(Math.random() * 77 + 1)
        .toString()
        .padStart(2, "0");
    const district = Math.floor(Math.random() * 50 + 1)
        .toString()
        .padStart(2, "0");
    const sequence = index.toString().padStart(7, "0");
    const base12 = `${prefix}${province}${district}${sequence}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(base12[i]) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return `${base12}${checkDigit}`;
}

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function randomBP() {
    const systolic = randomInt(90, 140);
    const diastolic = randomInt(60, 90);
    return `${systolic}/${diastolic}`;
}

async function main() {
    console.log("🧹 กำลังล้างข้อมูลเก่า...");
    await prisma.stockUsage.deleteMany();
    await prisma.expenseInventoryLot.deleteMany();
    await prisma.income.deleteMany();
    await prisma.visitItem.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.stockAdjustment.deleteMany();
    await prisma.inventoryLot.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();

    console.log(
        `🚀 เริ่มต้นการ Seed ข้อมูลระดับ ${TOTAL_DAYS / 365} ปี (${TOTAL_DAYS} วัน)...`,
    );

    // 1. User
    await prisma.user.create({
        data: {
            username: "admin",
            password_hash: await bcrypt.hash("admin", 10),
        },
    });

    // 2. Categories
    const categoriesData = [
        { name: "ยาปฏิชีวนะ" },
        { name: "ยาแก้ปวด" },
        { name: "ยาแก้อักเสบ" },
        { name: "ยาแก้แพ้" },
        { name: "วิตามิน" },
        { name: "ยาระบบทางเดินอาหาร" },
        { name: "ทั่วไป" },
    ];
    for (const cat of categoriesData) {
        await prisma.category.create({
            data: { category_name: cat.name },
        });
    }
    const categories = await prisma.category.findMany();
    const generalCategory = categories.find(
        (c) => c.category_name === "ทั่วไป",
    )!;

    // 3. Products (Procedures as Services)
    const proceduresData = [
        { name: "ล้างแผล", price: 100 },
        { name: "เย็บแผล", price: 200 },
        { name: "ฉีดยา", price: 50 },
        { name: "เจาะเลือด", price: 100 },
        { name: "ตรวจร่างกาย", price: 100 },
        { name: "ตรวจเลือด", price: 200 },
        { name: "ตรวจปัสสาวะ", price: 150 },
    ];
    for (const p of proceduresData) {
        await prisma.product.create({
            data: {
                product_name: p.name,
                product_type: ProductType.service,
                category_id: generalCategory.category_id,
                unit: "ครั้ง",
                lots: {
                    create: {
                        buy_unit: "ครั้ง",
                        buy_price: 0,
                        sell_price: p.price,
                        received_date: new Date(),
                        expire_date: new Date("2099-12-31"),
                        qty_received: 999999,
                        qty_remaining: 999999,
                    },
                },
            },
        });
    }

    // 4. Products (Drugs)
    const drugsData = [
        { name: "Amoxicillin 500mg", price: 120, unit: "แผง" },
        { name: "Paracetamol 500mg", price: 20, unit: "แผง" },
        { name: "Ibuprofen 400mg", price: 45, unit: "เม็ด" },
        { name: "CPM", price: 15, unit: "เม็ด" },
        { name: "Omeprazole 20mg", price: 150, unit: "กล่อง" },
        { name: "Vitamin C 1000mg", price: 250, unit: "ขวด" },
    ];
    for (const d of drugsData) {
        await prisma.product.create({
            data: {
                product_name: d.name,
                category_id:
                    categories[randomInt(0, categories.length - 2)].category_id, // skip last "General"
                unit: d.unit,
                product_type: ProductType.drug,
                min_stock: 50,
            },
        });
    }
    const drugs = await prisma.product.findMany({
        where: { product_type: ProductType.drug },
    });
    const procedures = await prisma.product.findMany({
        where: { product_type: ProductType.service },
    });

    // 5. Patients
    const maleFirstNames = [
        "ศักดิ์ชัย",
        "ธนวัฒน์",
        "ภูมินทร์",
        "ธีรพงศ์",
        "นพพล",
        "วีระชัย",
        "สมชาย",
        "สิทธิพล",
        "ปิยพงษ์",
        "อติรุจ",
    ];
    const femaleFirstNames = [
        "สิรินาถ",
        "พัชราภา",
        "ณัฏฐา",
        "สลิลทิพย์",
        "จันทร์จิรา",
        "วิไลวรรณ",
        "สุดารัตน์",
        "ปาริชาติ",
        "ทิพวรรณ",
        "ณิชา",
    ];
    const lastNames = [
        "รักชาติ",
        "แจ่มใส",
        "สว่างวรวงศ์",
        "เจริญศิริ",
        "รัตนวิจิตร",
        "พงษ์ศิริ",
        "เลิศวรพงศ์",
        "ประชาสวัสดิ์",
        "ยิ่งเจริญ",
        "มณีมานะ",
    ];

    const maleCombos = shuffle(
        maleFirstNames.flatMap((f) =>
            lastNames.map((l) => ({ f, l, g: Gender.male })),
        ),
    );
    const femaleCombos = shuffle(
        femaleFirstNames.flatMap((f) =>
            lastNames.map((l) => ({ f, l, g: Gender.female })),
        ),
    );

    const TOTAL_PATIENTS = 50;
    const patientsData: { f: string; l: string; g: Gender }[] = [];
    let mi = 0,
        fi = 0;
    for (let i = 0; i < TOTAL_PATIENTS; i++) {
        if (i % 2 === 0 && mi < maleCombos.length)
            patientsData.push(maleCombos[mi++]);
        else if (fi < femaleCombos.length)
            patientsData.push(femaleCombos[fi++]);
    }

    for (let i = 0; i < patientsData.length; i++) {
        await prisma.patient.create({
            data: {
                first_name: patientsData[i].f,
                last_name: patientsData[i].l,
                gender: patientsData[i].g,
                citizen_number: generateCitizenId(i + 1),
                hospital_number: `HN67${(i + 1).toString().padStart(4, "0")}`,
                phone: `0${randomInt(6, 9)}${randomInt(10000000, 99999999)}`,
                address: `${randomInt(1, 99)}/${randomInt(1, 99)} หมู่ ${randomInt(1, 12)} ต.ในเมือง อ.เมือง จ.ขอนแก่น`,
                birth_date: daysAgo(randomInt(7000, 18000)),
                allergy: i % 5 === 0 ? "แพ้ยากลุ่ม Penicillin" : "ไม่มี",
            },
        });
    }
    const patients = await prisma.patient.findMany();

    // 6. Simulation
    const symptoms = ["ปวดหัว", "ไข้", "ท้องเสีย", "ผื่น", "ปวดเมื่อย"];
    const diagnoses = [
        "ไข้หวัด",
        "อาหารเป็นพิษ",
        "กล้ามเนื้ออักเสบ",
        "สุขภาพปกติ",
    ];

    for (let day = TOTAL_DAYS; day >= 0; day--) {
        const date = daysAgo(day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        await prisma.$transaction(async (tx) => {
            // Expenses (Monthly Utilities)
            if (date.getDate() === 5) {
                await tx.expense.createMany({
                    data: [
                        {
                            created_at: date,
                            expense_type: ExpenseType.utility,
                            description: "ค่าไฟและน้ำประปา",
                            amount: randomInt(3000, 6000),
                            receipt_no: `UTX-${date.getTime()}`,
                        },
                        {
                            created_at: date,
                            expense_type: ExpenseType.general,
                            description: "ค่าเช่าสถานที่",
                            amount: 15000,
                            receipt_no: `RNT-${date.getTime()}`,
                        },
                    ],
                });
            }

            // Drug Restock
            for (const drug of drugs) {
                const stockSummary = await tx.inventoryLot.aggregate({
                    where: {
                        product_id: drug.product_id,
                        is_active: true,
                        deleted_at: null,
                    },
                    _sum: { qty_remaining: true },
                });
                const currentQty = stockSummary._sum.qty_remaining || 0;

                if (currentQty < drug.min_stock) {
                    const buyQty = randomInt(300, 500);
                    const sellPrice =
                        drugsData.find((d) => d.name === drug.product_name)
                            ?.price || 100;
                    const buyPrice = sellPrice * 0.4;

                    const expense = await tx.expense.create({
                        data: {
                            created_at: date,
                            expense_type: ExpenseType.drug,
                            description: `เติมยา: ${drug.product_name} (สต็อกเหลือ ${currentQty})`,
                            amount: buyPrice * buyQty,
                            receipt_no: `EXP-${date.getTime()}`,
                        },
                    });

                    await tx.inventoryLot.create({
                        data: {
                            product_id: drug.product_id,
                            lot_no: `LOT-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${randomInt(10, 99)}`,
                            received_date: date,
                            expire_date: new Date(
                                date.getFullYear() + 2,
                                date.getMonth(),
                                date.getDate(),
                            ),
                            qty_received: buyQty,
                            qty_remaining: buyQty,
                            buy_price: buyPrice,
                            sell_price: sellPrice,
                            buy_unit: drug.unit,
                            expenseLots: {
                                create: { expense_id: expense.expense_id },
                            },
                        },
                    });
                }
            }

            // Visits
            const dailyVisits = isWeekend ? randomInt(10, 15) : randomInt(4, 8);
            for (let v = 0; v < dailyVisits; v++) {
                const patient = patients[randomInt(0, patients.length - 1)];
                const visit = await tx.visit.create({
                    data: {
                        patient_id: patient.patient_id,
                        visit_date: date,
                        status: VisitStatus.completed,
                        symptom: symptoms[randomInt(0, symptoms.length - 1)],
                        diagnosis:
                            diagnoses[randomInt(0, diagnoses.length - 1)],
                        temperature: randomInt(360, 385) / 10,
                        blood_pressure: randomBP(),
                        heart_rate: randomInt(60, 100),
                        weight: randomInt(400, 1000) / 10,
                        height: randomInt(150, 185),
                    },
                });

                let totalAmount = 0;

                // Items (Drugs)
                const drugCount = randomInt(1, 3);
                for (let i = 0; i < drugCount; i++) {
                    const drug = drugs[randomInt(0, drugs.length - 1)];
                    const qty = randomInt(1, 5);
                    const lot = await tx.inventoryLot.findFirst({
                        where: {
                            product_id: drug.product_id,
                            qty_remaining: { gt: 0 },
                            is_active: true,
                            deleted_at: null,
                        },
                        orderBy: { expire_date: "asc" },
                    });

                    if (lot) {
                        const deduct = Math.min(qty, lot.qty_remaining);
                        const itemPrice = Number(lot.sell_price);
                        totalAmount += itemPrice * deduct;

                        await tx.visitItem.create({
                            data: {
                                visit_id: visit.visit_id,
                                product_id: drug.product_id,
                                lot_id: lot.lot_id,
                                quantity: deduct,
                                unit_price: itemPrice,
                                total_price: itemPrice * deduct,
                            },
                        });

                        await tx.stockUsage.create({
                            data: {
                                visit_id: visit.visit_id,
                                lot_id: lot.lot_id,
                                quantity: deduct,
                                used_at: date,
                            },
                        });

                        await tx.inventoryLot.update({
                            where: { lot_id: lot.lot_id },
                            data: { qty_remaining: { decrement: deduct } },
                        });
                    }
                }

                // Items (Services)
                if (Math.random() > 0.3) {
                    const procCount = randomInt(1, 2);
                    for (let i = 0; i < procCount; i++) {
                        const proc =
                            procedures[randomInt(0, procedures.length - 1)];
                        const lot = await tx.inventoryLot.findFirst({
                            where: { product_id: proc.product_id },
                        });
                        const price = Number(lot?.sell_price || 100);
                        totalAmount += price;

                        await tx.visitItem.create({
                            data: {
                                visit_id: visit.visit_id,
                                product_id: proc.product_id,
                                lot_id: lot?.lot_id,
                                quantity: 1,
                                unit_price: price,
                                total_price: price,
                            },
                        });
                    }
                }

                // Income
                if (totalAmount > 0) {
                    await tx.income.create({
                        data: {
                            visit_id: visit.visit_id,
                            amount: totalAmount,
                            payment_method:
                                Math.random() > 0.4
                                    ? PaymentMethod.transfer
                                    : PaymentMethod.cash,
                            receipt_no: `RC-${date.getTime()}-${v}`,
                            created_at: date,
                        },
                    });
                }
            }
        });

        if (day % 30 === 0)
            console.log(`...ดำเนินการย้อนหลัง เหลืออีก ${day} วัน`);
    }

    console.log("✅ Seed ข้อมูลเสร็จสิ้น!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
