"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Pencil, Trash2, Plus } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";
import DataTable, { Column } from "@/components/table/Table";
import Pagination from "@/components/Pagination";
import { Treatment } from "@/interface/treatment";
import { treatmentService } from "@/services/treatment";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AddTreatmentModal from "@/components/treatment/AddTreatmentModal";
import ViewTreatmentModal from "@/components/treatment/ViewTreatmentModal";
import EditTreatmentModal from "@/components/treatment/EditTreatmentModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TreatmentsPage() {
    usePageTitle("Treatments");

    const router = useRouter();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);

    const [loading, setLoading] = useState(true);
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [openAdd, setOpenAdd] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState<
        string | null
    >(null);
    const [selectedTreatment, setSelectedTreatment] =
        useState<Treatment | null>(null);

    const fetchTreatments = async () => {
        try {
            setLoading(true);

            const res = await treatmentService.getTreatments({
                page,
                pageSize: 10,
                q: debouncedSearch,
            });

            setTreatments(res.data);
            setTotalPages(res.meta.pagination.pageCount);
        } catch (error) {
            console.error("โหลดข้อมูลการรักษาไม่สำเร็จ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchTreatments();
    }, [page, debouncedSearch]);

    const columns: Column<Treatment>[] = [
        {
            key: "hospital_number",
            header: "รหัส",
            align: "center",
            render: (row) => `${row.patient.hospital_number}`,
        },
        {
            key: "citizen_number",
            header: "เลขบัตรประชาชน",
            align: "center",
            render: (row) => `${row.patient.citizen_number}`,
        },
        {
            key: "patient_name",
            header: "ชื่อ-นามสกุล",
            render: (row) =>
                row.patient
                    ? `${row.patient.first_name} ${row.patient.last_name}`
                    : "-",
        },
        {
            key: "visit_date",
            header: "วันที่",
            align: "center",
            render: (row) =>
                new Date(row.visit_date).toLocaleDateString("th-TH"),
        },
        {
            key: "symptom",
            header: "อาการ",
        },
        {
            key: "diagnosis",
            header: "การวินิจฉัย",
        },
        {
            key: "status",
            header: "สถานะ",
            align: "center",
            render: (row) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                    {row.status === "completed" ? "เสร็จสิ้น" : "ร่าง"}
                </span>
            ),
        },
        {
            key: "action",
            header: "จัดการ",
            align: "center",
            render: (row) => (
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedTreatmentId(row.visit_id);
                            setOpenView(true);
                        }}
                        className="text-primary hover:opacity-70"
                        title="ดู"
                    >
                        <Eye size={18} />
                    </button>
                    {row.status === "draft" && (
                        <button
                            onClick={() => {
                                setSelectedTreatment(row);
                                setOpenEdit(true);
                            }}
                            className="text-blue-600 hover:opacity-70"
                            title="แก้ไข"
                        >
                            <Pencil size={18} />
                        </button>
                    )}
                    {row.status === "draft" && (
                        <button
                            onClick={() => handleDelete(row)}
                            className="text-red-600 hover:opacity-70"
                            title="ลบ"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = async (treatment: Treatment) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: `คุณต้องการลบข้อมูลการรักษาของ ${treatment.patient.first_name} ${treatment.patient.last_name} หรือไม่?`,
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
                await treatmentService.deleteTreatment(treatment.visit_id);
                Swal.fire({
                    title: "ลบสำเร็จ!",
                    text: "ข้อมูลการรักษาถูกลบแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
                fetchTreatments();
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
                        placeholder="ค้นหา (ชื่อ-สกุล, HN, เลขบัตร...)"
                        className="pl-10 h-10 bg-white"
                    />
                </div>

                {/* Add Button */}
                <Button
                    onClick={() => setOpenAdd(true)}
                    className="cursor-pointer"
                >
                    <Plus size={18} />
                    บันทึกการรักษา
                </Button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={treatments}
                rowKey={(row) => row.visit_id}
            />

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />

            {/* Add Treatment Modal */}
            <AddTreatmentModal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                onSuccess={() => {
                    setPage(1);
                    fetchTreatments();
                }}
            />

            {/* View Treatment Modal */}
            <ViewTreatmentModal
                open={openView}
                onClose={() => setOpenView(false)}
                treatmentId={selectedTreatmentId}
                onEdit={(treatment) => {
                    setOpenView(false);
                    setSelectedTreatment(treatment);
                    setOpenEdit(true);
                }}
                onSuccess={() => {
                    fetchTreatments();
                }}
            />

            {/* Edit Treatment Modal */}
            <EditTreatmentModal
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                treatment={selectedTreatment}
                onSuccess={() => {
                    fetchTreatments();
                }}
            />
        </div>
    );
}
