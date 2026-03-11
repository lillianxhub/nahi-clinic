import { apiClient } from "./apiClient";
import { Procedure, CreateProcedureDTO } from "@/interface/procedure";
import { ResponseData } from "@/interface/response";
import { buildQuery, QueryParams } from "@/utils/query";

export const procedureService = {
    async getProcedures(
        params?: QueryParams,
    ): Promise<ResponseData<Procedure[], any>> {
        const query = buildQuery({ ...params, type: "service" });
        return apiClient.get<ResponseData<Procedure[], any>>(
            `/api/products${query}`,
        );
    },

    async createProcedure(payload: CreateProcedureDTO): Promise<Procedure> {
        return apiClient.post<Procedure, any>("/api/products", {
            ...payload,
            product_type: "service",
        });
    },

    async updateProcedure(
        product_id: string,
        payload: Partial<CreateProcedureDTO>,
    ): Promise<Procedure> {
        return apiClient.patch<Procedure, Partial<CreateProcedureDTO>>(
            `/api/products/${product_id}`,
            payload,
        );
    },

    async deleteProcedure(product_id: string): Promise<void> {
        return apiClient.delete(`/api/products/${product_id}`);
    },
};
