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
        procedure_id: string,
        payload: Partial<CreateProcedureDTO>,
    ): Promise<Procedure> {
        return apiClient.patch<Procedure, Partial<CreateProcedureDTO>>(
            `/api/products/${procedure_id}`,
            payload,
        );
    },

    async deleteProcedure(procedure_id: string): Promise<void> {
        return apiClient.delete(`/api/products/${procedure_id}`);
    },
};
