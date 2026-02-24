import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { ResponseData } from "@/interface/response";
import { Treatment, CreateTreatmentDTO } from "@/interface/treatment";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("apiUrl") || "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const treatmentService = {
  async getTreatments(
    params?: QueryParams
  ): Promise<ResponseData<Treatment[]>> {
    const query = buildQuery(params);
    const apiUrl = getApiUrl();

    return apiClient.get<ResponseData<Treatment[]>>(
      `${apiUrl}/api/treatments${query}`
    );
  },

  // ✓ เพิ่มฟังก์ชันนี้
  async createTreatment(data: CreateTreatmentDTO): Promise<Treatment> {
    const apiUrl = getApiUrl();
    return apiClient.post(`${apiUrl}/api/treatments`, data);
  },

  async deleteTreatment(id: number): Promise<void> {
    const apiUrl = getApiUrl();
    await apiClient.delete(`${apiUrl}/api/treatments/${id}`);
  },
};