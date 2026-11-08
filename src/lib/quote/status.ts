import type { QuoteRequest, QuoteStatus } from "./types";

export const quoteStatuses: readonly QuoteStatus[] = ["pending", "reviewing", "quoted", "accepted", "rejected", "cancelled", "declined"];

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  pending: "Sent to maker",
  reviewing: "Maker reviewing",
  quoted: "Quote received",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  declined: "Declined by maker",
};

export function parseQuoteStatus(value: unknown): QuoteStatus | undefined {
  return typeof value === "string" && (quoteStatuses as readonly string[]).includes(value) ? value as QuoteStatus : undefined;
}

export type QuoteAction = "accept" | "reject" | "cancel";

// Mirrors the backend transition table (internal/quote): accept also needs an
// unexpired quote, while an expired quote can still be rejected or cancelled.
export function availableActions(request: Pick<QuoteRequest, "status" | "final" | "expired">): QuoteAction[] {
  if (request.final) return [];
  const actions: QuoteAction[] = [];
  if (request.status === "quoted" && !request.expired) actions.push("accept");
  if (request.status === "quoted") actions.push("reject");
  if (request.status === "pending" || request.status === "reviewing" || request.status === "quoted") actions.push("cancel");
  return actions;
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** Formats an API timestamp in UTC so server and browser render the same text. */
export function formatQuoteDate(value: string): string {
  return dateFormat.format(new Date(value));
}

/** `valid_until` is a calendar date without a time zone. */
export function formatValidUntil(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00Z`));
}
