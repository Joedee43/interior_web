import { describe, expect, it } from "vitest";

import { resolveTrustedClientIp } from "./client-ip";

describe("resolveTrustedClientIp", () => {
  it("accepts one validated address from the configured trusted header", () => {
    expect(resolveTrustedClientIp("x-real-ip", "203.0.113.8")).toBe(
      "203.0.113.8",
    );
    expect(resolveTrustedClientIp("x-real-ip", "2001:db8::8")).toBe(
      "2001:db8::8",
    );
  });

  it("selects rather than appends a trusted forwarded chain", () => {
    expect(
      resolveTrustedClientIp(
        "x-forwarded-for",
        "203.0.113.8, 10.0.0.4, 10.0.0.5",
      ),
    ).toBe("203.0.113.8");
  });

  it("rejects malformed or missing values", () => {
    expect(resolveTrustedClientIp("x-real-ip", "not-an-ip")).toBeNull();
    expect(resolveTrustedClientIp("x-forwarded-for", null)).toBeNull();
  });
});
