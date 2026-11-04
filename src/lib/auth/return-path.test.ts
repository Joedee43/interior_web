import { describe, expect, it } from "vitest";

import { safeReturnPath } from "./return-path";

describe("safeReturnPath", () => {
  it("preserves local paths, queries and fragments", () => {
    expect(safeReturnPath("/account?tab=profile#details")).toBe(
      "/account?tab=profile#details",
    );
  });

  it.each([
    undefined,
    "",
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example",
    "/%5Cevil.example",
    "/login",
    "/register?next=/account",
    ["/account"],
  ])("falls back for unsafe or looping input %#", (value) => {
    expect(safeReturnPath(value)).toBe("/account");
  });
});

