import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DesignFailure } from "@/components/design/design-failure";
import { DesignList } from "@/components/design/design-list";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getInitialDesignPage, getRoomTemplates } from "@/lib/design/server";

export const metadata: Metadata = { title: "My designs", robots: { index: false, follow: false } };
export const instant = false;

export default async function DesignsPage() {
  let initialPage;
  let templates;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect("/login?next=%2Fdesigns");
    [initialPage, templates] = await Promise.all([getInitialDesignPage(), getRoomTemplates()]);
  } catch (error) {
    if (error instanceof ApiError) failure = error;
    else throw error;
  }
  if (failure) return <DesignFailure requestId={failure.requestId} retryUrl="/designs" />;
  return <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-terracotta">Saved rooms</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">My designs</h1><p className="mt-3 text-sm text-ink-muted">Rooms are ordered by their most recent change.</p></div><Button asChild size="lg"><Link href="/designs/new">Create a design</Link></Button></div><DesignList initialPage={initialPage!} templates={templates!} /></div>;
}
