import "server-only";

import { cache } from "react";

import { ApiError } from "@/lib/api/error";
import type { operations } from "@/lib/api/generated/schema";
import { serverApiFetch } from "@/lib/api/server";
import { normalizeAccount } from "./normalize";
import type { Account } from "./types";

type AccountResponse =
  operations["getCurrentAccount"]["responses"][200]["content"]["application/json"];

export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  try {
    const response = await serverApiFetch<AccountResponse>("/v1/auth/me", {
      cache: "no-store",
    });
    return normalizeAccount(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

