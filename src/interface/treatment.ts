import { ItemType } from "../../generated/prisma/enums";

export interface TreatmentItem {
  item_type: ItemType;
  drug_id?: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface VisitDetail {
  item_type: string;
  drug_id?: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface Treatment {
<<<<<<< HEAD
  hospital_number: string;
  treatment_id: string;
  visit_id: string;
  visit_date: string; 
  symptom?: string;
  diagnosis?: string;
  note?: string;
  items?: TreatmentItem[];
  visitDetails?: VisitDetail[];
=======
    hospital_number: string;
    treatment_id: string;
    visit_id: string;
    visit_date: string;
    symptom?: string;
    diagnosis?: string;
    note?: string;
>>>>>>> a6cfb6d5ff3cebacd3167edfc818325fe232e6dc

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
    payment_method: string;

    items: {
        item_type: ItemType;
        drug_id?: string;
        description?: string;
        quantity: number;
        unit_price: number;
    }[];
}
