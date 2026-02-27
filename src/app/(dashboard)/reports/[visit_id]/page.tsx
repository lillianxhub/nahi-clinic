"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Report } from "@/interface/report";
import { reportService } from "@/services/report";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import usePageTitle from "@/hooks/usePageTitle";

export default function ReportDetailPage() {
  usePageTitle("รายละเอียดรายงาน");
  const router = useRouter();
  const params = useParams();
  const visit_id = params.visit_id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visit_id) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await reportService.getReports({
          pageSize: 1000,
        });

        // หา report ที่ตรงกับ visit_id
        const foundReport = res.data.find(r => r.visit_id === visit_id);
        if (foundReport) {
          setReport(foundReport);
        }
      } catch (error) {
        console.error("โหลดข้อมูลรายงานไม่สำเร็จ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [visit_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:opacity-70"
        >
          <ArrowLeft size={18} />
          กลับไป
        </button>
        <div className="text-lg text-red-600">ไม่พบข้อมูลรายงาน</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-primary hover:opacity-70"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">รายละเอียดรายงาน</h1>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Patient Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">ชื่อ-นามสกุล</p>
            <p className="font-semibold">
              {report.patient?.first_name} {report.patient?.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">วันที่รักษา</p>
            <p className="font-semibold">
              {new Date(report.visit_date).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr />

        {/* Medical Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">อาการ</p>
            <p className="font-semibold">
              {report.symptom || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">การวินิจฉัย</p>
            <p className="font-semibold">
              {report.diagnosis || "-"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr />

        {/* Medicines Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">ยาที่จ่าย</h2>
          {report.drugs && report.drugs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left px-4 py-2">ยา</th>
                    <th className="text-center px-4 py-2">จำนวณ</th>
                    <th className="text-right px-4 py-2">ราคาต่อหน่วย</th>
                    <th className="text-right px-4 py-2">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {report.drugs.map((drug, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{drug.description || "-"}</td>
                      <td className="text-center px-4 py-3">{drug.quantity}</td>
                      <td className="text-right px-4 py-3">฿{drug.unit_price}</td>
                      <td className="text-right px-4 py-3">
                        ฿{(drug.quantity * drug.unit_price).toLocaleString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">ไม่มีข้อมูลยา</p>
          )}
        </div>

        {/* Print Button */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            พิมพ์
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:opacity-90"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
