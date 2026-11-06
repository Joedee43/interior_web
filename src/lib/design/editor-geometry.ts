import type { DesignItem, RoomDimensions, RoomOpening } from "./types";

export function rotatedHalfFootprint(widthMm: number, depthMm: number, rotationDeg: number) {
  const angle = rotationDeg * Math.PI / 180;
  return {
    x: Math.abs(Math.cos(angle)) * widthMm / 2 + Math.abs(Math.sin(angle)) * depthMm / 2,
    z: Math.abs(Math.sin(angle)) * widthMm / 2 + Math.abs(Math.cos(angle)) * depthMm / 2,
  };
}

export function clampItemPosition(room: RoomDimensions, item: Pick<DesignItem, "product" | "rotationDeg">, xMm: number, zMm: number) {
  const half = rotatedHalfFootprint(item.product.dimensions.widthMm, item.product.dimensions.depthMm, item.rotationDeg);
  if (half.x * 2 > room.widthMm || half.z * 2 > room.depthMm) return null;
  return { xMm: Math.round(Math.max(half.x, Math.min(room.widthMm - half.x, xMm))), zMm: Math.round(Math.max(half.z, Math.min(room.depthMm - half.z, zMm))) };
}

export function itemFitsRoom(room: RoomDimensions, item: DesignItem): boolean {
  const position = clampItemPosition(room, item, item.position.xMm, item.position.zMm);
  return position !== null && position.xMm === item.position.xMm && position.zMm === item.position.zMm && item.position.yMm <= room.heightMm;
}

export function openingsOverlap(a: RoomOpening, b: RoomOpening): boolean {
  if (a.wall !== b.wall) return false;
  const horizontal = a.offsetMm < b.offsetMm + b.widthMm && b.offsetMm < a.offsetMm + a.widthMm;
  const vertical = a.sillMm < b.sillMm + b.heightMm && b.sillMm < a.sillMm + a.heightMm;
  return horizontal && vertical;
}

export function openingFitsRoom(room: RoomDimensions, opening: RoomOpening): boolean {
  const wallLength = opening.wall === "north" || opening.wall === "south" ? room.widthMm : room.depthMm;
  return opening.widthMm >= 300 && opening.heightMm >= 300 && opening.offsetMm >= 0 && opening.sillMm >= 0 && opening.offsetMm + opening.widthMm <= wallLength && opening.sillMm + opening.heightMm <= room.heightMm;
}
