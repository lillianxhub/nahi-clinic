"use client";

import { Edit2, Eye, Trash2 } from "lucide-react";
import { Medicine } from "@/interface/medicine";
import { useState } from "react";
import { medicineService } from "@/services/medicine";
import { formatLocalDate } from "@/utils/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    medicine: Medicine;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function MedicineCard({
    medicine,
    onView,
    onEdit,
    onDelete,
}: Props) {
    const minQuantity = medicine.min_stock;

    const totalQuantity =
        medicine.lots?.reduce((sum, lot) => sum + lot.qty_remaining, 0) ?? 0;

    const nearestExpire =
        medicine.lots
            ?.filter((lot) => lot.qty_remaining > 0)
            .map((lot) => new Date(lot.expire_date))
            .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    const isOutOfStock = totalQuantity === 0;

    const isLowStock = totalQuantity > 0 && totalQuantity <= minQuantity;

    const isOutOfDate = nearestExpire && nearestExpire < new Date();

    const isExpiringSoon =
        nearestExpire &&
        nearestExpire >= new Date() &&
        nearestExpire <=
            new Date(new Date().setDate(new Date().getDate() + 30));

    const isInactive = medicine.status === "inactive";

    const getBackgroundColor = () => {
        if (isInactive) return "bg-gray-100 border-gray-200";
        if (isOutOfDate) return "bg-danger/10 border-danger/20";
        if (isOutOfStock) return "bg-danger/10 border-danger/20";
        if (isExpiringSoon) return "bg-orange-50 border-orange-200";
        if (isLowStock) return "bg-warning/10 border-warning/20";
        return "bg-card border-border";
    };

    const getStatusVariant = () => {
        if (isInactive) return "outline";
        if (isOutOfDate) return "error";
        if (isOutOfStock) return "error";
        if (isExpiringSoon) return "warning";
        if (isLowStock) return "warning";
        return "success";
    };

    const getStatusText = () => {
        if (isInactive) return "ระงับการใช้งาน";
        if (isOutOfDate) return "หมดอายุ";
        if (isOutOfStock) return "หมด";
        if (isExpiringSoon) return "ใกล้หมดอายุ";
        if (isLowStock) return "ต่ำ";
        return "ปกติ";
    };

    return (
        <Card
            className={cn(
                "transition-shadow border p-0 overflow-hidden",
                getBackgroundColor(),
            )}
        >
            <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                    {/* ===== Name & Status ===== */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge
                            variant={getStatusVariant() as any}
                            className="h-6"
                        >
                            {getStatusText()}
                        </Badge>

                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {medicine.drug_name}
                        </h3>
                    </div>

                    {/* ===== Info ===== */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:flex md:items-center md:gap-8">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">
                                คงเหลือ
                            </p>
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
                            <p className="text-xs text-gray-500 mb-1">
                                หมดอายุ
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                                {nearestExpire
                                    ? formatLocalDate(nearestExpire)
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    {/* ===== Actions ===== */}
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView?.(medicine.drug_id);
                            }}
                            className="cursor-pointer text-primary hover:text-primary/70"
                            title="ดูรายการ Lot"
                        >
                            <Eye className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(medicine.drug_id);
                            }}
                            className="cursor-pointer text-blue-600 hover:text-blue-600/70"
                            title="แก้ไขข้อมูลยา"
                        >
                            <Edit2 className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(medicine.drug_id);
                            }}
                            className="cursor-pointer text-red-600 hover:text-red-600/70"
                            title="ลบยา"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
