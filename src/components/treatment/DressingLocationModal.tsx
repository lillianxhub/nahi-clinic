"use client";

import { useState, useEffect } from "react";
import { X, Activity, Plus } from "lucide-react";

interface DressingLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: string, price: number) => void;
}

export default function DressingLocationModal({
    isOpen,
    onClose,
    onConfirm,
}: DressingLocationModalProps) {
    const [location, setLocation] = useState("");
    const [price, setPrice] = useState(100);

    useEffect(() => {
        if (isOpen) {
            setLocation("");
            setPrice(100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Allow empty location if user just wants "Dressing" without specific location
        onConfirm(location.trim(), price);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                                ระบุตำแหน่งแผล
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                ตำแหน่งที่ทำหัตถการ (ถ้ามี)
                            </label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="เช่น แผลที่เข่าซ้าย, นิ้วกลางมือขวา"
                                className="w-full h-10 px-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <p className="text-[10px] text-muted italic">
                                * หากไม่ระบุจะแสดงเพียง "ล้างแผล (Dressing)"
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                ราคา (บาท)
                            </label>
                            <input
                                type="number"
                                placeholder="100"
                                min="0"
                                className="w-full h-10 px-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                value={price}
                                onChange={(e) =>
                                    setPrice(parseInt(e.target.value) || 0)
                                }
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-10 rounded-lg font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="flex-1 h-10 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                เพิ่มรายการ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
