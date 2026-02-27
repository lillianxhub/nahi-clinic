"use client";

import { useState, useEffect } from "react";
import {
    X,
    Pill,
    Package,
    DollarSign,
    Calendar,
    Tag,
    Layers,
} from "lucide-react";
import { medicineService } from "@/services/medicine";
import { DrugCategory } from "@/interface/medicine";
import AddCategoryModal from "@/components/medicine/AddCategoryModal";
import swal from "sweetalert2";

interface AddMedicineModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddMedicineModal({
    open,
    onClose,
    onSuccess,
}: AddMedicineModalProps) {
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<DrugCategory[]>([]);
    const getTodayStr = () => new Date().toISOString().split("T")[0];

    const generateLotNo = (dateStr: string) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `LOT-${year}${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        medicine_name: "",
        category_id: "",
        unit: "",
        quantity: "",
        buy_price: "",
        sell_price: "",
        received_date: getTodayStr(),
        expiry_date: "",
        lot_no: generateLotNo(getTodayStr()),
    });

    useEffect(() => {
        if (open) {
            fetchCategories();
            const today = getTodayStr();
            setFormData((prev) => ({
                ...prev,
                received_date: today,
                lot_no: generateLotNo(today),
            }));
        }
    }, [open]);

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

        if (name === "category_id" && value === "add_newCategory") {
            setShowAddCategory(true);
            return;
        }

        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            // Auto-update lot number if received_date changes
            if (name === "received_date") {
                newData.lot_no = generateLotNo(value);
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await swal.fire({
            title: "ยืนยันการเพิ่มยา",
            text: "คุณต้องการเพิ่มยานี้หรือไม่?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "var(--primary)",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "บันทึกยา",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);

            await medicineService.createMedicine({
                drug_name: formData.medicine_name,
                category_id: formData.category_id,
                unit: formData.unit,
                quantity: Number(formData.quantity),
                buy_price: Number(formData.buy_price),
                sell_price: Number(formData.sell_price),
                received_date: formData.received_date,
                expiry_date: formData.expiry_date,
                lot_no: formData.lot_no,
            });

            await swal.fire({
                title: "สร้างยาสำเร็จ",
                text: "ยาถูกสร้างเรียบร้อยแล้ว",
                icon: "success",
                confirmButtonText: "ตกลง",
                timer: 1000,
                showConfirmButton: false,
            });

            setFormData({
                medicine_name: "",
                category_id: "",
                unit: "",
                quantity: "",
                buy_price: "",
                sell_price: "",
                received_date: getTodayStr(),
                expiry_date: "",
                lot_no: generateLotNo(getTodayStr()),
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("สร้างยาไม่สำเร็จ", error);

            swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถเพิ่มยาได้",
                icon: "error",
                confirmButtonText: "ตกลง",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isFormValid =
        formData.medicine_name.trim() &&
        formData.category_id &&
        formData.unit.trim() &&
        formData.quantity &&
        formData.buy_price &&
        formData.sell_price &&
        formData.expiry_date;

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
                                เพิ่มยาใหม่
                            </h2>
                            <p className="text-white/80 text-sm">
                                กรอกข้อมูลยา
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
                    // onSubmit={handleSubmit}
                    className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto"
                >
                    {/* Medicine Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Pill size={16} className="text-primary" />
                            ชื่อยา <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="medicine_name"
                            placeholder="กรอกชื่อยา"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={formData.medicine_name}
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
                                <option
                                    value="add_newCategory"
                                    className="text-primary"
                                >
                                    + เพิ่มหมวดหมู่
                                </option>
                            </select>
                        </div>

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
                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                จำนวน <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>

                        {/* Lot No */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Package size={16} className="text-primary" />
                                เลขล็อต (Lot No.)
                            </label>
                            <input
                                type="text"
                                name="lot_no"
                                placeholder="ระบุเลขล็อต (ถ้าเว้นวางจะรันตามวันที่)"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.lot_no}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Buy Price */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <DollarSign
                                    size={16}
                                    className="text-primary"
                                />
                                ราคาทุน (ต่อหน่วย){" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                name="buy_price"
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.buy_price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

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
                    </div>

                    {/* Expiry Date */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Received Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                วันที่นำเข้า{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                name="received_date"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.received_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                วันหมดอายุ{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                name="expiry_date"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                required
                            />
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
                            "บันทึกข้อมูล"
                        )}
                    </button>
                </div>
            </div>
            <AddCategoryModal
                open={showAddCategory}
                onClose={() => {
                    setShowAddCategory(false);
                    setFormData({ ...formData, category_id: "" });
                }}
                onSuccess={() => fetchCategories()}
            />
        </div>
    );
}
