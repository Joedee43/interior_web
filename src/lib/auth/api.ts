import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiError } from "@/lib/api/error";
import { normalizeAccount } from "./normalize";
import type { Account } from "./types";

export type LoginInput =
  operations["login"]["requestBody"]["content"]["application/json"];
export type RegisterInput =
  operations["registerCustomer"]["requestBody"]["content"]["application/json"];

type LoginResponse =
  operations["login"]["responses"][200]["content"]["application/json"];
type RegisterResponse =
  operations["registerCustomer"]["responses"][201]["content"]["application/json"];
type AccountResponse =
  operations["getCurrentAccount"]["responses"][200]["content"]["application/json"];

const jsonHeaders = { "Content-Type": "application/json" };

export async function login(input: LoginInput): Promise<Account> {
  const response = await browserApiFetch<LoginResponse>("/v1/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return normalizeAccount(response);
}

export async function registerCustomer(input: RegisterInput): Promise<Account> {
  const response = await browserApiFetch<RegisterResponse>("/v1/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return normalizeAccount(response);
}

export async function logout(): Promise<void> {
  await browserApiFetch<void>("/v1/auth/logout", { method: "POST" });
}

export async function fetchCurrentAccount(): Promise<Account | null> {
  try {
    const response = await browserApiFetch<AccountResponse>("/v1/auth/me");
    return normalizeAccount(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

