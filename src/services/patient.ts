import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { ResponseData } from "@/interface/response";
import { CreatePatientPayload, Patient, PatientApiResponse } from "@/interface/patient";
import { mapPatientFromApi } from "@/components/patient/AddPatientModal";

export const patientService = {
  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const apiPatient = await apiClient.post<
      PatientApiResponse,
      CreatePatientPayload
    >("/api/patients", payload);

    return mapPatientFromApi(apiPatient);
  },

  async getPatients(params?: QueryParams): Promise<ResponseData<Patient[]>> {
    const query = buildQuery(params);

    return apiClient.get<ResponseData<Patient[]>>(`/api/patients${query}`);

  },
};
