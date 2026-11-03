import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/server", () => ({ serverApiFetch: vi.fn() }));

import { ApiError } from "@/lib/api/error";
import { serverApiFetch } from "@/lib/api/server";
import { fetchCatalogCategories, fetchCatalogProducts } from "./api";

const mockedFetch = vi.mocked(serverApiFetch);
const productPage = { products: [], next_cursor: null };

describe("catalog API", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("passes an opaque cursor to Go without changing its value", async () => {
    const cursor = "  opaque+/= cursor  ";
    mockedFetch.mockResolvedValue(productPage);

    await fetchCatalogProducts({ cursor });

    const endpoint = mockedFetch.mock.calls[0]?.[0];
    expect(endpoint).toBeDefined();
    expect(
      new URL(endpoint as string, "http://api.test").searchParams.get("cursor"),
    ).toBe(cursor);
  });

  it("recovers only from cursor-specific validation failures", async () => {
    mockedFetch
      .mockRejectedValueOnce(
        new ApiError(400, {
          code: "validation_failed",
          message: "check the highlighted fields",
          details: { cursor: "is invalid" },
        }),
      )
      .mockResolvedValueOnce(productPage);

    const result = await fetchCatalogProducts({ cursor: "bad-cursor" });

    expect(result.recoveredFromInvalidCursor).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch.mock.calls[1]?.[0]).not.toContain("cursor=");
  });

  it("does not mask unrelated 400 responses", async () => {
    const error = new ApiError(400, {
      code: "validation_failed",
      message: "check the highlighted fields",
      details: { category: "is invalid" },
    });
    mockedFetch.mockRejectedValueOnce(error);

    await expect(
      fetchCatalogProducts({ cursor: "still-present" }),
    ).rejects.toBe(error);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces category API failures", async () => {
    const error = new ApiError(500, {
      code: "internal_error",
      message: "unexpected error",
      request_id: "request-123",
    });
    mockedFetch.mockRejectedValueOnce(error);

    await expect(fetchCatalogCategories()).rejects.toBe(error);
  });
});
