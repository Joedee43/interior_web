"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchDesignDetail, fetchDesignPage } from "./api";
import type { DesignDetail, DesignPage } from "./types";

export const designKeys = {
  all: ["designs"] as const,
  list: ["designs", "list"] as const,
  detail: (id: string) => ["designs", "detail", id] as const,
};

export function useDesigns(initialPage: DesignPage) {
  return useInfiniteQuery({
    queryKey: designKeys.list,
    queryFn: ({ pageParam }) => fetchDesignPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });
}

export function useDesign(id: string, initialData: DesignDetail) {
  return useQuery({ queryKey: designKeys.detail(id), queryFn: () => fetchDesignDetail(id), initialData });
}
