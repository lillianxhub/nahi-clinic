"use client";

import usePageTitle from "@/hooks/usePageTitle";

export default function ReportsPage() {
    usePageTitle("Reports");
    return (
        <div className="space-y-6">
            {/*Header*/}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold">รายงาน</h1>
            </div>
        </div>
    );
}
