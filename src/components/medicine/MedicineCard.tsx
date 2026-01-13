"use client";

import { Edit2, Trash2 } from "lucide-react";
import { Medicine } from "@/interface/medicine";
import { useState } from "react";
import { medicineService } from "@/services/medicine";

type Props = {
    medicine: Medicine;
    onClick?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function MedicineCard({
    medicine,
    onEdit,
    onDelete,
    onClick,
}: Props) {
    const totalQuantity =
        medicine.lots?.reduce((sum, lot) => sum + lot.qty_remaining, 0) ?? 0;

    const nearestExpire =
        medicine.lots
            ?.map((lot) => new Date(lot.expire_date))
            .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    const isOutOfStock = totalQuantity === 0;
    const isLowStock = totalQuantity > 0 && totalQuantity <= 30;

    const getBackgroundColor = () => {
        if (isOutOfStock) return "bg-danger/15 border-red-200";
        if (isLowStock) return "bg-warning/15 border-yellow-200";
        return "bg-bg-card border-border";
    };

    const getStatusColor = () => {
        if (isOutOfStock) {
            return "bg-red-100 text-red-800 border-red-200";
        }
        if (isLowStock) {
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
        return "bg-green-100 text-green-800 border-green-200";
    };

    const getStatusText = () => {
        if (isOutOfStock) return "หมด";
        if (isLowStock) return "ต่ำ";
        return "ปกติ";
    };

    return (
        <div
            className={`cursor-pointer bg-card rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border ${getBackgroundColor()}`}
            onClick={() => onClick?.(medicine.drug_id)}
        >
            <div
                className="
          flex flex-col gap-4
          md:flex-row md:items-center md:justify-between md:gap-6
        "
            >
                {/* ===== Name & Status ===== */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
                    >
                        {getStatusText()}
                    </span>

                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {medicine.drug_name}
                    </h3>
                </div>

                {/* ===== Info ===== */}
                <div
                    className="
            grid grid-cols-2 gap-4
            sm:grid-cols-3
            md:flex md:items-center md:gap-8
          "
                >
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">คงเหลือ</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {totalQuantity} {medicine.unit}
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">ราคา</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {medicine.sell_price} ฿
                        </p>
                    </div>

                    <div className="text-center col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 mb-1">หมดอายุ</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {nearestExpire
                                ? nearestExpire.toISOString().split("T")[0]
                                : "-"}
                        </p>
                    </div>
                </div>

                {/* ===== Actions ===== */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onEdit?.(medicine.drug_id)}
                        className="cursor-pointer p-2 hover:bg-teal-50 text-primary rounded-lg transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => onDelete?.(medicine.drug_id)}
                        className="cursor-pointer p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
