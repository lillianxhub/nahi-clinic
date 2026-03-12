export const MEDICINE_ORDER_FIELDS = {
    name: "product_name",
    createdAt: "created_at",
} as const;

export const MEDICINE_INCLUDES = {
    category: true,
    lots: {
        select: {
            lot_id: true,
            qty_remaining: true,
            expire_date: true,
        },
    },
} as const;
