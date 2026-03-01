"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
    );
}

export function FieldGroup({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-4", className)}>
            {children}
        </div>
    );
}

export function FieldLabel({
    children,
    className,
    htmlFor,
}: {
    children: React.ReactNode;
    className?: string;
    htmlFor?: string;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className={cn(
                "text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 px-0.5",
                className,
            )}
        >
            {children}
        </label>
    );
}
