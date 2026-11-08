import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch, browserApiFetchResponse, readApiResponse } from "@/lib/api/browser";
import { normalizeDesignDetail, normalizeDesignItem, normalizeDesignPage } from "./normalize";
import { designEtag, parseDesignEtag } from "./revision";
import type { DesignDetail, DesignItem, DesignPage } from "./types";

export const DESIGN_PAGE_SIZE = 20;
export type CreateDesignInput = operations["createDesign"]["requestBody"]["content"]["application/json"];
type ListResponse = operations["listDesigns"]["responses"][200]["content"]["application/json"];
type CreateResponse = operations["createDesign"]["responses"][201]["content"]["application/json"];
type DetailResponse = operations["getDesign"]["responses"][200]["content"]["application/json"];
export type UpdateDesignInput = operations["updateDesign"]["requestBody"]["content"]["application/json"];
export type CreateDesignItemInput = operations["createDesignItem"]["requestBody"]["content"]["application/json"];
export type UpdateDesignItemInput = operations["updateDesignItem"]["requestBody"]["content"]["application/json"];
type ItemResponse = operations["createDesignItem"]["responses"][201]["content"]["application/json"];
export interface Revisioned<T> { data: T; revision: number }

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

export async function fetchRevisionedDesignDetail(id: string): Promise<Revisioned<DesignDetail>> {
  const response = await browserApiFetchResponse(`/v1/designs/${encodeURIComponent(id)}` as `/v1/${string}`);
  return { data: normalizeDesignDetail(await response.json() as DetailResponse), revision: parseDesignEtag(response.headers.get("etag")) };
}

export async function createDesign(input: CreateDesignInput): Promise<DesignDetail> {
  const raw = await browserApiFetch<CreateResponse>("/v1/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return normalizeDesignDetail(raw);
}

async function revisioned<T>(path: `/v1/${string}`, revision: number, init: RequestInit, normalize: (raw: unknown) => T): Promise<Revisioned<T>> {
  const headers = new Headers(init.headers);
  headers.set("If-Match", designEtag(revision));
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await browserApiFetchResponse(path, { ...init, headers });
  const raw = response.status === 204 ? undefined : await readApiResponse<unknown>(response);
  return { data: normalize(raw), revision: parseDesignEtag(response.headers.get("etag")) };
}

export async function updateDesign(id: string, revision: number, input: UpdateDesignInput): Promise<Revisioned<DesignDetail>> {
  return revisioned(`/v1/designs/${encodeURIComponent(id)}` as `/v1/${string}`, revision, { method: "PATCH", body: JSON.stringify(input) }, normalizeDesignDetail);
}

// A deleted design has no next revision, so Go answers 204 without an ETag.
export async function deleteDesign(id: string, revision: number): Promise<void> {
  await browserApiFetchResponse(`/v1/designs/${encodeURIComponent(id)}` as `/v1/${string}`, { method: "DELETE", headers: { "If-Match": designEtag(revision) } });
}

export async function createDesignItem(id: string, revision: number, input: CreateDesignItemInput): Promise<Revisioned<DesignItem>> {
  return revisioned(`/v1/designs/${encodeURIComponent(id)}/items` as `/v1/${string}`, revision, { method: "POST", body: JSON.stringify(input) }, (raw) => normalizeDesignItem(raw as ItemResponse));
}

export async function updateDesignItem(designId: string, itemId: string, revision: number, input: UpdateDesignItemInput): Promise<Revisioned<DesignItem>> {
  return revisioned(`/v1/designs/${encodeURIComponent(designId)}/items/${encodeURIComponent(itemId)}` as `/v1/${string}`, revision, { method: "PATCH", body: JSON.stringify(input) }, normalizeDesignItem);
}

export async function deleteDesignItem(designId: string, itemId: string, revision: number): Promise<number> {
  const result = await revisioned(`/v1/designs/${encodeURIComponent(designId)}/items/${encodeURIComponent(itemId)}` as `/v1/${string}`, revision, { method: "DELETE" }, () => undefined);
  return result.revision;
}
