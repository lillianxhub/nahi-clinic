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
