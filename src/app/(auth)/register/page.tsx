import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthServiceFailure } from "@/components/auth/auth-service-failure";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { ApiError } from "@/lib/api/error";
import { safeReturnPath } from "@/lib/auth/return-path";
import { getCurrentAccount } from "@/lib/auth/server";

export const instant = false;
export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const nextPath = safeReturnPath((await searchParams).next);
  try {
    if (await getCurrentAccount()) redirect(nextPath);
  } catch (error) {
    if (error instanceof ApiError) {
      return <AuthServiceFailure requestId={error.requestId} retryUrl="/register" />;
    }
    throw error;
  }

  return (
    <AuthShell
      eyebrow="Customer account"
      title="Start with a room of your own."
      intro="Create a customer account now; saved room designs and quotes will build on this secure session in the next phases."
    >
      <RegisterForm nextPath={nextPath} />
    </AuthShell>
  );
}

