import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DesignPage, RoomTemplate } from "@/lib/design/types";
import { DesignList } from "./design-list";

const template: RoomTemplate = { id: "11111111-1111-4111-8111-111111111111", slug: "living-room", name: "Living room", description: "Room", room: { widthMm: 5000, depthMm: 6000, heightMm: 2800 }, features: { floor: "oak", wallColor: "#FFFFFF", openings: [] }, sortOrder: 1, updatedAt: "2026-11-01T00:00:00Z" };

function view(page: DesignPage) {
  return render(<QueryClientProvider client={new QueryClient()}><DesignList initialPage={page} templates={[template]} /></QueryClientProvider>);
}

describe("DesignList", () => {
  it("renders an honest empty state", () => {
    view({ designs: [], nextCursor: null });
    expect(screen.getByRole("heading", { name: "Start with an empty room" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create your first design" })).toHaveAttribute("href", "/designs/new");
  });

  it("renders template identity, dimensions, count, and detail link", () => {
    view({ designs: [{ id: "22222222-2222-4222-8222-222222222222", name: "My room", templateId: template.id, room: template.room, itemCount: 2, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-02T00:00:00Z" }], nextCursor: null });
    expect(screen.getByText("Living room")).toBeInTheDocument();
    expect(screen.getByText("5000 × 6000 × 2800 mm")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /My room/ })).toHaveAttribute("href", "/designs/22222222-2222-4222-8222-222222222222");
  });
});
