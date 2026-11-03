"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-2xl flex-col items-start justify-center px-5 py-20 sm:px-8">
      <p className="eyebrow text-terracotta">Something shifted</p>
      <h1 className="mt-5 font-serif text-5xl tracking-[-0.045em]">
        We couldn’t arrange this page.
      </h1>
      <p className="mt-5 max-w-lg leading-7 text-ink/65">
        Try the request again. If it continues, the API request ID shown with
        the error will help trace what happened.
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
