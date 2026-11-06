import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import type { Account } from "@/lib/auth/types";
import type { DesignDetail } from "@/lib/design/types";
import { fetchDesignDetail } from "@/lib/design/api";
import { submitDesignQuote } from "@/lib/quote/api";
import type { QuoteSubmission } from "@/lib/quote/types";
import { DesignQuoteForm } from "./design-quote-form";

vi.mock("@/lib/design/api", () => ({ fetchDesignDetail: vi.fn() }));
vi.mock("@/lib/quote/api", () => ({ submitDesignQuote: vi.fn() }));

const designId = "11111111-1111-4111-8111-111111111111";
const design: DesignDetail = {
  id: designId, name: "My room", templateId: null, room: { widthMm: 5000, depthMm: 5000, heightMm: 2800 }, itemCount: 2, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", features: { openings: [] },
  items: [
    { id: "22222222-2222-4222-8222-222222222222", position: { xMm: 1, yMm: 0, zMm: 1 }, rotationDeg: 0, available: true, updatedAt: "2026-11-01T00:00:00Z", product: { id: "33333333-3333-4333-8333-333333333333", slug: "chair", name: "Blue Chair", companySlug: "maker", companyName: "Maker", variantId: "44444444-4444-4444-8444-444444444444", sku: "CHAIR-BLUE", options: { Colour: "Blue" }, price: { amountMinor: 10000, currency: "ETB" }, dimensions: { widthMm: 500, depthMm: 500, heightMm: 900 }, primaryImageUrl: null, modelUrl: null } },
    { id: "55555555-5555-4555-8555-555555555555", position: { xMm: 2, yMm: 0, zMm: 2 }, rotationDeg: 0, available: false, updatedAt: "2026-11-01T00:00:00Z", product: { id: "66666666-6666-4666-8666-666666666666", slug: "table", name: "Unavailable Table", companySlug: "maker", companyName: "Maker", variantId: null, sku: null, options: {}, price: { amountMinor: 20000, currency: "ETB" }, dimensions: { widthMm: 1000, depthMm: 600, heightMm: 700 }, primaryImageUrl: null, modelUrl: null } },
  ],
  estimate: { note: "Not a quote", itemCount: 2, unavailableCount: 1, totals: [{ companySlug: "maker", companyName: "Maker", currency: "ETB", amountMinor: 10000, items: 1 }] },
};
const account: Account = { user: { id: "77777777-7777-4777-8777-777777777777", email: "demo@example.com", fullName: "Demo Customer", status: "active", isPlatformAdmin: false, createdAt: "2026-01-01T00:00:00Z" }, memberships: [] };
const submission: QuoteSubmission = { submissionId: "88888888-8888-4888-8888-888888888888", skipped: [{ itemId: design.items[1]!.id, productName: "Unavailable Table" }], requests: [{ id: "99999999-9999-4999-8999-999999999999", submissionId: "88888888-8888-4888-8888-888888888888", designId, status: "pending", revision: 0, final: false, company: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "maker", name: "Maker" }, customer: { name: "Demo Customer", email: "demo@example.com", phone: "", deliveryAddress: "", note: "" }, currency: "ETB", listTotalMinor: 10000, quotedTotalMinor: null, validUntil: null, expired: false, companyNote: "", lineCount: 1, lines: [], charges: [], submittedAt: "2026-11-06T00:00:00Z", quotedAt: null, decidedAt: null }] };

function renderForm(initial = design) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><DesignQuoteForm initialDesign={initial} account={account} /></QueryClientProvider>);
}

beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchDesignDetail).mockResolvedValue(design); });

describe("DesignQuoteForm", () => {
  it("shows maker estimates and unavailable furniture", () => {
    renderForm();
    expect(screen.getByText("Maker")).toBeVisible(); expect(screen.getByText("CHAIR-BLUE", { exact: false })).toBeVisible(); expect(screen.getByText("Unavailable Table")).toBeVisible(); expect(screen.getByText("Demo Customer")).toBeVisible();
  });

  it("requires confirmation and submits trimmed optional contact fields once", async () => {
    vi.mocked(submitDesignQuote).mockResolvedValue(submission); renderForm();
    await userEvent.type(screen.getByLabelText(/Phone/), "  +251 911  ");
    await userEvent.click(screen.getByRole("button", { name: "Send 1 quote request" }));
    expect(await screen.findByText("Confirm before sending the requests")).toBeVisible(); expect(submitDesignQuote).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("checkbox")); await userEvent.click(screen.getByRole("button", { name: "Send 1 quote request" }));
    expect(await screen.findByRole("heading", { name: "Quote requests sent." })).toBeVisible();
    expect(submitDesignQuote).toHaveBeenCalledOnce(); expect(vi.mocked(submitDesignQuote).mock.calls[0]?.[0]).toEqual(expect.objectContaining({ design_id: designId, contact_phone: "+251 911" }));
  });

  it("retains the form and displays backend request IDs without retrying", async () => {
    vi.mocked(submitDesignQuote).mockRejectedValue(new ApiError(500, { code: "internal_error", message: "failed", request_id: "quote-req-500" })); renderForm();
    await userEvent.click(screen.getByRole("checkbox")); await userEvent.click(screen.getByRole("button", { name: "Send 1 quote request" }));
    expect(await screen.findByText(/quote-req-500/)).toBeVisible(); expect(submitDesignQuote).toHaveBeenCalledOnce();
  });

  it("stops when the estimate changes during the final refresh", async () => {
    vi.mocked(fetchDesignDetail).mockResolvedValue({ ...design, items: [{ ...design.items[0]!, available: false }, design.items[1]!] }); renderForm();
    await userEvent.click(screen.getByRole("checkbox")); await userEvent.click(screen.getByRole("button", { name: "Send 1 quote request" }));
    expect(await screen.findByText(/room or its availability changed/i)).toBeVisible(); await waitFor(() => expect(submitDesignQuote).not.toHaveBeenCalled());
  });
});

