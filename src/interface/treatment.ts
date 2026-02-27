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
  hospital_number: string;
  treatment_id: string;
  visit_id: string;
  visit_date: string; 
  symptom?: string;
  diagnosis?: string;
  note?: string;
  items?: TreatmentItem[];
  visitDetails?: VisitDetail[];

  patient: {
    patient_id: string;
    first_name: string;
    last_name: string;
  };
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