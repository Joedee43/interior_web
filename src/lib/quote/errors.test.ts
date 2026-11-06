import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/error";
import { quoteFailure } from "./errors";

describe("quote failures", () => {
  it("maps validation fields and request IDs", () => expect(quoteFailure(new ApiError(400, { code: "validation_failed", message: "invalid", details: { contact_phone: "too long" }, request_id: "req-1" }))).toMatchObject({ fields: { contact_phone: "too long" }, requestId: "req-1" }));
  it("requests a refresh when nothing remains available", () => expect(quoteFailure(new ApiError(400, { code: "nothing_available", message: "none" })).refreshDesign).toBe(true));
  it("marks non-API failures as ambiguous", () => expect(quoteFailure(new TypeError("network"))).toMatchObject({ ambiguous: true }));
});

