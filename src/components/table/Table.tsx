import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
    key: keyof T | string;
    header: string;
    align?: "left" | "center" | "right";
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    rowKey: (row: T) => string | number;
    page?: number;
    pageSize?: number;
    emptyMessage?: string;
}

export default function DataTable<T>({
    columns,
    data,
    rowKey,
    emptyMessage = "ไม่มีข้อมูล",
}: DataTableProps<T>) {
    return (
        <div className="overflow-hidden rounded-xl border border-[#E6EFEF] bg-white">
            <Table>
                <TableHeader className="bg-[#3F7C87]">
                    <TableRow className="hover:bg-transparent border-none">
                        {columns.map((col) => (
                            <TableHead
                                key={String(col.key)}
                                className={cn(
                                    "text-white font-semibold py-3 px-4 h-auto",
                                    col.align === "center" && "text-center",
                                    col.align === "right" && "text-right",
                                )}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <TableRow
                                key={rowKey(row)}
                                className={cn(
                                    "border-none hover:opacity-90 transition-opacity",
                                    index % 2 === 0
                                        ? "bg-[#E6EFEF]"
                                        : "bg-white",
                                )}
                            >
                                {columns.map((col) => (
                                    <TableCell
                                        key={String(col.key)}
                                        className={cn(
                                            "py-3 px-4",
                                            col.align === "center" &&
                                                "text-center",
                                            col.align === "right" &&
                                                "text-right",
                                        )}
                                    >
                                        {col.render
                                            ? col.render(row)
                                            : (row as any)[col.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-muted text-sm bg-white"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
