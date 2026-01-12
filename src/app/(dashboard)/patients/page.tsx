"use client";

import { useState } from "react";
import Pagination from "@/components/Pagination";
import { Patient } from "@/interface/patient";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Badge from "@/components/Badge";
import DataTable, { Column } from "@/components/table/Table";

const patients: Patient[] = [
    {
        id: 1,
        citizenId: "1103700123456",
        fullName: "นางสาวมาลี สุขสันต์",
        gender: "หญิง",
        birthDate: "1998-04-12",
        phone: "081-234-5678",
    },
    {
        id: 2,
        citizenId: "1103700654321",
        fullName: "นายวิชัย กล้าหาญ",
        gender: "ชาย",
        birthDate: "1992-09-30",
        phone: "089-456-7890",
    },
];


const columns: Column<Patient>[] = [
    {
        key: "citizenId",
        header: "รหัสบัตร",
    },
    {
        key: "fullName",
        header: "ชื่อ-นามสกุล",
    },
    {
        key: "gender",
        header: "เพศ",
        align: "center",
        // render: (row) => (
        //     <Badge
        //         label={row.gender}
        //         variant={row.gender === "ชาย" ? "info" : "success"}
        //     />
        // ),
    },
    {
        key: "birthDate",
        header: "วันเกิด",
        align: "center",
        render: (row) =>
            new Date(row.birthDate).toLocaleDateString("th-TH"),
    },
    {
        key: "phone",
        header: "เบอร์โทร",
        align: "center",
    },
    {
        key: "action",
        header: "จัดการ",
        align: "center",
        render: () => (
            <div className="flex justify-center gap-3">
                <button className="text-primary hover:opacity-70 cursor-pointer">
                    <Eye size={18} />
                </button>
                <button className="text-blue-600 hover:opacity-70 cursor-pointer">
                    <Pencil size={18} />
                </button>
                <button className="text-red-600 hover:opacity-70 cursor-pointer">
                    <Trash2 size={18} />
                </button>
            </div>
        ),
    },
];

export default function PatientsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filteredPatients = patients.filter(
        (p) =>
            p.fullName.includes(search) ||
            p.citizenId.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาชื่อ / เลขบัตรประชาชน"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none"
                    />
                </div>

                {/* Add Button */}
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer">
                    <Plus size={18} />
                    เพิ่มผู้ป่วยใหม่
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredPatients}
                rowKey={(row) => row.id}
                page={page}
                pageSize={5}
            />

            <Pagination
                page={page}
                totalPages={Math.ceil(filteredPatients.length / 5)}
                onChange={setPage}
            />
        </div>
    );
}
