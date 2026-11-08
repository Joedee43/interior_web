import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuoteFailure } from "@/components/quote/quote-failure";
import { QuoteList } from "@/components/quote/quote-list";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getInitialQuotePage } from "@/lib/quote/server";
import { parseQuoteStatus } from "@/lib/quote/status";

export const metadata: Metadata = { title: "My quotes", robots: { index: false, follow: false } };
export const instant = false;

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = parseQuoteStatus((await searchParams).status);
  const returnPath = status ? `/quotes?status=${status}` : "/quotes";
  let initialPage;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
    initialPage = await getInitialQuotePage(status);
  } catch (error) {
    if (error instanceof ApiError) failure = error;
    else throw error;
  }
  if (failure) return <QuoteFailure requestId={failure.requestId} retryUrl={returnPath} />;
  return <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8"><div className="mb-8"><p className="eyebrow text-terracotta">Maker responses</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">My quotes</h1><p className="mt-3 max-w-2xl text-sm text-ink/60">Every maker answers separately. Newest requests come first.</p></div><QuoteList key={status ?? "all"} status={status} initialPage={initialPage!} /></div>;
}
