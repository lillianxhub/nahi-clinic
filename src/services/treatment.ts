import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { ResponseData } from "@/interface/response";
import { Treatment, CreateTreatmentDTO } from "@/interface/treatment";

const getApiUrl = () => {
    return ""; // Use relative paths for local API
};

export const treatmentService = {
    async getTreatments(
        params?: QueryParams,
    ): Promise<ResponseData<Treatment[]>> {
        const query = buildQuery(params);

        return apiClient.get<ResponseData<Treatment[]>>(
            `/api/treatments${query}`,
        );
    },

    async createTreatment(data: CreateTreatmentDTO): Promise<Treatment> {
        return apiClient.post(`/api/treatments`, data);
    },

    async getTreatmentById(id: string): Promise<Treatment> {
        const res = await apiClient.get<{ data: Treatment }>(
            `/api/treatments/${id}`,
        );
        return res.data;
    },

    async updateTreatment(
        id: string,
        data: Partial<CreateTreatmentDTO>,
    ): Promise<Treatment> {
        const res = await apiClient.patch<
            { data: Treatment },
            Partial<CreateTreatmentDTO>
        >(`/api/treatments/${id}`, data);
        return res.data;
    },

    async deleteTreatment(id: string | number): Promise<void> {
        await apiClient.delete(`/api/treatments/${id}`);
    },
};
