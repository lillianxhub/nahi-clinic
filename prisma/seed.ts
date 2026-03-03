import { prisma } from "../src/lib/prisma";
import { Gender } from "../src/generated/prisma/client";
import { ItemType } from "../src/generated/prisma/enums";
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
// function generateCitizenId(index: number): string {
//     // Format: 1XXXXXXXXXXXXXX where X digits are index-based + random padding
//     const base = index.toString().padStart(8, "0");
//     const suffix = Math.floor(Math.random() * 99999)
//         .toString()
//         .padStart(5, "0");
//     return `1${base}${suffix}`.slice(0, 13);
// }

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
    await prisma.procedure.deleteMany();
    await prisma.income_Category.deleteMany();

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

    console.log("Creating Income Categories...");
    const incomeCategories = [
        { category_name: "ค่ายา" },
        { category_name: "ค่าบริการ" },
        { category_name: "รายได้อื่นๆ" },
    ];

    for (const cat of incomeCategories) {
        await prisma.income_Category.upsert({
            where: { category_name: cat.category_name },
            update: {},
            create: { category_name: cat.category_name },
        });
    }

    const drugCategory = await prisma.income_Category.findUnique({
        where: { category_name: "ค่ายา" },
    });
    const serviceCategory = await prisma.income_Category.findUnique({
        where: { category_name: "ค่าบริการ" },
    });
    const otherIncomeCategory = await prisma.income_Category.findUnique({
        where: { category_name: "รายได้อื่นๆ" },
    });

    if (!drugCategory || !serviceCategory || !otherIncomeCategory) {
        throw new Error("Failed to create required Income Categories");
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
        await prisma.procedure.create({
            data: { procedure_name: p.name, price: p.price },
        });
    }
    const procedures = await prisma.procedure.findMany();

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
                // citizen_number: generateCitizenId(i + 1),
                hospital_number: `HN67${(i + 1).toString().padStart(4, "0")}`,
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

    //  for (let day = TOTAL_DAYS; day >= 0; day--) {
    //     const date = daysAgo(day);
    //     const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    //     // ใช้ Transaction ครอบระดับ "วัน" เพื่อลด Overhead ของ Database Connection
    //     await prisma.$transaction(async (tx) => {
    //         // 1. รายจ่ายประจำเดือน (Utility & General)
    //         if (date.getDate() === 5) {
    //             await tx.expense.createMany({
    //                 data: [
    //                     {
    //                         expense_date: date,
    //                         expense_type: "utility",
    //                         description: "ค่าไฟและน้ำประปา",
    //                         amount: randomInt(3000, 6000),
    //                         receipt_no: `UTX-${date.getTime()}`,
    //                     },
    //                     {
    //                         expense_date: date,
    //                         expense_type: "general",
    //                         description: "ค่าเช่าสถานที่",
    //                         amount: 15000,
    //                         receipt_no: `RNT-${date.getTime()}`,
    //                     },
    //                 ],
    //             });
    //         }

    //         // 2. ปรับสต็อกยาเบ็ดเตล็ด (Drug Adjustment)
    //         if (date.getDate() === 15 && Math.random() > 0.8) {
    //             const lot = await tx.drug_Lot.findFirst({
    //                 where: { qty_remaining: { gt: 0 } },
    //             });
    //             if (lot) {
    //                 const lostQty = randomInt(1, 5);
    //                 if (lot.qty_remaining >= lostQty) {
    //                     await tx.drug_Adjustment.create({
    //                         data: {
    //                             lot_id: lot.lot_id,
    //                             quantity_lost: lostQty,
    //                             reason: "พบยาชำรุด/เสื่อมสภาพ",
    //                             created_at: date,
    //                         },
    //                     });
    //                     await tx.drug_Lot.update({
    //                         where: { lot_id: lot.lot_id },
    //                         data: { qty_remaining: { decrement: lostQty } },
    //                     });
    //                 }
    //             }
    //         }

    //         // 3. รายได้อื่นๆ
    //         if (date.getDate() === 20 && Math.random() > 0.5) {
    //             await tx.income.create({
    //                 data: {
    //                     category_id: otherIncomeCategory.category_id,
    //                     income_date: date,
    //                     amount: randomInt(1000, 5000),
    //                     payment_method: "transfer",
    //                     receipt_no: `OTH-${date.getTime()}`,
    //                 },
    //             });
    //         }

    //         // 4. รายจ่าย: ซื้อยา (ต้นเดือน)
    //         if (date.getDate() === 1) {
    //             for (const drug of drugs) {
    //                 if (randomInt(1, 10) > 2) {
    //                     const qty = randomInt(300, 600);
    //                     const buyPrice = Number(drug.sell_price) * 0.5;
    //                     const expense = await tx.expense.create({
    //                         data: {
    //                             expense_date: date,
    //                             expense_type: "drug",
    //                             description: `เติมสต็อก ${drug.drug_name}`,
    //                             amount: buyPrice * qty,
    //                             receipt_no: `EXP-${date.getTime()}`,
    //                         },
    //                     });
    //                     await tx.drug_Lot.create({
    //                         data: {
    //                             drug_id: drug.drug_id,
    //                             lot_no: `LOT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}-${randomInt(10, 99)}`,
    //                             received_date: date,
    //                             expire_date: new Date(
    //                                 date.getFullYear() + 2,
    //                                 date.getMonth(),
    //                                 date.getDate(),
    //                             ),
    //                             qty_received: qty,
    //                             qty_remaining: qty,
    //                             buy_price: buyPrice,
    //                             expenseLots: {
    //                                 create: { expense_id: expense.expense_id },
    //                             },
    //                         },
    //                     });
    //                 }
    //             }
    //         }

    //         // 5. รายได้: Visits (ส่วนที่เยอะที่สุด)
    //         const dailyVisits = isWeekend ? randomInt(10, 15) : randomInt(4, 8);
    //         for (let v = 0; v < dailyVisits; v++) {
    //             const patient = patients[randomInt(0, patients.length - 1)];
    //             const age = patient.birth_date
    //                 ? calculateAge(patient.birth_date, date)
    //                 : { years: 0, months: 0, days: 0 };

    //             const visit = await tx.visit.create({
    //                 data: {
    //                     patient_id: patient.patient_id,
    //                     visit_date: date,
    //                     symptom: symptoms[randomInt(0, symptoms.length - 1)],
    //                     diagnosis:
    //                         diagnoses[randomInt(0, diagnoses.length - 1)],
    //                     blood_pressure: randomBP(),
    //                     heart_rate: randomInt(60, 100),
    //                     weight: randomInt(40, 100),
    //                     height: randomInt(150, 185),
    //                     age_years: age.years,
    //                     age_months: age.months,
    //                     age_days: age.days,
    //                 },
    //             });

    //             let totalDrugAmount = 0;
    //             let totalServiceAmount = 0;
    //             const visitDetailsBuffer = []; // เก็บสะสมไว้ใช้ createMany

    //             // 5.1 ยา (Drugs)
    //             const drugCount = randomInt(1, 3);
    //             for (let i = 0; i < drugCount; i++) {
    //                 const drug = drugs[randomInt(0, drugs.length - 1)];
    //                 const qty = randomInt(1, 5);
    //                 const unitPrice = Number(drug.sell_price);

    //                 visitDetailsBuffer.push({
    //                     visit_id: visit.visit_id,
    //                     item_type: ItemType.drug,
    //                     drug_id: drug.drug_id,
    //                     description: drug.drug_name,
    //                     quantity: qty,
    //                     unit_price: unitPrice,
    //                 });
    //                 totalDrugAmount += unitPrice * qty;

    //                 // FIFO Stock Deduction (ยังต้อง query lot รายตัวเพื่อความแม่นยำของสต็อก)
    //                 let remainingToDeduct = qty;
    //                 const lots = await tx.drug_Lot.findMany({
    //                     where: {
    //                         drug_id: drug.drug_id,
    //                         qty_remaining: { gt: 0 },
    //                     },
    //                     orderBy: { received_date: "asc" },
    //                 });

    //                 for (const lot of lots) {
    //                     if (remainingToDeduct <= 0) break;
    //                     const deduct = Math.min(
    //                         remainingToDeduct,
    //                         lot.qty_remaining,
    //                     );
    //                     await tx.drug_Usage.create({
    //                         data: {
    //                             visit_id: visit.visit_id,
    //                             lot_id: lot.lot_id,
    //                             quantity: deduct,
    //                             used_at: date,
    //                         },
    //                     });
    //                     await tx.drug_Lot.update({
    //                         where: { lot_id: lot.lot_id },
    //                         data: { qty_remaining: { decrement: deduct } },
    //                     });
    //                     remainingToDeduct -= deduct;
    //                 }
    //             }

    //             // 5.2 หัตถการ (Procedures)
    //             if (Math.random() > 0.3) {
    //                 const procCount = randomInt(1, 2);
    //                 for (let i = 0; i < procCount; i++) {
    //                     const proc =
    //                         procedures[randomInt(0, procedures.length - 1)];
    //                     const unitPrice = Number(proc.price);

    //                     visitDetailsBuffer.push({
    //                         visit_id: visit.visit_id,
    //                         item_type: ItemType.service,
    //                         procedure_id: proc.procedure_id,
    //                         description: proc.procedure_name,
    //                         quantity: 1,
    //                         unit_price: unitPrice,
    //                     });
    //                     totalServiceAmount += unitPrice;
    //                 }
    //             }

    //             // บันทึก Details ทั้งหมดของ Visit นี้ในครั้งเดียว
    //             await tx.visit_Detail.createMany({ data: visitDetailsBuffer });

    //             // 5.3 บันทึก Income แยก Category (สูงสุด 2 record ต่อ visit)
    //             const pm = Math.random() > 0.4 ? "transfer" : "cash";
    //             const incomeBuffer = [];

    //             if (totalDrugAmount > 0) {
    //                 incomeBuffer.push({
    //                     visit_id: visit.visit_id,
    //                     category_id: drugCategory.category_id,
    //                     income_date: date,
    //                     amount: totalDrugAmount,
    //                     payment_method: pm as any,
    //                     receipt_no: `RC-DRG-${date.getTime()}-${v}`,
    //                 });
    //             }
    //             if (totalServiceAmount > 0) {
    //                 incomeBuffer.push({
    //                     visit_id: visit.visit_id,
    //                     category_id: serviceCategory.category_id,
    //                     income_date: date,
    //                     amount: totalServiceAmount,
    //                     payment_method: pm as any,
    //                     receipt_no: `RC-SRV-${date.getTime()}-${v}`,
    //                 });
    //             }

    //             if (incomeBuffer.length > 0) {
    //                 await tx.income.createMany({ data: incomeBuffer });
    //             }
    //         }
    //     }); // จบ Transaction ของแต่ละวัน

    //     if (day % 30 === 0)
    //         console.log(`...ดำเนินการย้อนหลัง เหลืออีก ${day} วัน`);
    // }

    /*for (let day = TOTAL_DAYS; day >= 0; day--) {
         const date = daysAgo(day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // รายจ่ายประจำเดือน (Utility & General)
        if (date.getDate() === 5) {
            await prisma.expense.create({
                data: {
                    expense_date: date,
                    expense_type: "utility",
                    description: "ค่าไฟและน้ำประปา",
                    amount: randomInt(3000, 6000),
                    receipt_no: `UTX-${date.getTime()}`,
                },
            });
            await prisma.expense.create({
                data: {
                    expense_date: date,
                    expense_type: "general",
                    description: "ค่าเช่าสถานที่",
                    amount: 15000,
                    receipt_no: `RNT-${date.getTime()}`,
                },
            });
        }

        // ปรับสต็อกยาเบ็ดเตล็ด (Drug Adjustment) บางครั้ง
        if (date.getDate() === 15 && Math.random() > 0.8) {
            const lot = await prisma.drug_Lot.findFirst({
                where: { qty_remaining: { gt: 0 } },
            });
            if (lot) {
                const lostQty = randomInt(1, 5);
                if (lot.qty_remaining >= lostQty) {
                    await prisma.drug_Adjustment.create({
                        data: {
                            lot_id: lot.lot_id,
                            quantity_lost: lostQty,
                            reason: "พบยาชำรุด/เสื่อมสภาพ",
                            created_at: date,
                        },
                    });
                    await prisma.drug_Lot.update({
                        where: { lot_id: lot.lot_id },
                        data: { qty_remaining: { decrement: lostQty } },
                    });
                }
            }
        }

        // รายได้อื่นๆ สุ่มเกิด
        if (date.getDate() === 20 && Math.random() > 0.5) {
            await prisma.income.create({
                data: {
                    category_id: otherIncomeCategory.category_id,
                    income_date: date,
                    amount: randomInt(1000, 5000),
                    payment_method: "transfer",
                    receipt_no: `OTH-${date.getTime()}`,
                },
            });
        }

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

            let totalDrugAmount = 0;
            let totalServiceAmount = 0;

            // 1. Drug Usage
            const drugCount = randomInt(1, 3);
            for (let i = 0; i < drugCount; i++) {
                const drug = drugs[randomInt(0, drugs.length - 1)];
                const qty = randomInt(1, 5);
                const unitPrice = Number(drug.sell_price);
                const itemTotal = unitPrice * qty;

                await prisma.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: "drug",
                        drug_id: drug.drug_id,
                        description: drug.drug_name,
                        quantity: qty,
                        unit_price: unitPrice,
                    },
                });

                totalDrugAmount += itemTotal;

                // FIFO Stock Deduction
                let remainingToDeduct = qty;
                const lots = await prisma.drug_Lot.findMany({
                    where: { drug_id: drug.drug_id, qty_remaining: { gt: 0 } },
                    orderBy: { received_date: "asc" },
                });

                for (const lot of lots) {
                    if (remainingToDeduct <= 0) break;
                    const deduct = Math.min(
                        remainingToDeduct,
                        lot.qty_remaining,
                    );
                    await prisma.drug_Usage.create({
                        data: {
                            visit_id: visit.visit_id,
                            lot_id: lot.lot_id,
                            quantity: deduct,
                            used_at: date,
                        },
                    });
                    await prisma.drug_Lot.update({
                        where: { lot_id: lot.lot_id },
                        data: { qty_remaining: { decrement: deduct } },
                    });
                    remainingToDeduct -= deduct;
                }
            }

            // 2. Procedure/service
            if (Math.random() > 0.3) {
                const procCount = randomInt(1, 2);
                for (let i = 0; i < procCount; i++) {
                    const proc =
                        procedures[randomInt(0, procedures.length - 1)];
                    const unitPrice = Number(proc.price);

                    await prisma.visit_Detail.create({
                        data: {
                            visit_id: visit.visit_id,
                            item_type: "procedure",
                            procedure_id: proc.procedure_id,
                            description: proc.procedure_name,
                            quantity: 1,
                            unit_price: unitPrice,
                        },
                    });
                    totalServiceAmount += unitPrice;
                }
            }

            const pm = Math.random() > 0.4 ? "transfer" : "cash";

            if (totalDrugAmount > 0) {
                await prisma.income.create({
                    data: {
                        visit_id: visit.visit_id,
                        category_id: drugCategory.category_id,
                        income_date: date,
                        amount: totalDrugAmount,
                        payment_method: pm,
                        receipt_no: `RC-DRG-${date.getTime()}-${v}`,
                    },
                });
            }

            if (totalServiceAmount > 0) {
                await prisma.income.create({
                    data: {
                        visit_id: visit.visit_id,
                        category_id: serviceCategory.category_id,
                        income_date: date,
                        amount: totalServiceAmount,
                        payment_method: pm,
                        receipt_no: `RC-SRV-${date.getTime()}-${v}`,
                    },
                });
            }
        }

        if (day % 100 === 0)
            console.log(`...ดำเนินการย้อนหลัง เหลืออีก ${day} วัน`);
    } */
    console.log("✅ Seed ข้อมูล " + TOTAL_DAYS / 365 + " ปีเรียบร้อย!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
