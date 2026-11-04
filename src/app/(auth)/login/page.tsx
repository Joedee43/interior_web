import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthServiceFailure } from "@/components/auth/auth-service-failure";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { ApiError } from "@/lib/api/error";
import { safeReturnPath } from "@/lib/auth/return-path";
import { getCurrentAccount } from "@/lib/auth/server";

export const instant = false;
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const nextPath = safeReturnPath((await searchParams).next);
  try {
    if (await getCurrentAccount()) redirect(nextPath);
  } catch (error) {
    if (error instanceof ApiError) {
      return <AuthServiceFailure requestId={error.requestId} retryUrl="/login" />;
    }
    throw error;
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Return to your room."
      intro="Sign in to continue planning spaces and keep your furniture selections connected to your account."
    >
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}

