import type { Account } from "@/lib/auth/types";
import { LogoutButton } from "./logout-button";

export function AccountSummary({ account }: { account: Account }) {
  const activeMemberships = account.memberships.filter(
    (entry) => entry.status === "active" && entry.company.status === "active",
  );
  const joined = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(account.user.createdAt));

  return (
    <section>
      <p className="eyebrow text-terracotta">Customer account</p>
      <div className="mt-4 flex flex-col gap-6 border-b border-ink/15 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-5xl tracking-[-0.05em]">
            {account.user.fullName}
          </h1>
          <p className="mt-3 text-ink-muted">{account.user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-ink/10 bg-canvas-deep/30 p-6">
          <h2 className="font-serif text-2xl">Account details</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-ink-muted">Email</dt>
              <dd className="mt-1 font-medium">{account.user.email}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Member since</dt>
              <dd className="mt-1 font-medium">{joined}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-ink/10 bg-canvas-deep/30 p-6">
          <h2 className="font-serif text-2xl">Company memberships</h2>
          {activeMemberships.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {activeMemberships.map((entry) => (
                <li
                  key={entry.company.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-canvas p-4 text-sm"
                >
                  <span className="font-medium">{entry.company.name}</span>
                  <span className="text-ink-muted">
                    {entry.role === "company_admin"
                      ? "Company admin"
                      : "Company staff"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm leading-6 text-ink-muted">
              This is a customer account with no active company memberships.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

