import { Gender } from "@/constants/gender";

export interface Patient {
  id: string;
  hospital_number: string;
  fullName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  address?: string;
  allergy?: string;
}

export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  gender: Gender;
  birth_date?: string;
  phone?: string;
  address?: string;
  allergy?: string;
}

export interface PatientApiResponse {
  patient_id: string;
  hospital_number: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  birth_date: string;
  phone: string;
  address?: string;
  allergy: string;
}
