import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignEditor } from "@/components/design/editor-shell";
import { DesignFailure } from "@/components/design/design-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";
import { getRevisionedDesign } from "@/lib/design/server";

export const metadata: Metadata = { title: "Edit room", robots: { index: false, follow: false } };
export const instant = false;

export default async function EditDesignPage({ params }: { params: Promise<{ designID: string }> }) {
  const { designID } = await params;
  const returnPath = `/designs/${encodeURIComponent(designID)}/edit`;
  let record;
  let failure: ApiError | undefined;
  try {
    if (!(await getCurrentAccount())) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
    record = await getRevisionedDesign(designID);
  } catch (error) {
    if (error instanceof ApiError) failure = error; else throw error;
  }
  if (failure?.status === 404) notFound();
  if (failure) return <DesignFailure requestId={failure.requestId} retryUrl={returnPath} title="Unable to open the editor" />;
  if (!record) notFound();
  return <DesignEditor design={record.design} revision={record.revision} />;
}
