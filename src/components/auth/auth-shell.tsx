import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-9rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="max-w-xl">
        <p className="eyebrow text-terracotta">{eyebrow}</p>
        <h1 className="mt-5 font-serif text-5xl tracking-[-0.05em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-ink/65">{intro}</p>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-canvas-deep/35 p-6 shadow-[0_28px_80px_rgba(27,24,19,0.08)] sm:p-10">
        {children}
      </div>
    </section>
  );
}

