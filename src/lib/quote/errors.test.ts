import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/error";
import { quoteActionFailure, quoteFailure } from "./errors";

describe("quote failures", () => {
  it("maps validation fields and request IDs", () => expect(quoteFailure(new ApiError(400, { code: "validation_failed", message: "invalid", details: { contact_phone: "too long" }, request_id: "req-1" }))).toMatchObject({ fields: { contact_phone: "too long" }, requestId: "req-1" }));
  it("requests a refresh when nothing remains available", () => expect(quoteFailure(new ApiError(400, { code: "nothing_available", message: "none" })).refreshDesign).toBe(true));
  it("marks non-API failures as ambiguous", () => expect(quoteFailure(new TypeError("network"))).toMatchObject({ ambiguous: true }));
});

describe("quote action failures", () => {
  it.each([
    ["stale_revision", /revised this quote/],
    ["quote_expired", /valid-until/],
    ["invalid_transition", /status changed/],
  ])("refreshes after %s", (code, message) => {
    const failure = quoteActionFailure(new ApiError(409, { code, message: code, request_id: "req-409" }));
    expect(failure).toMatchObject({ refresh: true, requestId: "req-409" });
    expect(failure.message).toMatch(message);
  });

  it("refreshes after a network failure because the outcome is unknown", () => expect(quoteActionFailure(new TypeError("network"))).toMatchObject({ refresh: true }));
  it("does not refresh a missing request or ended session", () => {
    expect(quoteActionFailure(new ApiError(404, { code: "not_found", message: "gone" })).refresh).toBe(false);
    expect(quoteActionFailure(new ApiError(401, { code: "unauthenticated", message: "sign in" })).refresh).toBe(false);
  });
});

