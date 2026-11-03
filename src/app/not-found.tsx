import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-2xl flex-col items-start justify-center px-5 py-20 sm:px-8">
      <p className="eyebrow text-terracotta">404 · Not found</p>
      <h1 className="mt-5 font-serif text-5xl tracking-[-0.045em]">
        This room is still empty.
      </h1>
      <p className="mt-5 leading-7 text-ink/65">
        The page may have moved, or it may belong to someone else.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return home</Link>
      </Button>
    </section>
  );
}
