import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AccountSummary } from "@/components/auth/account-summary";
import { AuthServiceFailure } from "@/components/auth/auth-service-failure";
import { ApiError } from "@/lib/api/error";
import { getCurrentAccount } from "@/lib/auth/server";

export const instant = false;

export default async function AccountLayout({ children }: { children: ReactNode }) {
  let account;
  try {
    account = await getCurrentAccount();
  } catch (error) {
    if (error instanceof ApiError) {
      return <AuthServiceFailure requestId={error.requestId} retryUrl="/account" />;
    }
    throw error;
  }
  if (!account) redirect("/login?next=%2Faccount");

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <AccountSummary account={account} />
      {children}
    </div>
  );
}

