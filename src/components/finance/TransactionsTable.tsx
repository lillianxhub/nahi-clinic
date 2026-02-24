"use client";

import { useState } from "react";
import DataTable, { Column } from "@/components/table/Table";
import Pagination from "@/components/Pagination";
import Badge from "@/components/Badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import ViewTransactionModal from "./ViewTransactionModal";
import EditTransactionModal from "./EditTransactionModal";
import Swal from "sweetalert2";
import { financeService } from "@/services/finance";
import { TransactionItem } from "@/interface/finance";

interface TransactionsTableProps {
    data: TransactionItem[];
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    pageSize?: number;
}

export default function TransactionsTable({
    data,
    currentPage,
    total,
    onPageChange,
    onRefresh,
    pageSize = 10,
}: TransactionsTableProps) {
    const [viewTransaction, setViewTransaction] =
        useState<TransactionItem | null>(null);
    const [editTransaction, setEditTransaction] =
        useState<TransactionItem | null>(null);

    const handleDelete = async (transaction: TransactionItem) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: `คุณต้องการลบรายการธุกรรม "${transaction.category}" จำนวน ฿${Math.abs(transaction.amount).toLocaleString()} ใช่หรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3F7C87",
            cancelButtonColor: "#EF4444",
            confirmButtonText: "ยืนยันการลบ",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                if (transaction.type === "income") {
                    await financeService.deleteIncome(transaction.id);
                } else {
                    await financeService.deleteExpense(transaction.id);
                }

                await Swal.fire({
                    title: "ลบสำเร็จ!",
                    text: "ลบข้อมูลธุรกรรมเรียบร้อยแล้ว",
                    icon: "success",
                    confirmButtonColor: "#3F7C87",
                });

                onRefresh();
            } catch (error) {
                console.error("Failed to delete transaction:", error);
                await Swal.fire({
                    title: "เกิดข้อผิดพลาด!",
                    text: "ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                    icon: "error",
                    confirmButtonColor: "#3F7C87",
                });
            }
        }
    };

    const columns: Column<TransactionItem>[] = [
        { key: "date", header: "วันที่" },
        { key: "category", header: "หมวดหมู่" },
        { key: "description", header: "รายละเอียด" },
        {
            key: "amount",
            header: "จำนวนเงิน",
            align: "right",
            render: (row) =>
                `${row.type === "income" ? "+" : "-"}฿${Math.abs(row.amount).toLocaleString()}`,
        },
        {
            key: "status",
            header: "สถานะ",
            align: "center",
            render: (row) =>
                row.status === "เสร็จสิ้น" ? (
                    <Badge label="เสร็จสิ้น" variant="success" />
                ) : (
                    <Badge label="รอดำเนินการ" variant="warning" />
                ),
        },
        {
            key: "actions",
            header: "จัดการ",
            align: "center",
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setViewTransaction(row)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                        title="ดูรายละเอียด"
                    >
                        <Eye
                            size={16}
                            className="text-primary group-hover:scale-110 transition-transform"
                        />
                    </button>
                    <button
                        onClick={() => setEditTransaction(row)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                        title="แก้ไข"
                    >
                        <Edit
                            size={16}
                            className="text-blue-600 group-hover:scale-110 transition-transform"
                        />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                        title="ลบ"
                    >
                        <Trash2
                            size={16}
                            className="text-red-600 group-hover:scale-110 transition-transform"
                        />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <DataTable columns={columns} data={data} rowKey={(row) => row.id} />

            <Pagination
                page={currentPage}
                totalPages={Math.ceil(total / pageSize)}
                onChange={onPageChange}
            />

            <ViewTransactionModal
                isOpen={!!viewTransaction}
                onClose={() => setViewTransaction(null)}
                transaction={viewTransaction}
                onEdit={(t) => {
                    setViewTransaction(null);
                    setEditTransaction(t);
                }}
            />

            <EditTransactionModal
                isOpen={!!editTransaction}
                onClose={() => setEditTransaction(null)}
                transaction={editTransaction}
                onSuccess={onRefresh}
            />
        </>
    );
}
