import { Box3, Object3D, Vector3 } from "three";

import type { CatalogProductDimensions } from "@/lib/catalog/types";

export interface ModelBounds {
  widthM: number;
  depthM: number;
  heightM: number;
}

export interface BoundsComparison {
  axis: "width" | "depth" | "height";
  expectedM: number;
  actualM: number;
  relativeDifference: number;
}

const warnedModels = new Set<string>();

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function readModelBounds(object: Object3D): ModelBounds {
  const box = new Box3().setFromObject(object);
  const size = box.getSize(new Vector3());

  if (
    box.isEmpty() ||
    !finitePositive(size.x) ||
    !finitePositive(size.y) ||
    !finitePositive(size.z)
  ) {
    throw new Error("The 3D model has empty or non-finite bounds.");
  }

  return { widthM: size.x, depthM: size.z, heightM: size.y };
}

export function normalizeModelPivot(object: Object3D): ModelBounds {
  const box = new Box3().setFromObject(object);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  if (
    box.isEmpty() ||
    !finitePositive(size.x) ||
    !finitePositive(size.y) ||
    !finitePositive(size.z) ||
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.z) ||
    !Number.isFinite(box.min.y)
  ) {
    throw new Error("The 3D model has empty or non-finite bounds.");
  }

  object.position.x -= center.x;
  object.position.y -= box.min.y;
  object.position.z -= center.z;

  return { widthM: size.x, depthM: size.z, heightM: size.y };
}

export function compareModelDimensions(
  actual: ModelBounds,
  expected: CatalogProductDimensions,
): BoundsComparison[] {
  const values: Array<[BoundsComparison["axis"], number, number]> = [
    ["width", expected.width_mm / 1000, actual.widthM],
    ["depth", expected.depth_mm / 1000, actual.depthM],
    ["height", expected.height_mm / 1000, actual.heightM],
  ];

  return values.map(([axis, expectedM, actualM]) => ({
    axis,
    expectedM,
    actualM,
    relativeDifference: Math.abs(actualM - expectedM) / expectedM,
  }));
}

export function warnForDimensionMismatch(
  identity: string,
  actual: ModelBounds,
  expected: CatalogProductDimensions,
  warn: (message: string) => void = console.warn,
) {
  if (process.env.NODE_ENV === "production" || warnedModels.has(identity)) {
    return;
  }

  const comparisons = compareModelDimensions(actual, expected);
  if (
    !comparisons.some(
      (item) => item.relativeDifference > 0.05 + Number.EPSILON,
    )
  ) {
    return;
  }

  warnedModels.add(identity);
  warn(
    `[3D model dimensions] ${identity}: ${comparisons
      .map(
        ({ axis, expectedM, actualM }) =>
          `${axis} expected=${expectedM.toFixed(3)}m actual=${actualM.toFixed(3)}m`,
      )
      .join(", ")}`,
  );
}

export function resetDimensionWarningsForTests() {
  warnedModels.clear();
}
