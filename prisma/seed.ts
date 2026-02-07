import { prisma } from "../src/lib/prisma";
import { Gender } from "../generated/prisma/client";
import bcrypt from "bcrypt";

function daysAgo(days: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCitizenId() {
    let id = "";
    for (let i = 0; i < 13; i++) {
        id += Math.floor(Math.random() * 10).toString();
    }
    return id;
}

async function main() {
    console.log("🧹 กำลังล้างข้อมูลเก่า...");
    await prisma.drug_Usage.deleteMany();
    await prisma.expense_Drug_Lot.deleteMany();
    await prisma.income.deleteMany();
    await prisma.visit_Detail.deleteMany();
    await prisma.drug_Lot.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.drug.deleteMany();
    await prisma.drug_Category.deleteMany();
    await prisma.patient.deleteMany();
    // Keep users to avoid locking out

    console.log("🚀 เริ่มต้นการ Seed ข้อมูลระดับ 1 ปี (365 วัน)...");

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

    // 2. หมวดหมู่ยา
    const categoriesData = [
        { name: "ยาปฏิชีวนะ (Antibiotics)" },
        { name: "ยาแก้ปวด/ลดไข้ (Analgesics)" },
        { name: "ยาแก้อักเสบ (NSAIDs)" },
        { name: "ยาแก้แพ้ (Antihistamines)" },
        { name: "วิตามินและอาหารเสริม" },
        { name: "ยาระบบทางเดินอาหาร" },
    ];
    for (const cat of categoriesData) {
        await prisma.drug_Category.create({
            data: { category_name: cat.name },
        });
    }
    const categories = await prisma.drug_Category.findMany();

    // 3. ข้อมูลยา
    const drugsData = [
        { name: "Amoxicillin 500mg", price: 120, unit: "แผง" },
        { name: "Paracetamol 500mg", price: 20, unit: "แผง" },
        { name: "Ibuprofen 400mg", price: 45, unit: "เม็ด" },
        { name: "CPM (Chlorpheniramine)", price: 15, unit: "เม็ด" },
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

    // 4. ข้อมูลผู้ป่วย
    const patientsData = [
        { f: "กิตติพงษ์", l: "อัศวเหม", g: Gender.male },
        { f: "นริศรา", l: "รัตนโกสินทร์", g: Gender.female },
        { f: "ประเสริฐ", l: "สุขสวัสดิ์", g: Gender.male },
        { f: "วิไลพร", l: "วงค์สว่าง", g: Gender.female },
        { f: "สมศักดิ์", l: "รักชาติ", g: Gender.male },
        { f: "จิราพร", l: "ดวงดี", g: Gender.female },
        { f: "พงศธร", l: "มีทรัพย์", g: Gender.male },
        { f: "เบญจมาศ", l: "แก้ววิจิตร", g: Gender.female },
    ];
    for (let i = 0; i < patientsData.length; i++) {
        await prisma.patient.create({
            data: {
                first_name: patientsData[i].f,
                last_name: patientsData[i].l,
                gender: patientsData[i].g,
                citizen_number: generateCitizenId(),
                hospital_number: `HN-67${(i + 1).toString().padStart(4, "0")}`,
                phone: `08${randomInt(10000000, 99999999)}`,
                address: `${randomInt(100, 999)} หมู่ ${randomInt(1, 12)} ต.ในเมือง อ.เมือง จ.ขอนแก่น`,
                birth_date: daysAgo(randomInt(7000, 18000)),
                allergy: i % 3 === 0 ? "แพ้ยากลุ่ม Penicillin" : "ไม่มี",
            },
        });
    }
    const patients = await prisma.patient.findMany();

    // 5. จำลองข้อมูลย้อนหลัง 365 วัน
    console.log("⏳ กำลังสร้างธุรกรรมย้อนหลัง 365 วัน... อาจใช้เวลาสักครู่");

    const symptoms = [
        "ปวดหัว ตัวร้อน",
        "ไอ จาม มีน้ำมูก",
        "ปวดท้อง ท้องเสีย",
        "ผื่นคันตามร่างกาย",
        "ปวดเมื่อยกล้ามเนื้อ",
        "เวียนศีรษะ หน้ามืด",
        "เจ็บคอ กลืนลำบาก",
        "แน่นหน้าอก",
        "ปวดฟัน",
        "ตรวจสุขภาพทั่วไป",
    ];

    const diagnoses = [
        "ไข้หวัด (Common Cold)",
        "โรคกระเพาะอักเสบ",
        "กล้ามเนื้ออักเสบ",
        "ภูมิแพ้อากาศ",
        "อาหารเป็นพิษ",
        "ความดันโลหิตสูง",
        "ติดเชื้อทางเดินหายใจ",
        "ผื่นแพ้สัมผัส",
        "ปวดศีรษะจากความเครียด",
        "สุขภาพปกติ",
    ];

    for (let day = 365; day >= 0; day--) {
        const date = daysAgo(day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // --- รายจ่าย: ซื้อยาเข้าคลัง (สุ่มซื้อเดือนละครั้ง ทุกวันที่ 1 ของเดือน) ---
        if (date.getDate() === 1 || day === 365) {
            console.log(
                `📦 ทำรายการซื้อยาเข้าคลังประจำเดือน: ${date.toLocaleDateString()}`,
            );
            for (const drug of drugs) {
                // ซุ่มซื้อยาบางตัว หรือซื้อทุกตัวเพื่อป้องกันสต็อกขาด
                if (randomInt(1, 10) > 3) {
                    const qty = randomInt(200, 500);
                    const buyPrice = Number(drug.sell_price) * 0.6;

                    const expense = await prisma.expense.create({
                        data: {
                            expense_date: date,
                            expense_type: "drug",
                            description: `สต็อกยาประจำเดือน ${drug.drug_name}`,
                            amount: buyPrice * qty,
                            receipt_no: `EXP-${date.getTime()}-${randomInt(100, 999)}`,
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
                                create: {
                                    expense_id: expense.expense_id,
                                },
                            },
                        },
                    });
                }
            }
        }

        // --- รายได้: คนไข้มาตรวจ (Visit) ---
        // เสาร์-อาทิตย์คนไข้เฉลี่ย 8-12 คน, วันธรรมดา 3-6 คน
        const dailyVisits = isWeekend ? randomInt(8, 12) : randomInt(3, 6);

        for (let v = 0; v < dailyVisits; v++) {
            const patient = patients[randomInt(0, patients.length - 1)];
            const visit = await prisma.visit.create({
                data: {
                    patient_id: patient.patient_id,
                    visit_date: date,
                    symptom: symptoms[randomInt(0, symptoms.length - 1)],
                    diagnosis: diagnoses[randomInt(0, diagnoses.length - 1)],
                },
            });

            const serviceFee = 300;
            let totalDrugPrice = 0;

            // สุ่มจ่ายยา 1-3 รายการ
            const drugCount = randomInt(1, 3);
            for (let i = 0; i < drugCount; i++) {
                const drug = drugs[randomInt(0, drugs.length - 1)];
                const qty = randomInt(1, 10);

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

                // หักสต็อกและบันทึก Drug_Usage
                // ค้นหา Lot ที่มีของ (FIFO)
                const availableLot = await prisma.drug_Lot.findFirst({
                    where: {
                        drug_id: drug.drug_id,
                        qty_remaining: { gt: 0 },
                    },
                    orderBy: { received_date: "asc" },
                });

                if (availableLot) {
                    const useQty = Math.min(qty, availableLot.qty_remaining);
                    await prisma.drug_Usage.create({
                        data: {
                            visit_id: visit.visit_id,
                            lot_id: availableLot.lot_id,
                            quantity: useQty,
                            used_at: date,
                        },
                    });

                    await prisma.drug_Lot.update({
                        where: { lot_id: availableLot.lot_id },
                        data: { qty_remaining: { decrement: useQty } },
                    });
                }

                totalDrugPrice += Number(drug.sell_price) * qty;
            }

            // บันทึกรายได้ (Income)
            await prisma.income.create({
                data: {
                    visit_id: visit.visit_id,
                    income_date: date,
                    amount: serviceFee + totalDrugPrice,
                    payment_method: randomInt(0, 1) === 0 ? "cash" : "transfer",
                    receipt_no: `RC-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate()}-${v}`,
                },
            });
        }

        if (day % 30 === 0) console.log(`...เหลืออีก ${day} วัน`);
    }

    console.log("✅ Seed ข้อมูล 1 ปีเรียบร้อย!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
