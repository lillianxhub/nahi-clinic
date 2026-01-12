type Order = "asc" | "desc";

export function buildOrderBy<T extends Record<string, string>>(
  field: string | null,
  order: Order | null,
  allowFields: T
) {
  if (!field || !order) return undefined;

  const prismaField = allowFields[field as keyof T];
  if (!prismaField) return undefined;

  return {
    [prismaField]: order,
  };
}
