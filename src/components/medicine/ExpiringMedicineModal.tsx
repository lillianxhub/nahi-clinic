"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { medicineService } from "@/services/medicine";
import { ExpiringLot } from "@/interface/medicine";
import Swal from "sweetalert2";
import { formatLocalDate } from "@/utils/dateUtils";

type Props = {
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
};

export default function ExpiringMedicineModal({ open, onClose, onRefresh }: Props) {
    const [lots, setLots] = useState<ExpiringLot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchExpiringLots();
        }
    }, [open]);

    const fetchExpiringLots = async () => {
        setLoading(true);
        try {
            // ดึงข้อมูลยาที่จะหมดอายุใน 30 วัน
            const res = await medicineService.getExpiringLots(30);
            setLots(res.data);
        } catch (error) {
            console.error("Failed to fetch expiring lots", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = async (lot: ExpiringLot) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการทำลายยา?",
            html: `คุณกำลังทำลายยา <b>${lot.drug.drug_name}</b> ล็อต <b>${lot.lot_no}</b><br/>จำนวนคงเหลือ ${lot.qty_remaining} ${lot.drug.unit}<br/><br/><span class="text-sm text-red-500">การกระทำนี้จะตัดยอดคงเหลือเป็น 0 และไม่สามารถแสดงยอดนี้ได้อีก</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ทำลายยา",
            cancelButtonText: "ยกเลิก"
        });

        if (confirm.isConfirmed) {
            try {
                await medicineService.discardDrugLot(lot.lot_id, "หมดอายุ/ทำลาย");
                Swal.fire("สำเร็จ!", "บันทึกการทำลายเรียบร้อยแล้ว", "success");
                fetchExpiringLots();
                onRefresh();
            } catch (error: any) {
                console.error("Discard detailed error:", error);
                Swal.fire("เกิดข้อผิดพลาด", error.message || "ไม่สามารถบันทึกการทำลายยาได้", "error");
            }
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">จัดการยาหมดอายุ (ภายใน 30 วัน)</h2>
                            <p className="text-sm text-gray-500">ตรวจสอบและทำลายลดสต๊อกของยาที่หมดอายุ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex justify-center p-10">กำลังโหลดข้อมูล...</div>
                    ) : lots.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">ไม่มียาที่ใกล้หมดอายุใน 30 วัน</div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">ชื่อยา</th>
                                        <th className="px-4 py-3">ล็อต</th>
                                        <th className="px-4 py-3">วันหมดอายุ</th>
                                        <th className="px-4 py-3 text-right">คงเหลือ</th>
                                        <th className="px-4 py-3 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lots.map((lot) => {
                                        const isExpired = new Date(lot.expire_date) < new Date();
                                        return (
                                            <tr key={lot.lot_id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{lot.drug.drug_name}</td>
                                                <td className="px-4 py-3 text-gray-500">{lot.lot_no || "-"}</td>
                                                <td className={`px-4 py-3 font-medium ${isExpired ? "text-red-600" : "text-yellow-600"}`}>
                                                    {formatLocalDate(new Date(lot.expire_date))}
                                                    {isExpired && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">หมดอายุแล้ว</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                    {lot.qty_remaining} <span className="text-gray-500 text-xs">{lot.drug.unit}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleDiscard(lot)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        ทำลายทิ้ง
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
