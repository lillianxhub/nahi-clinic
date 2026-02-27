"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Printer } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";
import DataTable, { Column } from "@/components/table/Table";
import Pagination from "@/components/Pagination";
import { Report } from "@/interface/report";
import { reportService } from "@/services/report";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  usePageTitle("Reports");

  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await reportService.getReports({
        page,
        pageSize: 10,
        q: debouncedSearch,
      });

      setReports(res.data);
      setTotalPages(res.meta.pagination.pageCount);
    } catch (error) {
      console.error("โหลดข้อมูลรายงานไม่สำเร็จ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchReports();
  }, [page, debouncedSearch]);

  const columns: Column<Report>[] = [
    {
      key: "patient_first_name",
      header: "ชื่อ-นามสกุล",
      render: (row) =>
        `${row.patient?.first_name} ${row.patient?.last_name}`,
    },
    {
      key: "visit_date",
      header: "วันที่รักษา",
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
      key: "drugs",
      header: "ยาที่จ่าย",
      render: (row) =>
        row.drugs?.map((drug) => drug.description).join(", ") || "-",
    },
    {
      key: "quantity",
      header: "จำนวณ",
      render: (row) =>
        row.drugs?.map((drug) => drug.quantity.toString()).join(", ") || "-",
    },
    {
      key: "action",
      header: "จัดการ",
      align: "center",
      render: (row) => (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push(`/reports/${row.visit_id}`)}
            className="text-primary hover:opacity-70"
            title="ดู"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => window.print()}
            className="text-blue-600 hover:opacity-70"
            title="พิมพ์"
          >
            <Printer size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">รายงาน</h1>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ป่วย..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary w-full"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={reports}
        rowKey={(row) => row.visit_id}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />
    </div>
  );
}
