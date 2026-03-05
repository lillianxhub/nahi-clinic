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
