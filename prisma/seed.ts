import { PrismaClient } from "/generated/prisma/client";

import prisma from "../src/lib/prisma";

async function main() {
    // -----------------------------
    // 1️⃣ สร้าง clinic อันเดียว
    // -----------------------------
    const clinic = await prisma.clinic.create({
        data: {
            clinic_name: "คลินิกบ้านสุขภาพ",
            address: "123 ถนนสุขภาพ กรุงเทพฯ",
            phone: "081-234-5678",
            open_time: new Date("1970-01-01T08:00:00"),
            close_time: new Date("1970-01-01T17:00:00"),
        },
    });

    // -----------------------------
    // 2️⃣ สร้าง patients
    // -----------------------------
    const patient1 = await prisma.patient.create({
        data: {
            national_id: "1101700123456",
            firstname: "สมชาย",
            lastname: "ใจดี",
            gender: "ชาย",
            birthdate: new Date("1980-03-15"),
            phone: "081-111-2222",
            clinic_id: clinic.clinic_id,
        },
    });

    const patient2 = await prisma.patient.create({
        data: {
            national_id: "1101700654321",
            firstname: "สมหญิง",
            lastname: "แสนดี",
            gender: "หญิง",
            birthdate: new Date("1990-07-20"),
            phone: "082-333-4444",
            clinic_id: clinic.clinic_id,
        },
    });

    // -----------------------------
    // 3️⃣ สร้าง medicines
    // -----------------------------
    const medicine1 = await prisma.medicine.create({
        data: {
            medicine_name: "พาราเซตามอล",
            stock: 100,
            price: 2.5,
            expire_date: new Date("2026-12-31"),
            clinic_id: clinic.clinic_id,
        },
    });

    const medicine2 = await prisma.medicine.create({
        data: {
            medicine_name: "ไอบูโพรเฟน",
            stock: 50,
            price: 3.0,
            expire_date: new Date("2025-06-30"),
            clinic_id: clinic.clinic_id,
        },
    });

    // -----------------------------
    // 4️⃣ สร้าง treatments
    // -----------------------------
    const treatment1 = await prisma.treatment.create({
        data: {
            treatment_date: new Date("2026-01-10"),
            symptom: "ปวดหัว มีไข้",
            diagnosis: "ไข้หวัดใหญ่",
            total_cost: 250,
            clinic_id: clinic.clinic_id,
            patient_id: patient1.patient_id,
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        },
    });

    const treatment2 = await prisma.treatment.create({
        data: {
            treatment_date: new Date("2026-01-11"),
            symptom: "ไอแห้ง เจ็บคอ",
            diagnosis: "หลอดลมอักเสบ",
            total_cost: 300,
            clinic_id: clinic.clinic_id,
            patient_id: patient2.patient_id,
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        },
    });

    // -----------------------------
    // 5️⃣ TreatmentMedicine
    // -----------------------------
    await prisma.treatmentMedicine.create({
        data: {
            medicine_id: medicine1.medicine_id,
            treatment_id: treatment1.treatment_id,
            quantity: 2,
            price: 5.0,
        },
    });

    await prisma.treatmentMedicine.create({
        data: {
            medicine_id: medicine2.medicine_id,
            treatment_id: treatment2.treatment_id,
            quantity: 1,
            price: 3.0,
        },
    });

    // -----------------------------
    // 6️⃣ MedicinePurchase
    // -----------------------------
    await prisma.medicinePurchase.create({
        data: {
            medicine_id: medicine1.medicine_id,
            quantity: 50,
            cost: 100,
            purchase_date: new Date("2025-12-01"),
        },
    });

    await prisma.medicinePurchase.create({
        data: {
            medicine_id: medicine2.medicine_id,
            quantity: 30,
            cost: 90,
            purchase_date: new Date("2025-12-05"),
        },
    });

    // -----------------------------
    // 7️⃣ Finance
    // -----------------------------
    await prisma.finance.create({
        data: {
            type: "INCOME",
            amount: 5000,
            date: new Date("2026-01-10"),
            clinic_id: clinic.clinic_id,
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        },
    });

    await prisma.finance.create({
        data: {
            type: "EXPENSE",
            amount: 1500,
            date: new Date("2026-01-11"),
            clinic_id: clinic.clinic_id,
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        },
    });

    console.log("Seeder completed! Clinic:", clinic.clinic_name);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
