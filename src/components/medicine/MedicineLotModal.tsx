"use client";

import { useState, useEffect } from "react";
import { X, Pencil, Check, Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import Badge from "../Badge";
import { medicineService } from "@/services/medicine";
import { DrugLot } from "@/interface/medicine";
import Pagination from "../Pagination";

type Props = {
    open: boolean;
    onClose: () => void;
    drugName: string;
    drugId?: string; // We'll need the ID to fetch now
    onRefresh?: () => void;
};

// Frontend status mapping for UI
const getLotStatusClient = (expire_date: string | Date, qty: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expire_date);

    const diffDays =
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "expired";
    if (qty === 0) return "out_of_stock";
    if (diffDays <= 30) return "expiring";
    return "normal";
};

const getLotBadge = (status: string) => {
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
    drugId,
    onRefresh,
}: Props) {
    const [lots, setLots] = useState<DrugLot[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 500);
    const [status, setStatus] = useState<
        "all" | "normal" | "expiring" | "out_of_stock" | "expired"
    >("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Edit qty state
    const [editingLotId, setEditingLotId] = useState<string | null>(null);
    const [editingQty, setEditingQty] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPage(1);
    }, [debouncedSearch, status, open]);

    useEffect(() => {
        if (open && drugId) {
            fetchLots();
        }
    }, [page, debouncedSearch, status, open, drugId]);

    const fetchLots = async () => {
        if (!drugId) return;
        try {
            setLoading(true);
            const res = await medicineService.getMedicineLots(drugId, {
                page,
                pageSize: 5,
                ...(debouncedSearch && { q: debouncedSearch }),
                ...(status !== "all" && { status }),
            });
            setLots(res.data);
            setTotalPages(res.meta?.pagination?.pageCount ?? 1);
        } catch (error) {
            console.error("Failed to load lots", error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const handleStartEdit = (lot: DrugLot) => {
        setEditingLotId(lot.lot_id);
        setEditingQty(String(lot.qty_remaining));
    };

    const handleSaveQty = async (lot_id: string) => {
        try {
            setSaving(true);
            await medicineService.updateLotQuantity(lot_id, Number(editingQty));
            setEditingLotId(null);
            fetchLots();
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
            <div className="bg-card rounded-xl w-full max-w-4xl p-6 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                        Lot ของยา: {drugName}
                    </h2>
                    <button onClick={onClose} className="cursor-pointer">
                        <X />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center mb-4">
                    <div className="relative flex-1 min-w-50">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหา Lot No..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm max-w-37.5"
                    >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="normal">ปกติ</option>
                        <option value="expiring">ใกล้หมดอายุ</option>
                        <option value="out_of_stock">หมดสต็อก</option>
                        <option value="expired">หมดอายุ</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-75">
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">
                            กำลังโหลดข้อมูล...
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left border-b font-medium text-gray-500">
                                    <th className="py-3 px-2">Lot No.</th>
                                    <th className="py-3">หมดอายุ</th>
                                    <th className="py-3">คงเหลือ</th>
                                    <th className="py-3">สถานะ</th>
                                    <th className="py-3 text-right pr-2">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            ไม่พบข้อมูล Lot
                                        </td>
                                    </tr>
                                ) : (
                                    lots.map((lot) => (
                                        <tr
                                            key={lot.lot_id}
                                            className="border-b last:border-none hover:bg-gray-50/50"
                                        >
                                            <td className="py-3 px-2 font-medium">
                                                {lot.lot_no}
                                            </td>
                                            <td className="py-3">
                                                {
                                                    lot.expire_date
                                                        .toString()
                                                        .split("T")[0]
                                                }
                                            </td>
                                            <td className="py-3">
                                                {editingLotId === lot.lot_id ? (
                                                    <input
                                                        type="number"
                                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        value={editingQty}
                                                        min="0"
                                                        onChange={(e) =>
                                                            setEditingQty(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <span
                                                        className={
                                                            lot.qty_remaining ===
                                                                0
                                                                ? "text-red-500 font-semibold"
                                                                : ""
                                                        }
                                                    >
                                                        {lot.qty_remaining}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                {(() => {
                                                    const clientStatus =
                                                        getLotStatusClient(
                                                            lot.expire_date,
                                                            lot.qty_remaining,
                                                        );
                                                    const badge =
                                                        getLotBadge(
                                                            clientStatus,
                                                        );
                                                    return (
                                                        <Badge
                                                            label={badge.label}
                                                            variant={
                                                                badge.variant
                                                            }
                                                        />
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 text-right pr-2">
                                                {editingLotId === lot.lot_id ? (
                                                    <button
                                                        onClick={() =>
                                                            handleSaveQty(
                                                                lot.lot_id,
                                                            )
                                                        }
                                                        disabled={saving}
                                                        className="cursor-pointer ml-auto p-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
                                                        title="บันทึก"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleStartEdit(lot)
                                                        }
                                                        className="cursor-pointer ml-auto p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                                                        title="แก้ไขจำนวน"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 border-t pt-4">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onChange={setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
