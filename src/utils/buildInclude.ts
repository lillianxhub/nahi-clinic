type IncludeMap = Record<string, true | object>;

export function buildInclude(allowIncludes: IncludeMap, join?: string | null) {
  if (!join) return undefined;

  const keys = join.split(",");

  return keys.reduce<Record<string, any>>((acc, key) => {
    if (allowIncludes[key]) {
      acc[key] = allowIncludes[key];
    }
    return acc;
  }, {});
}
