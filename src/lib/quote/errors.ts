import { ApiError } from "@/lib/api/error";

export interface QuoteFailure { message: string; requestId?: string; fields: Record<string, string>; ambiguous: boolean; refreshDesign: boolean }
export function quoteFailure(error: unknown): QuoteFailure {
  if (!(error instanceof ApiError)) return { message: "The request may have reached a maker before the connection failed. Confirm before retrying.", fields: {}, ambiguous: true, refreshDesign: false };
  if (error.code === "validation_failed") return { message: "Check the highlighted fields.", requestId: error.requestId, fields: error.details ?? {}, ambiguous: false, refreshDesign: false };
  if (error.code === "nothing_available") return { message: "None of this design’s furniture is currently available. The room has been refreshed.", requestId: error.requestId, fields: {}, ambiguous: false, refreshDesign: true };
  if (error.code === "rate_limited") return { message: "Too many quote submissions. Wait a few minutes before trying again.", requestId: error.requestId, fields: {}, ambiguous: false, refreshDesign: false };
  if (error.status === 404) return { message: "This design is no longer available.", requestId: error.requestId, fields: {}, ambiguous: false, refreshDesign: true };
  return { message: "The quote service could not complete the request.", requestId: error.requestId, fields: {}, ambiguous: false, refreshDesign: false };
}

export interface QuoteActionFailure { message: string; requestId?: string; refresh: boolean }
// State conflicts are business outcomes, not crashes: the page refetches so the
// customer reviews the quote as it is now before deciding again.
export function quoteActionFailure(error: unknown): QuoteActionFailure {
  if (!(error instanceof ApiError)) return { message: "The connection failed, so the action may or may not have been applied. The latest status is shown.", refresh: true };
  const requestId = error.requestId;
  if (error.code === "stale_revision") return { message: "The maker revised this quote. Review the latest revision, then confirm again.", requestId, refresh: true };
  if (error.code === "quote_expired") return { message: "This quote is past its valid-until date and can no longer be accepted.", requestId, refresh: true };
  if (error.code === "invalid_transition") return { message: "This request's status changed. The latest status is shown.", requestId, refresh: true };
  if (error.status === 401) return { message: "Your session ended. Sign in again to continue.", requestId, refresh: false };
  if (error.status === 404) return { message: "This quote request is no longer available.", requestId, refresh: false };
  return { message: "The quote service could not complete the action. Try again.", requestId, refresh: false };
}

