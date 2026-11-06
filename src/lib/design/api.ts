import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch } from "@/lib/api/browser";
import { normalizeDesignDetail, normalizeDesignPage } from "./normalize";
import type { DesignDetail, DesignPage } from "./types";

export const DESIGN_PAGE_SIZE = 20;
export type CreateDesignInput = operations["createDesign"]["requestBody"]["content"]["application/json"];
type ListResponse = operations["listDesigns"]["responses"][200]["content"]["application/json"];
type CreateResponse = operations["createDesign"]["responses"][201]["content"]["application/json"];
type DetailResponse = operations["getDesign"]["responses"][200]["content"]["application/json"];

export async function fetchDesignPage(cursor?: string): Promise<DesignPage> {
  const query = new URLSearchParams({ limit: String(DESIGN_PAGE_SIZE) });
  if (cursor !== undefined) query.set("cursor", cursor);
  const raw = await browserApiFetch<ListResponse>(`/v1/designs?${query}` as `/v1/${string}`);
  return normalizeDesignPage(raw);
}

export async function fetchDesignDetail(id: string): Promise<DesignDetail> {
  const raw = await browserApiFetch<DetailResponse>(`/v1/designs/${encodeURIComponent(id)}` as `/v1/${string}`);
  return normalizeDesignDetail(raw);
}

export async function createDesign(input: CreateDesignInput): Promise<DesignDetail> {
  const raw = await browserApiFetch<CreateResponse>("/v1/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return normalizeDesignDetail(raw);
}
