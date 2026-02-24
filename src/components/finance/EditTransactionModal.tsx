"use client";

import { useState, useEffect } from "react";
import {
    X,
    DollarSign,
    Calendar,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Tag,
    CreditCard,
    Save,
    Loader2,
} from "lucide-react";
import {
    TransactionItem,
    Income,
    Expense,
    CreateIncomePayload,
    CreateExpensePayload,
} from "@/interface/finance";
import { financeService } from "@/services/finance";

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionItem | null;
    onSuccess: () => void;
}

export default function EditTransactionModal({
    isOpen,
    onClose,
    transaction,
    onSuccess,
}: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && transaction) {
            fetchDetails();
        }
    }, [isOpen, transaction]);

    const fetchDetails = async () => {
        if (!transaction) return;
        setFetching(true);
        try {
            if (transaction.type === "income") {
                const res = await financeService.getIncomeById(transaction.id);
                setFormData({
                    ...res,
                    date: new Date(res.income_date).toISOString().split("T")[0],
                    amount: Number(res.amount),
                });
            } else {
                const res = await financeService.getExpenseById(transaction.id);
                setFormData({
                    ...res,
                    date: new Date(res.expense_date)
                        .toISOString()
                        .split("T")[0],
                    amount: Number(res.amount),
                });
            }
        } catch (error) {
            console.error("Failed to fetch details:", error);
            alert("ไม่สามารถดึงข้อมูลรายการได้");
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction || !formData) return;

        setLoading(true);
        try {
            if (transaction.type === "income") {
                const payload: Partial<CreateIncomePayload> = {
                    income_date: new Date(formData.date).toISOString(),
                    amount: Number(formData.amount),
                    payment_method: formData.payment_method,
                    receipt_no: formData.receipt_no,
                };
                await financeService.updateIncome(transaction.id, payload);
            } else {
                const payload: Partial<CreateExpensePayload> = {
                    expense_date: new Date(formData.date).toISOString(),
                    expense_type: formData.expense_type,
                    amount: Number(formData.amount),
                    description: formData.description,
                    receipt_no: formData.receipt_no,
                };
                await financeService.updateExpense(transaction.id, payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update transaction:", error);
            alert("ไม่สามารถบันทึกข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !transaction) return null;

    const isIncome = transaction.type === "income";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <FileText className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                แก้ไขรายการ
                            </h2>
                            <p className="text-white/80 text-sm">
                                {isIncome ? "รายรับ" : "รายจ่าย"} •{" "}
                                {transaction.id}
                            </p>
                        </div>
                    </div>
                </div>

                {fetching ? (
                    <div className="p-20 flex justify-center flex-col items-center gap-4">
                        <Loader2
                            className="animate-spin text-primary"
                            size={40}
                        />
                        <p className="text-muted text-sm animate-pulse">
                            กำลังดึงข้อมูล...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Date */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Calendar
                                        size={16}
                                        className="text-primary"
                                    />
                                    วันที่{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={formData?.date || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            {/* Type Specific Fields */}
                            {isIncome ? (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <CreditCard
                                            size={16}
                                            className="text-primary"
                                        />
                                        วิธีการชำระเงิน{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData?.payment_method || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                payment_method: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="cash">เงินสด</option>
                                        <option value="transfer">
                                            เงินโอน
                                        </option>
                                        <option value="credit">
                                            บัตรเครดิต
                                        </option>
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Tag
                                            size={16}
                                            className="text-primary"
                                        />
                                        หมวดหมู่รายการ{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData?.expense_type || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                expense_type: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="drug">
                                            ค่ายา/เวชภัณฑ์
                                        </option>
                                        <option value="utility">
                                            ค่าเช่า/สาธารณูปโภค
                                        </option>
                                        <option value="general">
                                            ค่าใช้จ่ายอื่นๆ
                                        </option>
                                    </select>
                                </div>
                            )}

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <DollarSign
                                        size={16}
                                        className="text-primary"
                                    />
                                    จำนวนเงิน (บาท){" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="0.00"
                                    value={formData?.amount || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            {/* Description (Only for Expense) */}
                            {!isIncome && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        รายละเอียด
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                        rows={3}
                                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                        value={formData?.description || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            {/* Receipt No */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-primary"
                                    />
                                    เลขที่ใบเสร็จ (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="ระบุเลขที่ใบเสร็จ"
                                    value={formData?.receipt_no || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            receipt_no: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        บันทึกการแก้ไข
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
