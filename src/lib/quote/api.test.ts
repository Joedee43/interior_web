import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptQuote, cancelQuote, fetchQuotePage, rejectQuote } from "./api";

const id = "33333333-3333-4333-8333-333333333333";
const detail = {
  id, submission_id: "22222222-2222-4222-8222-222222222222", design_id: null,
  status: "accepted", revision: 1, final: true,
  company: { id: "44444444-4444-4444-8444-444444444444", slug: "maker-one", name: "Maker One" },
  customer: { name: "Demo Customer", email: "demo@example.com", phone: "", delivery_address: "", note: "" },
  currency: "ETB", list_total_minor: 1000, quoted_total_minor: 900, valid_until: "2099-12-31", expired: false, company_note: "", line_count: 1,
  lines: [{ id: "55555555-5555-4555-8555-555555555555", product_id: null, variant_id: null, product_name: "Chair", product_slug: "chair", sku: null, options: {}, dimensions: { width_mm: 500, depth_mm: 600, height_mm: 900 }, quantity: 1, list_unit_price_minor: 1000, quoted_unit_price_minor: 900, note: "" }],
  charges: [], submitted_at: "2026-11-06T10:00:00Z", quoted_at: "2026-11-07T10:00:00Z", decided_at: "2026-11-08T10:00:00Z",
};
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("quote browser API", () => {
  it("lists one status and passes the cursor back unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ requests: [], next_cursor: null }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchQuotePage("quoted", "  page+2==  ");

    const url = new URL(fetchMock.mock.calls[0]![0] as string, "https://interior.test");
    expect(url.pathname).toBe("/v1/quote-requests");
    expect(Object.fromEntries(url.searchParams)).toEqual({ limit: "20", status: "quoted", cursor: "  page+2==  " });
  });

  it("accepts with the reviewed revision in the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(detail));
    vi.stubGlobal("fetch", fetchMock);

    await expect(acceptQuote(id, 3)).resolves.toMatchObject({ status: "accepted" });

    expect(fetchMock).toHaveBeenCalledWith(`/v1/quote-requests/${id}/accept`, expect.objectContaining({ method: "POST", credentials: "include", body: JSON.stringify({ revision: 3 }) }));
  });

  it.each([["reject", rejectQuote], ["cancel", cancelQuote]] as const)("%ss with an empty POST", async (action, run) => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ...detail, status: action === "reject" ? "rejected" : "cancelled" }));
    vi.stubGlobal("fetch", fetchMock);

    await run(id);

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe(`/v1/quote-requests/${id}/${action}`);
    expect(init).toMatchObject({ method: "POST" });
    expect(init.body).toBeUndefined();
  });
});
