import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DesignDetail } from "@/lib/design/types";
import { EditableFloorPlan } from "./editable-floor-plan";

const item = {
  id: "33333333-3333-4333-8333-333333333333",
  position: { xMm: 1000, yMm: 0, zMm: 1000 }, rotationDeg: 0, available: true,
  product: { id: "44444444-4444-4444-8444-444444444444", slug: "chair", name: "Chair", companySlug: "maker", companyName: "Maker", variantId: null, sku: null, options: {}, price: { amountMinor: 100, currency: "ETB" }, dimensions: { widthMm: 500, depthMm: 500, heightMm: 800 }, primaryImageUrl: null, modelUrl: null },
  updatedAt: "2026-11-01T00:00:00Z",
};
// A 2:1 room letterboxed into the 4:3 frame: 400×300 px shows it at 1/15 scale
// with 50 px bands above and below.
const design: DesignDetail = {
  id: "11111111-1111-4111-8111-111111111111", name: "Wide room", templateId: null,
  room: { widthMm: 6000, depthMm: 3000, heightMm: 2800 }, itemCount: 1,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
  features: { wallColor: "#FFFFFF", floor: "oak", openings: [] }, items: [item],
  estimate: { note: "Not a quote", itemCount: 1, unavailableCount: 0, totals: [] },
};

function renderPlan() {
  const onSelect = vi.fn();
  const onMove = vi.fn();
  render(<EditableFloorPlan design={design} selectedId={null} onSelect={onSelect} onMove={onMove} />);
  const plan = screen.getByTestId("editable-floor-plan");
  plan.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0, toJSON: () => ({}) });
  return { onSelect, onMove, plan, piece: screen.getByTestId(`floor-item-${item.id}`) };
}

describe("EditableFloorPlan", () => {
  it("selects on a plain click without moving or saving", () => {
    const { onSelect, onMove, plan, piece } = renderPlan();

    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 70, clientY: 120 });
    fireEvent.pointerMove(plan, { pointerId: 1, clientX: 71, clientY: 121 });
    fireEvent.pointerUp(plan, { pointerId: 1, clientX: 71, clientY: 121 });

    expect(onSelect).toHaveBeenCalledWith(item.id);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("keeps the grab offset and commits once on release", () => {
    const { onMove, plan, piece } = renderPlan();

    // Grabbed 50 mm right of and below the centre (1050, 1050).
    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 70, clientY: 120 });
    fireEvent.pointerMove(plan, { pointerId: 1, clientX: 100, clientY: 140 });
    fireEvent.pointerUp(plan, { pointerId: 1, clientX: 100, clientY: 140 });

    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onMove).toHaveBeenNthCalledWith(1, item.id, expect.closeTo(1450, 5), expect.closeTo(1300, 5), false);
    expect(onMove).toHaveBeenNthCalledWith(2, item.id, expect.closeTo(1450, 5), expect.closeTo(1300, 5), true);
  });

  it("is operable from the keyboard: Enter selects, arrows nudge and save", () => {
    const { onSelect, onMove, piece } = renderPlan();
    expect(piece).toHaveAttribute("tabindex", "0");
    expect(piece).toHaveAccessibleName("Chair, 1000 millimetres from the west wall, 1000 from the north wall");

    fireEvent.keyDown(piece, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(item.id);

    fireEvent.keyDown(piece, { key: "ArrowRight" });
    fireEvent.keyDown(piece, { key: "ArrowDown", shiftKey: true });
    expect(onMove).toHaveBeenNthCalledWith(1, item.id, 1010, 1000, true);
    expect(onMove).toHaveBeenNthCalledWith(2, item.id, 1000, 1100, true);

    fireEvent.keyDown(piece, { key: "a" });
    expect(onMove).toHaveBeenCalledTimes(2);
  });
});
