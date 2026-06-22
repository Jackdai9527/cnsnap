export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

type ApiClientOptions = Omit<RequestInit, "body" | "method"> & {
  params?: QueryParams;
};

function buildUrl(path: string, params?: QueryParams) {
  const url = path.startsWith("http") ? new URL(path) : new URL(path, "http://localhost");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => appendQueryValue(url, key, item));
      } else {
        appendQueryValue(url, key, value);
      }
    });
  }

  return path.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
}

function appendQueryValue(url: URL, key: string, value: QueryValue) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  url.searchParams.append(key, String(value));
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request<TResponse>(path: string, method: string, body?: unknown, options: ApiClientOptions = {}) {
  const headers = new Headers(options.headers);

  if (body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(buildUrl(path, options.params), {
    ...options,
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = response.status === 204 ? null : await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(message, response.status, payload);
  }

  return payload as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: ApiClientOptions) => request<TResponse>(path, "GET", undefined, options),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: ApiClientOptions) => request<TResponse>(path, "POST", body, options),
  patch: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: ApiClientOptions) => request<TResponse>(path, "PATCH", body, options),
  delete: <TResponse>(path: string, options?: ApiClientOptions) => request<TResponse>(path, "DELETE", undefined, options)
};
