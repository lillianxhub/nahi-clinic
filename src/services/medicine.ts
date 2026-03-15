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
    async getProduct(
        params?: QueryParams,
    ): Promise<ResponseData<Medicine[], MedicineSummary>> {
        const query = buildQuery(params);
        return apiClient.get<ResponseData<Medicine[], MedicineSummary>>(
            `/api/products${query}`,
        );
    },

    async getMedicines(
        params?: QueryParams,
    ): Promise<ResponseData<Medicine[], MedicineSummary>> {
        const query = buildQuery({ type: "drug", ...params });

        return apiClient.get<ResponseData<Medicine[], MedicineSummary>>(
            `/api/products${query}`,
        );
    },

    async getSupplies(
        params?: QueryParams,
    ): Promise<ResponseData<Medicine[], MedicineSummary>> {
        const query = buildQuery({ ...params, type: "supply" });

        return apiClient.get<ResponseData<Medicine[], MedicineSummary>>(
            `/api/products${query}`,
        );
    },

    async getMedicineLots(
        product_id: string,
        params?: QueryParams,
    ): Promise<ResponseData<DrugLot[], any>> {
        const query = buildQuery(params);
        return apiClient.get<ResponseData<DrugLot[], any>>(
            `/api/products/${product_id}/lots${query}`,
        );
    },

    async getCategories(
        product_type?: string,
    ): Promise<{ data: DrugCategory[] }> {
        const query = product_type ? `?product_type=${product_type}` : "";
        return apiClient.get<{ data: DrugCategory[] }>(
            `/api/products/categories${query}`,
        );
    },

    async createCategory(
        category_name: string,
        product_type: string = "drug",
    ): Promise<{ data: DrugCategory }> {
        return apiClient.post<
            { data: DrugCategory },
            { category_name: string; product_type: string }
        >("/api/products/categories", { category_name, product_type });
    },

    async getMedicineDetail(product_id: string): Promise<{ data: Medicine }> {
        return apiClient.get<{ data: Medicine }>(`/api/products/${product_id}`);
    },

    async createMedicine(payload: any): Promise<Medicine> {
        return apiClient.post<Medicine, any>("/api/products", payload);
    },

    async updateMedicine(product_id: string, payload: any): Promise<Medicine> {
        return apiClient.patch<Medicine, any>(
            `/api/products/${product_id}`,
            payload,
        );
    },

    async deleteMedicine(product_id: string): Promise<void> {
        return apiClient.delete(`/api/products/${product_id}`);
    },

    async updateLotDetails(
        lot_id: string,
        data: { qty_remaining?: number; expire_date?: string },
    ): Promise<void> {
        return apiClient.patch(`/api/products/lots/${lot_id}`, data);
    },

    async deleteLot(lot_id: string): Promise<void> {
        return apiClient.delete(`/api/products/lots/${lot_id}`);
    },

    async getExpiringLots(
        days: number = 30,
        params?: QueryParams,
    ): Promise<ResponseData<any[], any>> {
        const query = buildQuery(params);
        const separator = query ? "&" : "?";
        return apiClient.get<ResponseData<any[], any>>(
            `/api/products/lots/expiring${query}${separator}days=${days}`,
        );
    },

    async discardDrugLot(lot_id: string, reason: string): Promise<void> {
        return apiClient.post(
            `/api/products/lots/${lot_id}/stock-adjustments`,
            {
                lot_id,
                reason,
            },
        );
    },

    async getSuppliers(params?: QueryParams): Promise<{ data: any[] }> {
        const query = buildQuery(params);
        return apiClient.get<{ data: any[] }>(`/api/suppliers${query}`);
    },

    async createSupplier(
        supplier_name: string,
        contact?: string,
    ): Promise<{ data: any }> {
        return apiClient.post<
            { data: any },
            { supplier_name: string; contact?: string }
        >("/api/suppliers", { supplier_name, contact });
    },
};
