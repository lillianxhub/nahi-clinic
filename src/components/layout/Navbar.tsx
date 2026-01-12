"use client";

import { usePathname } from "next/navigation";
import { PAGE_TITLES } from "@/constants/page-title";
import { UserCircle } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();

    const title = PAGE_TITLES[pathname] ?? "";

    return (
        <header
            className="h-25 bg-white border-b border-black/20 shadow-sm px-6 flex items-center justify-between"
        >
            {/* Left: Title */}
            <div>
                <h1 className="text-xl font-semibold text-black">
                    {title}
                </h1>
                <p className="text-sm text-muted hint">
                    นาฮีคลินิก - ระบบจัดการคลินิก
                </p>
            </div>

            {/* Right: User */}
            <div className="flex items-center gap-3">
                <UserCircle size={32} className="text-muted" />
            </div>
        </header>
    );
}
