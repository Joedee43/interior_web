import { describe, expect, it } from "vitest";
import { buildWallSegments, degreesToYRadians, itemWorldPosition } from "./room-geometry";
import type { DesignItem } from "./types";

const room = { widthMm: 5000, depthMm: 6000, heightMm: 2800 };
const item = { position: { xMm: 1600, yMm: 0, zMm: 1800 }, rotationDeg: 30 } as DesignItem;

describe("room geometry", () => {
  it("maps north-west millimetres into a centred Three.js room", () => {
    const position = itemWorldPosition(room, item);
    expect(position[0]).toBeCloseTo(-0.9);
    expect(position[1]).toBe(0);
    expect(position[2]).toBeCloseTo(-1.2);
    expect(degreesToYRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it("cuts a door and raised window into segmented walls", () => {
    const segments = buildWallSegments(room, [
      { type: "door", wall: "south", offsetMm: 300, widthMm: 900, heightMm: 2100, sillMm: 0 },
      { type: "window", wall: "north", offsetMm: 900, widthMm: 1200, heightMm: 1300, sillMm: 900 },
    ]);
    const overDoor = segments.find((entry) => entry.wall === "south" && entry.alongStartM === 0.3);
    expect(overDoor).toMatchObject({ bottomM: 2.1, heightM: 0.7, alongLengthM: 0.9 });
    const northWindow = segments.filter((entry) => entry.wall === "north" && entry.alongStartM === 0.9);
    expect(northWindow).toEqual([
      { wall: "north", alongStartM: 0.9, alongLengthM: 1.2, bottomM: 0, heightM: 0.9 },
      { wall: "north", alongStartM: 0.9, alongLengthM: 1.2, bottomM: 2.2, heightM: 0.6 },
    ]);
  });

  it("merges overlapping openings instead of producing duplicate geometry", () => {
    const segments = buildWallSegments(room, [
      { type: "window", wall: "west", offsetMm: 1000, widthMm: 1000, heightMm: 1000, sillMm: 500 },
      { type: "window", wall: "west", offsetMm: 1000, widthMm: 1000, heightMm: 1000, sillMm: 1000 },
    ]).filter((entry) => entry.wall === "west" && entry.alongStartM === 1);
    expect(segments).toHaveLength(2);
    expect(segments.map(({ bottomM, heightM }) => [bottomM, heightM])).toEqual([[0, 0.5], [2, 0.8]]);
  });
});
