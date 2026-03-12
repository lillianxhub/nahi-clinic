export interface Procedure {
    product_id: string;
    product_name: string;
    product_type: "service";
    price: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface CreateProcedureDTO {
    product_name: string;
    product_type: "service";
    price: number;
}
