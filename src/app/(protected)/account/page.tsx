import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountSummary } from "@/components/auth/account-summary";
import { getCurrentAccount } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=%2Faccount");
  return <AccountSummary account={account} />;
}

