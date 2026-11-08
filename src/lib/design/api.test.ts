import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteDesign, deleteDesignItem } from "./api";

const designId = "11111111-1111-4111-8111-111111111111";
const itemId = "33333333-3333-4333-8333-333333333333";

afterEach(() => vi.unstubAllGlobals());

describe("design browser API", () => {
  it("deletes a design with If-Match and accepts Go's 204 without an ETag", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteDesign(designId, 4)).resolves.toBeUndefined();

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe(`/v1/designs/${designId}`);
    expect(init).toMatchObject({ method: "DELETE", credentials: "include" });
    expect(new Headers(init.headers).get("If-Match")).toBe('"design-4"');
  });

  it("still reads the next revision after deleting an item", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204, headers: { ETag: '"design-5"' } })));

    await expect(deleteDesignItem(designId, itemId, 4)).resolves.toBe(5);
  });
});
