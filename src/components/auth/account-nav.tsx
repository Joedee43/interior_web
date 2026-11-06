"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAccountQuery } from "@/lib/auth/query";
import { LogoutButton } from "./logout-button";

export function AccountNav() {
  const account = useAccountQuery();

  if (account.isPending) {
    return <div aria-label="Loading account" className="h-9 w-48 animate-pulse rounded-full bg-ink/10" />;
  }
  if (account.isError) {
    return (
      <Button variant="secondary" size="sm" onClick={() => account.refetch()}>
        Account unavailable · Retry
      </Button>
    );
  }
  if (!account.data) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Button asChild variant="quiet" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    );
  }

  const firstName = account.data.user.fullName.split(/\s+/)[0] || "Account";
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button asChild variant="quiet" size="sm" className="hidden sm:inline-flex">
        <Link href="/designs">My designs</Link>
      </Button>
      <Button asChild variant="quiet" size="sm">
        <Link href="/account">{firstName}</Link>
      </Button>
      <LogoutButton compact />
    </div>
  );
}

