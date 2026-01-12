export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export function buildQuery(params?: QueryParams): string {
  if (!params) return "";

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return query ? `?${query}` : "";
}
