"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { formatMoney } from "@/lib/catalog/format";
import { useQuotes } from "@/lib/quote/query";
import { formatQuoteDate, formatValidUntil, quoteStatuses, quoteStatusLabels } from "@/lib/quote/status";
import type { QuotePage, QuoteStatus } from "@/lib/quote/types";
import { QuoteStatusBadge } from "./quote-status";

function StatusFilter({ status }: { status?: QuoteStatus }) {
  const options: Array<{ value?: QuoteStatus; label: string }> = [{ label: "All" }, ...quoteStatuses.map((value) => ({ value, label: quoteStatusLabels[value] }))];
  return (
    <nav aria-label="Filter quotes by status" className="mb-8 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === status;
        return (
          <Link key={option.label} href={option.value ? `/quotes?status=${option.value}` : "/quotes"} aria-current={active ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${active ? "border-ink bg-ink text-canvas" : "border-ink/15 hover:border-ink/35"}`}>
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function QuoteList({ status, initialPage }: { status?: QuoteStatus; initialPage: QuotePage }) {
  const query = useQuotes(status, initialPage);
  const requests = query.data?.pages.flatMap((page) => page.requests) ?? [];

  if (query.isError && requests.length === 0) {
    const requestId = query.error instanceof ApiError ? query.error.requestId : undefined;
    return <div><StatusFilter status={status} /><div role="alert" className="rounded-2xl border border-terracotta/20 bg-terracotta/10 p-6"><p className="font-medium">Unable to load your quotes.</p>{requestId && <p className="mt-2 font-mono text-xs">Request ID: {requestId}</p>}<Button className="mt-4" onClick={() => void query.refetch()}>Retry</Button></div></div>;
  }

  if (requests.length === 0) {
    return (
      <div>
        <StatusFilter status={status} />
        <div className="rounded-3xl border border-dashed border-ink/20 bg-canvas-deep/20 px-6 py-16 text-center">
          <h2 className="font-serif text-3xl">{status ? `No requests are “${quoteStatusLabels[status]}”` : "No quote requests yet"}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-muted">Plan a room, then request quotes from its makers. Each maker’s answer appears here.</p>
          <Button asChild className="mt-7"><Link href={status ? "/quotes" : "/designs"}>{status ? "Show all requests" : "Open my designs"}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StatusFilter status={status} />
      {query.isFetching && !query.isFetchingNextPage && <p className="mb-4 text-xs text-ink-muted" role="status">Refreshing quotes…</p>}
      <ul className="grid gap-5 md:grid-cols-2">
        {requests.map((request) => (
          <li key={request.id}>
            <Link href={`/quotes/${request.id}`} className="block rounded-2xl border border-ink/10 bg-canvas p-6 transition hover:-translate-y-0.5 hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
              <QuoteStatusBadge status={request.status} expired={request.expired} />
              <h2 className="mt-4 font-serif text-2xl">{request.company.name}</h2>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
                <div><dt className="text-ink-muted">{request.quotedTotalMinor === null ? "List estimate" : "Quoted total"}</dt><dd className="mt-1 text-sm font-medium">{formatMoney(request.quotedTotalMinor ?? request.listTotalMinor, request.currency)}</dd></div>
                <div><dt className="text-ink-muted">Items</dt><dd className="mt-1 text-sm font-medium">{request.lineCount}</dd></div>
                <div><dt className="text-ink-muted">Sent</dt><dd className="mt-1 font-medium">{formatQuoteDate(request.submittedAt)}</dd></div>
                {request.validUntil && <div><dt className="text-ink-muted">Valid until</dt><dd className="mt-1 font-medium">{formatValidUntil(request.validUntil)}</dd></div>}
              </dl>
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage && <Button variant="secondary" className="mt-8" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more"}</Button>}
      {query.isError && requests.length > 0 && <p role="alert" className="mt-4 text-sm text-terracotta">More quotes could not be loaded. Try again.</p>}
    </div>
  );
}
