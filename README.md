# NAHI Clinic Management System (ระบบจัดการคลินิก NAHI)

ระบบบริหารจัดการคลินิกที่ครบวงจร ตั้งแต่ข้อมูลผู้ป่วย การรักษา คลังยา ไปจนถึงบัญชีรายรับ-รายจ่าย พัฒนาด้วย Next.js และ PostgreSQL

[Documentation](https://docs.google.com/document/d/1ipNyGYTvvmIGfxef5B1M9oZee3zKOdYhZN6kn0UvYIs/edit?usp=sharing)

## คุณสมบัติหลัก (Key Features)

- **ระบบแดชบอร์ด**: แสดงภาพรวมสถิติผู้ป่วย รายได้ และสถานะคลังยาผ่านกราฟที่เข้าใจง่าย
- **จัดการข้อมูลผู้ป่วย**: ลงทะเบียนผู้ป่วยใหม่, ค้นหาประวัติ, และแสดงรายละเอียดประวัติการรักษาอย่างละเอียด
- **การบันทึกการรักษา**: บันทึกอาการ, สัญญาณชีพ (Vital Signs), ผลการวินิจฉัย, การสั่งยา และค่าบริการ
- **ระบบคลังยาและเวชภัณฑ์**: จัดการสต็อกยา, ระบบ Lot ยา (วันรับ, วันหมดอายุ), ระบบตัดสต็อกอัตโนมัติ และการแจ้งเตือนยาใกล้หมด/ใกล้หมดอายุ
- **ระบบการเงิน**: บันทึกรายได้จากการรักษา และรายจ่ายต่างๆ ของคลินิก พร้อมระบบจัดการหมวดหมู่รายรับ-รายจ่าย
- **รายงานสรุป**: รายงานรายรับ-รายจ่ายและสถิติต่างๆ แบบแยกช่วงเวลา
- **ระบบสมาชิก**: ระบบเข้าสู่ระบบ (Login) เพื่อความปลอดภัยและการจำกัดสิทธิ์เข้าถึงข้อมูล

## เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Lucide React](https://lucide.dev/) (Icons), [Recharts](https://recharts.org/) (Charts), [SweetAlert2](https://sweetalert2.github.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Configuration**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## การติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)

- [Node.js](https://nodejs.org/) (เวอร์ชัน 20.x ขึ้นไป)
- [Docker](https://www.docker.com/) และ [Docker Compose](https://docs.docker.com/compose/) (แนะนำสำหรับการรันฐานข้อมูลและระบบ)

### ขั้นตอนการติดตั้งแบบ Local Development

1. **ติดตั้ง dependencies**:

    ```bash
    npm install
    ```

2. **ตั้งค่าไฟล์ Environment Variables**:
   สร้างไฟล์ `.env` โดยคัดลอกตัวอย่างจาก `.env.example`:

    ```bash
    cp .env.example .env
    ```

    _หมายเหตุ: อย่าลืมแก้ไขค่า DATABASE_URL และ NEXTAUTH_SECRET ให้ถูกต้อง_

3. **เตรียมฐานข้อมูล (Prisma)**:

    ```bash
    npx prisma generate
    # หากเป็นการติดตั้งครั้งแรกและต้องการทำ migration
    # npx prisma migrate dev
    # หากต้องการ seed ข้อมูล
    npx prisma db seed
    ```

4. **รันระบบสำหรับ development**:
    ```bash
    npm run dev
    ```
    เข้าใช้งานผ่าน [http://localhost:3000](http://localhost:3000)

### ขั้นตอนการรันผ่าน Docker (แนะนำ)

1. **สร้าง image และรัน container**:

    ```bash
    docker compose up --build -d
    ```

2. **ตั้งค่าฐานข้อมูลใน Container (ครั้งแรก)**:

    ```bash
    docker compose exec app npx prisma migrate deploy
    docker compose exec app npx prisma db seed
    ```

3. **เข้าใช้งานระบบ**:
   ตรวจสอบที่ [http://localhost:3000](http://localhost:3000)

## การตั้งค่า Environment Variables

ค่าสำคัญที่ต้องระบุในไฟล์ `.env`:

- `DATABASE_URL`: Connection string สำหรับ PostgreSQL
- `NEXTAUTH_SECRET`: คีย์ลับสำหรับใช้เข้ารหัส Session
- `NEXTAUTH_URL`: URL หลักของระบบ (ปกติคือ http://localhost:3000)
- `JWT_SECRET`: คีย์ลับสำหรับ JWT Token (หากใช้แยกจาก NextAuth)

---
