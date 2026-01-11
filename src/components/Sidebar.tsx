"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    Home,
    User,
    PlusSquare,
    Syringe,
    Wallet,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "จัดการผู้ป่วย", href: "/patients", icon: User },
    { label: "บันทึกการรักษา", href: "/treatments", icon: PlusSquare },
    { label: "คลังยา", href: "/medicines", icon: Syringe },
    { label: "การเงิน", href: "/finance", icon: Wallet },
    { label: "รายงาน", href: "/reports", icon: FileText },
    { label: "การตั้งค่า", href: "/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`min-h-screen bg-primary text-white flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}
        >
            <div className="px-4 h-25 border-b border-white/20 flex items-center justify-between">
                <div className="overflow-hidden">
                    <h1
                        className={`font-bold text-xl whitespace-nowrap transition-all ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}
                    >
                        นาฮีคลินิก
                    </h1>
                    {!collapsed && (
                        <p className="text-sm opacity-80">Nahi Clinic</p>
                    )}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto hover:bg-white/10 p-1 rounded"
                    aria-label="Toggle sidebar"
                >
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
            </div>

            <nav className="flex-1 px-2 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition
                                ${isActive
                                    ? "bg-secondary text-black"
                                    : "hover:bg-white/10"
                                }
                                ${collapsed ? "justify-center" : ""}
                            `}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-white/20">
                <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 mb-3 bg-white/20
                        ${collapsed ? "justify-center" : ""}
                    `}
                >
                    <User size={20} />
                    {!collapsed && (
                        <div className="text-sm leading-tight">
                        </div>
                    )}
                </div>

                <button
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 w-full cursor-pointer
                        ${collapsed ? "justify-center" : ""}
                    `}
                    title={collapsed ? "ออกจากระบบ" : undefined}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>ออกจากระบบ</span>}
                </button>
            </div>
        </aside>
    );
}
