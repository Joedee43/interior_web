import { describe, expect, it } from "vitest";

import { ApiError } from "./error";

describe("ApiError", () => {
  it("preserves backend codes, fields and request IDs", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: "validation_failed",
          message: "check the highlighted fields",
          details: { name: "is required" },
          request_id: "body-id",
        },
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );

    const error = await ApiError.fromResponse(response);
    expect(error).toMatchObject({
      status: 400,
      code: "validation_failed",
      details: { name: "is required" },
      requestId: "body-id",
    });
  });

  it("uses a safe fallback for non-API responses", async () => {
    const response = new Response("bad gateway", {
      status: 502,
      headers: { "x-request-id": "proxy-id" },
    });

    const error = await ApiError.fromResponse(response);
    expect(error).toMatchObject({
      status: 502,
      code: "unexpected_response",
      requestId: "proxy-id",
    });
  });
});
