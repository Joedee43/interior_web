import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  compareModelDimensions,
  normalizeModelPivot,
  resetDimensionWarningsForTests,
  warnForDimensionMismatch,
} from "./model-bounds";

describe("model bounds", () => {
  beforeEach(resetDimensionWarningsForTests);

  it("centres X/Z and grounds Y without resizing", () => {
    const root = new Group();
    const mesh = new Mesh(new BoxGeometry(2, 3, 4), new MeshBasicMaterial());
    mesh.position.set(4, 7, -2);
    root.add(mesh);
    const scale = root.scale.clone();

    expect(normalizeModelPivot(root)).toEqual({ widthM: 2, depthM: 4, heightM: 3 });
    expect(root.scale.equals(scale)).toBe(true);
    expect(root.position.toArray()).toEqual([-4, -5.5, 2]);
  });

  it("maps X to width, Z to depth, and Y to height", () => {
    expect(
      compareModelDimensions(
        { widthM: 1, depthM: 2, heightM: 3 },
        { width_mm: 1000, depth_mm: 2000, height_mm: 3000 },
      ).map(({ relativeDifference }) => relativeDifference),
    ).toEqual([0, 0, 0]);
  });

  it("does not warn at exactly 5%, warns above 5%, and warns once", () => {
    const warn = vi.fn();
    const expected = { width_mm: 1000, depth_mm: 1000, height_mm: 1000 };
    warnForDimensionMismatch("exact", { widthM: 1.05, depthM: 1, heightM: 1 }, expected, warn);
    warnForDimensionMismatch("bad", { widthM: 1.051, depthM: 1, heightM: 1 }, expected, warn);
    warnForDimensionMismatch("bad", { widthM: 2, depthM: 2, heightM: 2 }, expected, warn);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("width expected=1.000m actual=1.051m");
  });

  it("rejects empty bounds", () => {
    expect(() => normalizeModelPivot(new Group())).toThrow(/empty or non-finite/);
  });
});
