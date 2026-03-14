import { apiClient } from "./apiClient";
import { Service, CreateServiceDTO } from "@/interface/service";
import { buildQuery, QueryParams } from "@/utils/query";

interface ServiceResponse {
    data: Service[];
}

export const serviceService = {
    async getServices(params?: QueryParams): Promise<ServiceResponse> {
        const query = buildQuery(params);
        return apiClient.get<ServiceResponse>(`/api/services${query}`);
    },

    async createService(payload: CreateServiceDTO): Promise<Service> {
        return apiClient.post<Service, CreateServiceDTO>("/api/services", payload);
    },
};
