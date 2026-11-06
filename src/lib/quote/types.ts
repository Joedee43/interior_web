export type QuoteStatus = "pending" | "reviewing" | "quoted" | "accepted" | "rejected" | "cancelled" | "declined";

export interface QuoteLine {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string;
  sku: string | null;
  options: Record<string, string>;
  dimensions: { widthMm: number; depthMm: number; heightMm: number };
  quantity: number;
  listUnitPriceMinor: number;
  quotedUnitPriceMinor: number | null;
  note: string;
}

export interface QuoteRequest {
  id: string;
  submissionId: string;
  designId: string | null;
  status: QuoteStatus;
  revision: number;
  final: boolean;
  company: { id: string; slug: string; name: string };
  customer: { name: string; email: string; phone: string; deliveryAddress: string; note: string };
  currency: string;
  listTotalMinor: number;
  quotedTotalMinor: number | null;
  validUntil: string | null;
  expired: boolean;
  companyNote: string;
  lineCount: number;
  lines: QuoteLine[];
  charges: Array<{ label: string; amountMinor: number }>;
  submittedAt: string;
  quotedAt: string | null;
  decidedAt: string | null;
}

export interface QuoteSubmission {
  submissionId: string;
  requests: QuoteRequest[];
  skipped: Array<{ itemId: string; productName: string }>;
}

