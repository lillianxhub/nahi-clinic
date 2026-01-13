import React from "react";
import clsx from "clsx";

export type BadgeVariant =
    | "success"
    | "warning"
    | "error"
    | "info"
    | "default";

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    default: "bg-gray-100 text-gray-700",
};

export default function Badge({
    label,
    variant = "default",
    className,
}: BadgeProps) {
    return (
        <span
            className={clsx(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                variantClasses[variant],
                className
            )}
        >
            {label}
        </span>
    );
}
