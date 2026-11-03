import { describe, expect, it } from "vitest";

import { parseEnv } from "./values";

describe("parseEnv", () => {
  it("provides local development defaults", () => {
    expect(parseEnv({})).toEqual({
      API_INTERNAL_URL: "http://localhost:5050",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      TRUSTED_CLIENT_IP_HEADER: "x-real-ip",
    });
  });

  it("normalizes trailing slashes", () => {
    expect(
      parseEnv({
        API_INTERNAL_URL: "https://api.internal/",
        NEXT_PUBLIC_APP_URL: "https://app.example.com/",
      }),
    ).toMatchObject({
      API_INTERNAL_URL: "https://api.internal",
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
    });
  });

  it("rejects invalid URLs and header names", () => {
    expect(() =>
      parseEnv({
        API_INTERNAL_URL: "api.internal",
        TRUSTED_CLIENT_IP_HEADER: "forwarded",
      }),
    ).toThrow("Invalid frontend environment");
  });
});
