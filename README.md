# Nahi Clinic

Branch นี้จะเป็นการสาธิต ระบบจัดการคลินิกสถานพยาบาลเบื้องต้น โดยการใช้ Next.js, Prisma, และ PostgreSQL และ สามารถรันทุกอย่างผ่าน Docker
- [เอกสารโครงงาน](https://docs.google.com/document/d/1ipNyGYTvvmIGfxef5B1M9oZee3zKOdYhZN6kn0UvYIs/edit?usp=sharing)

## ความต้องการของระบบ

ก่อนเริ่มต้น ตรวจสอบให้แน่ใจว่าเครื่องของมีการติดตั้ง:
[Docker installation](https://docs.docker.com/compose/install/)

- **Docker**
- **Docker Compose**


ไม่จำเป็นต้องมี Node.js หรือ PostgreSQL ติดตั้งอยู่ในเครื่อง เพราะทุกอย่างจะทำงานภายใน Docker containers

## วิธีรันโปรเจกต์

สามารถเริ่มใช้งานโปรเจกต์ได้ด้วยขั้นตอนง่ายๆ ดังนี้:

1.  **Clone โปรเจกต์**

    ```bash
    git clone https://github.com/lillianxhub/nahi-clinic.git
    cd nahi-clinic
    ```

2.  **รันสคริปต์ Setup**
    ใช้คำสั่งต่อไปนี้เพื่อตั้งค่าสภาพแวดล้อมและเริ่มการทำงาน:
    ```bash
    bash setup.sh
    ```

สคริปต์จะทำหน้าที่ดังนี้:

- คัดลอกไฟล์ `.env.example` ไปเป็น `.env` (หากยังไม่มี)
- Build Docker images
- เริ่มการทำงานของ Database (PostgreSQL)
- รอจนกว่า Database จะพร้อมใช้งาน
- รัน Prisma Migrations เพื่อสร้าง Schema
- รัน Prisma Seed เพื่อเตรียมข้อมูลพื้นฐาน
- เริ่มการทำงานของ Next.js Application

## การเข้าใช้งาน

เมื่อรันสคริปต์เสร็จสมบูรณ์ สามารถเข้าใช้งานแอปพลิเคชันได้ที่:

[http://localhost:3000](http://localhost:3000)

## ผู้จัดทำ

- นายก้องภพ 		โชควิริยะ 		673380030-5
- นายถิรวัฒน์ 		    อุจินา			673380039-7
- นายกรมภัฏ 		    พิริยะ			673380262-4
- นายณพวิทย์ 		วงษ์ประเสริฐ 		673380266-6
- นายรัฐภูมิ 		    เกิดพระจีน		673380057-5
- นายเพชรภิญโญ 	    ธนศิรินรากร  		673380073-7
