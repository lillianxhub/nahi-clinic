import { prisma } from "../src/lib/prisma";
import { Gender, ItemType, DrugStatus, PaymentMethod, ExpenseType } from "../generated/prisma/client";

function daysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ฟังก์ชันสุ่มเลขบัตรประชาชน 13 หลัก
function generateCitizenId() {
    let id = "";
    for (let i = 0; i < 13; i++) {
        id += Math.floor(Math.random() * 10).toString();
    }
    return id;
}

async function main() {
    console.log("🚀 เริ่มต้นการ Seed ข้อมูลระดับ Demo...");

    await prisma.user.create({
        data: {
            username: "admin",
            password_hash: "admin",
        }
    });
    // 1. หมวดหมู่ยา
    const categoriesData = [
        { name: "ยาปฏิชีวนะ (Antibiotics)" },
        { name: "ยาแก้ปวด/ลดไข้ (Analgesics)" },
        { name: "ยาแก้อักเสบ (NSAIDs)" },
        { name: "ยาแก้แพ้ (Antihistamines)" },
        { name: "วิตามินและอาหารเสริม" },
        { name: "ยาระบบทางเดินอาหาร" }
    ];

    for (const cat of categoriesData) {
        await prisma.drug_Category.create({
            data: { category_name: cat.name }
        });
    }
    const categories = await prisma.drug_Category.findMany();

    // 2. ข้อมูลยา (Drugs)
    const drugsData = [
        { name: "Amoxicillin 500mg", price: 120, unit: "แผง" },
        { name: "Paracetamol 500mg", price: 20, unit: "แผง" },
        { name: "Ibuprofen 400mg", price: 45, unit: "เม็ด" },
        { name: "CPM (Chlorpheniramine)", price: 15, unit: "เม็ด" },
        { name: "Omeprazole 20mg", price: 150, unit: "กล่อง" },
        { name: "Vitamin C 1000mg", price: 250, unit: "ขวด" }
    ];

    for (const d of drugsData) {
        await prisma.drug.create({
            data: {
                drug_name: d.name,
                category_id: categories[randomInt(0, categories.length - 1)].category_id,
                unit: d.unit,
                sell_price: d.price,
                min_stock: 50,
                status: "active"
            }
        });
    }
    const drugs = await prisma.drug.findMany();

    // 3. ข้อมูลผู้ป่วย (Patients) - รายชื่อสมจริง
    const thaiNames = [
        { f: "กิตติพงษ์", l: "อัศวเหม", g: Gender.male },
        { f: "นริศรา", l: "รัตนโกสินทร์", g: Gender.female },
        { f: "ประเสริฐ", l: "สุขสวัสดิ์", g: Gender.male },
        { f: "วิไลพร", l: "วงค์สว่าง", g: Gender.female },
        { f: "สมศักดิ์", l: "รักชาติ", g: Gender.male },
        { f: "จิราพร", l: "ดวงดี", g: Gender.female },
        { f: "พงศธร", l: "มีทรัพย์", g: Gender.male },
        { f: "เบญจมาศ", l: "แก้ววิจิตร", g: Gender.female }
    ];

    for (let i = 0; i < thaiNames.length; i++) {
        await prisma.patient.create({
            data: {
                first_name: thaiNames[i].f,
                last_name: thaiNames[i].l,
                gender: thaiNames[i].g,
                citizen_number: generateCitizenId(),
                hospital_number: `HN-67${(i + 1).toString().padStart(4, '0')}`,
                phone: `08${randomInt(10000000, 99999999)}`,
                address: "กรุงเทพมหานคร ประเทศไทย",
                birth_date: daysAgo(randomInt(7000, 18000)), // อายุประมาณ 20-50 ปี
                allergy: i % 3 === 0 ? "แพ้ยากลุ่ม Penicillin" : "ไม่มี"
            }
        });
    }
    const patients = await prisma.patient.findMany();

    // 4. การจำลอง Transaction ย้อนหลัง 7 วัน
    for (let day = 7; day >= 0; day--) {
        const date = daysAgo(day);
        console.log(`📅 กำลังสร้างข้อมูลของวันที่: ${date.toLocaleDateString()}`);

        // --- ซื้อยาเข้าคลัง (Expense + Lot) ---
        for (let j = 0; j < 2; j++) {
            const drug = drugs[randomInt(0, drugs.length - 1)];
            const buyPrice = Number(drug.sell_price) * 0.5;
            const qty = 200;

            const expense = await prisma.expense.create({
                data: {
                    expense_date: date,
                    expense_type: "drug",
                    description: `จัดซื้อยา ${drug.drug_name} เข้าคลัง`,
                    amount: buyPrice * qty,
                    receipt_no: `INV-${date.getTime()}-${j}`
                }
            });

            const lot = await prisma.drug_Lot.create({
                data: {
                    drug_id: drug.drug_id,
                    lot_no: `LOT-${randomInt(1000, 9999)}`,
                    received_date: date,
                    expire_date: daysAgo(-365),
                    qty_received: qty,
                    qty_remaining: qty,
                    buy_price: buyPrice
                }
            });

            await prisma.expense_Drug_Lot.create({
                data: { expense_id: expense.expense_id, lot_id: lot.lot_id }
            });
        }

        // ดึง Lots ล่าสุดมาใช้จ่ายยา
        const availableLots = await prisma.drug_Lot.findMany({ where: { qty_remaining: { gt: 0 } } });

        // --- คนไข้มาหาหมอ (Visit) ---
        const dailyVisits = randomInt(3, 6);
        for (let v = 0; v < dailyVisits; v++) {
            const patient = patients[randomInt(0, patients.length - 1)];
            const serviceFee = 250;
            
            const visit = await prisma.visit.create({
                data: {
                    patient_id: patient.patient_id,
                    visit_date: date,
                    symptom: "มีอาการไอ เจ็บคอ มีไข้ต่ำๆ",
                    diagnosis: "คออักเสบ (Pharyngitis)",
                    note: "นัดติดตามอาการอีก 3 วันถ้าไม่ดีขึ้น"
                }
            });

            // ค่าตรวจ
            await prisma.visit_Detail.create({
                data: {
                    visit_id: visit.visit_id,
                    item_type: "service",
                    description: "ค่าธรรมเนียมการตรวจ",
                    quantity: 1,
                    unit_price: serviceFee
                }
            });

            // ค่ายาและการตัดสต็อก
            let totalDrugPrice = 0;
            const selectedLot = availableLots[randomInt(0, availableLots.length - 1)];
            const qtyUsed = randomInt(1, 2);
            const drugInfo = drugs.find(d => d.drug_id === selectedLot.drug_id);

            if (drugInfo) {
                await prisma.visit_Detail.create({
                    data: {
                        visit_id: visit.visit_id,
                        item_type: "drug",
                        drug_id: drugInfo.drug_id,
                        description: drugInfo.drug_name,
                        quantity: qtyUsed,
                        unit_price: drugInfo.sell_price
                    }
                });

                await prisma.drug_Usage.create({
                    data: {
                        visit_id: visit.visit_id,
                        lot_id: selectedLot.lot_id,
                        quantity: qtyUsed,
                        used_at: date
                    }
                });

                totalDrugPrice = Number(drugInfo.sell_price) * qtyUsed;
            }

            // บันทึกรายได้
            await prisma.income.create({
                data: {
                    visit_id: visit.visit_id,
                    income_date: date,
                    amount: serviceFee + totalDrugPrice,
                    payment_method: v % 2 === 0 ? "cash" : "transfer",
                    receipt_no: `RC-${date.getFullYear()}${(v+1).toString().padStart(4, '0')}`
                }
            });
        }
    }

    console.log("✅ Seed ข้อมูลเสร็จสมบูรณ์! พร้อมสำหรับการ Demo");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });