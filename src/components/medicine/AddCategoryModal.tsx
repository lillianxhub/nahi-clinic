"use client";

import { useState } from "react";
import { X, Tag } from "lucide-react";
import { medicineService } from "@/services/medicine";
import { DrugCategory } from "@/interface/medicine";
import swal from "sweetalert2";

interface AddCategoryModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (category: DrugCategory) => void;
    productType?: string;
}

export default function AddCategoryModal({
    open,
    onClose,
    onSuccess,
    productType = "drug",
}: AddCategoryModalProps) {
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await swal.fire({
            title: "คุณต้องการสร้างหมวดหมู่ใหม่หรือไม่?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "var(--primary)",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "สร้าง",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        if (!categoryName.trim()) return;

        try {
            setLoading(true);
            setError("");
            const res = await medicineService.createCategory(
                categoryName.trim(),
                productType,
            );
            setCategoryName("");
            onSuccess(res.data);

            await swal.fire({
                title: "สร้างหมวดหมู่สำเร็จ",
                icon: "success",
                confirmButtonText: "ตกลง",
                timer: 1000,
                showConfirmButton: false,
            });

            onClose();
        } catch (err) {
            console.error("Failed to create category", err);
            setError("ไม่สามารถสร้างหมวดหมู่ได้");

            swal.fire({
                title: "ไม่สามารถสร้างหมวดหมู่ได้",
                icon: "error",
                confirmButtonText: "ตกลง",
                timer: 1000,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-primary to-primary-light px-5 py-4 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Tag className="text-white" size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">
                            เพิ่มหมวดหมู่ใหม่
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} className="cursor-pointer" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            ชื่อหมวดหมู่ <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="เช่น ยาแก้ปวด, ยาปฏิชีวนะ"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && <p className="text-sm text-danger">{error}</p>}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !categoryName.trim()}
                            className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
