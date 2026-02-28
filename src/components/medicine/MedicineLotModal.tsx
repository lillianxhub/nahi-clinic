"use client";

import { useState, useEffect } from "react";
import { X, Pencil, Check, Search, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useDebounce } from "use-debounce";
import Badge from "../Badge";
import { medicineService } from "@/services/medicine";
import { DrugLot } from "@/interface/medicine";
import Pagination from "../Pagination";
import Swal from "sweetalert2";

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
    const [sort, setSort] = useState("expire_date_asc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Edit state
    const [editingLotId, setEditingLotId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        qty_remaining: string;
        expire_date: string;
    }>({ qty_remaining: "", expire_date: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPage(1);
    }, [debouncedSearch, status, sort, open]);

    useEffect(() => {
        if (open && drugId) {
            fetchLots();
        }
    }, [page, debouncedSearch, status, sort, open, drugId]);

    const fetchLots = async () => {
        if (!drugId) return;
        try {
            setLoading(true);
            const orderBy = sort.replace(/_(asc|desc)$/, "");
            const orderType = sort.endsWith("desc") ? "desc" : "asc";

            const res = await medicineService.getMedicineLots(drugId, {
                page,
                pageSize: 5,
                ...(debouncedSearch && { q: debouncedSearch }),
                ...(status !== "all" && { status }),
                orderBy,
                orderType,
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
        setEditForm({
            qty_remaining: String(lot.qty_remaining),
            expire_date: new Date(lot.expire_date).toISOString().split("T")[0],
        });
    };

    const handleSaveQty = async (lot_id: string) => {
        try {
            setSaving(true);
            await medicineService.updateLotDetails(lot_id, {
                qty_remaining: Number(editForm.qty_remaining),
                expire_date: editForm.expire_date,
            });
            setEditingLotId(null);
            fetchLots();
            onRefresh?.();
        } catch (error) {
            console.error("บันทึกข้อมูลไม่สำเร็จ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล Lot ยา");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLot = async (lot_id: string, lot_no: string | null) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบ Lot ยา?",
            html: `คุณกำลังจะลบ Lot <b>${lot_no || "-"}</b><br/><br/><span class="text-sm text-red-500">การกระทำนี้จะไม่สามารถย้อนกลับได้ และข้อมูลที่เชื่อมโยงกับ Lot นี้จะถูกลบไปด้วย</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ลบข้อมูล",
            cancelButtonText: "ยกเลิก",
        });

        if (confirm.isConfirmed) {
            try {
                setLoading(true);
                await medicineService.deleteLot(lot_id);
                Swal.fire("สำเร็จ!", "ลบ Lot ยาเรียบร้อยแล้ว", "success");
                await fetchLots();
                onRefresh?.();
            } catch (error: any) {
                console.error("ลบ Lot ไม่สำเร็จ", error);
                Swal.fire("เกิดข้อผิดพลาด", error.message || "ไม่สามารถลบ Lot ยาได้", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSort = (column: string) => {
        if (sort.startsWith(column)) {
            setSort(sort.endsWith("asc") ? `${column}_desc` : `${column}_asc`);
        } else {
            setSort(`${column}_asc`);
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
                        onChange={(e) => setStatus(e.target.value as "all" | "normal" | "expiring" | "out_of_stock" | "expired")}
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
                                    <th
                                        className="py-3 px-2 cursor-pointer hover:text-gray-700 select-none group"
                                        onClick={() => handleSort("lot_no")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Lot No.
                                            <span className="text-gray-400 transition-colors">
                                                {sort === "lot_no_asc" ? <ArrowUp size={14} className="text-primary" /> : sort === "lot_no_desc" ? <ArrowDown size={14} className="text-primary" /> : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        className="py-3 cursor-pointer hover:text-gray-700 select-none group"
                                        onClick={() => handleSort("expire_date")}
                                    >
                                        <div className="flex items-center gap-1">
                                            หมดอายุ
                                            <span className="text-gray-400 transition-colors">
                                                {sort === "expire_date_asc" ? <ArrowUp size={14} className="text-primary" /> : sort === "expire_date_desc" ? <ArrowDown size={14} className="text-primary" /> : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        className="py-3 cursor-pointer hover:text-gray-700 select-none group"
                                        onClick={() => handleSort("qty_remaining")}
                                    >
                                        <div className="flex items-center gap-1">
                                            คงเหลือ
                                            <span className="text-gray-400 transition-colors">
                                                {sort === "qty_remaining_asc" ? <ArrowUp size={14} className="text-primary" /> : sort === "qty_remaining_desc" ? <ArrowDown size={14} className="text-primary" /> : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />}
                                            </span>
                                        </div>
                                    </th>
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
                                                {editingLotId === lot.lot_id ? (
                                                    <input
                                                        type="date"
                                                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        value={editForm.expire_date}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                expire_date: e.target.value,
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    lot.expire_date
                                                        .toString()
                                                        .split("T")[0]
                                                )}
                                            </td>
                                            <td className="py-3">
                                                {editingLotId === lot.lot_id ? (
                                                    <input
                                                        type="number"
                                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        value={editForm.qty_remaining}
                                                        min="0"
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                qty_remaining: e.target.value,
                                                            })
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
                                                <div className="flex justify-end gap-2">
                                                    {editingLotId === lot.lot_id ? (
                                                        <button
                                                            onClick={() =>
                                                                handleSaveQty(
                                                                    lot.lot_id,
                                                                )
                                                            }
                                                            disabled={saving}
                                                            className="cursor-pointer p-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
                                                            title="บันทึก"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleStartEdit(lot)
                                                            }
                                                            className="cursor-pointer p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                                                            title="แก้ไขข้อมูล"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteLot(lot.lot_id, lot.lot_no)}
                                                        className="cursor-pointer p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors"
                                                        title="ลบ Lot"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
