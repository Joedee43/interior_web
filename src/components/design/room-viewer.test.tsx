import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignDetail } from "@/lib/design/types";
import { RoomViewer } from "./room-viewer";

let desktop = false;
let webgl = true;
vi.mock("next/dynamic", () => ({ default: () => function SceneStub({ onFailure }: { onFailure: () => void }) { return <div data-testid="room-3d-scene"><button onClick={onFailure}>Lose WebGL</button><button>Reset view</button></div>; } }));
vi.mock("@/components/product/product-preview", () => ({ supportsWebGL2: () => webgl }));

const design: DesignDetail = {
  id: "11111111-1111-4111-8111-111111111111", name: "My room", templateId: null,
  room: { widthMm: 5000, depthMm: 6000, heightMm: 2800 }, itemCount: 0,
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
  features: { floor: "oak", wallColor: "#FFFFFF", openings: [] }, items: [],
  estimate: { note: "Not a quote", itemCount: 0, unavailableCount: 0, totals: [] },
};

describe("RoomViewer", () => {
  beforeEach(() => {
    desktop = false;
    webgl = true;
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: desktop, media: "", addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  it("defers 3D on mobile until explicitly requested", async () => {
    render(<RoomViewer design={design} />);
    expect(screen.getByTestId("room-floor-plan")).toBeInTheDocument();
    expect(screen.queryByTestId("room-3d-scene")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("load-3d-room"));
    expect(screen.getByTestId("room-3d-scene")).toBeInTheDocument();
  });

  it("loads 3D automatically on desktop", async () => {
    desktop = true;
    render(<RoomViewer design={design} />);
    await waitFor(() => expect(screen.getByTestId("room-3d-scene")).toBeInTheDocument());
  });

  it("returns to the floor plan after context failure", async () => {
    desktop = true;
    render(<RoomViewer design={design} />);
    await userEvent.click(await screen.findByRole("button", { name: "Lose WebGL" }));
    expect(screen.getByTestId("room-floor-plan")).toBeInTheDocument();
    expect(screen.getByText(/3D is unavailable/)).toBeInTheDocument();
  });

  it("keeps the floor plan when WebGL2 is unavailable", async () => {
    desktop = true;
    webgl = false;
    render(<RoomViewer design={design} />);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.queryByTestId("room-3d-scene")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("load-3d-room"));
    expect(screen.getByText(/3D is unavailable/)).toBeInTheDocument();
  });
});
