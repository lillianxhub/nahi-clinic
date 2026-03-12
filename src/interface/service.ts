export interface Service {
    service_id: string;
    service_name: string;
    price: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface CreateServiceDTO {
    service_name: string;
    price: number;
}
