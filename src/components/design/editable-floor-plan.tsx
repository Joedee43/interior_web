"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { DesignDetail, DesignItem } from "@/lib/design/types";

// A click that wobbles a few pixels selects; it must not move or save.
const DRAG_THRESHOLD_PX = 4;
// Arrow keys nudge the focused item: 10 mm, or 100 mm with Shift.
const NUDGE_MM = 10;
const NUDGE_LARGE_MM = 100;
const arrowSteps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

interface FloorDrag { id: string; pointerId: number; offsetXMm: number; offsetZMm: number; startClientX: number; startClientY: number; last?: { xMm: number; zMm: number } }

export function EditableFloorPlan({ design, selectedId, onSelect, onMove }: { design: DesignDetail; selectedId: string | null; onSelect: (id: string | null) => void; onMove: (id: string, x: number, z: number, commit: boolean) => void }) {
  const drag = useRef<FloorDrag | null>(null);
  // The viewBox is letterboxed into the 4:3 frame (xMidYMid meet), so map
  // through the same uniform scale and centring offset.
  const point = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / design.room.widthMm, rect.height / design.room.depthMm);
    const left = rect.left + (rect.width - design.room.widthMm * scale) / 2;
    const top = rect.top + (rect.height - design.room.depthMm * scale) / 2;
    return { x: (clientX - left) / scale, z: (clientY - top) / scale };
  };
  // Keep the grabbed point under the pointer instead of snapping the centre to it.
  const startDrag = (item: DesignItem, event: PointerEvent<SVGGElement>) => {
    event.stopPropagation();
    onSelect(item.id);
    const svg = event.currentTarget.closest("svg");
    if (!svg) return;
    const grabbed = point(svg, event.clientX, event.clientY);
    drag.current = { id: item.id, pointerId: event.pointerId, offsetXMm: item.position.xMm - grabbed.x, offsetZMm: item.position.zMm - grabbed.z, startClientX: event.clientX, startClientY: event.clientY };
    // Capture keeps move/up events coming even when the pointer leaves the plan.
    svg.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.last && Math.hypot(event.clientX - current.startClientX, event.clientY - current.startClientY) < DRAG_THRESHOLD_PX) return;
    const p = point(event.currentTarget, event.clientX, event.clientY);
    current.last = { xMm: p.x + current.offsetXMm, zMm: p.z + current.offsetZMm };
    onMove(current.id, current.last.xMm, current.last.zMm, false);
  };
  // Save only when the furniture actually moved; a plain click just selects.
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.last) onMove(current.id, current.last.xMm, current.last.zMm, true);
  };
  // role="application" promises keyboard control: Enter/Space selects, arrows
  // move through the same onMove path as a drag (clamped, then saved).
  const keyDown = (item: DesignItem, event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.id); return; }
    const step = arrowSteps[event.key];
    if (!step) return;
    event.preventDefault();
    if (selectedId !== item.id) onSelect(item.id);
    const distance = event.shiftKey ? NUDGE_LARGE_MM : NUDGE_MM;
    onMove(item.id, item.position.xMm + step[0] * distance, item.position.zMm + step[1] * distance, true);
  };
  const instructionsId = useId();
  return <>
    <p id={instructionsId} className="sr-only">Press Tab to reach furniture, Enter to select it, and the arrow keys to move it by 10 millimetres, or 100 with Shift. North is up.</p>
    <svg viewBox={`0 0 ${design.room.widthMm} ${design.room.depthMm}`} className="aspect-[4/3] w-full touch-none rounded-2xl border-2 border-ink/20 bg-canvas-deep" role="application" aria-label="Top-down editable room" aria-describedby={instructionsId} data-testid="editable-floor-plan" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerDown={(event) => { if (event.target === event.currentTarget) onSelect(null); }}>
      {design.items.map((item) => <g key={item.id} tabIndex={0} role="button" aria-pressed={selectedId === item.id} aria-label={`${item.product.name}, ${item.position.xMm} millimetres from the west wall, ${item.position.zMm} from the north wall`} className="group cursor-grab outline-none" transform={`translate(${item.position.xMm} ${item.position.zMm}) rotate(${item.rotationDeg})`} onPointerDown={(event) => startDrag(item, event)} onKeyDown={(event) => keyDown(item, event)} data-testid={`floor-item-${item.id}`}><rect x={-item.product.dimensions.widthMm / 2} y={-item.product.dimensions.depthMm / 2} width={item.product.dimensions.widthMm} height={item.product.dimensions.depthMm} rx="60" fill={item.available ? (selectedId === item.id ? "#a94f35" : "#706a5f") : "#b26b52"} opacity="0.85" className="stroke-ink [stroke-width:0] group-focus-visible:[stroke-width:40]" /><title>{item.product.name}</title></g>)}
    </svg>
  </>;
}
