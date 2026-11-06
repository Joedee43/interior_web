import type { QuoteLine, QuoteRequest, QuoteStatus, QuoteSubmission } from "./types";

export class QuoteContractError extends Error { constructor(message: string) { super(message); this.name = "QuoteContractError"; } }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = new Set<QuoteStatus>(["pending", "reviewing", "quoted", "accepted", "rejected", "cancelled", "declined"]);

function fail(message: string): never { throw new QuoteContractError(`quote contract ${message}`); }
function record(value: unknown, field: string): Record<string, unknown> { if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${field} must be an object`); return value as Record<string, unknown>; }
function string(value: unknown, field: string, empty = false): string { if (typeof value !== "string" || (!empty && value.length === 0)) fail(`${field} must be a${empty ? "" : " non-empty"} string`); return value; }
function uuid(value: unknown, field: string): string { const result = string(value, field); if (!uuidPattern.test(result)) fail(`${field} must be a UUID`); return result; }
function nullableUUID(value: unknown, field: string): string | null { return value === null ? null : uuid(value, field); }
function integer(value: unknown, field: string, min = 0): number { if (!Number.isSafeInteger(value) || (value as number) < min) fail(`${field} must be a safe integer of at least ${min}`); return value as number; }
function bool(value: unknown, field: string): boolean { if (typeof value !== "boolean") fail(`${field} must be boolean`); return value; }
function dateTime(value: unknown, field: string): string { const result = string(value, field); if (!Number.isFinite(Date.parse(result))) fail(`${field} must be a date-time`); return result; }
function nullableDateTime(value: unknown, field: string): string | null { return value === null ? null : dateTime(value, field); }
function nullableDate(value: unknown, field: string): string | null { if (value === null) return null; const result = string(value, field); if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(new Date(`${result}T00:00:00Z`).valueOf())) fail(`${field} must be a date`); return result; }
function currency(value: unknown, field: string): string { const result = string(value, field); if (!/^[A-Z]{3}$/.test(result)) fail(`${field} must be an uppercase currency code`); return result; }
function options(value: unknown, field: string): Record<string, string> { const raw = record(value, field); const result: Record<string, string> = {}; for (const [key, entry] of Object.entries(raw)) { if (!key || typeof entry !== "string" || !entry) fail(`${field} must contain non-empty string pairs`); result[key] = entry; } return result; }

function normalizeLine(value: unknown, field: string): QuoteLine {
  const line = record(value, field);
  const dimensions = record(line.dimensions, `${field}.dimensions`);
  return {
    id: uuid(line.id, `${field}.id`), productId: nullableUUID(line.product_id, `${field}.product_id`), variantId: nullableUUID(line.variant_id, `${field}.variant_id`),
    productName: string(line.product_name, `${field}.product_name`), productSlug: string(line.product_slug, `${field}.product_slug`), sku: line.sku === null ? null : string(line.sku, `${field}.sku`),
    options: options(line.options, `${field}.options`), dimensions: { widthMm: integer(dimensions.width_mm, `${field}.dimensions.width_mm`, 1), depthMm: integer(dimensions.depth_mm, `${field}.dimensions.depth_mm`, 1), heightMm: integer(dimensions.height_mm, `${field}.dimensions.height_mm`, 1) },
    quantity: integer(line.quantity, `${field}.quantity`, 1), listUnitPriceMinor: integer(line.list_unit_price_minor, `${field}.list_unit_price_minor`), quotedUnitPriceMinor: line.quoted_unit_price_minor === null ? null : integer(line.quoted_unit_price_minor, `${field}.quoted_unit_price_minor`), note: string(line.note, `${field}.note`, true),
  };
}

export function normalizeQuoteRequest(value: unknown, field = "response", requireDetail = true): QuoteRequest {
  const request = record(value, field);
  const company = record(request.company, `${field}.company`); const customer = record(request.customer, `${field}.customer`);
  const status = string(request.status, `${field}.status`) as QuoteStatus; if (!statuses.has(status)) fail(`${field}.status is invalid`);
  if (requireDetail && (!Array.isArray(request.lines) || !Array.isArray(request.charges))) fail(`${field} detail arrays are required`);
  const lines = Array.isArray(request.lines) ? request.lines.map((entry, index) => normalizeLine(entry, `${field}.lines[${index}]`)) : [];
  const charges = Array.isArray(request.charges) ? request.charges.map((entry, index) => { const charge = record(entry, `${field}.charges[${index}]`); return { label: string(charge.label, `${field}.charges[${index}].label`), amountMinor: integer(charge.amount_minor, `${field}.charges[${index}].amount_minor`) }; }) : [];
  if (new Set(lines.map(({ id }) => id)).size !== lines.length) fail(`${field}.lines contains duplicate IDs`);
  const lineCount = integer(request.line_count, `${field}.line_count`); if (requireDetail && lineCount !== lines.length) fail(`${field}.line_count does not match lines`);
  const listTotalMinor = integer(request.list_total_minor, `${field}.list_total_minor`);
  if (requireDetail && lines.reduce((sum, line) => sum + line.listUnitPriceMinor * line.quantity, 0) !== listTotalMinor) fail(`${field}.list_total_minor does not match lines`);
  const quotedTotalMinor = request.quoted_total_minor === null ? null : integer(request.quoted_total_minor, `${field}.quoted_total_minor`);
  if (quotedTotalMinor !== null && requireDetail) { const calculated = lines.reduce((sum, line) => sum + (line.quotedUnitPriceMinor ?? fail(`${field}.lines requires quoted prices`)) * line.quantity, 0) + charges.reduce((sum, charge) => sum + charge.amountMinor, 0); if (calculated !== quotedTotalMinor) fail(`${field}.quoted_total_minor does not match lines and charges`); }
  return {
    id: uuid(request.id, `${field}.id`), submissionId: uuid(request.submission_id, `${field}.submission_id`), designId: nullableUUID(request.design_id, `${field}.design_id`), status, revision: integer(request.revision, `${field}.revision`), final: bool(request.final, `${field}.final`),
    company: { id: uuid(company.id, `${field}.company.id`), slug: (() => { const slug = string(company.slug, `${field}.company.slug`); if (!slugPattern.test(slug)) fail(`${field}.company.slug is invalid`); return slug; })(), name: string(company.name, `${field}.company.name`) },
    customer: { name: string(customer.name, `${field}.customer.name`), email: string(customer.email, `${field}.customer.email`), phone: string(customer.phone, `${field}.customer.phone`, true), deliveryAddress: string(customer.delivery_address, `${field}.customer.delivery_address`, true), note: string(customer.note, `${field}.customer.note`, true) },
    currency: currency(request.currency, `${field}.currency`), listTotalMinor, quotedTotalMinor, validUntil: nullableDate(request.valid_until, `${field}.valid_until`), expired: bool(request.expired, `${field}.expired`), companyNote: string(request.company_note, `${field}.company_note`, true), lineCount, lines, charges,
    submittedAt: dateTime(request.submitted_at, `${field}.submitted_at`), quotedAt: nullableDateTime(request.quoted_at, `${field}.quoted_at`), decidedAt: nullableDateTime(request.decided_at, `${field}.decided_at`),
  };
}

export function normalizeQuoteSubmission(value: unknown, expectedDesignId?: string): QuoteSubmission {
  const submission = record(value, "response"); const submissionId = uuid(submission.submission_id, "response.submission_id");
  if (!Array.isArray(submission.requests) || submission.requests.length === 0) fail("response.requests must be a non-empty array");
  if (!Array.isArray(submission.skipped)) fail("response.skipped must be an array");
  const requests = submission.requests.map((entry, index) => normalizeQuoteRequest(entry, `response.requests[${index}]`, true));
  const skipped = submission.skipped.map((entry, index) => { const item = record(entry, `response.skipped[${index}]`); return { itemId: uuid(item.item_id, `response.skipped[${index}].item_id`), productName: string(item.product_name, `response.skipped[${index}].product_name`) }; });
  if (new Set(requests.map(({ id }) => id)).size !== requests.length || new Set(requests.map(({ company }) => company.id)).size !== requests.length) fail("response.requests contains duplicate requests or companies");
  if (new Set(skipped.map(({ itemId }) => itemId)).size !== skipped.length) fail("response.skipped contains duplicate item IDs");
  for (const request of requests) { if (request.submissionId !== submissionId) fail("response request submission IDs differ"); if (expectedDesignId && request.designId !== expectedDesignId) fail("response request design IDs differ"); if (request.status !== "pending" || request.revision !== 0 || request.final || request.expired || request.quotedTotalMinor !== null || request.validUntil !== null || request.quotedAt !== null || request.decidedAt !== null || request.charges.length !== 0 || request.lines.some((line) => line.quotedUnitPriceMinor !== null)) fail("response contains a non-new quote request"); }
  return { submissionId, requests, skipped };
}

