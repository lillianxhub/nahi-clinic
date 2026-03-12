import { ProductType, VisitStatus } from "@/generated/prisma";

export interface TreatmentItem {
    visit_item_id: string;
    product_id?: string | null;
    service_id?: string | null;
    lot_id?: string | null;
    quantity: number;
    unit_price: number;
    description?: string | null;
    product?: {
        product_id: string;
        product_name: string;
        product_type: ProductType;
        unit: string;
    };
    service?: {
        service_id: string;
        service_name: string;
        price: number;
    };
    // Derived or manually mapped fields for UI
    item_type?: string;
    item_name?: string;
}

export interface Treatment {
    hospital_number: string;
    treatment_id: string;
    visit_id: string;
    visit_date: string;
    status: VisitStatus;
    symptom?: string;
    diagnosis?: string;
    note?: string;
    temperature?: number;
    blood_pressure?: string;
    heart_rate?: number;
    weight?: number;
    height?: number;
    waistline?: number;
    smoking_history?: string;
    drinking_history?: string;
    age_years?: number;
    age_months?: number;
    age_days?: number;
    age_formatted?: string;

    patient: {
        hospital_number: any;
        patient_id: string;
        first_name: string;
        last_name: string;
        citizen_number?: string;
        allergy?: string;
    };
    items: TreatmentItem[];
}

export interface CreateTreatmentItemDTO {
    item_type: "product" | "service";
    product_id?: string;
    service_id?: string;
    lot_id?: string;
    quantity: number;
    unit_price: number;
    description?: string;
}

export interface CreateTreatmentDTO {
    patient_id: string;
    visit_date: string;
    status?: VisitStatus;
    symptom?: string;
    diagnosis?: string;
    note?: string;
    temperature?: number;
    blood_pressure?: string;
    heart_rate?: number;
    weight?: number;
    height?: number;
    waistline?: number;
    smoking_history?: string;
    drinking_history?: string;
    payment_method: string;
    receipt_no?: string;

    items: CreateTreatmentItemDTO[];
}
