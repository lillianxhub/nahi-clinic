import { ItemType } from "@/generated/prisma/enums";

export interface Treatment {
    hospital_number: string;
    treatment_id: string;
    visit_id: string;
    visit_date: string;
    symptom?: string;
    diagnosis?: string;
    note?: string;
    blood_pressure?: string;
    heart_rate?: number;
    weight?: number;
    height?: number;
    age_years?: number;
    age_months?: number;
    age_days?: number;
    age_formatted?: string;

    patient: {
        hospital_number: any;
        patient_id: string;
        first_name: string;
        last_name: string;
    };
    visitDetails: {
        visit_detail_id: string;
        item_type: "drug" | "service" | "procedure";
        drug_id?: string;
        procedure_id?: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }[];
}

export interface CreateTreatmentDTO {
    patient_id: string;
    visit_date: string;
    symptom?: string;
    diagnosis?: string;
    note?: string;
    payment_method: string;
    blood_pressure?: string;
    heart_rate?: number;
    weight?: number;
    height?: number;

    items: {
        item_type: ItemType;
        drug_id?: string;
        procedure_id?: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }[];
}
