"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Search } from "lucide-react";
import { medicineService } from "@/services/medicine";
import { DrugLot, Medicine } from "@/interface/medicine";
import MedicineCard from "@/components/medicine/MedicineCard";
import MedicineLotModal from "@/components/medicine/MedicineLotModal";
import Pagination from "@/components/Pagination";

export default function MedicinesPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"all" | "normal" | "low">("all");
    const [openLot, setOpenLot] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState<Medicine | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lowStockTotal, setLowStockTotal] = useState(0);

    useEffect(() => {
        fetchMedicines();
    }, [page]);

    const fetchMedicines = async () => {
        try {
            const res = await medicineService.getMedicines({
                page,
                pageSize: 6,
                orderBy: "name",
                order: "asc",
            });
            setMedicines(res.data);
            setTotalPages(res.meta.pagination.pageCount);
            setLowStockTotal(res.summary?.lowStockCount ?? 0);
        } catch (error) {
            console.error("โหลดข้อมูลยาไม่สำเร็จ", error);
        } finally {
            setLoading(false);
        }
    };

    const withComputed = useMemo(() => {
        return medicines.map((m) => {
            const totalQty =
                m.lots?.reduce((sum, lot) => sum + lot.qty_remaining, 0) ?? 0;

            const nearestExpire =
                m.lots
                    ?.map((l) => new Date(l.expire_date))
                    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

            const isLowStock = totalQty <= 30;

            return {
                ...m,
                totalQty,
                nearestExpire,
                isLowStock,
            };
        });
    }, [medicines]);

    const filteredMedicines = withComputed.filter((m) => {
        if (search && !m.drug_name.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }

        if (status === "low" && !m.isLowStock) return false;
        if (status === "normal" && m.isLowStock) return false;

        return true;
    });

    const openLotModal = async (drug_id: string) => {
        try {
            const res = await medicineService.getMedicineDetail(drug_id);
            setSelectedDrug(res.data);
            setOpenLot(true);
        } catch (error) {
            console.error("โหลด lot ไม่สำเร็จ", error);
        }
    };

    const mapLotsWithStatus = (lots: DrugLot[]) => {
        const today = new Date();

        return lots.map((lot) => {
            const expireDate = new Date(lot.expire_date);
            const diffDays =
                (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

            let status: "normal" | "expiring" | "out_of_stock" | "expired" = "normal";

            if (diffDays < 0) {
                status = "expired";
            } else if (lot.qty_remaining === 0) {
                status = "out_of_stock";
            } else if (diffDays <= 30) {
                status = "expiring";
            }

            return {
                lot_id: lot.lot_id,
                lot_no: lot.lot_no,
                expire_date: lot.expire_date,
                qty_remaining: lot.qty_remaining,
                buy_price: lot.buy_price,
                status,
            };
        });
    };


    if (loading) {
        return <div className="p-6">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="space-y-6">

            {lowStockTotal > 0 && (
                <div className="bg-warning/20 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-black">
                            มียา {lowStockTotal} รายการ ที่ใกล้หมดหรือหมดแล้ว
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อยา..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-card w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value as "all" | "normal" | "low")
                    }
                    className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="normal">ปกติ</option>
                    <option value="low">ใกล้หมด</option>
                </select>

                <button
                    className="cursor-pointer ml-auto bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                    onClick={() => console.log("add medicine")}
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มยา
                </button>
            </div>

            <div className="space-y-3">
                {filteredMedicines.map((medicine) => (
                    <MedicineCard
                        key={medicine.drug_id}
                        medicine={medicine}
                        onClick={(id) => openLotModal(id)}
                        onEdit={(id) => console.log("edit", id)}
                        onDelete={(id) => console.log("delete", id)}
                    />
                ))}
            </div>

            {selectedDrug && (
                <MedicineLotModal
                    open={openLot}
                    onClose={() => setOpenLot(false)}
                    drugName={selectedDrug.drug_name}
                    lots={mapLotsWithStatus(selectedDrug.lots)}
                />
            )}

            {filteredMedicines.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200 mt-6">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        ไม่พบรายการยา
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                        ลองเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง
                    </p>
                </div>
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
            />

        </div >
    );
}
