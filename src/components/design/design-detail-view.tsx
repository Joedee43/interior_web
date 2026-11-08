"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { formatDimensions, formatMoney } from "@/lib/catalog/format";
import { useDesign } from "@/lib/design/query";
import type { DesignDetail } from "@/lib/design/types";
import { Button } from "@/components/ui/button";
import { RoomViewer } from "./room-viewer";

export function DesignDetailView({ initialDesign }: { initialDesign: DesignDetail }) {
  const query = useDesign(initialDesign.id, initialDesign);
  const design = query.data;
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/designs" className="text-sm text-ink-muted underline-offset-4 hover:underline">← My designs</Link>
      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <div><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-terracotta">Read-only room</p><h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">{design.name}</h1><p className="mt-3 text-sm text-ink-muted">{formatDimensions({ width_mm: design.room.widthMm, depth_mm: design.room.depthMm, height_mm: design.room.heightMm })} · {design.itemCount} {design.itemCount === 1 ? "item" : "items"}</p></div><Button asChild><Link href={`/designs/${design.id}/edit`}>Edit room</Link></Button></div><div className="mt-8"><RoomViewer design={design} /></div></div>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-ink/10 bg-canvas-deep/20 p-5"><h2 className="font-serif text-2xl">Room details</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-ink-muted">Floor</dt><dd className="mt-1 capitalize">{design.features.floor ?? "Not specified"}</dd></div><div><dt className="text-ink-muted">Wall colour</dt><dd className="mt-1 flex items-center gap-2"><span className="size-4 rounded-full border border-ink/15" style={{ backgroundColor: design.features.wallColor ?? "#F2EFE9" }} />{design.features.wallColor ?? "Default"}</dd></div><div><dt className="text-ink-muted">Openings</dt><dd className="mt-1">{design.features.openings.length}</dd></div><div><dt className="text-ink-muted">Updated</dt><dd className="mt-1">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(design.updatedAt))}</dd></div></dl></section>
          <section className="rounded-2xl border border-ink/10 bg-canvas p-5"><h2 className="font-serif text-2xl">Current estimate</h2><p className="mt-2 text-xs leading-5 text-ink-muted">{design.estimate.note}</p>{design.estimate.totals.length ? <ul className="mt-5 space-y-3">{design.estimate.totals.map((total) => <li key={`${total.companySlug}-${total.currency}`} className="flex items-center justify-between gap-4 border-t border-ink/10 pt-3 text-sm"><span>{total.companyName}<span className="block text-xs text-ink-muted">{total.items} {total.items === 1 ? "item" : "items"}</span></span><strong>{formatMoney(total.amountMinor, total.currency)}</strong></li>)}</ul> : <p className="mt-5 text-sm text-ink-muted">No available furniture to estimate yet.</p>}{design.estimate.unavailableCount > 0 && <p className="mt-4 text-xs text-terracotta">{design.estimate.unavailableCount} unavailable {design.estimate.unavailableCount === 1 ? "item is" : "items are"} excluded.</p>}<Button asChild className="mt-5 w-full"><Link href={`/designs/${design.id}/quote`}>Request quotes</Link></Button></section>
        </aside>
      </div>

      <section className="mt-12"><h2 className="font-serif text-3xl">Furniture in this room</h2>{design.items.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-ink/20 p-8 text-center"><p className="font-medium">This room is ready for furniture.</p><p className="mt-2 text-sm text-ink-muted">Furniture placement will be available in the interactive editor.</p></div> : <ul className="mt-5 grid gap-4 md:grid-cols-2">{design.items.map((item) => <li key={item.id} className="flex gap-4 rounded-2xl border border-ink/10 bg-canvas p-4"><div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-canvas-deep"><ProductImage src={item.product.primaryImageUrl} alt={item.product.name} className="size-full object-cover" /></div><div className="min-w-0"><Link href={`/products/${item.product.companySlug}/${item.product.slug}`} className="font-medium underline-offset-4 hover:underline">{item.product.name}</Link><p className="mt-1 text-xs text-ink-muted">{item.product.companyName}</p>{Object.keys(item.product.options).length > 0 && <p className="mt-2 text-xs text-ink/65">{Object.entries(item.product.options).map(([name, value]) => `${name}: ${value}`).join(" · ")}</p>}<p className="mt-2 text-xs">{formatMoney(item.product.price.amountMinor, item.product.price.currency)} · Position {item.position.xMm}, {item.position.yMm}, {item.position.zMm} mm · {item.rotationDeg}°</p>{!item.available && <p className="mt-2 text-xs font-medium text-terracotta">Currently unavailable</p>}</div></li>)}</ul>}</section>
      {query.isError && <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta">The latest design refresh failed. The last loaded room remains visible.</p>}
    </div>
  );
}
