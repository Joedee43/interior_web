import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentAccount, login, logout, registerCustomer } from "./api";

const account = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "customer@example.com",
    full_name: "Demo Customer",
    status: "active",
    is_platform_admin: false,
    created_at: "2026-01-02T03:04:05Z",
  },
  memberships: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("auth browser API", () => {
  it("uses same-origin credentialed endpoints for login and registration", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(account), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(account), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await login({ email: "customer@example.com", password: "password 123" });
    await registerCustomer({
      full_name: "Demo Customer",
      email: "customer@example.com",
      password: "password 123",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/v1/auth/login",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/v1/auth/register",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("treats only a 401 from /me as signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "unauthenticated", message: "required" } }),
          { status: 401 },
        ),
      ),
    );
    await expect(fetchCurrentAccount()).resolves.toBeNull();
  });

  it("preserves non-401 API failures and request IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "internal_error", message: "failed", request_id: "auth-500" },
          }),
          { status: 500 },
        ),
      ),
    );
    await expect(fetchCurrentAccount()).rejects.toMatchObject({
      status: 500,
      requestId: "auth-500",
    });
  });

  it("logs out through the browser rewrite", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await logout();
    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});

