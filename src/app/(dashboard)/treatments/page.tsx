"use client";

import { Search } from "lucide-react";

export default function TreatmentsPage() {
    return (
        <div className="space-y-6">
            {/*Header*/}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                        type="text"
                        placeholder="ค้นหา..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button className="px-4 py-2 bg-btn-green/60 text-black rounded hover:bg-btn-green-hover/70 transition">บันทึกการรักษา</button>
            </div>
        </div>
    );
}
