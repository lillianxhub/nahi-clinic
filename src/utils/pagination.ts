export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") ?? 10), 1);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return {
    page,
    pageSize,
    skip,
    take,
  };
}
