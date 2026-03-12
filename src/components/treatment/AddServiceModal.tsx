"use client";

import { useState } from "react";
import { X, Activity } from "lucide-react";
import { serviceService } from "@/services/service";
import { Service } from "@/interface/service";
import swal from "sweetalert2";

interface AddServiceModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (service: Service) => void;
}

export default function AddServiceModal({
    open,
    onClose,
    onSuccess,
}: AddServiceModalProps) {
    const [formData, setFormData] = useState({
        service_name: "",
        price: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.service_name.trim() || !formData.price) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        const result = await swal.fire({
            title: "คุณต้องการสร้างบริการใหม่หรือไม่?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "var(--primary)",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "สร้าง",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            setError("");

            const service = await serviceService.createService({
                service_name: formData.service_name.trim(),
                price: Number(formData.price),
            });

            setFormData({ service_name: "", price: "" });
            onSuccess(service);

            await swal.fire({
                title: "สร้างบริการสำเร็จ",
                icon: "success",
                confirmButtonText: "ตกลง",
                timer: 1500,
                showConfirmButton: false,
            });

            onClose();
        } catch (err: any) {
            console.error("Failed to create service", err);
            setError(err.response?.data?.message || "ไม่สามารถสร้างบริการได้");

            swal.fire({
                title: "ไม่สามารถสร้างบริการได้",
                text: err.response?.data?.message || "",
                icon: "error",
                confirmButtonText: "ตกลง",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Activity className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            เพิ่มบริการใหม่
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-6 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={22} className="cursor-pointer" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            ชื่อบริการ <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="เช่น ล้างแผลเล็ก, เย็บแผล"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={formData.service_name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    service_name: e.target.value,
                                })
                            }
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            ราคา (บาท) <span className="text-danger">*</span>
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    price: e.target.value,
                                })
                            }
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-danger">{error}</p>}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !formData.service_name.trim() ||
                                !formData.price
                            }
                            className="px-8 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
