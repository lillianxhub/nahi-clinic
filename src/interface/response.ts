import { Pagination } from "./pagination";

interface ApiStatus {
  code: string;
  message: string;
}

export interface ResponseData<T, TSummary = undefined> {
  data: T;
  summary?: TSummary;
  meta: { pagination: Pagination };
  status: ApiStatus;
}

export interface UserSettings {
  profile_image: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  clinic_name: string;
  clinic_address: string;
  api_url: string;
}
