"use client";

import { X, Calendar, Package, DollarSign, ArchiveRestore } from "lucide-react";
import { formatLocalDate } from "@/utils/dateUtils";
import { DrugLot } from "@/interface/medicine";

interface LotModalProps {
    open: boolean;
    onClose: () => void;
    lot: DrugLot | any | null;
    drugName: string;
}

export default function LotModal({
    open,
    onClose,
    lot,
    drugName,
}: LotModalProps) {
    if (!open || !lot) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            รายละเอียด Lot: {lot.lot_no || "-"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {drugName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            ซัพพลายเออร์
                        </label>
                        <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                            {lot.supplier.supplier_name}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Package size={16} className="text-gray-400" />
                            Lot Number
                        </label>
                        <p className="text-base font-semibold text-gray-900 border border-gray-100 bg-gray-50 rounded-lg px-3 py-2">
                            {lot.lot_no || "-"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <Calendar size={16} className="text-gray-400" />
                                วันที่รับเข้า
                            </label>
                            <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                                {lot.received_date
                                    ? new Date(
                                          lot.received_date,
                                      ).toLocaleDateString("th-TH")
                                    : "ไม่ระบุ"}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <Calendar
                                    size={16}
                                    className="text-orange-400"
                                />
                                วันหมดอายุ
                            </label>
                            <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                                {lot.expire_date
                                    ? new Date(
                                          lot.expire_date,
                                      ).toLocaleDateString("th-TH")
                                    : "ไม่ระบุ"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <ArchiveRestore
                                    size={16}
                                    className="text-gray-400"
                                />
                                จำนวนรับเข้า
                            </label>
                            <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                                {lot.qty_received?.toLocaleString() || "0"}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <Package size={16} className="text-primary" />
                                <span
                                    className={
                                        lot.qty_remaining === 0
                                            ? "text-red-500 font-semibold"
                                            : ""
                                    }
                                >
                                    จำนวนคงเหลือ
                                </span>
                            </label>
                            <p
                                className={`text-base font-bold border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 ${lot.qty_remaining === 0 ? "text-red-600 border-red-100 bg-red-50" : "text-primary"}`}
                            >
                                {lot.qty_remaining?.toLocaleString() || "0"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <DollarSign
                                    size={16}
                                    className="text-gray-400"
                                />
                                ต้นทุนต่อหน่วย
                            </label>
                            <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                                ฿
                                {Number(lot.buy_price || 0).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    },
                                )}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <DollarSign
                                    size={16}
                                    className="text-gray-400"
                                />
                                มูลค่าต้นทุนคงเหลือ
                            </label>
                            <p className="text-base text-gray-900 border border-gray-100 rounded-lg px-3 py-2">
                                ฿
                                {Number(
                                    (lot.qty_remaining || 0) *
                                        (lot.buy_price || 0),
                                ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                    </div>
                    {/* Additional fields like Supplier can be added here if available in the API response */}
                </div>

                {/* Footer */}
                <div className="bg-light px-6 py-4 flex justify-end border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
}
