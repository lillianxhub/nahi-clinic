import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function generateReceiptNo(
    category_name: string,
    index?: number,
): string {
    const timestamp = Date.now();
    let prefix = "RC-OTH";

    switch (category_name) {
        case "ค่าบริการ":
            prefix = "RC-PROC";
            break;
        case "ค่ายา":
            prefix = "RC-DRUG";
            break;
        case "รายได้อื่นๆ":
            prefix = "RC-OTH";
            break;
    }

    const suffix = index !== undefined ? `-${index}` : "";
    return `${prefix}-${timestamp}${suffix}`;
}

export function calculateAge(birthDate: Date, visitDate: Date) {
    let y = visitDate.getFullYear() - birthDate.getFullYear();
    let m = visitDate.getMonth() - birthDate.getMonth();
    let d = visitDate.getDate() - birthDate.getDate();

    if (d < 0) {
        m -= 1;
        const lastMonth = new Date(
            visitDate.getFullYear(),
            visitDate.getMonth(),
            0,
        );
        d += lastMonth.getDate();
    }
    if (m < 0) {
        y -= 1;
        m += 12;
    }

    return {
        years: Math.max(0, y),
        months: Math.max(0, m),
        days: Math.max(0, d),
    };
}

export function formatAge(years: number, months: number, days: number): string {
    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (years === 0 && months === 0 && days >= 0) {
        parts.push(`${days} วัน`);
    } else if (days > 0) {
        parts.push(`${days} วัน`);
    }

    return parts.length > 0 ? parts.join(" ") : "0 วัน";
}
