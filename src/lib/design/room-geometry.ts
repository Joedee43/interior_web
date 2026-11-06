import type { DesignItem, RoomDimensions, RoomOpening, Wall } from "./types";

export interface WallSegment {
  wall: Wall;
  alongStartM: number;
  alongLengthM: number;
  bottomM: number;
  heightM: number;
}

export function itemWorldPosition(room: RoomDimensions, item: DesignItem): [number, number, number] {
  return [item.position.xMm / 1000 - room.widthMm / 2000, item.position.yMm / 1000, item.position.zMm / 1000 - room.depthMm / 2000];
}

export function degreesToYRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function buildWallSegments(room: RoomDimensions, openings: RoomOpening[]): WallSegment[] {
  return (["north", "south", "east", "west"] as const).flatMap((wall) => {
    const lengthMm = wall === "north" || wall === "south" ? room.widthMm : room.depthMm;
    const onWall = openings.filter((opening) => opening.wall === wall);
    const points = [...new Set([0, lengthMm, ...onWall.flatMap((opening) => [opening.offsetMm, opening.offsetMm + opening.widthMm])])].sort((a, b) => a - b);
    const segments: WallSegment[] = [];
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]!;
      const end = points[index + 1]!;
      if (end <= start) continue;
      const midpoint = (start + end) / 2;
      const blocked = onWall
        .filter((opening) => midpoint >= opening.offsetMm && midpoint < opening.offsetMm + opening.widthMm)
        .map((opening) => [opening.sillMm, opening.sillMm + opening.heightMm] as const)
        .sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [];
      for (const range of blocked) {
        const previous = merged.at(-1);
        if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
        else merged.push([range[0], range[1]]);
      }
      let bottom = 0;
      for (const [blockedStart, blockedEnd] of merged) {
        if (blockedStart > bottom) segments.push(segment(wall, start, end, bottom, blockedStart));
        bottom = Math.max(bottom, blockedEnd);
      }
      if (bottom < room.heightMm) segments.push(segment(wall, start, end, bottom, room.heightMm));
    }
    return segments;
  });
}

function segment(wall: Wall, start: number, end: number, bottom: number, top: number): WallSegment {
  return { wall, alongStartM: start / 1000, alongLengthM: (end - start) / 1000, bottomM: bottom / 1000, heightM: (top - bottom) / 1000 };
}
