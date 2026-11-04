import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/error";
import { authFormFailure } from "./form-errors";

describe("authFormFailure", () => {
  it("maps validation details and preserves the request ID", () => {
    expect(
      authFormFailure(
        new ApiError(400, {
          code: "validation_failed",
          message: "invalid",
          details: { email: "is invalid" },
          request_id: "auth-validation",
        }),
        "register",
      ),
    ).toEqual({
      message: "Check the highlighted fields and try again.",
      requestId: "auth-validation",
      fields: { email: "is invalid" },
    });
  });

  it("uses safe messages for credentials, duplicate email and rate limits", () => {
    expect(
      authFormFailure(
        new ApiError(401, { code: "invalid_credentials", message: "no" }),
        "login",
      ).message,
    ).toBe("Invalid email or password.");
    expect(
      authFormFailure(
        new ApiError(409, { code: "email_taken", message: "taken" }),
        "register",
      ).fields.email,
    ).toMatch(/already exists/i);
    expect(
      authFormFailure(
        new ApiError(429, { code: "rate_limited", message: "slow" }),
        "login",
      ).message,
    ).toMatch(/too many attempts/i);
  });
});

