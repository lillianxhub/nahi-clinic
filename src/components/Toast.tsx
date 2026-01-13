"use client";

import { useEffect } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    title?: string;
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const toastConfig: Record<
    ToastType,
    {
        icon: React.ReactNode;
        container: string;
        title: string;
        titleColor: string;
        textColor: string;
    }
> = {
    success: {
        icon: <Check size={20} className="text-emerald-600" />,
        container: "bg-emerald-50 border border-emerald-500",
        title: "Success",
        titleColor: "text-emerald-600",
        textColor: "text-emerald-700",
    },
    warning: {
        icon: <AlertCircle size={20} className="text-amber-600" />,
        container: "bg-amber-50 border border-amber-500",
        title: "Warning",
        titleColor: "text-amber-600",
        textColor: "text-amber-700",
    },
    error: {
        icon: <X size={20} className="text-red-600" />,
        container: "bg-red-50 border border-red-500",
        title: "Error",
        titleColor: "text-red-600",
        textColor: "text-red-700",
    },
    info: {
        icon: <Info size={20} className="text-blue-600" />,
        container: "bg-blue-50 border border-blue-500",
        title: "Info",
        titleColor: "text-blue-600",
        textColor: "text-blue-700",
    },
};

export default function Toast({
    title,
    message,
    type,
    onClose,
    duration = 3000,
}: ToastProps) {
    const config = toastConfig[type];

    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div
                className={`
          flex items-start gap-3 p-4 rounded-lg shadow-sm
          bg-white
          ${config.container}
          min-w-[320px]
        `}
            >
                {config.icon}

                <div className="flex-1">
                    <p className={`font-medium ${config.titleColor}`}>
                        {title ?? config.title}
                    </p>
                    <p className={`text-sm mt-1 ${config.textColor}`}>
                        {message}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="text-muted hover:opacity-70 cursor-pointer"
                    aria-label="Close toast"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
