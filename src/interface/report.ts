export interface ReportDrug {
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface Report {
  visit_id: string;
  visit_date: string;
  patient_first_name: string;
  patient_last_name: string;
  symptom?: string;
  diagnosis?: string;
  drugs: ReportDrug[];
  
  patient: {
    patient_id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ReportResponse {
  data: Report[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
