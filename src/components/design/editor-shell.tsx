"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/catalog/product-image";
import { getDefaultVariant } from "@/lib/catalog/variant-resolver";
import type { ProductDetail, ProductVariant } from "@/lib/catalog/detail-types";
import { designKeys } from "@/lib/design/query";
import { deleteDesign } from "@/lib/design/api";
import { clampItemPosition, itemFitsRoom, openingFitsRoom, openingsOverlap } from "@/lib/design/editor-geometry";
import { fetchEditorCategories, fetchEditorProduct, fetchEditorProducts } from "@/lib/design/editor-catalog";
import { EditorProvider, useEditor } from "@/lib/design/editor-store";
import { metresToMillimetres } from "@/lib/design/form";
import type { DesignDetail, DesignItem, FloorType, RoomFeatures, RoomOpening, Wall } from "@/lib/design/types";
import { EditableFloorPlan } from "./editable-floor-plan";

const RoomScene = dynamic(() => import("./room-scene"), { ssr: false, loading: () => <div className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas-deep" /> });
const inputClass = "h-10 w-full rounded-xl border border-ink/15 bg-canvas px-3 text-sm";

function DebouncedInput({ value, onPreview, onCommit, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur"> & { value: string; onPreview?: (value: string) => void; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => { const frame = requestAnimationFrame(() => setDraft(value)); return () => cancelAnimationFrame(frame); }, [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const commit = (next: string) => { if (timer.current) clearTimeout(timer.current); timer.current = undefined; if (next !== value) onCommit(next); };
  return <input {...props} value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); onPreview?.(next); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => commit(next), 500); }} onBlur={() => commit(draft)} />;
}

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => { const media = matchMedia("(min-width: 768px)"); const update = () => setDesktop(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  return desktop;
}

function SaveIndicator() {
  const { status, requestId, message, retry, reviewLatest, applyMine } = useEditor((s) => s);
  const label = { saved: "Saved", saving: "Saving…", unsaved: "Unsaved", conflict: "Conflict", error: "Save failed" }[status];
  return <div role="status" className={`rounded-full px-3 py-1 text-xs font-medium ${status === "saved" ? "bg-moss/10 text-moss" : status === "error" || status === "conflict" ? "bg-terracotta/10 text-terracotta" : "bg-sand/40"}`}><span>{label}</span>{message && <span className="ml-2">{message}</span>}{requestId && <span className="ml-2 font-mono">{requestId}</span>}{status === "error" && <button className="ml-2 underline" onClick={retry}>Retry</button>}{status === "conflict" && <><button className="ml-2 underline" onClick={reviewLatest}>Review latest</button><button className="ml-2 underline" onClick={applyMine}>Apply mine</button></>}</div>;
}

function RoomEditor() {
  const design = useEditor((s) => s.design);
  const selected = useEditor((s) => s.selectedItemId);
  const select = useEditor((s) => s.selectItem);
  const preview = useEditor((s) => s.previewItem);
  const patch = useEditor((s) => s.patchItem);
  const desktop = useDesktop();
  const [webglFailed, setWebglFailed] = useState(false);
  const move = (id: string, x: number, z: number, commit: boolean) => {
    const item = design.items.find((candidate) => candidate.id === id);
    if (!item) return;
    const clamped = clampItemPosition(design.room, item, x, z);
    if (!clamped) return;
    const apply = (value: DesignItem) => ({ ...value, position: { ...value.position, ...clamped } });
    if (commit) patch(id, { x_mm: clamped.xMm, z_mm: clamped.zMm }, apply); else preview(id, apply);
  };
  const viewport = !desktop || webglFailed
    ? <><EditableFloorPlan design={design} selectedId={selected} onSelect={select} onMove={move} /><p className="mt-2 text-xs text-ink/55">{webglFailed ? "3D became unavailable. Continue editing in the top-down plan." : "Drag furniture in the plan. Mobile 3D remains view-only on the room page."}</p></>
    : <RoomScene design={design} onFailure={() => setWebglFailed(true)} editing={{ selectedItemId: selected, onSelect: select, onPreviewMove: (id, x, z) => move(id, x, z, false), onCommitMove: (id, x, z) => move(id, x, z, true) }} />;
  return <div>{viewport}{design.items.length > 0 && <ul aria-label="Furniture selection" className="mt-3 flex flex-wrap gap-2">{design.items.map((item) => <li key={item.id}><button type="button" aria-pressed={selected === item.id} className="rounded-full border border-ink/15 px-3 py-1 text-xs aria-pressed:bg-ink aria-pressed:text-canvas" onClick={() => select(item.id)}>Select {item.product.name}</button></li>)}</ul>}</div>;
}

function SelectedItemPanel() {
  const design = useEditor((s) => s.design);
  const id = useEditor((s) => s.selectedItemId);
  const patch = useEditor((s) => s.patchItem);
  const preview = useEditor((s) => s.previewItem);
  const remove = useEditor((s) => s.removeItem);
  const item = design.items.find((entry) => entry.id === id);
  const detail = useQuery({ queryKey: ["editor", "product", item?.product.companySlug, item?.product.slug], queryFn: () => fetchEditorProduct(item!.product.companySlug, item!.product.slug), enabled: Boolean(item) });
  if (!item) return <section className="rounded-2xl border border-dashed border-ink/20 p-5 text-sm text-ink/60">Select furniture to edit its exact position, rotation or finish.</section>;
  const updateNumber = (field: "xMm" | "zMm" | "rotationDeg", raw: string, commit: boolean) => {
    const value = Number(raw); if (!Number.isFinite(value)) return;
    if (field === "rotationDeg") { const rotation = ((value % 360) + 360) % 360; const changed = { ...item, rotationDeg: rotation }; const clamped = clampItemPosition(design.room, changed, item.position.xMm, item.position.zMm); if (clamped) { const optimistic = (current: DesignItem) => ({ ...current, rotationDeg: rotation, position: { ...current.position, ...clamped } }); if (commit) patch(item.id, { rotation_deg: rotation, x_mm: clamped.xMm, z_mm: clamped.zMm }, optimistic); else preview(item.id, optimistic); } }
    else { const clamped = clampItemPosition(design.room, item, field === "xMm" ? value : item.position.xMm, field === "zMm" ? value : item.position.zMm); if (clamped) { const optimistic = (current: DesignItem) => ({ ...current, position: { ...current.position, ...clamped } }); if (commit) patch(item.id, { x_mm: clamped.xMm, z_mm: clamped.zMm }, optimistic); else preview(item.id, optimistic); } }
  };
  return <section className="rounded-2xl border border-ink/10 bg-canvas p-5"><div className="flex items-start justify-between"><div><h2 className="font-serif text-2xl">{item.product.name}</h2><p className="text-xs text-ink/55">{item.product.companyName}</p></div><button className="text-sm text-terracotta underline" onClick={() => remove(item.id)}>Remove</button></div><div className="mt-5 grid grid-cols-3 gap-3"><label className="text-xs">X (mm)<DebouncedInput className={inputClass} type="number" value={String(item.position.xMm)} onPreview={(value) => updateNumber("xMm", value, false)} onCommit={(value) => updateNumber("xMm", value, true)} /></label><label className="text-xs">Z (mm)<DebouncedInput className={inputClass} type="number" value={String(item.position.zMm)} onPreview={(value) => updateNumber("zMm", value, false)} onCommit={(value) => updateNumber("zMm", value, true)} /></label><label className="text-xs">Rotation<DebouncedInput className={inputClass} type="number" value={String(item.rotationDeg)} onPreview={(value) => updateNumber("rotationDeg", value, false)} onCommit={(value) => updateNumber("rotationDeg", value, true)} /></label></div>{detail.data?.hasOptions && <label className="mt-4 block text-xs">Available finish<select className={`${inputClass} mt-1`} value={item.product.variantId ?? ""} onChange={(e) => { const variant = detail.data?.variants.find((v) => v.id === e.target.value); if (variant?.available) patch(item.id, { variant_id: variant.id }, (current) => ({ ...current, product: { ...current.product, variantId: variant.id, sku: variant.sku, options: variant.options, price: { amountMinor: variant.price.amount_minor, currency: variant.price.currency } } })); }}>{detail.data.variants.filter((v) => v.available).map((variant) => <option key={variant.id} value={variant.id}>{variant.sku}</option>)}</select></label>}</section>;
}

function featureWire(features: RoomFeatures) { return { wall_color: features.wallColor, floor: features.floor, openings: features.openings.map((o) => ({ type: o.type, wall: o.wall, offset_mm: o.offsetMm, width_mm: o.widthMm, height_mm: o.heightMm, sill_mm: o.sillMm })) }; }

function RoomSettings() {
  const design = useEditor((s) => s.design);
  const patch = useEditor((s) => s.patchDesign);
  const [error, setError] = useState<string>();
  const saveRoom = (nextRoom = design.room, nextFeatures = design.features) => {
    if (design.items.some((item) => !itemFitsRoom(nextRoom, item))) { setError("Move or remove furniture that would fall outside the resized room."); return; }
    if (nextFeatures.openings.some((opening) => !openingFitsRoom(nextRoom, opening))) { setError("An opening no longer fits the resized room."); return; }
    if (nextFeatures.openings.some((opening, i, all) => all.slice(i + 1).some((other) => openingsOverlap(opening, other)))) { setError("Openings on the same wall cannot overlap."); return; }
    setError(undefined); patch({ width_mm: nextRoom.widthMm, depth_mm: nextRoom.depthMm, height_mm: nextRoom.heightMm, features: featureWire(nextFeatures) }, (current) => ({ ...current, room: nextRoom, features: nextFeatures }));
  };
  const changeDimension = (key: "widthMm" | "depthMm" | "heightMm", value: string) => { try { saveRoom({ ...design.room, [key]: metresToMillimetres(value) }); } catch { setError("Use metres with at most three decimal places."); } };
  const updateOpening = (index: number, opening: RoomOpening) => saveRoom(design.room, { ...design.features, openings: design.features.openings.map((value, i) => i === index ? opening : value) });
  return <section className="rounded-2xl border border-ink/10 bg-canvas p-5"><h2 className="font-serif text-2xl">Room settings</h2><label className="mt-4 block text-xs">Name<DebouncedInput className={inputClass} value={design.name} onCommit={(value) => { const name = value.trim(); if (name && name !== design.name) patch({ name }, (current) => ({ ...current, name })); }} /></label><div className="mt-4 grid grid-cols-3 gap-3">{(["widthMm", "depthMm", "heightMm"] as const).map((key) => <label key={key} className="text-xs">{key.replace("Mm", " (m)")}<DebouncedInput className={inputClass} value={(design.room[key] / 1000).toString()} onCommit={(value) => changeDimension(key, value)} /></label>)}</div><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs">Floor<select className={inputClass} value={design.features.floor ?? "oak"} onChange={(e) => saveRoom(design.room, { ...design.features, floor: e.target.value as FloorType })}>{["oak", "tile", "carpet", "concrete"].map((floor) => <option key={floor}>{floor}</option>)}</select></label><label className="text-xs">Wall colour<DebouncedInput className={inputClass} value={design.features.wallColor ?? "#F2EFE9"} onCommit={(value) => { const color = value.toUpperCase(); if (/^#[0-9A-F]{6}$/.test(color)) saveRoom(design.room, { ...design.features, wallColor: color }); }} /></label></div><div className="mt-6 flex items-center justify-between"><h3 className="font-medium">Doors and windows</h3><button className="text-sm underline disabled:opacity-40" disabled={design.features.openings.length >= 20} onClick={() => saveRoom(design.room, { ...design.features, openings: [...design.features.openings, { type: "window", wall: "north", offsetMm: 0, widthMm: 900, heightMm: 900, sillMm: 900 }] })}>Add opening</button></div><div className="mt-3 space-y-3">{design.features.openings.map((opening, index) => <OpeningRow key={index} opening={opening} onChange={(next) => updateOpening(index, next)} onRemove={() => saveRoom(design.room, { ...design.features, openings: design.features.openings.filter((_, i) => i !== index) })} />)}</div>{error && <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p>}</section>;
}

function OpeningRow({ opening, onChange, onRemove }: { opening: RoomOpening; onChange: (value: RoomOpening) => void; onRemove: () => void }) {
  const number = (key: "offsetMm" | "widthMm" | "heightMm" | "sillMm", raw: string) => { try { onChange({ ...opening, [key]: key === "sillMm" && opening.type === "door" ? 0 : metresToMillimetres(raw) }); } catch { /* keep last valid */ } };
  return <div className="grid grid-cols-2 gap-2 rounded-xl bg-canvas-deep/30 p-3 sm:grid-cols-4"><select className={inputClass} value={opening.type} onChange={(e) => onChange({ ...opening, type: e.target.value as "door" | "window", sillMm: e.target.value === "door" ? 0 : opening.sillMm })}><option value="door">Door</option><option value="window">Window</option></select><select className={inputClass} value={opening.wall} onChange={(e) => onChange({ ...opening, wall: e.target.value as Wall })}>{["north", "south", "east", "west"].map((wall) => <option key={wall}>{wall}</option>)}</select>{(["offsetMm", "widthMm", "heightMm", "sillMm"] as const).map((key) => <label key={key} className="text-[10px]">{key.replace("Mm", " m")}<input className={inputClass} disabled={key === "sillMm" && opening.type === "door"} defaultValue={(opening[key] / 1000).toString()} onBlur={(e) => number(key, e.target.value)} /></label>)}<button className="text-left text-xs text-terracotta underline" onClick={onRemove}>Remove opening</button></div>;
}

function CatalogDrawer() {
  const design = useEditor((s) => s.design); const add = useEditor((s) => s.addItem);
  const [open, setOpen] = useState(false); const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [chosen, setChosen] = useState<{ company: string; slug: string }>();
  const categories = useQuery({ queryKey: ["editor", "categories"], queryFn: fetchEditorCategories, enabled: open });
  const products = useInfiniteQuery({ queryKey: ["editor", "catalog", q, category], queryFn: ({ pageParam }) => fetchEditorProducts(q, category, pageParam), initialPageParam: undefined as string | undefined, getNextPageParam: (page) => page.nextCursor ?? undefined, enabled: open });
  const detail = useQuery({ queryKey: ["editor", "product", chosen?.company, chosen?.slug], queryFn: () => fetchEditorProduct(chosen!.company, chosen!.slug), enabled: Boolean(chosen) });
  const place = (product: ProductDetail, variant: ProductVariant | null) => { const draft = { rotationDeg: 0, product: { dimensions: { widthMm: product.dimensions.width_mm, depthMm: product.dimensions.depth_mm, heightMm: product.dimensions.height_mm } } } as DesignItem; const position = clampItemPosition(design.room, draft, design.room.widthMm / 2, design.room.depthMm / 2); if (!position) return; add({ product_id: product.id, ...(variant ? { variant_id: variant.id } : {}), x_mm: position.xMm, y_mm: 0, z_mm: position.zMm, rotation_deg: 0 }); setOpen(false); setChosen(undefined); };
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button>Add furniture</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45" /><Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-canvas p-6 shadow-2xl"><div className="flex items-center justify-between"><Dialog.Title className="font-serif text-3xl">Add furniture</Dialog.Title><Dialog.Close className="text-sm underline">Close</Dialog.Close></div>{chosen && detail.data ? <ProductChoice product={detail.data} onBack={() => setChosen(undefined)} onPlace={place} /> : <><div className="mt-6 grid grid-cols-[1fr_auto] gap-3"><input aria-label="Search furniture" className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" /><select aria-label="Category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div><ul className="mt-6 grid grid-cols-2 gap-4">{products.data?.pages.flatMap((page) => page.products).map((product) => <li key={product.id}><button className="w-full overflow-hidden rounded-xl border border-ink/10 text-left" onClick={() => setChosen({ company: product.company.slug, slug: product.slug })}><div className="aspect-[4/3] bg-canvas-deep"><ProductImage src={product.primaryImageUrl} alt={product.name} /></div><div className="p-3"><strong>{product.name}</strong><span className="block text-xs">{product.formattedPrice}</span></div></button></li>)}</ul>{products.hasNextPage && <Button variant="secondary" className="mt-5" onClick={() => products.fetchNextPage()}>Load more</Button>}</>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function ProductChoice({ product, onBack, onPlace }: { product: ProductDetail; onBack: () => void; onPlace: (product: ProductDetail, variant: ProductVariant | null) => void }) {
  const available = product.variants.filter((variant) => variant.available); const [variantId, setVariantId] = useState(getDefaultVariant(available)?.id ?? ""); const variant = available.find((entry) => entry.id === variantId) ?? null;
  return <div className="mt-6"><button className="text-sm underline" onClick={onBack}>← Back</button><h3 className="mt-4 font-serif text-2xl">{product.name}</h3><p className="text-sm text-ink/60">{product.company.name} · {variant?.formattedPrice ?? product.formattedBasePrice}</p>{product.hasOptions && <label className="mt-5 block text-sm">Available configuration<select className={`${inputClass} mt-2`} value={variantId} onChange={(e) => setVariantId(e.target.value)}>{available.map((entry) => <option key={entry.id} value={entry.id}>{Object.values(entry.options).join(" · ")} — {entry.formattedPrice}</option>)}</select></label>}<Button className="mt-6" disabled={product.hasOptions && !variant} onClick={() => onPlace(product, variant)}>Place in room</Button></div>;
}

function DeleteDesignButton() {
  const design = useEditor((s) => s.design); const revision = useEditor((s) => s.revision); const status = useEditor((s) => s.status); const router = useRouter(); const query = useQueryClient(); const [open, setOpen] = useState(false); const [error, setError] = useState<string>();
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button variant="quiet" className="text-terracotta">Delete design</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45" /><Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-canvas p-6"><Dialog.Title className="font-serif text-2xl">Delete {design.name}?</Dialog.Title><p className="mt-3 text-sm text-ink/60">This permanently removes the room and its placed furniture.</p>{error && <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Dialog.Close asChild><Button variant="secondary">Cancel</Button></Dialog.Close><Button disabled={status !== "saved"} onClick={async () => { try { await deleteDesign(design.id, revision); query.removeQueries({ queryKey: designKeys.detail(design.id) }); await query.invalidateQueries({ queryKey: designKeys.list }); router.replace("/designs"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); } }}>Delete permanently</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function EditorContent() {
  const design = useEditor((s) => s.design);
  const status = useEditor((s) => s.status);
  useEffect(() => { const before = (event: BeforeUnloadEvent) => { if (status !== "saved") event.preventDefault(); }; window.addEventListener("beforeunload", before); return () => window.removeEventListener("beforeunload", before); }, [status]);
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><header className="flex flex-wrap items-center justify-between gap-4"><div><Link href={`/designs/${design.id}`} className="text-sm underline">← Read-only room</Link><h1 className="mt-2 font-serif text-4xl">Edit {design.name}</h1></div><div className="flex flex-wrap items-center gap-3"><SaveIndicator />{status === "saved" ? <Button asChild variant="secondary"><Link href={`/designs/${design.id}/quote`}>Review and request quotes</Link></Button> : <Button variant="secondary" disabled title="Save the room before requesting quotes">Review and request quotes</Button>}<CatalogDrawer /></div></header><div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,.7fr)]"><div><RoomEditor /><div className="mt-5"><SelectedItemPanel /></div></div><aside className="space-y-5"><RoomSettings /><DeleteDesignButton /></aside></div></div>;
}

export function DesignEditor({ design, revision }: { design: DesignDetail; revision: number }) { return <EditorProvider design={design} revision={revision}><EditorContent /></EditorProvider>; }
