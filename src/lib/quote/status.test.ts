import { describe, expect, it } from "vitest";
import { availableActions, formatQuoteDate, formatValidUntil, parseQuoteStatus } from "./status";
import type { QuoteStatus } from "./types";

describe("quote status rules", () => {
  it.each<[QuoteStatus, boolean, boolean, string[]]>([
    ["pending", false, false, ["cancel"]],
    ["reviewing", false, false, ["cancel"]],
    ["quoted", false, false, ["accept", "reject", "cancel"]],
    ["quoted", true, false, ["reject", "cancel"]],
    ["accepted", false, true, []],
    ["rejected", false, true, []],
    ["cancelled", false, true, []],
    ["declined", false, true, []],
  ])("%s (expired=%s, final=%s) allows %j", (status, expired, final, actions) => {
    expect(availableActions({ status, expired, final })).toEqual(actions);
  });

  it("only accepts known status filters", () => {
    expect(parseQuoteStatus("quoted")).toBe("quoted");
    expect(parseQuoteStatus("archived")).toBeUndefined();
    expect(parseQuoteStatus(["quoted"])).toBeUndefined();
    expect(parseQuoteStatus(undefined)).toBeUndefined();
  });

  it("formats dates in UTC so server and browser agree", () => {
    expect(formatQuoteDate("2026-11-04T23:30:00Z")).toBe("Nov 4, 2026");
    expect(formatValidUntil("2026-12-31")).toBe("Dec 31, 2026");
  });
});
