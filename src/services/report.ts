import { buildQuery, QueryParams } from "@/utils/query";
import { apiClient } from "./apiClient";
import { treatmentService } from "./treatment";
import { Report, ReportResponse } from "@/interface/report";
import { Treatment } from "@/interface/treatment";
import { ResponseData } from "@/interface/response";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("apiUrl") || "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const reportService = {
  async getReports(
    params?: QueryParams
  ): Promise<ReportResponse> {
    try {
      // ดึงข้อมูล treatment จากจาก API
      const treatmentRes = await treatmentService.getTreatments(params);
      
      // แปลง Treatment เป็น Report format
      const reports: Report[] = treatmentRes.data.map((treatment: Treatment) => {
        // ใช้ visitDetails หรือ items ข้อมูลใดมี
        const visitDetails = treatment.visitDetails || treatment.items || [];
        const drugs = visitDetails
          .filter(item => item.item_type === 'drug')
          .map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }));

        return {
          visit_id: treatment.visit_id,
          visit_date: treatment.visit_date,
          patient_first_name: treatment.patient?.first_name || "",
          patient_last_name: treatment.patient?.last_name || "",
          symptom: treatment.symptom,
          diagnosis: treatment.diagnosis,
          drugs,
          patient: treatment.patient,
        };
      });

      return {
        data: reports,
        meta: treatmentRes.meta,
      };
    } catch (error) {
      console.error("Error in reportService.getReports:", error);
      throw error;
    }
  },
};
