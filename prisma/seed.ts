import { prisma } from "../src/lib/prisma";
function daysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log("🌱 เริ่ม Seed ข้อมูลจำนวนมาก...");

    // =========================
    // หมวดหมู่ยา
    // =========================
    await prisma.drug_Category.createMany({
        data: [
            { category_name: "ยาปฏิชีวนะ" },
            { category_name: "ยาแก้ปวด" },
            { category_name: "ยาลดไข้" },
            { category_name: "ยาแก้อักเสบ" },
            { category_name: "วิตามิน" },
            { category_name: "ยาแก้แพ้" },
        ],
    });

    const categories = await prisma.drug_Category.findMany();

    // =========================
    // ยา (20 รายการ)
    // =========================
    const drugNames = [
        "พาราเซตามอล",
        "ไอบูโพรเฟน",
        "แอสไพริน",
        "อะม็อกซิซิลลิน",
        "อะซิโทรมัยซิน",
        "เซฟาเลกซิน",
        "วิตามินซี",
        "วิตามินบีรวม",
        "คลอเฟนิรามีน",
        "ลอราทาดีน",
        "เซทิริซีน",
        "ไดโคลฟีแนค",
        "เมโทรนิดาโซล",
        "โดมเพอริโดน",
        "โอเมพราโซล",
        "ฟลูโคนาโซล",
        "ซิงค์",
        "แคลเซียม",
        "ฟ้าทะลายโจร",
        "ยาแก้ไอ",
    ];

    for (const name of drugNames) {
        await prisma.drug.create({
            data: {
                drug_name: name,
                category_id:
                    categories[randomInt(0, categories.length - 1)].category_id,
                unit: "เม็ด",
                sell_price: randomInt(5, 20),
                min_stock: randomInt(50, 150),
            },
        });
    }

    const drugs = await prisma.drug.findMany();

    // =========================
    // LOT ยา (ยาแต่ละตัวมี 2 LOT)
    // =========================
    for (const drug of drugs) {
        for (let i = 0; i < 2; i++) {
            await prisma.drug_Lot.create({
                data: {
                    drug_id: drug.drug_id,
                    lot_no: `LOT-${drug.drug_name}-${i + 1}`,
                    received_date: daysAgo(randomInt(20, 40)),
                    expire_date: daysAgo(-randomInt(90, 360)),
                    qty_received: 500,
                    qty_remaining: 500,
                    buy_price: Number(drug.sell_price) * 0.5,
                },
            });
        }
    }

    const lots = await prisma.drug_Lot.findMany();

    // =========================
    // ผู้ป่วย (50 คน)
    // =========================
    const firstNames = [
        "สมชาย",
        "สมศรี",
        "อนันต์",
        "วิชัย",
        "พรชัย",
        "อรทัย",
        "สุดา",
        "มานพ",
        "ธีรพล",
        "กนก",
    ];
    const lastNames = [
        "ใจดี",
        "สุขใจ",
        "มีสุข",
        "ดีงาม",
        "มั่นคง",
        "วัฒนา",
        "แสงทอง",
    ];

    for (let i = 0; i < 50; i++) {
        await prisma.patient.create({
            data: {
                first_name: firstNames[randomInt(0, firstNames.length - 1)],
                last_name: lastNames[randomInt(0, lastNames.length - 1)],
                gender: Math.random() > 0.5 ? "male" : "female",
                phone: `08${randomInt(10000000, 99999999)}`,
            },
        });
    }

    const patients = await prisma.patient.findMany();

    // =========================
    // การรักษา + การใช้ยา + รายรับ (ย้อนหลัง 14 วัน)
    // =========================
    const diagnoses = [
        "ไข้หวัด",
        "ไข้หวัดใหญ่",
        "ปวดศีรษะ",
        "ปวดกล้ามเนื้อ",
        "อาหารเป็นพิษ",
        "ท้องเสีย",
        "ภูมิแพ้",
        "เจ็บคอ",
        "ติดเชื้อทางเดินหายใจ",
    ];

    for (let day = 0; day < 14; day++) {
        const visitsToday = randomInt(15, 30);

        for (let i = 0; i < visitsToday; i++) {
            const patient = patients[randomInt(0, patients.length - 1)];

            const visit = await prisma.visit.create({
                data: {
                    patient_id: patient.patient_id,
                    visit_date: daysAgo(day),
                    symptom: diagnoses[randomInt(0, diagnoses.length - 1)],
                    diagnosis: diagnoses[randomInt(0, diagnoses.length - 1)],
                },
            });

            // ค่าตรวจ
            await prisma.visit_Detail.create({
                data: {
                    visit_id: visit.visit_id,
                    item_type: "service",
                    description: "ค่าตรวจรักษา",
                    quantity: 1,
                    unit_price: 150,
                },
            });

            // ใช้ยา 1–3 รายการ
            const drugCount = randomInt(1, 3);
            for (let j = 0; j < drugCount; j++) {
                const lot = lots[randomInt(0, lots.length - 1)];
                const qty = randomInt(1, 5);

                await prisma.drug_Usage.create({
                    data: {
                        visit_id: visit.visit_id,
                        lot_id: lot.lot_id,
                        quantity: qty,
                        used_at: daysAgo(day),
                    },
                });

                await prisma.drug_Lot.update({
                    where: { lot_id: lot.lot_id },
                    data: { qty_remaining: { decrement: qty } },
                });
            }

            // รายรับ
            await prisma.income.create({
                data: {
                    visit_id: visit.visit_id,
                    income_date: daysAgo(day),
                    amount: randomInt(200, 450),
                    payment_method: Math.random() > 0.7 ? "transfer" : "cash",
                },
            });
        }
    }

    // =========================
    // ค่าใช้จ่าย (drug / utility / general)
    // =========================
    for (let day = 0; day < 14; day++) {
        await prisma.expense.createMany({
            data: [
                {
                    expense_date: daysAgo(day),
                    expense_type: "utility",
                    description: "ค่าน้ำ/ค่าไฟ",
                    amount: randomInt(300, 800),
                },
                {
                    expense_date: daysAgo(day),
                    expense_type: "general",
                    description: "ค่าใช้จ่ายทั่วไป",
                    amount: randomInt(200, 600),
                },
            ],
        });
    }

    console.log("✅ Seed ข้อมูลจำนวนมากเสร็จเรียบร้อย");
}

main()
    .catch((e) => {
        console.error("❌ เกิดข้อผิดพลาด:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
