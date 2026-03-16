# Nahi Clinic - Dockerized Demo

โปรเจกต์นี้เป็นการสาธิตระบบ Nahi Clinic ที่ใช้ Next.js, Prisma, และ PostgreSQL โดยสามารถรันผ่าน Docker ได้อย่างง่ายดาย

## ความต้องการของระบบ

ก่อนเริ่มต้น ตรวจสอบให้แน่ใจว่าเครื่องของคุณมีการติดตั้ง:

*   **Docker**
*   **Docker Compose**

คุณไม่จำเป็นต้องมี Node.js หรือ PostgreSQL ติดตั้งอยู่ในเครื่อง เพราะทุกอย่างจะทำงานภายใน Docker containers

## วิธีรันโปรเจกต์

คุณสามารถเริ่มใช้งานโปรเจกต์ได้ด้วยขั้นตอนง่ายๆ ดังนี้:

1.  **Clone โปรเจกต์**
    ```bash
    git clone <repo_url>
    cd nahi-clinic
    ```

2.  **รันสคริปต์ Setup**
    ใช้คำสั่งต่อไปนี้เพื่อตั้งค่าสภาพแวดล้อมและเริ่มการทำงาน:
    ```bash
    bash setup.sh
    ```

สคริปต์จะทำหน้าที่ดังนี้:
*   คัดลอกไฟล์ `.env.example` ไปเป็น `.env` (หากยังไม่มี)
*   Build Docker images
*   เริ่มการทำงานของ Database (PostgreSQL)
*   รอจนกว่า Database จะพร้อมใช้งาน
*   รัน Prisma Migrations เพื่อสร้าง Schema
*   รัน Prisma Seed เพื่อเตรียมข้อมูลพื้นฐาน
*   เริ่มการทำงานของ Next.js Application

## การเข้าใช้งาน

เมื่อรันสคริปต์เสร็จสมบูรณ์ คุณสามารถเข้าใช้งานแอปพลิเคชันได้ที่:

[http://localhost:3000](http://localhost:3000)

---
*จัดทำโดยทีม Senior DevOps Engineer*
