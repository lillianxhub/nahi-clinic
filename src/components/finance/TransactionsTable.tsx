"use client";

import { useState } from "react";
import DataTable, { Column } from "@/components/table/Table";
import Pagination from "@/components/Pagination";
import Badge from "@/components/Badge";
import { Eye, Edit, Trash2 } from "lucide-react";

interface Transaction {
    id: number;
    date: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    status: string;
}

export default function TransactionsTable({ data }: { data: Transaction[] }) {
    const [page, setPage] = useState(1);

    const columns: Column<Transaction>[] = [
        { key: "date", header: "วันที่" },
        { key: "category", header: "หมวดหมู่" },
        { key: "description", header: "รายละเอียด" },
        {
            key: "amount",
            header: "จำนวนเงิน",
            align: "right",
            render: (row) =>
                `${row.type === "income" ? "+" : "-"}฿${row.amount.toLocaleString()}`
        },
        {
            key: "status",
            header: "สถานะ",
            align: "center",
            render: (row) =>
                row.status === "completed"
                    ? <Badge label="เสร็จสิ้น" variant="success" />
                    : <Badge label="รอดำเนินการ" variant="warning" />
        },
        {
            key: "actions",
            header: "จัดการ",
            align: "center",
            render: () => (
                <div className="flex justify-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-opacity-10 transition-colors cursor-pointer">
                        <Eye size={16} className="text-primary" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-opacity-10 transition-colors cursor-pointer">
                        <Edit size={16} className="text-blue-600" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-opacity-10 transition-colors cursor-pointer">
                        <Trash2 size={16} className="text-red-600" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                rowKey={(row) => row.id}
                page={page}
                pageSize={5}
            />

            <Pagination
                page={page}
                totalPages={Math.ceil(data.length / 5)}
                onChange={setPage}
            />
        </>
    );
}
