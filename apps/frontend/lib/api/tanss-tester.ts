import { request } from "./_base";

export interface TanssTestRequest {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: unknown;
  extraHeaders?: Record<string, string>;
}

export interface TanssTestResponse {
  status: number;
  statusText: string;
  durationMs: number;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export const tanssTester = {
  request: (body: TanssTestRequest) =>
    request<TanssTestResponse>("/api/v1/tanss-tester/request", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
