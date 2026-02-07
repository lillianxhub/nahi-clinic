"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import { Patient } from "@/interface/patient";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Badge from "@/components/Badge";
import DataTable, { Column } from "@/components/table/Table";
import AddPatientModal from "@/components/patient/AddPatientModal";
import { patientService } from "@/services/patient";
import { GenderLabelTH } from "@/constants/gender";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

const getColumns = (onView: (id: string) => void): Column<Patient>[] => [
    {
        key: "hospital_number",
        header: "HN",
        align: "center",
        render: (row) => row.hospital_number ?? "-",
    },
    {
        key: "first_name",
        header: "ชื่อจริง",
    },
    {
        key: "last_name",
        header: "นามสกุล",
    },
    {
        key: "gender",
        header: "เพศ",
        align: "center",
        render: (row) => GenderLabelTH[row.gender],
    },
    {
        key: "phone",
        header: "เบอร์โทร",
        align: "center",
        render: (row) => row.phone ?? "-",
    },
    {
        key: "action",
        header: "จัดการ",
        align: "center",
        render: (row) => (
            <div className="flex justify-center gap-3">
                <button
                    onClick={() => onView(row.patient_id)}
                    className="cursor-pointer text-primary hover:opacity-70"
                >
                    <Eye size={18} />
                </button>
                <button className="cursor-pointer text-blue-600 hover:opacity-70">
                    <Pencil size={18} />
                </button>
                <button className="cursor-pointer text-red-600 hover:opacity-70">
                    <Trash2 size={18} />
                </button>
            </div>
        ),
    },
];

export default function PatientsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [openAdd, setOpenAdd] = useState(false);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const res = await patientService.getPatients({
                page,
                pageSize: 10,
                q: debouncedSearch,
            });

            setPatients(res.data);
            setTotalPages(res.meta.pagination.pageCount);
        } catch (error) {
            console.error("โหลดข้อมูลผู้ป่วยไม่สำเร็จ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchPatients();
    }, [page, debouncedSearch]);

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
                <button
                    onClick={() => setOpenAdd(true)}
                    className="cursor-pointer flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
                >
                    <Plus size={18} />
                    เพิ่มผู้ป่วยใหม่
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={getColumns((id) => router.push(`/patients/${id}`))}
                data={patients}
                rowKey={(row) => row.patient_id}
                page={page}
                pageSize={10}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />

            <AddPatientModal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                onSuccess={() => {
                    setPage(1);
                    fetchPatients();
                }}
            />
        </div>
    );
}
