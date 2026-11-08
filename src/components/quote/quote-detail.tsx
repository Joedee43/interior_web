"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/catalog/format";
import { clearAccountOnUnauthorized } from "@/lib/query/client";
import { acceptQuote, cancelQuote, rejectQuote } from "@/lib/quote/api";
import { quoteActionFailure, type QuoteActionFailure } from "@/lib/quote/errors";
import { quoteKeys, useQuoteRequest } from "@/lib/quote/query";
import { availableActions, formatQuoteDate, formatValidUntil, type QuoteAction } from "@/lib/quote/status";
import type { QuoteRequest } from "@/lib/quote/types";
import { QuoteStatusBadge } from "./quote-status";

const actionLabels: Record<QuoteAction, string> = { accept: "Accept quote", reject: "Reject quote", cancel: "Cancel request" };

function confirmCopy(action: QuoteAction, request: QuoteRequest): { title: string; body: string; confirm: string } {
  const total = formatMoney(request.quotedTotalMinor ?? request.listTotalMinor, request.currency);
  if (action === "accept") return { title: `Accept ${total} from ${request.company.name}?`, body: `You are accepting revision ${request.revision} exactly as shown. This tells the maker you agree; no payment is taken here.`, confirm: "Accept quote" };
  if (action === "reject") return { title: `Reject the quote from ${request.company.name}?`, body: "The maker will see that you declined this price. This cannot be undone.", confirm: "Reject quote" };
  return { title: `Cancel your request to ${request.company.name}?`, body: "The maker will stop working on it. This cannot be undone.", confirm: "Cancel request" };
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-ink-muted">{label}</dt><dd className="mt-1 font-medium">{children}</dd></div>;
}

export function QuoteDetail({ initialRequest }: { initialRequest: QuoteRequest }) {
  const queryClient = useQueryClient();
  const query = useQuoteRequest(initialRequest.id, initialRequest);
  const request = query.data;
  // The dialog keeps the request as it was when opened, so Accept sends the
  // revision the customer actually read even if a refetch lands meanwhile.
  const [confirming, setConfirming] = useState<{ action: QuoteAction; request: QuoteRequest }>();
  const [failure, setFailure] = useState<QuoteActionFailure>();
  const mutation = useMutation({
    mutationFn: ({ action, request: seen }: { action: QuoteAction; request: QuoteRequest }) => action === "accept" ? acceptQuote(seen.id, seen.revision) : action === "reject" ? rejectQuote(seen.id) : cancelQuote(seen.id),
    retry: false,
    onSuccess: async (updated) => { queryClient.setQueryData(quoteKeys.detail(updated.id), updated); await queryClient.invalidateQueries({ queryKey: quoteKeys.lists }); },
  });
  const actions = availableActions(request);
  const quoted = request.quotedTotalMinor !== null;
  const copy = confirming ? confirmCopy(confirming.action, confirming.request) : undefined;

  const run = async () => {
    if (!confirming) return;
    setFailure(undefined);
    try { await mutation.mutateAsync(confirming); setConfirming(undefined); }
    catch (error) { clearAccountOnUnauthorized(queryClient, error); const next = quoteActionFailure(error); setFailure(next); setConfirming(undefined); if (next.refresh) await query.refetch(); }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <Link href="/quotes" className="text-sm underline">← My quotes</Link>
      <header className="mt-7 flex flex-col gap-5 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <QuoteStatusBadge status={request.status} expired={request.expired} />
          <h1 className="mt-4 font-serif text-5xl tracking-tight">{request.company.name}</h1>
          <p className="mt-3 text-sm text-ink-muted">Sent {formatQuoteDate(request.submittedAt)}{request.revision > 0 && ` · Quote revision ${request.revision}`}</p>
        </div>
        {request.designId && <Button asChild variant="secondary"><Link href={`/designs/${request.designId}`}>View room</Link></Button>}
      </header>

      {failure && <div role="alert" className="mt-6 rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta"><p>{failure.message}</p>{failure.requestId && <p className="mt-1 font-mono text-xs">Request ID: {failure.requestId}</p>}</div>}
      {request.status === "quoted" && request.expired && <p className="mt-6 rounded-xl bg-sand/30 p-4 text-sm">This quote expired on {request.validUntil ? formatValidUntil(request.validUntil) : "its valid-until date"}. Ask the maker for a new quote, or reject or cancel it.</p>}
      {(request.status === "pending" || request.status === "reviewing") && <p className="mt-6 rounded-xl bg-sand/30 p-4 text-sm">The maker has not sent a price yet. The amounts below are catalog list prices from when you sent the request.</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_.6fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink/10 bg-canvas p-5">
            <h2 className="font-serif text-2xl">Items</h2>
            <ul className="mt-4 divide-y divide-ink/10">
              {request.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{line.productName}</span>
                    <span className="block text-xs text-ink-muted">{Object.entries(line.options).map(([name, value]) => `${name}: ${value}`).join(" · ") || "Standard configuration"}{line.sku ? ` · ${line.sku}` : ""} · Qty {line.quantity}</span>
                    {line.note && <span className="mt-1 block text-xs italic text-ink/65">Maker: {line.note}</span>}
                  </div>
                  <div className="text-right">
                    {line.quotedUnitPriceMinor !== null && <span className="block font-medium">{formatMoney(line.quotedUnitPriceMinor * line.quantity, request.currency)}</span>}
                    <span className={`block ${line.quotedUnitPriceMinor !== null ? "text-xs text-ink-muted line-through" : ""}`}>{formatMoney(line.listUnitPriceMinor * line.quantity, request.currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
            {request.charges.length > 0 && (
              <ul aria-label="Charges" className="mt-2 divide-y divide-ink/10 border-t border-ink/10">
                {request.charges.map((charge, index) => <li key={`${charge.label}-${index}`} className="flex justify-between gap-4 py-3 text-sm"><span>{charge.label}</span><span>{formatMoney(charge.amountMinor, request.currency)}</span></li>)}
              </ul>
            )}
            <dl className="mt-2 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">List estimate</dt><dd>{formatMoney(request.listTotalMinor, request.currency)}</dd></div>
              {quoted && <div className="flex justify-between text-base"><dt className="font-medium">Quoted total</dt><dd className="font-semibold">{formatMoney(request.quotedTotalMinor!, request.currency)}</dd></div>}
            </dl>
          </section>
          {request.companyNote && <section className="rounded-2xl bg-canvas-deep/40 p-5"><h2 className="font-medium">{request.status === "declined" ? "Why the maker declined" : "Note from the maker"}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink/70">{request.companyNote}</p></section>}
        </div>

        <aside className="space-y-6">
          {actions.length > 0 && (
            <section className="rounded-2xl border border-ink/10 bg-canvas p-5">
              <h2 className="font-serif text-2xl">Your decision</h2>
              <div className="mt-4 flex flex-col gap-3">
                {actions.map((action) => <Button key={action} variant={action === "accept" ? "primary" : "secondary"} disabled={mutation.isPending} onClick={() => { setFailure(undefined); setConfirming({ action, request }); }}>{actionLabels[action]}</Button>)}
              </div>
            </section>
          )}
          <section className="rounded-2xl border border-ink/10 bg-canvas p-5">
            <h2 className="font-serif text-2xl">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {request.validUntil && <Detail label="Valid until">{formatValidUntil(request.validUntil)}</Detail>}
              {request.quotedAt && <Detail label="Quoted">{formatQuoteDate(request.quotedAt)}</Detail>}
              {request.decidedAt && <Detail label="Decided">{formatQuoteDate(request.decidedAt)}</Detail>}
              <Detail label="Your name">{request.customer.name}</Detail>
              <Detail label="Email">{request.customer.email}</Detail>
              {request.customer.phone && <Detail label="Phone">{request.customer.phone}</Detail>}
              {request.customer.deliveryAddress && <Detail label="Delivery address"><span className="whitespace-pre-line">{request.customer.deliveryAddress}</span></Detail>}
              {request.customer.note && <Detail label="Your note"><span className="whitespace-pre-line">{request.customer.note}</span></Detail>}
              <Detail label="Submission"><span className="font-mono text-xs">{request.submissionId}</span></Detail>
            </dl>
          </section>
        </aside>
      </div>

      <Dialog.Root open={confirming !== undefined} onOpenChange={(open) => { if (!open && !mutation.isPending) setConfirming(undefined); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45" />
          {copy && (
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-canvas p-6">
              <Dialog.Title className="font-serif text-2xl">{copy.title}</Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-ink/65">{copy.body}</Dialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <Dialog.Close asChild><Button variant="secondary" disabled={mutation.isPending}>Keep it</Button></Dialog.Close>
                <Button disabled={mutation.isPending} onClick={() => void run()}>{mutation.isPending ? "Saving…" : copy.confirm}</Button>
              </div>
            </Dialog.Content>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
