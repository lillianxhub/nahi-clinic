"use client";

import { useState, useEffect } from "react";
import { X, Pill, Tag, Layers, DollarSign, Package } from "lucide-react";
import { medicineService } from "@/services/medicine";
import { DrugCategory, Medicine } from "@/interface/medicine";

interface EditMedicineModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    medicine: Medicine | null;
}

export default function EditMedicineModal({
    open,
    onClose,
    onSuccess,
    medicine,
}: EditMedicineModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<DrugCategory[]>([]);
    const [formData, setFormData] = useState({
        product_name: "",
        product_type: "drug",
        category_id: "",
        unit: "",
        sell_price: "",
        min_stock: "",
        // status: "active" as "active" | "inactive",
        is_active: true,
    });

    useEffect(() => {
        if (open) {
            fetchCategories();
            if (medicine) {
                setFormData({
                    product_name: medicine.product_name,
                    product_type: medicine.product_type || "drug",
                    category_id: medicine.category?.category_id || "",
                    unit: medicine.unit,
                    sell_price: String(medicine.sell_price),
                    min_stock: String(medicine.min_stock || 0),
                    is_active: medicine.is_active,
                });
            }
        }
    }, [open, medicine]);

    const fetchCategories = async () => {
        try {
            const response = await medicineService.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "is_active" ? value === "true" : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medicine) return;

        try {
            setLoading(true);

            await medicineService.updateMedicine(medicine.product_id, {
                product_name: formData.product_name,
                product_type: formData.product_type,
                category_id: formData.category_id,
                unit: formData.unit,
                sell_price: Number(formData.sell_price),
                min_stock: Number(formData.min_stock),
                is_active: formData.is_active,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("แก้ไขยาไม่สำเร็จ", error);
            alert("เกิดข้อผิดพลาด: " + String(error));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isFormValid =
        formData.product_name.trim() &&
        formData.category_id &&
        formData.unit.trim() &&
        Number(formData.sell_price) > 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Pill className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                แก้ไขข้อมูลยา
                            </h2>
                            <p className="text-white/80 text-sm">
                                อัปเดตข้อมูลรายละเอียดของยา
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={22} className="cursor-pointer" />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto"
                >
                    {/* Drug Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Pill size={16} className="text-primary" />
                            ชื่อยา <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="product_name"
                            placeholder="กรอกชื่อยา"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={formData.product_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Tag size={16} className="text-primary" />
                                หมวดหมู่ <span className="text-danger">*</span>
                            </label>
                            <select
                                name="category_id"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                                value={formData.category_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">เลือกหมวดหมู่</option>
                                {categories.map((cat) => (
                                    <option
                                        key={cat.category_id}
                                        value={cat.category_id}
                                    >
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Type */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                ประเภทสินค้า <span className="text-danger">*</span>
                            </label>
                            <select
                                name="product_type"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                                value={formData.product_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="drug">ยา</option>
                                <option value="supply">เวชภัณฑ์</option>
                            </select>
                        </div>

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Unit */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Layers size={16} className="text-primary" />
                                หน่วยเรียก{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="unit"
                                placeholder="เช่น เม็ด, ขวด"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Sell Price */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <DollarSign
                                    size={16}
                                    className="text-primary"
                                />
                                ราคาขาย (ต่อหน่วย){" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                name="sell_price"
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.sell_price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Min Stock */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                จุดแจ้งเตือนสต็อกต่ำ
                            </label>
                            <input
                                type="number"
                                name="min_stock"
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.min_stock}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Tag size={16} className="text-primary" />
                            สถานะ
                        </label>
                        <div className="flex gap-4 p-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="is_active"
                                    value="true"
                                    checked={formData.is_active === true}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm">ใช้งานปกติ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="is_active"
                                    value="false"
                                    checked={formData.is_active === false}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm">ระงับการใช้งาน</span>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="bg-light px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                        onClick={handleSubmit}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                กำลังบันทึก...
                            </span>
                        ) : (
                            "อัปเดตข้อมูล"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
