import { describe, expect, it } from "vitest";
import { normalizeQuoteSubmission } from "./normalize";

const designId = "11111111-1111-4111-8111-111111111111";
const submissionId = "22222222-2222-4222-8222-222222222222";
const request = {
  id: "33333333-3333-4333-8333-333333333333", submission_id: submissionId, design_id: designId,
  status: "pending", revision: 0, final: false,
  company: { id: "44444444-4444-4444-8444-444444444444", slug: "maker-one", name: "Maker One" },
  customer: { name: "Demo Customer", email: "demo@example.com", phone: "", delivery_address: "", note: "" },
  currency: "ETB", list_total_minor: 2000, quoted_total_minor: null, valid_until: null, expired: false, company_note: "", line_count: 1,
  lines: [{ id: "55555555-5555-4555-8555-555555555555", product_id: "66666666-6666-4666-8666-666666666666", variant_id: null, product_name: "Chair", product_slug: "chair", sku: null, options: {}, dimensions: { width_mm: 500, depth_mm: 600, height_mm: 900 }, quantity: 2, list_unit_price_minor: 1000, quoted_unit_price_minor: null, note: "" }],
  charges: [], submitted_at: "2026-11-06T10:00:00Z", quoted_at: null, decided_at: null,
};
const submission = { submission_id: submissionId, requests: [request], skipped: [{ item_id: "77777777-7777-4777-8777-777777777777", product_name: "Unavailable table" }] };

describe("quote submission normalization", () => {
  it("normalizes a new seller-split submission", () => {
    const result = normalizeQuoteSubmission(submission, designId);
    expect(result.requests[0]).toMatchObject({ status: "pending", revision: 0, listTotalMinor: 2000 });
    expect(result.skipped[0]?.productName).toBe("Unavailable table");
  });

  it.each([
    [{ ...request, submission_id: "88888888-8888-4888-8888-888888888888" }, /submission IDs/],
    [{ ...request, design_id: "88888888-8888-4888-8888-888888888888" }, /design IDs/],
    [{ ...request, status: "quoted" }, /non-new/],
    [{ ...request, revision: 1 }, /non-new/],
    [{ ...request, final: true }, /non-new/],
    [{ ...request, list_total_minor: 1 }, /does not match lines/],
    [{ ...request, currency: "etb" }, /currency/],
    [{ ...request, line_count: 2 }, /line_count/],
  ])("rejects malformed or inconsistent requests", (changed, pattern) => {
    expect(() => normalizeQuoteSubmission({ ...submission, requests: [changed] }, designId)).toThrow(pattern);
  });

  it("rejects duplicate companies and skipped item IDs", () => {
    expect(() => normalizeQuoteSubmission({ ...submission, requests: [request, { ...request, id: "88888888-8888-4888-8888-888888888888" }] }, designId)).toThrow(/duplicate/);
    expect(() => normalizeQuoteSubmission({ ...submission, skipped: [submission.skipped[0], submission.skipped[0]] }, designId)).toThrow(/duplicate/);
  });
});

