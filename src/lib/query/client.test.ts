import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/error";
import type { Account } from "@/lib/auth/types";
import {
  accountQueryKey,
  clearAuthenticatedState,
  createAppQueryClient,
  setAuthenticatedAccount,
} from "./client";

const account: Account = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "customer@example.com",
    fullName: "Demo Customer",
    status: "active",
    isPlatformAdmin: false,
    createdAt: "2026-01-02T03:04:05Z",
  },
  memberships: [],
};

describe("authenticated query cache", () => {
  it("clears user-scoped data when users sign in or out", () => {
    const client = createAppQueryClient();
    client.setQueryData(["designs"], ["old-design"]);
    setAuthenticatedAccount(client, account);
    expect(client.getQueryData(accountQueryKey)).toEqual(account);
    expect(client.getQueryData(["designs"])).toBeUndefined();

    client.setQueryData(["quotes"], ["old-quote"]);
    clearAuthenticatedState(client);
    expect(client.getQueryData(accountQueryKey)).toBeNull();
    expect(client.getQueryData(["quotes"])).toBeUndefined();
  });

  it("clears account state after any query receives 401", async () => {
    const client = createAppQueryClient();
    client.setQueryData(accountQueryKey, account);

    await expect(
      client.fetchQuery({
        queryKey: ["designs"],
        queryFn: () =>
          Promise.reject(
            new ApiError(401, { code: "unauthenticated", message: "required" }),
          ),
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(client.getQueryData(accountQueryKey)).toBeNull();
  });
});

