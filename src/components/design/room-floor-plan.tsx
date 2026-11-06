import type { DesignDetail } from "@/lib/design/types";

export function RoomFloorPlan({ design }: { design: DesignDetail }) {
  const { widthMm, depthMm } = design.room;
  return (
    <div className="rounded-2xl border border-ink/10 bg-canvas-deep/30 p-4" data-testid="room-floor-plan">
      <svg viewBox={`0 0 ${widthMm} ${depthMm}`} role="img" aria-label={`Top-down plan of ${design.name}`} className="aspect-[4/3] w-full rounded-xl bg-white/70">
        <rect x="0" y="0" width={widthMm} height={depthMm} fill={design.features.wallColor ?? "#F2EFE9"} stroke="#1b1813" strokeWidth={Math.max(widthMm, depthMm) / 120} />
        {design.items.map((item) => (
          <rect key={item.id} x={item.position.xMm - item.product.dimensions.widthMm / 2} y={item.position.zMm - item.product.dimensions.depthMm / 2} width={item.product.dimensions.widthMm} height={item.product.dimensions.depthMm} rx="60" fill={item.available ? "#7a8b68" : "#b26b52"} fillOpacity="0.75" stroke="#1b1813" transform={`rotate(${item.rotationDeg} ${item.position.xMm} ${item.position.zMm})`}><title>{item.product.name}</title></rect>
        ))}
      </svg>
    </div>
  );
}
