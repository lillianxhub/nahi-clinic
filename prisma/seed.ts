import { prisma } from "../src/lib/prisma";
import {
    Gender,
    ProductType,
    VisitStatus,
    PaymentMethod,
    ExpenseType,
    IncomeType,
    Prisma,
    VisitItemType,
} from "../src/generated/prisma/client";
import bcrypt from "bcrypt";
import { calculateAge } from "@/lib/utils";

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
    await prisma.supplier.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.service.deleteMany();
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

    const supplier = await prisma.supplier.create({
        data: {
            supplier_name: "บริษัท ยาสามัญประจำบ้าน จำกัด",
            contact: "02-123-4567",
        },
    });

    // 2. Categories
    const categoriesNames = [
        { name: "ยาปฏิชีวนะ", type: ProductType.drug },
        { name: "ยาแก้ปวด", type: ProductType.drug },
        { name: "ยาแก้อักเสบ", type: ProductType.drug },
        { name: "ยาแก้แพ้", type: ProductType.drug },
        { name: "วิตามิน", type: ProductType.drug },
        { name: "ยาระบบทางเดินอาหาร", type: ProductType.drug },
        { name: "วัสดุสิ้นเปลือง", type: ProductType.supply },
        { name: "ทั่วไป", type: ProductType.supply },
    ];
    for (const cat of categoriesNames) {
        await prisma.category.create({
            data: { category_name: cat.name, product_type: cat.type },
        });
    }
    const categories = await prisma.category.findMany();

    // 3. Products (Procedures as Services)
    const serviceData = [
        { name: "ตรวจร่างกายทั่วไป", price: 100 },
        { name: "ฉีดยา", price: 50 },
        { name: "ทำแผล", price: 80 },
        { name: "ตรวจเลือด (Lab)", price: 300 },
    ];
    for (const s of serviceData) {
        await prisma.service.create({
            data: {
                service_name: s.name,
                price: new Prisma.Decimal(s.price),
            },
        });
    }

    const allServices = await prisma.service.findMany();

    // 4. Products
    const itemToSeed = [
        {
            name: "Ibuprofen 400mg",
            type: ProductType.drug,
            cat: "ยาแก้ปวด",
            price: 45,
            unit: "เม็ด",
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "Omeprazole 20mg",
            type: ProductType.drug,
            cat: "ยาระบบทางเดินอาหาร",
            price: 150,
            unit: "กล่อง",
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "Vitamin C 1000mg",
            type: ProductType.drug,
            cat: "วิตามิน",
            price: 250,
            unit: "ขวด",
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "Amoxicillin 500mg",
            type: ProductType.drug,
            unit: "แผง",
            cat: "ยาปฏิชีวนะ",
            price: 120,
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "Paracetamol 500mg",
            type: ProductType.drug,
            unit: "แผง",
            cat: "ยาแก้ปวด",
            price: 20,
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "CPM",
            type: ProductType.drug,
            unit: "เม็ด",
            cat: "ยาแก้แพ้",
            price: 15,
            buy_unit: "กระปุก",
            conversion_factor: 100,
        },
        {
            name: "ชุดทำแผล (S)",
            type: ProductType.supply,
            unit: "ชุด",
            cat: "วัสดุสิ้นเปลือง",
            price: 150,
            buy_unit: "ลัง",
            conversion_factor: 100,
        },
        {
            name: "Mask N95",
            type: ProductType.supply,
            unit: "ชิ้น",
            cat: "วัสดุสิ้นเปลือง",
            price: 45,
            buy_unit: "กล่อง",
            conversion_factor: 100,
        },
        {
            name: "Alcohol 70%",
            type: ProductType.supply,
            unit: "ขวด",
            cat: "วัสดุสิ้นเปลือง",
            price: 60,
            buy_unit: "ลัง",
            conversion_factor: 100,
        },
    ];
    for (const p of itemToSeed) {
        await prisma.product.create({
            data: {
                product_name: p.name,
                unit: p.unit,
                min_stock: 50,
                category: {
                    connect: {
                        category_id: categories.find(
                            (c) => c.category_name === p.cat,
                        )!.category_id,
                    },
                },
                lots: {
                    create: {
                        supplier_id: supplier.supplier_id,
                        buy_unit: p.buy_unit,
                        conversion_factor: p.conversion_factor,
                        buy_price: p.price * 0.4,
                        sell_price: p.price,
                        received_date: new Date(),
                        expire_date: new Date("2027-12-31"),
                        qty_received: 500,
                        qty_remaining: 500,
                    },
                },
            },
        });
    }

    const allProducts = await prisma.product.findMany({
        include: { category: true },
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

    const TOTAL_PATIENTS = 45;
    const patientsData: { f: string; l: string; g: Gender }[] = [
        { f: "ก้องภพ", l: "โชควิริยะ", g: Gender.male },
        { f: "ถิรวัฒน์", l: "อุจินา", g: Gender.male },
        { f: "กรมภัฏ", l: "พิริยะ", g: Gender.male },
        { f: "ณพวิทย์", l: "วงษ์ประเสริฐ", g: Gender.male },
        { f: "รัฐภูมิ", l: "เกิดพระจีน", g: Gender.male },
    ];
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
    const allPatients = await prisma.patient.findMany();

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
                            expense_date: date,
                        },
                        {
                            created_at: date,
                            expense_type: ExpenseType.general,
                            description: "ค่าเช่าสถานที่",
                            amount: 15000,
                            receipt_no: `RNT-${date.getTime()}`,
                            expense_date: date,
                        },
                    ],
                });
            }

            // Drug Restock
            for (const item of allProducts) {
                const stockSummary = await tx.inventoryLot.aggregate({
                    where: {
                        product_id: item.product_id,
                        is_active: true,
                        deleted_at: null,
                    },
                    _sum: { qty_remaining: true },
                });
                const currentQty = stockSummary._sum.qty_remaining || 0;

                if (currentQty < item.min_stock) {
                    const buyQty = randomInt(300, 500);
                    const sellPrice =
                        itemToSeed.find((d) => d.name === item.product_name)
                            ?.price || 100;
                    const buyPrice = sellPrice * 0.4;

                    const expense = await tx.expense.create({
                        data: {
                            created_at: date,
                            expense_type:
                                item.category.product_type === ProductType.drug
                                    ? ExpenseType.drug
                                    : ExpenseType.supply,
                            description: `ซื้อ${item.category.product_type === ProductType.drug ? "ยา" : "เวชภัณฑ์"}: ${item.product_name} (${buyQty} ${item.unit})`,
                            amount: buyPrice * buyQty,
                            receipt_no: `EXP-${date.getTime()}`,
                            expense_date: date,
                        },
                    });

                    await tx.inventoryLot.create({
                        data: {
                            supplier_id: supplier.supplier_id,
                            product_id: item.product_id,
                            lot_no: `LOT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}-${randomInt(10, 99)}`,
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
                            buy_unit:
                                itemToSeed.find(
                                    (d) => d.name === item.product_name,
                                )?.buy_unit ?? item.unit,
                            conversion_factor:
                                itemToSeed.find(
                                    (d) => d.name === item.product_name,
                                )?.conversion_factor ?? 1,
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
                const patient =
                    allPatients[randomInt(0, allPatients.length - 1)];
                const age = patient.birth_date
                    ? calculateAge(patient.birth_date, date)
                    : { years: 0, months: 0, days: 0 };
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
                        age_years: age.years,
                        age_months: age.months,
                        age_days: age.days,
                    },
                });

                const serviceToApply = shuffle(allServices).slice(
                    0,
                    randomInt(1, 2),
                );

                for (const s of serviceToApply) {
                    const sPrice = Number(s.price);

                    const item = await tx.visitItem.create({
                        data: {
                            visit_id: visit.visit_id,
                            service_id: s.service_id,
                            quantity: 1,
                            unit_price: sPrice,
                            item_type: VisitItemType.service,
                            description: s.service_name,
                        },
                    });

                    await tx.income.create({
                        data: {
                            visit_item_id: item.visit_item_id,
                            income_type: IncomeType.service,
                            amount: sPrice,
                            payment_method: PaymentMethod.cash,
                            income_date: date,
                        },
                    });
                }

                // Items shuffle
                const itemsToSell = [
                    ...shuffle(
                        allProducts.filter(
                            (p) =>
                                p.category.product_type === ProductType.supply,
                        ),
                    ).slice(0, 1),
                    ...shuffle(
                        allProducts.filter(
                            (p) => p.category.product_type === ProductType.drug,
                        ),
                    ).slice(0, randomInt(1, 2)),
                ];

                for (const p of itemsToSell) {
                    const lot = await tx.inventoryLot.findFirst({
                        where: {
                            product_id: p.product_id,
                            qty_remaining: { gt: 0 },
                            is_active: true,
                            deleted_at: null,
                        },
                        orderBy: { expire_date: "asc" },
                    });

                    if (lot) {
                        const qty = randomInt(1, 10);
                        const finalQty = Math.min(qty, lot.qty_remaining);
                        const price = Number(lot.sell_price);
                        const lineTotal = price * finalQty;

                        const item = await tx.visitItem.create({
                            data: {
                                visit_id: visit.visit_id,
                                product_id: p.product_id,
                                quantity: finalQty,
                                unit_price: price,
                                item_type: VisitItemType.product,
                                description: p.product_name,
                                stockUsage: {
                                    create: {
                                        lot_id: lot.lot_id,
                                        quantity: finalQty,
                                        used_at: date,
                                    },
                                },
                            },
                        });
                        await tx.inventoryLot.update({
                            where: { lot_id: lot.lot_id },
                            data: {
                                qty_remaining: { decrement: finalQty },
                            },
                        });
                        await tx.income.create({
                            data: {
                                visit_item_id: item.visit_item_id,
                                income_type:
                                    p.category.product_type === ProductType.drug
                                        ? IncomeType.drug
                                        : IncomeType.supply,
                                amount: new Prisma.Decimal(lineTotal),
                                payment_method: PaymentMethod.cash,
                                income_date: date,
                            },
                        });
                    }
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
