import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import type { QuoteRequest } from "@/lib/quote/types";

const api = vi.hoisted(() => ({ acceptQuote: vi.fn(), rejectQuote: vi.fn(), cancelQuote: vi.fn(), fetchQuoteRequest: vi.fn(), fetchQuotePage: vi.fn() }));
vi.mock("@/lib/quote/api", () => api);

import { QuoteDetail } from "./quote-detail";

const quoted: QuoteRequest = {
  id: "85000000-0000-4000-8000-000000000002", submissionId: "88000000-0000-4000-8000-000000000002", designId: "55555555-5555-4555-8555-555555555555",
  status: "quoted", revision: 2, final: false,
  company: { id: "82000000-0000-4000-8000-000000000001", slug: "ergoseat", name: "ErgoSeat" },
  customer: { name: "Demo Customer", email: "demo@example.com", phone: "", deliveryAddress: "Bole", note: "" },
  currency: "ETB", listTotalMinor: 1700000, quotedTotalMinor: 1750000, validUntil: "2099-12-31", expired: false, companyNote: "Price includes assembly.", lineCount: 1,
  lines: [{ id: "86000000-0000-4000-8000-000000000002", productId: null, variantId: null, productName: "Ergo Task Chair", productSlug: "ergo-task-chair", sku: "ERGO-GREY", options: { Colour: "Grey" }, dimensions: { widthMm: 650, depthMm: 600, heightMm: 1100 }, quantity: 2, listUnitPriceMinor: 850000, quotedUnitPriceMinor: 800000, note: "" }],
  charges: [{ label: "Delivery to Bole", amountMinor: 150000 }],
  submittedAt: "2026-11-04T09:00:00Z", quotedAt: "2026-11-05T09:00:00Z", decidedAt: null,
};

function renderDetail(request: QuoteRequest) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><QuoteDetail initialRequest={request} /></QueryClientProvider>);
}
const decision = () => screen.queryByRole("heading", { name: "Your decision" })?.closest("section");

describe("QuoteDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the quote with charges and only the actions its status allows", () => {
    renderDetail(quoted);
    expect(screen.getByText("Delivery to Bole")).toBeInTheDocument();
    expect(screen.getByText("Quoted total")).toBeInTheDocument();
    expect(within(decision()!).getAllByRole("button").map((button) => button.textContent)).toEqual(["Accept quote", "Reject quote", "Cancel request"]);
  });

  it("hides Accept on an expired quote and every action once final", () => {
    renderDetail({ ...quoted, expired: true });
    expect(screen.getByText(/This quote expired on Dec 31, 2099/)).toBeInTheDocument();
    expect(within(decision()!).queryByRole("button", { name: "Accept quote" })).not.toBeInTheDocument();
  });

  it("shows no decision panel for an accepted quote", () => {
    renderDetail({ ...quoted, status: "accepted", final: true, decidedAt: "2026-11-06T09:00:00Z" });
    expect(decision()).toBeUndefined();
  });

  it("accepts the revision on screen after confirmation", async () => {
    api.acceptQuote.mockResolvedValue({ ...quoted, status: "accepted", final: true, decidedAt: "2026-11-06T09:00:00Z" });
    renderDetail(quoted);

    await userEvent.click(screen.getByRole("button", { name: "Accept quote" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("revision 2");
    await userEvent.click(within(dialog).getByRole("button", { name: "Accept quote" }));

    expect(api.acceptQuote).toHaveBeenCalledWith(quoted.id, 2);
    await waitFor(() => expect(screen.getByText("Accepted")).toBeInTheDocument());
    expect(decision()).toBeUndefined();
  });

  it("asks for a fresh review when the maker revised the quote meanwhile", async () => {
    api.acceptQuote.mockRejectedValue(new ApiError(409, { code: "stale_revision", message: "stale", request_id: "req-stale" }));
    api.fetchQuoteRequest.mockResolvedValue({ ...quoted, revision: 3, quotedTotalMinor: 1700000 });
    renderDetail(quoted);

    await userEvent.click(screen.getByRole("button", { name: "Accept quote" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Accept quote" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/revised this quote/);
    expect(screen.getByText("req-stale", { exact: false })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Quote revision 3/)).toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels a pending request", async () => {
    const pending = { ...quoted, status: "pending" as const, revision: 0, quotedTotalMinor: null, validUntil: null, charges: [], quotedAt: null, lines: quoted.lines.map((line) => ({ ...line, quotedUnitPriceMinor: null })) };
    api.cancelQuote.mockResolvedValue({ ...pending, status: "cancelled", final: true });
    renderDetail(pending);
    expect(within(decision()!).getAllByRole("button").map((button) => button.textContent)).toEqual(["Cancel request"]);

    await userEvent.click(screen.getByRole("button", { name: "Cancel request" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel request" }));

    expect(api.cancelQuote).toHaveBeenCalledWith(quoted.id);
    await waitFor(() => expect(screen.getByText("Cancelled")).toBeInTheDocument());
  });
});
