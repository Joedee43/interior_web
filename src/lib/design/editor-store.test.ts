import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import type { DesignDetail } from "./types";

const api = vi.hoisted(() => ({
  createDesignItem: vi.fn(),
  deleteDesignItem: vi.fn(),
  fetchRevisionedDesignDetail: vi.fn(),
  updateDesign: vi.fn(),
  updateDesignItem: vi.fn(),
}));

vi.mock("./api", () => api);

import { createEditorStore } from "./editor-store";

const item = {
  id: "33333333-3333-4333-8333-333333333333",
  position: { xMm: 1000, yMm: 0, zMm: 1000 }, rotationDeg: 0, available: true,
  product: { id: "44444444-4444-4444-8444-444444444444", slug: "chair", name: "Chair", companySlug: "maker", companyName: "Maker", variantId: null, sku: null, options: {}, price: { amountMinor: 100, currency: "ETB" }, dimensions: { widthMm: 500, depthMm: 500, heightMm: 800 }, primaryImageUrl: null, modelUrl: null },
  updatedAt: "2026-11-01T00:00:00Z",
};
const design: DesignDetail = {
  id: "11111111-1111-4111-8111-111111111111", name: "Room", templateId: null,
  room: { widthMm: 5000, depthMm: 5000, heightMm: 2800 }, itemCount: 1,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
  features: { wallColor: "#FFFFFF", floor: "oak", openings: [] }, items: [item],
  estimate: { note: "Not a quote", itemCount: 1, unavailableCount: 0, totals: [{ companySlug: "maker", companyName: "Maker", currency: "ETB", amountMinor: 100, items: 1 }] },
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("editor save queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchRevisionedDesignDetail.mockResolvedValue({ data: design, revision: 2 });
  });

  it("serializes mutations and sends the advanced revision", async () => {
    let finishFirst!: (value: unknown) => void;
    api.updateDesign.mockReturnValue(new Promise((resolve) => { finishFirst = resolve; }));
    api.updateDesignItem.mockResolvedValue({ data: { ...item, rotationDeg: 45 }, revision: 3 });
    const store = createEditorStore(design, 1);

    store.getState().patchDesign({ name: "New room" }, (current) => ({ ...current, name: "New room" }));
    store.getState().patchItem(item.id, { rotation_deg: 45 }, (current) => ({ ...current, rotationDeg: 45 }));
    expect(api.updateDesignItem).not.toHaveBeenCalled();

    finishFirst({ data: { ...design, name: "New room" }, revision: 2 });
    await tick();
    expect(api.updateDesignItem).toHaveBeenCalledWith(design.id, item.id, 2, expect.objectContaining({ rotation_deg: 45 }));
    await tick();
    expect(store.getState().status).toBe("saved");
  });

  it("pauses on stale revisions and retries against the latest ETag", async () => {
    api.updateDesign.mockRejectedValueOnce(new ApiError(409, { code: "stale_revision", message: "stale", request_id: "req-stale" }));
    api.updateDesign.mockResolvedValueOnce({ data: { ...design, name: "Mine" }, revision: 8 });
    api.fetchRevisionedDesignDetail.mockResolvedValue({ data: { ...design, name: "Remote" }, revision: 7 });
    const store = createEditorStore(design, 1);

    store.getState().patchDesign({ name: "Mine" }, (current) => ({ ...current, name: "Mine" }));
    await tick(); await tick();
    expect(store.getState()).toMatchObject({ status: "conflict", requestId: "req-stale", revision: 1 });

    store.getState().applyMine();
    await tick(); await tick();
    expect(api.updateDesign).toHaveBeenLastCalledWith(design.id, 7, expect.objectContaining({ name: "Mine" }));
    expect(store.getState()).toMatchObject({ status: "saved", revision: 8 });
  });

  it("keeps failed drafts retryable and clears auth on 401", async () => {
    const unauthorized = vi.fn();
    api.updateDesignItem.mockRejectedValueOnce(new ApiError(401, { code: "unauthenticated", message: "sign in", request_id: "req-401" }));
    api.updateDesignItem.mockResolvedValueOnce({ data: { ...item, rotationDeg: 90 }, revision: 2 });
    const store = createEditorStore(design, 1, unauthorized);

    store.getState().patchItem(item.id, { rotation_deg: 90 }, (current) => ({ ...current, rotationDeg: 90 }));
    await tick();
    expect(store.getState()).toMatchObject({ status: "error", requestId: "req-401" });
    expect(store.getState().design.items[0]?.rotationDeg).toBe(90);
    expect(unauthorized).toHaveBeenCalledOnce();

    store.getState().retry();
    await tick(); await tick();
    expect(store.getState()).toMatchObject({ status: "saved", revision: 2 });
  });

  it("sends every queued placement, even when added while another save runs", async () => {
    let finishFirst!: (value: unknown) => void;
    api.createDesignItem.mockReturnValueOnce(new Promise((resolve) => { finishFirst = resolve; }));
    api.createDesignItem.mockImplementation(async (_id: string, revision: number) => ({ data: { ...item, id: `item-${revision}` }, revision: revision + 1 }));
    const store = createEditorStore({ ...design, items: [], itemCount: 0 }, 1);
    const place = (x: number) => store.getState().addItem({ product_id: item.product.id, x_mm: x, y_mm: 0, z_mm: 1000, rotation_deg: 0 });

    place(1000); place(2000); place(3000);
    finishFirst({ data: { ...item, id: "item-1" }, revision: 2 });
    for (let i = 0; i < 6; i += 1) await tick();

    expect(api.createDesignItem).toHaveBeenCalledTimes(3);
    expect(api.createDesignItem.mock.calls.map(([, , input]) => (input as { x_mm: number }).x_mm)).toEqual([1000, 2000, 3000]);
    expect(store.getState()).toMatchObject({ status: "saved", revision: 4 });
    expect(store.getState().design.items).toHaveLength(3);
  });

  it("holds later edits behind a failed save instead of dropping the failed change", async () => {
    api.updateDesignItem.mockRejectedValueOnce(new ApiError(500, { code: "internal_error", message: "boom", request_id: "req-500" }));
    api.updateDesignItem.mockImplementation(async (_id: string, itemId: string, revision: number) => ({ data: { ...item, id: itemId, rotationDeg: 90 }, revision: revision + 1 }));
    api.updateDesign.mockImplementation(async (_id: string, revision: number) => ({ data: { ...design, name: "Renamed" }, revision: revision + 1 }));
    const store = createEditorStore(design, 1);

    store.getState().patchItem(item.id, { rotation_deg: 90 }, (current) => ({ ...current, rotationDeg: 90 }));
    await tick();
    expect(store.getState()).toMatchObject({ status: "error", requestId: "req-500" });

    store.getState().patchDesign({ name: "Renamed" }, (current) => ({ ...current, name: "Renamed" }));
    await tick();
    expect(store.getState()).toMatchObject({ status: "error", requestId: "req-500" });
    expect(api.updateDesign).not.toHaveBeenCalled();

    store.getState().retry();
    for (let i = 0; i < 4; i += 1) await tick();
    expect(api.updateDesignItem).toHaveBeenLastCalledWith(design.id, item.id, 1, expect.objectContaining({ rotation_deg: 90 }));
    expect(api.updateDesign).toHaveBeenCalledWith(design.id, 2, expect.objectContaining({ name: "Renamed" }));
    expect(store.getState()).toMatchObject({ status: "saved", revision: 3, requestId: undefined, message: undefined });
  });

  it("removes an item once after a failed delete is retried", async () => {
    api.deleteDesignItem.mockRejectedValueOnce(new ApiError(500, { code: "internal_error", message: "boom" }));
    api.deleteDesignItem.mockRejectedValueOnce(new ApiError(500, { code: "internal_error", message: "boom" }));
    api.deleteDesignItem.mockResolvedValueOnce(2);
    // An older server copy keeps the background refresh from hiding the local result.
    api.fetchRevisionedDesignDetail.mockResolvedValue({ data: design, revision: 1 });
    const store = createEditorStore(design, 1);

    store.getState().removeItem(item.id);
    await tick();
    expect(store.getState().design.items).toHaveLength(1);
    store.getState().retry();
    await tick();
    expect(store.getState().design.items).toHaveLength(1);

    store.getState().retry();
    await tick(); await tick();
    expect(store.getState()).toMatchObject({ status: "saved", revision: 2 });
    expect(store.getState().design.items).toHaveLength(0);
    expect(store.getState().design.itemCount).toBe(0);
  });
});
