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

