import { prisma } from "../src/lib/prisma";
import { Gender } from "../src/generated/prisma/client";
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

// Generate a guaranteed-unique citizen ID using the patient index as a seed
function generateCitizenId(index: number): string {
    // Format: 1XXXXXXXXXXXXXX where X digits are index-based + random padding
    const base = index.toString().padStart(8, "0");
    const suffix = Math.floor(Math.random() * 99999)
        .toString()
        .padStart(5, "0");
    return `1${base}${suffix}`.slice(0, 13);
}

// Shuffle array in-place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function calculateAge(birthDate: Date, visitDate: Date) {
    let years = visitDate.getFullYear() - birthDate.getFullYear();
    let months = visitDate.getMonth() - birthDate.getMonth();
    let days = visitDate.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(
            visitDate.getFullYear(),
            visitDate.getMonth(),
            0,
        );
        days += lastMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months, days };
}

function randomBP() {
    const systolic = randomInt(90, 140);
    const diastolic = randomInt(60, 90);
    return `${systolic}/${diastolic}`;
}

async function main() {
    console.log("🧹 กำลังล้างข้อมูลเก่า...");
    await prisma.drug_Usage.deleteMany();
    await prisma.expense_Drug_Lot.deleteMany();
    await prisma.income.deleteMany();
    await prisma.visit_Detail.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.drug_Adjustment.deleteMany();
    await prisma.drug_Lot.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.drug.deleteMany();
    await prisma.drug_Category.deleteMany();
    await prisma.patient.deleteMany();

    console.log(
        `🚀 เริ่มต้นการ Seed ข้อมูลระดับ ${TOTAL_DAYS / 365} ปี (${TOTAL_DAYS} วัน)...`,
    );

    // 1. Admin (เหมือนเดิม)
    const adminExists = await prisma.user.findFirst({
        where: { username: "admin" },
    });
    if (!adminExists) {
        await prisma.user.create({
            data: {
                username: "admin",
                password_hash: await bcrypt.hash("admin", 10),
            },
        });
    }

    // 2. Categories & 3. Drugs (เหมือนเดิม)
    const categoriesData = [
        { name: "ยาปฏิชีวนะ" },
        { name: "ยาแก้ปวด" },
        { name: "ยาแก้อักเสบ" },
        { name: "ยาแก้แพ้" },
        { name: "วิตามิน" },
        { name: "ยาระบบทางเดินอาหาร" },
    ];
    for (const cat of categoriesData) {
        await prisma.drug_Category.create({
            data: { category_name: cat.name },
        });
    }
    const categories = await prisma.drug_Category.findMany();

    const drugsData = [
        { name: "Amoxicillin 500mg", price: 120, unit: "แผง" },
        { name: "Paracetamol 500mg", price: 20, unit: "แผง" },
        { name: "Ibuprofen 400mg", price: 45, unit: "เม็ด" },
        { name: "CPM", price: 15, unit: "เม็ด" },
        { name: "Omeprazole 20mg", price: 150, unit: "กล่อง" },
        { name: "Vitamin C 1000mg", price: 250, unit: "ขวด" },
    ];
    for (const d of drugsData) {
        await prisma.drug.create({
            data: {
                drug_name: d.name,
                category_id:
                    categories[randomInt(0, categories.length - 1)].category_id,
                unit: d.unit,
                sell_price: d.price,
                min_stock: 50,
                status: "active",
            },
        });
    }
    const drugs = await prisma.drug.findMany();

    // 4. Patients – build ALL unique first×last combos then shuffle-pick
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
        "กิตติภพ",
        "จิรวัฒน์",
        "ธนกร",
        "ปวริศ",
        "รพินทร์",
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
        "กนกวรรณ",
        "จิราภรณ์",
        "ฐานิตา",
        "นภัสสร",
        "พิมพิกา",
        "วรัญญา",
        "ชนาภา",
        "ธัญชนก",
        "พรรษา",
        "อนันตา",
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
        "วิจิตรบรรจง",
        "ศรีสุวรรณ",
        "ทองดี",
        "วงพิศุทธ์",
        "สุขสวัสดิ์",
    ];

    // Build all unique male and female combos, then shuffle each pool
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
    let mi = 0;
    let fi = 0;
    for (let i = 0; i < TOTAL_PATIENTS; i++) {
        if (i % 2 === 0 && mi < maleCombos.length) {
            patientsData.push(maleCombos[mi++]);
        } else if (fi < femaleCombos.length) {
            patientsData.push(femaleCombos[fi++]);
        } else {
            patientsData.push(maleCombos[mi++]);
        }
    }

    for (let i = 0; i < patientsData.length; i++) {
        await prisma.patient.create({
            data: {
                first_name: patientsData[i].f,
                last_name: patientsData[i].l,
                gender: patientsData[i].g,
                citizen_number: generateCitizenId(i + 1),
                hospital_number: `HN-67${(i + 1).toString().padStart(4, "0")}`,
                phone: `0${randomInt(6, 9)}${randomInt(10000000, 99999999)}`,
                address: `${randomInt(1, 99)}/${randomInt(1, 99)} หมู่ ${randomInt(1, 12)} ต.ในเมือง อ.เมือง จ.ขอนแก่น`,
                birth_date: daysAgo(randomInt(7000, 18000)),
                allergy: i % 5 === 0 ? "แพ้ยากลุ่ม Penicillin" : "ไม่มี",
            },
        });
    }
    const patients = await prisma.patient.findMany();

    // 5. Simulate 730 Days
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

        // รายจ่าย: ซื้อยา (ซื้อทุกๆ ต้นเดือน)
        if (date.getDate() === 1) {
            for (const drug of drugs) {
                if (randomInt(1, 10) > 2) {
                    const qty = randomInt(300, 600);
                    const buyPrice = Number(drug.sell_price) * 0.5;
                    const expense = await prisma.expense.create({
                        data: {
                            expense_date: date,
                            expense_type: "drug",
                            description: `เติมสต็อก ${drug.drug_name}`,
                            amount: buyPrice * qty,
                            receipt_no: `EXP-${date.getTime()}`,
                        },
                    });
                    await prisma.drug_Lot.create({
                        data: {
                            drug_id: drug.drug_id,
                            lot_no: `LOT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}-${randomInt(10, 99)}`,
                            received_date: date,
                            expire_date: new Date(
                                date.getFullYear() + 2,
                                date.getMonth(),
                                date.getDate(),
                            ),
                            qty_received: qty,
                            qty_remaining: qty,
                            buy_price: buyPrice,
                            expenseLots: {
                                create: { expense_id: expense.expense_id },
                            },
                        },
                    });
                }
            }
        }

        // รายได้: Visits
        const dailyVisits = isWeekend ? randomInt(10, 15) : randomInt(4, 8);
        for (let v = 0; v < dailyVisits; v++) {
            const patient = patients[randomInt(0, patients.length - 1)];

            const age = patient.birth_date
                ? calculateAge(patient.birth_date, date)
                : { years: 0, months: 0, days: 0 };

            const visit = await prisma.visit.create({
                data: {
                    patient_id: patient.patient_id,
                    visit_date: date,
                    symptom: symptoms[randomInt(0, symptoms.length - 1)],
                    diagnosis: diagnoses[randomInt(0, diagnoses.length - 1)],
                    blood_pressure: randomBP(),
                    heart_rate: randomInt(60, 100),
                    weight: randomInt(40, 100),
                    height: randomInt(150, 185),
                    age_years: age.years,
                    age_months: age.months,
                    age_days: age.days,
                },
            });

            let totalDrugPrice = 0;
            const drugCount = randomInt(1, 3);
            for (let i = 0; i < drugCount; i++) {
                const drug = drugs[randomInt(0, drugs.length - 1)];
                const qty = randomInt(1, 5);

                await prisma.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: "drug",
                        drug_id: drug.drug_id,
                        description: drug.drug_name,
                        quantity: qty,
                        unit_price: drug.sell_price,
                    },
                });

                // FIFO Stock Deduction
                const lot = await prisma.drug_Lot.findFirst({
                    where: { drug_id: drug.drug_id, qty_remaining: { gt: 0 } },
                    orderBy: { received_date: "asc" },
                });

                if (lot) {
                    const useQty = Math.min(qty, lot.qty_remaining);
                    await prisma.drug_Usage.create({
                        data: {
                            visit_id: visit.visit_id,
                            lot_id: lot.lot_id,
                            quantity: useQty,
                            used_at: date,
                        },
                    });
                    await prisma.drug_Lot.update({
                        where: { lot_id: lot.lot_id },
                        data: { qty_remaining: { decrement: useQty } },
                    });
                }
                totalDrugPrice += Number(drug.sell_price) * qty;
            }

            await prisma.income.create({
                data: {
                    visit_id: visit.visit_id,
                    income_date: date,
                    amount: 300 + totalDrugPrice,
                    payment_method: Math.random() > 0.4 ? "transfer" : "cash",
                    receipt_no: `RC-${date.getTime()}-${v}`,
                },
            });
        }

        if (day % 100 === 0)
            console.log(`...ดำเนินการย้อนหลัง เหลืออีก ${day} วัน`);
    }
    console.log("✅ Seed ข้อมูล 2 ปีเรียบร้อย!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
