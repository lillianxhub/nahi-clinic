"use client";

import { useState, useEffect } from "react";
import { X, Building } from "lucide-react";
import { medicineService } from "@/services/medicine";
import swal from "sweetalert2";

interface AddSupplierModalProps {
    open: boolean;
    initialData?: { supplier_name: string };
    onClose: () => void;
    onSuccess: (newSupplier: any) => void;
}

export default function AddSupplierModal({
    open,
    initialData,
    onClose,
    onSuccess,
}: AddSupplierModalProps) {
    const [loading, setLoading] = useState(false);
    const [supplierName, setSupplierName] = useState("");
    const [contact, setContact] = useState("");

    useEffect(() => {
        if (open) {
            setSupplierName(initialData?.supplier_name || "");
            setContact("");
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await medicineService.createSupplier(supplierName, contact);
            
            await swal.fire({
                title: "สำเร็จ",
                text: "เพิ่มซัพพลายเออร์เรียบร้อยแล้ว",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });

            onSuccess(res.data);
            onClose();
        } catch (error) {
            console.error("Failed to create supplier", error);
            swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถเพิ่มซัพพลายเออร์ได้ อาจมีชื่อนี้ในระบบแล้ว",
                icon: "error",
                confirmButtonText: "ตกลง",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div 
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header elements... */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Building className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">เพิ่มซัพพลายเออร์ใหม่</h2>
                            <p className="text-white/80 text-sm">กรอกข้อมูลซัพพลายเออร์</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            ชื่อซัพพลายเออร์ <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="เช่น บ.ยา จำกัด"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            ข้อมูลติดต่อ
                        </label>
                        <input
                            type="text"
                            placeholder="เบอร์โทรศัพท์ หรือที่อยู่"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={!supplierName.trim() || loading}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึกซัพพลายเออร์"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
