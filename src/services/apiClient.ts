import { ApiError } from "@/interface/auth";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody> {
  body?: TBody;
  headers?: HeadersInit;
}

async function request<TResponse, TBody = undefined>(
  method: HttpMethod,
  url: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error("Invalid response from server");
  }

  const data = (await res.json()) as TResponse | ApiError;

  if (!res.ok) {
    throw new Error((data as ApiError).message);
  }

  return data as TResponse;
}

export const apiClient = {
  get<TResponse>(url: string, headers?: HeadersInit) {
    return request<TResponse>("GET", url, { headers });
  },

  post<TResponse, TBody>(url: string, body: TBody, headers?: HeadersInit) {
    return request<TResponse, TBody>("POST", url, {
      body,
      headers,
    });
  },

  put<TResponse, TBody>(url: string, body: TBody, headers?: HeadersInit) {
    return request<TResponse, TBody>("PUT", url, {
      body,
      headers,
    });
  },

  patch<TResponse, TBody>(url: string, body: TBody, headers?: HeadersInit) {
    return request<TResponse, TBody>("PATCH", url, {
      body,
      headers,
    });
  },

  delete<TResponse>(url: string, headers?: HeadersInit) {
    return request<TResponse>("DELETE", url, { headers });
  },
};
