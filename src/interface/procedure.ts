export interface Procedure {
    procedure_id: string;
    procedure_name: string;
    price: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface CreateProcedureDTO {
    procedure_name: string;
    price: number;
}
