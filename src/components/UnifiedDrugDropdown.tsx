import React from "react";
import { Medicine } from "@/interface/medicine";
import { Plus } from "lucide-react";

interface UnifiedDrugDropdownProps {
    isOpen: boolean;
    searchTerm: string;
    items: Medicine[];
    isSearching: boolean;
    displayMode: "inventory" | "category";
    onSelect: (medicine: Medicine) => void;
}

export default function UnifiedDrugDropdown({
    isOpen,
    searchTerm,
    items,
    isSearching,
    displayMode,
    onSelect,
}: UnifiedDrugDropdownProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {isSearching ? (
                <div className="p-4 text-center text-muted text-sm">
                    กำลังค้นหา...
                </div>
            ) : items.length > 0 ? (
                <div className="py-1">
                    {items.map((m) => (
                        <button
                            key={m.product_id}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                            onClick={() => onSelect(m)}
                        >
                            <div>
                                <div className="font-medium text-foreground group-hover:text-primary">
                                    {m.product_name}
                                </div>
                                <div className="text-xs text-muted">
                                    {displayMode === "inventory" ? (
                                        <>
                                            ราคา:{" "}
                                            {m.sell_price.toLocaleString()} บาท
                                            | คงเหลือ:{" "}
                                            {m.lots?.reduce(
                                                (sum, lot) =>
                                                    sum +
                                                    (lot.qty_remaining || 0),
                                                0,
                                            ) ?? 0}{" "}
                                            {m.unit}
                                        </>
                                    ) : (
                                        <>
                                            หมวดหมู่:{" "}
                                            {m.category?.category_name || "-"} |
                                            หน่วย: {m.unit}
                                        </>
                                    )}
                                </div>
                            </div>
                            <Plus
                                size={14}
                                className="text-gray-300 group-hover:text-primary"
                            />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center text-muted text-sm">
                    ไม่พบข้อมูลสินค้า
                </div>
            )}
        </div>
    );
}
