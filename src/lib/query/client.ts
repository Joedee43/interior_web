import {
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";

import { ApiError } from "@/lib/api/error";
import type { Account } from "@/lib/auth/types";

export const accountQueryKey = ["auth", "account"] as const;

export function clearAuthenticatedState(queryClient: QueryClient): void {
  queryClient.clear();
  queryClient.setQueryData<Account | null>(accountQueryKey, null);
}

export function setAuthenticatedAccount(
  queryClient: QueryClient,
  account: Account,
): void {
  queryClient.clear();
  queryClient.setQueryData(accountQueryKey, account);
}

export function clearAccountOnUnauthorized(
  queryClient: QueryClient,
  error: unknown,
): void {
  if (error instanceof ApiError && error.status === 401) {
    clearAuthenticatedState(queryClient);
  }
}

export function createAppQueryClient(): QueryClient {
  const holder: { current?: QueryClient } = {};
  const onError = (error: unknown): void => {
    if (holder.current) clearAccountOnUnauthorized(holder.current, error);
  };

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
  holder.current = queryClient;
  return queryClient;
}

