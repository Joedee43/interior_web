import { describe, expect, it } from "vitest";
import { clampItemPosition, openingsOverlap, rotatedHalfFootprint } from "./editor-geometry";
import type { DesignItem } from "./types";

const item = { rotationDeg: 0, product: { dimensions: { widthMm: 1000, depthMm: 500, heightMm: 800 } } } as DesignItem;
describe("editor geometry", () => {
  it("clamps the complete rotated footprint", () => {
    expect(clampItemPosition({ widthMm: 4000, depthMm: 3000, heightMm: 2500 }, item, 0, 3000)).toEqual({ xMm: 500, zMm: 2750 });
    expect(rotatedHalfFootprint(1000, 500, 90)).toEqual({ x: 250.00000000000003, z: 500 });
  });
  it("rejects products larger than the room", () => expect(clampItemPosition({ widthMm: 600, depthMm: 400, heightMm: 2500 }, item, 300, 200)).toBeNull());
  it("treats touching opening edges as non-overlapping", () => {
    const a = { type: "door", wall: "north", offsetMm: 0, widthMm: 900, heightMm: 2100, sillMm: 0 } as const;
    expect(openingsOverlap(a, { ...a, offsetMm: 900 })).toBe(false);
    expect(openingsOverlap(a, { ...a, offsetMm: 899 })).toBe(true);
  });
});
