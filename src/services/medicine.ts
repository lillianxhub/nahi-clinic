import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import {
    Medicine,
    MedicineSummary,
    DrugCategory,
    DrugLot,
} from "@/interface/medicine";
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

    async getMedicineLots(
        drug_id: string,
        params?: QueryParams,
    ): Promise<ResponseData<DrugLot[], any>> {
        const query = buildQuery(params);
        return apiClient.get<ResponseData<DrugLot[], any>>(
            `/api/medicines/${drug_id}/lots${query}`,
        );
    },

    async getCategories(): Promise<{ data: DrugCategory[] }> {
        return apiClient.get<{ data: DrugCategory[] }>(
            "/api/medicines/categories",
        );
    },

    async createCategory(
        category_name: string,
    ): Promise<{ data: DrugCategory }> {
        return apiClient.post<
            { data: DrugCategory },
            { category_name: string }
        >("/api/medicines/categories", { category_name });
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

    async getExpiringLots(
        days: number = 30,
        params?: QueryParams,
    ): Promise<ResponseData<any[], any>> {
        const query = buildQuery(params);
        const separator = query ? "&" : "?";
        return apiClient.get<ResponseData<any[], any>>(
            `/api/drug-lots/expiring${query}${separator}days=${days}`,
        );
    },

    async discardDrugLot(
        lot_id: string,
        reason: string,
    ): Promise<void> {
        return apiClient.post("/api/drug-adjustments", {
            lot_id,
            reason,
        });
    },
};
