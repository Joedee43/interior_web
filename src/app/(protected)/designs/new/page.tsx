import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateDesignForm } from "@/components/design/create-design-form";
import { DesignFailure } from "@/components/design/design-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getRoomTemplates } from "@/lib/design/server";

export const metadata: Metadata = { title: "Create a design", robots: { index: false, follow: false } };
export const instant = false;

export default async function NewDesignPage() {
  let templates;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect("/login?next=%2Fdesigns%2Fnew");
    templates = await getRoomTemplates();
  } catch (error) {
    if (error instanceof ApiError) failure = error;
    else throw error;
  }
  if (failure) return <DesignFailure requestId={failure.requestId} retryUrl="/designs/new" title="Unable to prepare a new design" />;
  return <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8"><Link href="/designs" className="text-sm text-ink/60 underline-offset-4 hover:underline">← My designs</Link><p className="eyebrow mt-10 text-terracotta">New room</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">Create a design</h1><p className="mt-3 mb-10 max-w-2xl text-sm leading-7 text-ink/60">Start with a curated layout or enter your room’s measurements. Furniture can be added in the next editor phase.</p><CreateDesignForm templates={templates!} /></div>;
}
