import { ProductType, VisitStatus } from "@/generated/prisma";

export interface TreatmentItem {
    visit_item_id: string;
    product_id: string;
    lot_id?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: {
        product_id: string;
        product_name: string;
        product_type: ProductType;
        unit: string;
    };
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
    product_id: string;
    lot_id?: string;
    quantity: number;
    unit_price: number;
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
