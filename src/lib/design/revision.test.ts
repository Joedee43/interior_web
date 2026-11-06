import { describe, expect, it } from "vitest";
import { designEtag, parseDesignEtag } from "./revision";

describe("design revisions", () => {
  it("round-trips exact aggregate ETags", () => expect(parseDesignEtag(designEtag(42))).toBe(42));
  it.each([null, "design-1", 'W/"design-1"', '"design-0"', '"design-1 "'])("rejects malformed ETags", (value) => expect(() => parseDesignEtag(value)).toThrow());
});
