"use client";

import {
    X,
    DollarSign,
    Calendar,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Tag,
    Clock,
} from "lucide-react";
import { TransactionItem } from "@/interface/finance";

interface ViewTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionItem | null;
    onEdit?: (transaction: TransactionItem) => void;
}

export default function ViewTransactionModal({
    isOpen,
    onClose,
    transaction,
    onEdit,
}: ViewTransactionModalProps) {
    if (!isOpen || !transaction) return null;

    const isIncome = transaction.type === "income";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                            {isIncome ? (
                                <ArrowUpRight
                                    className="text-white"
                                    size={28}
                                />
                            ) : (
                                <ArrowDownRight
                                    className="text-white"
                                    size={28}
                                />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                รายละเอียดธุรกรรม
                            </h2>
                            <p className="text-white/80 text-sm">
                                {isIncome ? "รายรับ" : "รายจ่าย"} •{" "}
                                {transaction.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Amount Highlight */}
                    <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 italic">
                        <p className="text-sm text-muted font-medium mb-1 -translate-y-0.5">
                            จำนวนเงินสุทธิ
                        </p>
                        <p
                            className={`text-4xl font-black ${isIncome ? "text-primary" : "text-danger"}`}
                        >
                            {isIncome ? "+" : ""}฿
                            {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Transaction Date */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={12} className="text-primary" />
                                วันที่ทำรายการ
                            </label>
                            <p className="text-foreground font-medium">
                                {transaction.date}
                            </p>
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Tag size={12} className="text-primary" />
                                หมวดหมู่
                            </label>
                            <p className="text-foreground font-medium">
                                {transaction.category}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} className="text-primary" />
                                สถานะ
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                <p className="text-foreground font-medium">
                                    {transaction.status}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <FileText size={12} className="text-primary" />
                            รายละเอียด/บันทึก
                        </label>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-foreground leading-relaxed">
                                {transaction.description || "ไม่มีรายละเอียด"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        ปิด
                    </button>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(transaction)}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                        >
                            แก้ไขข้อมูล
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
