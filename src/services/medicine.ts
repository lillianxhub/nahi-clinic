import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { Medicine, MedicineSummary, DrugCategory } from "@/interface/medicine";
import { ResponseData } from "@/interface/response";

export const medicineService = {
    async getMedicines(
        params?: QueryParams,
    ): Promise<ResponseData<Medicine[], MedicineSummary>> {
        const query = buildQuery(params);

        return apiClient.get<ResponseData<Medicine[], MedicineSummary>>(
            `/api/medicines${query}`,
        );
    },

    async getCategories(): Promise<{ data: DrugCategory[] }> {
        return apiClient.get<{ data: DrugCategory[] }>(
            "/api/medicines/categories",
        );
    },

    async getMedicineDetail(drug_id: string): Promise<{ data: Medicine }> {
        return apiClient.get<{ data: Medicine }>(`/api/medicines/${drug_id}`);
    },

    async createMedicine(payload: any): Promise<Medicine> {
        return apiClient.post<Medicine, any>("/api/medicines", payload);
    },

    async updateMedicine(drug_id: string, payload: any): Promise<Medicine> {
        return apiClient.patch<Medicine, any>(
            `/api/medicines/${drug_id}`,
            payload,
        );
    },

    async deleteMedicine(drug_id: string): Promise<void> {
        return apiClient.delete(`/api/medicines/${drug_id}`);
    },

    async updateLotQuantity(
        lot_id: string,
        qty_remaining: number,
    ): Promise<void> {
        return apiClient.patch(`/api/medicines/lots/${lot_id}`, {
            qty_remaining,
        });
    },
};
