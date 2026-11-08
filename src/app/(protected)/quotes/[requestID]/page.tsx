import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuoteDetail } from "@/components/quote/quote-detail";
import { QuoteFailure } from "@/components/quote/quote-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getQuoteRequest } from "@/lib/quote/server";

export const metadata: Metadata = { title: "Quote request", robots: { index: false, follow: false } };
export const instant = false;

export default async function QuoteRequestPage({ params }: { params: Promise<{ requestID: string }> }) {
  const { requestID } = await params;
  const returnPath = `/quotes/${encodeURIComponent(requestID)}`;
  let request;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
    request = await getQuoteRequest(requestID);
  } catch (error) {
    if (error instanceof ApiError) failure = error;
    else throw error;
  }
  if (failure?.status === 404) notFound();
  if (failure) return <QuoteFailure requestId={failure.requestId} retryUrl={returnPath} title="Unable to open this quote" />;
  if (!request) notFound();
  return <QuoteDetail initialRequest={request} />;
}
