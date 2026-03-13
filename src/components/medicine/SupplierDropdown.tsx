import React from "react";
import { Plus } from "lucide-react";

interface SupplierDropdownProps {
    isOpen: boolean;
    searchTerm: string;
    items: any[];
    isSearching: boolean;
    onSelect: (supplier: any) => void;
    onAddNew: () => void;
}

export default function SupplierDropdown({
    isOpen,
    searchTerm,
    items,
    isSearching,
    onSelect,
    onAddNew,
}: SupplierDropdownProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {isSearching ? (
                <div className="p-4 text-center text-muted text-sm">
                    กำลังค้นหา...
                </div>
            ) : items.length > 0 ? (
                <div className="py-1">
                    {items.map((s) => (
                        <button
                            key={s.supplier_id}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                            onClick={() => onSelect(s)}
                        >
                            <div>
                                <div className="font-medium text-foreground group-hover:text-primary">
                                    {s.supplier_name}
                                </div>
                                <div className="text-xs text-muted">
                                    {s.contact !== "N/A" ? s.contact : "ไม่มีข้อมูลติดต่อ"}
                                </div>
                            </div>
                            <Plus
                                size={14}
                                className="text-gray-300 group-hover:text-primary"
                            />
                        </button>
                    ))}
                    
                    {searchTerm && (
                        <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-primary hover:bg-primary/5 flex items-center gap-2 text-sm font-medium transition-colors"
                                onClick={onAddNew}
                            >
                                <Plus size={16} />
                                เพิ่ม "{searchTerm}" เป็นซัพพลายเออร์ใหม่
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-2 text-center">
                    <div className="p-3 text-muted text-sm">
                        ไม่พบข้อมูลซัพพลายเออร์
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-primary hover:bg-primary/5 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-t border-gray-100 mt-1 pt-2"
                            onClick={onAddNew}
                        >
                            <Plus size={16} />
                            เพิ่มเป็นซัพพลายเออร์ใหม่
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
