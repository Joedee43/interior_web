import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignDetail, RoomTemplate } from "@/lib/design/types";
import { CreateDesignForm } from "./create-design-form";

const push = vi.fn();
const refresh = vi.fn();
const createDesign = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/lib/design/api", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/design/api")>()), createDesign: (input: unknown) => createDesign(input) }));

const template: RoomTemplate = { id: "11111111-1111-4111-8111-111111111111", slug: "living-room", name: "Living room", description: "A room", room: { widthMm: 5000, depthMm: 6000, heightMm: 2800 }, features: { floor: "oak", wallColor: "#FFFFFF", openings: [] }, sortOrder: 1, updatedAt: "2026-11-01T00:00:00Z" };
const created = { id: "22222222-2222-4222-8222-222222222222", name: "Studio", templateId: null, room: { widthMm: 4250, depthMm: 5000, heightMm: 2700 }, itemCount: 0, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", features: { floor: "concrete", wallColor: "#ABCDEF", openings: [] }, items: [], estimate: { note: "Not a quote", itemCount: 0, unavailableCount: 0, totals: [] } } satisfies DesignDetail;

function view() {
  return render(<QueryClientProvider client={new QueryClient()}><CreateDesignForm templates={[template]} /></QueryClientProvider>);
}

describe("CreateDesignForm", () => {
  beforeEach(() => { vi.clearAllMocks(); createDesign.mockResolvedValue(created); });

  it("shows templates and switches to custom room controls", async () => {
    view();
    expect(screen.getByRole("button", { name: /Living room/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Custom room" }));
    expect(screen.getByLabelText("Width (metres)")).toHaveValue("4");
    expect(screen.getByLabelText("Floor")).toBeInTheDocument();
  });

  it("converts custom metres exactly and navigates after creation", async () => {
    view();
    await userEvent.type(screen.getByLabelText("Design name"), "Studio");
    await userEvent.click(screen.getByRole("radio", { name: "Custom room" }));
    await userEvent.clear(screen.getByLabelText("Width (metres)"));
    await userEvent.type(screen.getByLabelText("Width (metres)"), "4.25");
    await userEvent.click(screen.getByRole("button", { name: "Create design" }));
    await waitFor(() => expect(createDesign).toHaveBeenCalledWith(expect.objectContaining({ name: "Studio", width_mm: 4250, depth_mm: 5000, height_mm: 2700 })));
    expect(push).toHaveBeenCalledWith(`/designs/${created.id}`);
  });

  it("blocks invalid custom dimensions", async () => {
    view();
    await userEvent.type(screen.getByLabelText("Design name"), "Studio");
    await userEvent.click(screen.getByRole("radio", { name: "Custom room" }));
    await userEvent.clear(screen.getByLabelText("Width (metres)"));
    await userEvent.type(screen.getByLabelText("Width (metres)"), "30.001");
    await userEvent.click(screen.getByRole("button", { name: "Create design" }));
    expect(await screen.findByText("Use a value from 1 to 30 metres")).toBeInTheDocument();
    expect(createDesign).not.toHaveBeenCalled();
  });
});
