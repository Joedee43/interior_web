import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignQuoteForm } from "@/components/quote/design-quote-form";
import { DesignFailure } from "@/components/design/design-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getDesign } from "@/lib/design/server";

export const metadata: Metadata = { title: "Request quotes", robots: { index: false, follow: false } };
export const instant = false;

export default async function DesignQuotePage({ params }: { params: Promise<{ designID: string }> }) {
  const { designID } = await params; const returnPath = `/designs/${encodeURIComponent(designID)}/quote`;
  let account; let design; let failure: ApiError | undefined;
  try { account = await getCurrentAccount(); if (!account) redirect(`/login?next=${encodeURIComponent(returnPath)}`); design = await getDesign(designID); }
  catch (error) { if (error instanceof ApiError) failure = error; else throw error; }
  if (failure?.status === 404) notFound();
  if (failure) return <DesignFailure requestId={failure.requestId} retryUrl={returnPath} title="Unable to prepare quote requests" />;
  if (!design || !account) notFound();
  return <DesignQuoteForm initialDesign={design} account={account} />;
}

