import { quoteStatusLabels } from "@/lib/quote/status";
import type { QuoteStatus } from "@/lib/quote/types";

const tones: Record<QuoteStatus, string> = {
  pending: "bg-sand/40 text-ink",
  reviewing: "bg-sand/40 text-ink",
  quoted: "bg-terracotta/12 text-terracotta",
  accepted: "bg-moss/12 text-moss",
  rejected: "bg-ink/8 text-ink/70",
  cancelled: "bg-ink/8 text-ink/70",
  declined: "bg-ink/8 text-ink/70",
};

export function QuoteStatusBadge({ status, expired = false }: { status: QuoteStatus; expired?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[status]}`}>{quoteStatusLabels[status]}</span>
      {expired && status === "quoted" && <span className="rounded-full border border-terracotta/30 px-2.5 py-1 text-xs font-medium text-terracotta">Expired</span>}
    </span>
  );
}
