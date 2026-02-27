"use client";

import { useState } from "react";
import { X, Pencil, Check } from "lucide-react";
import Badge from "../Badge";
import { medicineService } from "@/services/medicine";

type Lot = {
    lot_id: string;
    lot_no: string;
    expire_date: string;
    qty_remaining: number;
    buy_price: number;
    status: "normal" | "expiring" | "out_of_stock" | "expired";
};

type Props = {
    open: boolean;
    onClose: () => void;
    drugName: string;
    lots: Lot[];
    onRefresh?: () => void;
};

const getLotBadge = (status: Lot["status"]) => {
    switch (status) {
        case "expired":
            return { label: "หมดอายุ", variant: "error" as const };
        case "out_of_stock":
            return { label: "หมดสต็อก", variant: "error" as const };
        case "expiring":
            return { label: "ใกล้หมดอายุ", variant: "warning" as const };
        default:
            return { label: "ปกติ", variant: "success" as const };
    }
};

export default function MedicineLotModal({
    open,
    onClose,
    drugName,
    lots,
    onRefresh,
}: Props) {
    const [editingLotId, setEditingLotId] = useState<string | null>(null);
    const [editingQty, setEditingQty] = useState<string>("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleStartEdit = (lot: Lot) => {
        setEditingLotId(lot.lot_id);
        setEditingQty(String(lot.qty_remaining));
    };

    const handleSaveQty = async (lot_id: string) => {
        try {
            setSaving(true);
            await medicineService.updateLotQuantity(lot_id, Number(editingQty));
            setEditingLotId(null);
            onRefresh?.();
        } catch (error) {
            console.error("บันทึกจำนวนไม่สำเร็จ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกจำนวนยา");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl w-full max-w-3xl p-6 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Lot ของยา: {drugName}
                    </h2>
                    <button onClick={onClose} className="cursor-pointer">
                        <X />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2">Lot No.</th>
                                <th>หมดอายุ</th>
                                <th>คงเหลือ</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map((lot) => (
                                <tr
                                    key={lot.lot_id}
                                    className="border-b last:border-none"
                                >
                                    <td className="py-2">{lot.lot_no}</td>
                                    <td>
                                        {
                                            lot.expire_date
                                                .toString()
                                                .split("T")[0]
                                        }
                                    </td>
                                    <td>
                                        {editingLotId === lot.lot_id ? (
                                            <input
                                                type="number"
                                                className="w-20 border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={editingQty}
                                                min="0"
                                                onChange={(e) =>
                                                    setEditingQty(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        ) : (
                                            lot.qty_remaining
                                        )}
                                    </td>
                                    <td>
                                        {(() => {
                                            const badge = getLotBadge(
                                                lot.status,
                                            );
                                            return (
                                                <Badge
                                                    label={badge.label}
                                                    variant={badge.variant}
                                                />
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        {editingLotId === lot.lot_id ? (
                                            <button
                                                onClick={() =>
                                                    handleSaveQty(lot.lot_id)
                                                }
                                                disabled={saving}
                                                className="cursor-pointer p-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
                                                title="บันทึก"
                                            >
                                                <Check size={15} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleStartEdit(lot)
                                                }
                                                className="cursor-pointer p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                                                title="แก้ไขจำนวน"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
