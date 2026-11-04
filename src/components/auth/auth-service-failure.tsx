import { Button } from "@/components/ui/button";

export function AuthServiceFailure({
  requestId,
  retryUrl,
}: {
  requestId?: string;
  retryUrl: string;
}) {
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <p className="eyebrow text-terracotta">Account service</p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight">
        Unable to check your account
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink/65">
        Your sign-in state could not be confirmed. Try the request again.
      </p>
      {requestId && (
        <p className="mt-5 rounded-lg border border-ink/10 bg-canvas-deep px-4 py-2 font-mono text-xs">
          Request ID: <span className="select-all">{requestId}</span>
        </p>
      )}
      <Button asChild className="mt-8">
        <a href={retryUrl}>Try again</a>
      </Button>
    </section>
  );
}

