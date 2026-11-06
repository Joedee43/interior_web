"use client";

import type { PointerEvent } from "react";
import type { DesignDetail } from "@/lib/design/types";

export function EditableFloorPlan({ design, selectedId, onSelect, onMove }: { design: DesignDetail; selectedId: string | null; onSelect: (id: string | null) => void; onMove: (id: string, x: number, z: number, commit: boolean) => void }) {
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * design.room.widthMm, z: (event.clientY - rect.top) / rect.height * design.room.depthMm };
  };
  const active = selectedId && design.items.find((item) => item.id === selectedId);
  return <svg viewBox={`0 0 ${design.room.widthMm} ${design.room.depthMm}`} className="aspect-[4/3] w-full touch-none rounded-2xl border-2 border-ink/20 bg-canvas-deep" role="application" aria-label="Top-down editable room" data-testid="editable-floor-plan" onPointerMove={(event) => { if (active && event.buttons === 1) { const p = point(event); onMove(active.id, p.x, p.z, false); } }} onPointerUp={(event) => { if (active) { const p = point(event); onMove(active.id, p.x, p.z, true); } }} onPointerDown={(event) => { if (event.target === event.currentTarget) onSelect(null); }}>
    {design.items.map((item) => <g key={item.id} transform={`translate(${item.position.xMm} ${item.position.zMm}) rotate(${item.rotationDeg})`} onPointerDown={(event) => { event.stopPropagation(); onSelect(item.id); }} data-testid={`floor-item-${item.id}`}><rect x={-item.product.dimensions.widthMm / 2} y={-item.product.dimensions.depthMm / 2} width={item.product.dimensions.widthMm} height={item.product.dimensions.depthMm} rx="60" fill={item.available ? (selectedId === item.id ? "#a94f35" : "#706a5f") : "#b26b52"} opacity="0.85" /><title>{item.product.name}</title></g>)}
  </svg>;
}
