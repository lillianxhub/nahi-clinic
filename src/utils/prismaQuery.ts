export function getOrderBy(params: URLSearchParams, fallback = "created_at") {
    const orderBy = params.get("orderBy") || fallback;
    const orderType = params.get("orderType") === "asc" ? "asc" : "desc";

    return { [orderBy]: orderType };
}

export function getInclude(params: URLSearchParams, allowed: string[]) {
    const includeParam = params.get("include");
    if (!includeParam) return undefined;

    const includes = includeParam.split(",");
    const include: any = {};

    for (const key of includes) {
        if (allowed.includes(key)) {
            include[key] = true;
        }
    }

    return Object.keys(include).length ? include : undefined;
}
