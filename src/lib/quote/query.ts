"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchQuotePage, fetchQuoteRequest } from "./api";
import type { QuotePage, QuoteRequest, QuoteStatus } from "./types";

export const quoteKeys = {
  all: ["quotes"] as const,
  lists: ["quotes", "list"] as const,
  list: (status?: QuoteStatus) => ["quotes", "list", status ?? "all"] as const,
  detail: (id: string) => ["quotes", "detail", id] as const,
  submission: (id: string) => ["quotes", "submission", id] as const,
};

export function useQuotes(status: QuoteStatus | undefined, initialPage: QuotePage) {
  return useInfiniteQuery({
    queryKey: quoteKeys.list(status),
    queryFn: ({ pageParam }) => fetchQuotePage(status, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });
}

export function useQuoteRequest(id: string, initialData: QuoteRequest) {
  return useQuery({ queryKey: quoteKeys.detail(id), queryFn: () => fetchQuoteRequest(id), initialData });
}
