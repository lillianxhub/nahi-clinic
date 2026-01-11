"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error";

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    message,
    type,
    onClose,
    duration = 3000,
}: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div
            className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-3
        px-4 py-3 rounded-lg shadow-lg
        text-white
        ${type === "success"
                    ? "bg-green-600"
                    : "bg-red-600"
                }
      `}
        >
            <span className="text-sm">{message}</span>

            <button
                onClick={onClose}
                className="hover:opacity-80 cursor-pointer"
                aria-label="Close toast"
            >
                <X size={16} />
            </button>
        </div>
    );
}
