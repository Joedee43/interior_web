import type { operations } from "@/lib/api/generated/schema";
import { browserApiFetch } from "@/lib/api/browser";
import { normalizeQuoteSubmission } from "./normalize";
import type { QuoteSubmission } from "./types";

type Input = operations["createQuoteRequestsFromDesign"]["requestBody"]["content"]["application/json"];
type Response = operations["createQuoteRequestsFromDesign"]["responses"][201]["content"]["application/json"];
export type SubmitDesignQuoteInput = Input;

export async function submitDesignQuote(input: Input): Promise<QuoteSubmission> {
  const raw = await browserApiFetch<Response>("/v1/quote-requests/from-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return normalizeQuoteSubmission(raw, input.design_id);
}

