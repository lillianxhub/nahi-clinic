"use client";

import { useState } from "react";
import { X, Pill, Package, DollarSign, Calendar } from "lucide-react";
import { medicineService } from "@/services/medicine";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: "",
    quantity: "",
    price: "",
    expiry_date: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await medicineService.createMedicine({
        medicine_name: formData.medicine_name,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        expiry_date: formData.expiry_date,
      });

      setFormData({
        medicine_name: "",
        quantity: "",
        price: "",
        expiry_date: "",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("สร้างยาไม่สำเร็จ", error);
      alert("เกิดข้อผิดพลาด: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isFormValid =
    formData.medicine_name.trim() &&
    formData.quantity &&
    formData.price &&
    formData.expiry_date;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-5 relative">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
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
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={formData.medicine_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Package size={16} className="text-primary" />
              ปริมาณ <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-primary" />
              ราคา <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="price"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              วันหมดอายุ <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="expiry_date"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={formData.expiry_date}
              onChange={handleChange}
              required
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-light px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
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
    </div>
  );
}