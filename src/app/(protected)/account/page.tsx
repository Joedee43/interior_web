import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export const instant = false;

export default function AccountPage() {
  return <div className="mt-10 grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-ink/10 bg-canvas-deep/20 p-6"><p className="eyebrow text-terracotta">Room planning</p><h2 className="mt-3 font-serif text-3xl">Your saved designs</h2><p className="mt-3 max-w-xl text-sm leading-7 text-ink/60">Create rooms, review placed furniture, and return to your layouts from any device.</p><Button asChild className="mt-6"><Link href="/designs">Open my designs</Link></Button></section><section className="rounded-2xl border border-ink/10 bg-canvas-deep/20 p-6"><p className="eyebrow text-terracotta">Maker responses</p><h2 className="mt-3 font-serif text-3xl">Your quotes</h2><p className="mt-3 max-w-xl text-sm leading-7 text-ink/60">Follow each maker’s answer, compare quoted prices, and accept, reject or cancel requests.</p><Button asChild className="mt-6"><Link href="/quotes">Open my quotes</Link></Button></section></div>;
}
