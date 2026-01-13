import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export default function Pagination({
    page,
    totalPages,
    onChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: (number | "...")[] = [];

        if (page > 2) pages.push(1);
        if (page > 3) pages.push("...");

        for (
            let p = Math.max(1, page - 1);
            p <= Math.min(totalPages, page + 1);
            p++
        ) {
            pages.push(p);
        }

        if (page < totalPages - 2) pages.push("...");
        if (page < totalPages - 1) pages.push(totalPages);

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            {/* Prev */}
            <button
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40"
            >
                <ChevronLeft size={16} />
            </button>

            {getPages().map((p, i) =>
                p === "..." ? (
                    <span key={i} className="px-2 text-muted">
                        …
                    </span>
                ) : (
                    <button
                        key={`page-${p}-${i}`}
                        onClick={() => onChange(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm cursor-pointer
              ${p === page
                                ? "bg-primary text-white border-primary"
                                : "bg-white hover:bg-[#E6EFEF]"
                            }
            `}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next */}
            <button
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
