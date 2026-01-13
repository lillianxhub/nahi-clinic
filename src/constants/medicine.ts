export const MEDICINE_ORDER_FIELDS = {
  name: "drug_name",
  price: "sell_price",
  stock: "stock",
  createdAt: "drug_id",
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
