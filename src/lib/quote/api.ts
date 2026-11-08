import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch } from "@/lib/api/browser";
import { normalizeQuotePage, normalizeQuoteRequest, normalizeQuoteSubmission } from "./normalize";
import type { QuotePage, QuoteRequest, QuoteStatus, QuoteSubmission } from "./types";

type Input = operations["createQuoteRequestsFromDesign"]["requestBody"]["content"]["application/json"];
type Response = operations["createQuoteRequestsFromDesign"]["responses"][201]["content"]["application/json"];
type ListResponse = operations["listCustomerQuoteRequests"]["responses"][200]["content"]["application/json"];
type DetailResponse = operations["getCustomerQuoteRequest"]["responses"][200]["content"]["application/json"];
type AcceptInput = operations["acceptQuoteRequest"]["requestBody"]["content"]["application/json"];
export type SubmitDesignQuoteInput = Input;

export const QUOTE_PAGE_SIZE = 20;

export async function submitDesignQuote(input: Input): Promise<QuoteSubmission> {
  const raw = await browserApiFetch<Response>("/v1/quote-requests/from-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return normalizeQuoteSubmission(raw, input.design_id);
}

export function quoteListQuery(status?: QuoteStatus, cursor?: string): URLSearchParams {
  const query = new URLSearchParams({ limit: String(QUOTE_PAGE_SIZE) });
  if (status) query.set("status", status);
  if (cursor !== undefined) query.set("cursor", cursor);
  return query;
}

export async function fetchQuotePage(status?: QuoteStatus, cursor?: string): Promise<QuotePage> {
  const raw = await browserApiFetch<ListResponse>(`/v1/quote-requests?${quoteListQuery(status, cursor)}` as `/v1/${string}`);
  return normalizeQuotePage(raw);
}

export async function fetchQuoteRequest(id: string): Promise<QuoteRequest> {
  const raw = await browserApiFetch<DetailResponse>(`/v1/quote-requests/${encodeURIComponent(id)}` as `/v1/${string}`);
  return normalizeQuoteRequest(raw);
}

/** Sends the revision the customer reviewed; the backend answers `stale_revision` if it changed. */
export async function acceptQuote(id: string, revision: number): Promise<QuoteRequest> {
  const body: AcceptInput = { revision };
  const raw = await browserApiFetch<DetailResponse>(`/v1/quote-requests/${encodeURIComponent(id)}/accept` as `/v1/${string}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return normalizeQuoteRequest(raw);
}

export async function rejectQuote(id: string): Promise<QuoteRequest> {
  const raw = await browserApiFetch<DetailResponse>(`/v1/quote-requests/${encodeURIComponent(id)}/reject` as `/v1/${string}`, { method: "POST" });
  return normalizeQuoteRequest(raw);
}

export async function cancelQuote(id: string): Promise<QuoteRequest> {
  const raw = await browserApiFetch<DetailResponse>(`/v1/quote-requests/${encodeURIComponent(id)}/cancel` as `/v1/${string}`, { method: "POST" });
  return normalizeQuoteRequest(raw);
}
