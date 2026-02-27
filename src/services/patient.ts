import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { ResponseData } from "@/interface/response";
import {
    CreatePatientPayload,
    Patient,
    PatientApiResponse,
} from "@/interface/patient";
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

        const res = await apiClient.get<ResponseData<PatientApiResponse[]>>(
            `/api/patients${query}`,
        );

        return {
            ...res,
            data: res.data.map(mapPatientFromApi),
        };
    },

    async getPatientById(id: string): Promise<Patient> {
        const res = await apiClient.get<{ data: PatientApiResponse }>(
            `/api/patients/${id}`,
        );
        return mapPatientFromApi(res.data);
    },

    async updatePatient(
        id: string,
        payload: Partial<CreatePatientPayload>,
    ): Promise<Patient> {
        const res = await apiClient.patch<
            { data: PatientApiResponse },
            Partial<CreatePatientPayload>
        >(`/api/patients/${id}`, payload);
        return mapPatientFromApi(res.data);
    },

    async deletePatient(id: string): Promise<void> {
        await apiClient.delete(`/api/patients/${id}`);
    },
};
