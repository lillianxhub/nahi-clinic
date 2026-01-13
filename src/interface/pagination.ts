export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}
