export interface MedicineStock {
    total: number;
    min: number;
    isLow: boolean;
    nearestExpire: string | null;
}

export interface DrugCategory {
    category_id: string;
    category_name: string;
}

export interface DrugLot {
    lot_id: string;
    lot_no: string;
    received_date: string;
    expire_date: string;
    qty_received: number;
    qty_remaining: number;
    buy_price: number;
}

export interface ExpiringLot extends DrugLot {
    drug: {
        drug_name: string;
        unit: string;
    };
}

export interface DrugAdjustment {
    adjustment_id: string;
    lot_id: string;
    quantity_lost: number;
    reason: string;
    created_at: string;
}

export interface Medicine {
    product_id: string;
    drug_name: string;
    unit: string;
    sell_price: number;
    status: "active" | "inactive";
    min_stock: number;
    category: DrugCategory;

    stock: MedicineStock;

    lots: DrugLot[];
}

export interface MedicineSummary {
    lowStockCount: number;
    expiringLotsCount?: number;
}
