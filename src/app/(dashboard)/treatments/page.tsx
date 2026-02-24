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
import AddTreatmentModal from "@/components/treatment/AddTreatmentModal";

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
      key: "treatment_id",
      header: "รหัส",
      align: "center",
    },
    {
      key: "patient_first_name",
      header: "ชื่อ-นามสกุล",
      render: (row) =>
        `${row.patient?.first_name} ${row.patient?.last_name}`,
    },
    {
      key: "visit_date",
      header: "วันที่",
      align: "center",
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
      key: "action",
      header: "จัดการ",
      align: "center",
      render: (row) => (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push(`/treatments/${row.treatment_id}`)}
            className="text-primary hover:opacity-70"
            title="ดู"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => router.push(`/treatments/${row.treatment_id}/edit`)}
            className="text-blue-600 hover:opacity-70"
            title="แก้ไข"
          >
            <Pencil size={18} />
          </button>
          <button 
            onClick={() => {
              if (confirm("คุณต้องการลบการรักษานี้หรือไม่?")) {
                treatmentService.deleteTreatment(Number(row.treatment_id));
                fetchTreatments();
              }
            }}
            className="text-red-600 hover:opacity-70"
            title="ลบ"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

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
            placeholder="ค้นหา..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setOpenAdd(true)}
          className="cursor-pointer flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          บันทึกการรักษา
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={treatments}
        rowKey={(row) => row.treatment_id}
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
      
    </div>
  );
}