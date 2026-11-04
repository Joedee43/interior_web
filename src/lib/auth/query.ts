"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCurrentAccount } from "./api";
import { accountQueryKey } from "@/lib/query/client";

export function useAccountQuery() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: fetchCurrentAccount,
  });
}

