import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignDetail } from "@/lib/design/types";

const api = vi.hoisted(() => ({
  createDesignItem: vi.fn(),
  deleteDesign: vi.fn(),
  deleteDesignItem: vi.fn(),
  fetchRevisionedDesignDetail: vi.fn(),
  updateDesign: vi.fn(),
  updateDesignItem: vi.fn(),
}));
vi.mock("@/lib/design/api", () => api);
vi.mock("next/dynamic", () => ({ default: () => function SceneStub() { return <div data-testid="room-3d-scene" />; } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import { DesignEditor } from "./editor-shell";

const windowAt = (offsetMm: number) => ({ type: "window" as const, wall: "north" as const, offsetMm, widthMm: 900, heightMm: 900, sillMm: 900 });
const design: DesignDetail = {
  id: "11111111-1111-4111-8111-111111111111", name: "Room", templateId: null,
  room: { widthMm: 5000, depthMm: 4000, heightMm: 2800 }, itemCount: 0,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
  features: { wallColor: "#FFFFFF", floor: "oak", openings: [windowAt(0), windowAt(2000)] }, items: [],
  estimate: { note: "Not a quote", itemCount: 0, unavailableCount: 0, totals: [] },
};

describe("DesignEditor room settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, media: "", addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    api.fetchRevisionedDesignDetail.mockResolvedValue({ data: design, revision: 1 });
  });

  it("shows the remaining opening's values after removing an earlier one", async () => {
    const remaining = { ...design, features: { ...design.features, openings: [windowAt(2000)] } };
    api.updateDesign.mockResolvedValue({ data: remaining, revision: 2 });
    render(<QueryClientProvider client={new QueryClient()}><DesignEditor design={design} revision={1} /></QueryClientProvider>);
    expect(screen.getAllByLabelText("offset m").map((input) => (input as HTMLInputElement).value)).toEqual(["0", "2"]);

    await userEvent.click(screen.getAllByRole("button", { name: "Remove opening" })[0]!);

    await waitFor(() => expect(screen.getAllByLabelText("offset m").map((input) => (input as HTMLInputElement).value)).toEqual(["2"]));
    expect(api.updateDesign).toHaveBeenCalledWith(design.id, 1, expect.objectContaining({ features: expect.objectContaining({ openings: [expect.objectContaining({ offset_mm: 2000 })] }) }));
  });
});
