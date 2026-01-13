"use client";

import { X } from "lucide-react";
import Badge from "../Badge";

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
}: Props) {
    if (!open) return null;

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
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map((lot) => (
                                <tr key={lot.lot_id} className="border-b last:border-none">
                                    <td className="py-2">{lot.lot_no}</td>
                                    <td>{lot.expire_date.toString().split("T")[0]}</td>
                                    <td>{lot.qty_remaining}</td>
                                    <td>
                                        {(() => {
                                            const badge = getLotBadge(lot.status);
                                            return <Badge label={badge.label} variant={badge.variant} />;
                                        })()}
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
