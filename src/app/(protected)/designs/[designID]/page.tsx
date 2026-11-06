import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignDetailView } from "@/components/design/design-detail-view";
import { DesignFailure } from "@/components/design/design-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getDesign } from "@/lib/design/server";

export const metadata: Metadata = { title: "Room design", robots: { index: false, follow: false } };
export const instant = false;

export default async function DesignPage({ params }: { params: Promise<{ designID: string }> }) {
  const { designID } = await params;
  const returnPath = `/designs/${encodeURIComponent(designID)}`;
  let design;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
    design = await getDesign(designID);
  } catch (error) {
    if (error instanceof ApiError) failure = error;
    else throw error;
  }
  if (failure) return <DesignFailure requestId={failure.requestId} retryUrl={returnPath} title="Unable to load this room" />;
  if (!design) notFound();
  return <DesignDetailView initialDesign={design} />;
}
