import { Button } from "@/components/ui/button";

const foundations = [
  {
    number: "01",
    title: "A typed API boundary",
    body: "The Go OpenAPI contract generates TypeScript types, while one error layer preserves validation details and request IDs.",
  },
  {
    number: "02",
    title: "Server-first commerce",
    body: "Catalog and product pages stay in Server Components. Client state appears only where interaction actually needs it.",
  },
  {
    number: "03",
    title: "One secure origin",
    body: "Next.js rewrites browser API calls to Go, retaining first-party cookies and the backend’s Origin protection.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-ink/10">
        <div className="hero-grid absolute inset-0 -z-10 opacity-55" />
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow mb-7">Furniture commerce, made spatial</p>
            <h1 className="max-w-4xl font-serif text-[clamp(3.5rem,9vw,7.8rem)] leading-[0.86] tracking-[-0.065em] text-balance">
              Make room for certainty.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-ink/66 sm:text-xl">
              Configure furniture, place it at real scale, and ask the maker
              for a quote—all before the first box reaches your door.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#foundation">
                  View the foundation
                  <span aria-hidden="true">↘</span>
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#roadmap">See what comes next</a>
              </Button>
            </div>
          </div>

          <div
            id="experience"
            className="relative mx-auto aspect-[4/5] w-full max-w-lg overflow-hidden rounded-[2rem] bg-moss text-canvas shadow-[0_35px_90px_rgba(35,43,33,0.2)]"
          >
            <div className="absolute inset-5 rounded-[1.35rem] border border-canvas/25" />
            <div className="absolute left-[13%] top-[12%] h-[38%] w-[74%] rounded-t-full border border-canvas/25" />
            <div className="absolute bottom-[19%] left-[13%] h-[30%] w-[74%] rounded-[1.5rem] bg-canvas/10 backdrop-blur-sm" />
            <div className="absolute bottom-[22%] left-[18%] right-[18%] grid grid-cols-3 gap-3">
              <span className="aspect-square rounded-[1rem] bg-sand/85" />
              <span className="aspect-square rounded-[1rem] bg-terracotta/85" />
              <span className="aspect-square rounded-[1rem] bg-ink/70" />
            </div>
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between border-t border-canvas/25 pt-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-canvas/55">
                  Room study
                </p>
                <p className="mt-1 font-serif text-2xl">5 × 6 metres</p>
              </div>
              <span className="grid size-11 place-items-center rounded-full border border-canvas/30 text-lg">
                ↗
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="foundation" className="bg-canvas-deep py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 border-b border-ink/15 pb-12 lg:grid-cols-2">
            <p className="eyebrow">Phase 1 · Foundation</p>
            <h2 className="font-serif text-4xl leading-tight tracking-[-0.045em] sm:text-6xl">
              Quiet infrastructure for a visual product.
            </h2>
          </div>
          <div className="grid divide-y divide-ink/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {foundations.map((item) => (
              <article key={item.number} className="py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <p className="text-xs font-semibold tracking-[0.16em] text-terracotta">
                  {item.number}
                </p>
                <h3 className="mt-7 font-serif text-3xl tracking-[-0.035em]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-sm leading-7 text-ink/62">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="bg-ink py-24 text-canvas sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow text-sand">Next on the roadmap</p>
            <p className="mt-5 max-w-sm leading-7 text-canvas/55">
              The foundation is intentionally lean. Each customer capability
              arrives as a separately reviewed phase.
            </p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-3xl bg-canvas/15 sm:grid-cols-2">
            {[
              "Public catalog",
              "Product configuration",
              "Customer accounts",
              "Three.js preview",
              "Saved room designs",
              "Interactive editor",
            ].map((label, index) => (
              <li
                key={label}
                className="flex min-h-28 items-end justify-between bg-ink px-6 py-5"
              >
                <span className="font-serif text-xl">{label}</span>
                <span className="text-xs text-canvas/35">{index + 2}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
