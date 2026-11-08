import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QuotePage, QuoteRequest, QuoteStatus } from "@/lib/quote/types";

const api = vi.hoisted(() => ({ fetchQuotePage: vi.fn(), fetchQuoteRequest: vi.fn() }));
vi.mock("@/lib/quote/api", () => api);

import { QuoteList } from "./quote-list";

function row(id: string, overrides: Partial<QuoteRequest> = {}): QuoteRequest {
  return {
    id, submissionId: "88000000-0000-4000-8000-000000000001", designId: null, status: "pending", revision: 0, final: false,
    company: { id: "82000000-0000-4000-8000-000000000001", slug: "ergoseat", name: "ErgoSeat" },
    customer: { name: "Demo Customer", email: "demo@example.com", phone: "", deliveryAddress: "", note: "" },
    currency: "ETB", listTotalMinor: 1820000, quotedTotalMinor: null, validUntil: null, expired: false, companyNote: "", lineCount: 2, lines: [], charges: [],
    submittedAt: "2026-11-05T09:00:00Z", quotedAt: null, decidedAt: null, ...overrides,
  };
}

function renderList(status: QuoteStatus | undefined, initialPage: QuotePage) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  render(<QueryClientProvider client={client}><QuoteList status={status} initialPage={initialPage} /></QueryClientProvider>);
}

describe("QuoteList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows list estimates or quoted totals and links to each request", () => {
    renderList(undefined, { nextCursor: null, requests: [row("85000000-0000-4000-8000-000000000001"), row("85000000-0000-4000-8000-000000000002", { status: "quoted", revision: 1, quotedTotalMinor: 1860000, validUntil: "2026-01-10", expired: true })] });

    const links = screen.getAllByRole("link", { name: /ErgoSeat/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/quotes/85000000-0000-4000-8000-000000000001", "/quotes/85000000-0000-4000-8000-000000000002"]);
    expect(links[0]).toHaveTextContent("List estimate");
    expect(links[1]).toHaveTextContent("Quoted total");
    expect(links[1]).toHaveTextContent("Expired");
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
  });

  it("loads the next page with the unchanged cursor", async () => {
    api.fetchQuotePage.mockResolvedValue({ nextCursor: null, requests: [row("85000000-0000-4000-8000-000000000003", { company: { id: "82000000-0000-4000-8000-000000000002", slug: "woodcraft", name: "WoodCraft" } })] });
    renderList("pending", { nextCursor: "  page+2==  ", requests: [row("85000000-0000-4000-8000-000000000001")] });
    expect(screen.getByRole("link", { name: "Sent to maker" })).toHaveAttribute("aria-current", "page");

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(api.fetchQuotePage).toHaveBeenCalledWith("pending", "  page+2==  ");
    expect(await screen.findByRole("link", { name: /WoodCraft/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("offers to clear an empty filter", () => {
    renderList("declined", { nextCursor: null, requests: [] });
    expect(screen.getByRole("heading", { name: /No requests are “Declined by maker”/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show all requests" })).toHaveAttribute("href", "/quotes");
  });
});
