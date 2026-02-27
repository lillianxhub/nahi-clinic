import React from "react";

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
            <table className="w-full border-collapse">
                {/* Header */}
                <thead>
                    <tr className="bg-[#3F7C87] text-white">
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className={`px-4 py-3 text-sm font-semibold
                  ${
                      col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                  }
                `}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <tr
                                key={rowKey(row)}
                                className={
                                    index % 2 === 0
                                        ? "bg-[#E6EFEF]"
                                        : "bg-white"
                                }
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={`px-4 py-3 text-sm
                    ${
                        col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                              ? "text-right"
                              : "text-left"
                    }
                  `}
                                    >
                                        {col.render
                                            ? col.render(row)
                                            : (row as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-muted text-sm bg-white"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
