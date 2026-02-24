import { ItemType } from "../../generated/prisma/enums";

export interface Treatment {
    hospital_number: string;
    treatment_id: string;
    visit_id: string;
    visit_date: string;
    symptom?: string;
    diagnosis?: string;
    note?: string;

    patient: {
        hospital_number: any;
        patient_id: string;
        first_name: string;
        last_name: string;
    };
    visitDetails: {
        visit_detail_id: string;
        item_type: "drug" | "service";
        drug_id?: string;
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

    items: {
        item_type: ItemType;
        drug_id?: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }[];
}
