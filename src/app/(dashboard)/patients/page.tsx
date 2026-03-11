"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import { Patient } from "@/interface/patient";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DataTable, { Column } from "@/components/table/Table";
import AddPatientModal from "@/components/patient/AddPatientModal";
import ViewPatientModal from "@/components/patient/ViewPatientModal";
import EditPatientModal from "@/components/patient/EditPatientModal";
import { patientService } from "@/services/patient";
import { GenderLabelTH } from "@/constants/gender";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import usePageTitle from "@/hooks/usePageTitle";
import Swal from "sweetalert2";

const getColumns = (
    onView: (id: string) => void,
    onEdit: (patient: Patient) => void,
    onDelete: (patient: Patient) => void,
): Column<Patient>[] => [
    {
        key: "hospital_number",
        header: "HN",
        align: "center",
        render: (row) => row.hospital_number ?? "-",
    },
    {
        key: "first_name",
        header: "ชื่อจริง",
        align: "center",
        render: (row) => row.first_name ?? "-",
    },
    {
        key: "last_name",
        header: "นามสกุล",
        align: "center",
        render: (row) => row.last_name ?? "-",
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
                    title="ดูรายละเอียด"
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={() => onEdit(row)}
                    className="cursor-pointer text-blue-600 hover:opacity-70"
                    title="แก้ไขข้อมูล"
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={() => onDelete(row)}
                    className="cursor-pointer text-red-600 hover:opacity-70"
                    title="ลบผู้ป่วย"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        ),
    },
];

export default function PatientsPage() {
    usePageTitle("Patients");
    const router = useRouter();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [openAdd, setOpenAdd] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
        null,
    );
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
        null,
    );

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

    const handleView = (id: string) => {
        setSelectedPatientId(id);
        setOpenView(true);
    };

    const handleEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setOpenEdit(true);
    };

    const handleDelete = async (patient: Patient) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: `คุณต้องการลบผู้ป่วย ${patient.fullName} หรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ลบข้อมูล",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                await patientService.deletePatient(patient.patient_id);
                Swal.fire({
                    title: "ลบสำเร็จ!",
                    text: "ข้อมูลผู้ป่วยถูกลบแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchPatients();
            } catch (error) {
                Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 bg-white"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาชื่อ / เลข HN"
                        className="pl-10 h-10 bg-white"
                    />
                </div>

                {/* Add Button */}
                <Button
                    onClick={() => setOpenAdd(true)}
                    className="cursor-pointer shadow-lg shadow-primary/20"
                >
                    <Plus size={18} />
                    เพิ่มผู้ป่วยใหม่
                </Button>
            </div>

            {/* Table */}
            <DataTable
                columns={getColumns(handleView, handleEdit, handleDelete)}
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
                    fetchPatients();
                }}
            />

            <ViewPatientModal
                open={openView}
                onClose={() => setOpenView(false)}
                patientId={selectedPatientId}
                onEdit={(patient) => {
                    setOpenView(false);
                    handleEdit(patient);
                }}
            />

            <EditPatientModal
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                patient={selectedPatient}
                onSuccess={() => {
                    fetchPatients();
                }}
            />
        </div>
    );
}
