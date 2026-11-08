import "server-only";

import { cache } from "react";
import type { operations } from "@/lib/api/generated/schema";
import { ApiError } from "@/lib/api/error";
import { serverApiFetch } from "@/lib/api/server";
import { quoteListQuery } from "./api";
import { normalizeQuotePage, normalizeQuoteRequest } from "./normalize";
import type { QuotePage, QuoteRequest, QuoteStatus } from "./types";

type ListResponse = operations["listCustomerQuoteRequests"]["responses"][200]["content"]["application/json"];
type DetailResponse = operations["getCustomerQuoteRequest"]["responses"][200]["content"]["application/json"];

export const getInitialQuotePage = cache(async (status?: QuoteStatus): Promise<QuotePage> => {
  const raw = await serverApiFetch<ListResponse>(`/v1/quote-requests?${quoteListQuery(status)}` as `/v1/${string}`, { cache: "no-store" });
  return normalizeQuotePage(raw);
});

export const getQuoteRequest = cache(async (id: string): Promise<QuoteRequest | null> => {
  try {
    const raw = await serverApiFetch<DetailResponse>(`/v1/quote-requests/${encodeURIComponent(id)}` as `/v1/${string}`, { cache: "no-store" });
    return normalizeQuoteRequest(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
