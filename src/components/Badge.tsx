import React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "default";

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

export default function Badge({
    label,
    variant = "default",
    className,
}: BadgeProps) {
    // Map existing variant names to shadcn variants if they differ
    const shadcnVariant = variant === "default" ? "outline" : variant;

    return (
        <ShadcnBadge variant={shadcnVariant as any} className={className}>
            {label}
        </ShadcnBadge>
    );
}
