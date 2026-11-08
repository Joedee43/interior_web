"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DesignDetail } from "@/lib/design/types";
import { supportsWebGL2 } from "@/components/product/product-preview";
import { RoomFloorPlan } from "./room-floor-plan";

const RoomScene = dynamic(() => import("./room-scene"), { ssr: false, loading: () => <div className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas-deep/40" role="status" aria-label="Loading 3D room" /> });

export function RoomViewer({ design }: { design: DesignDetail }) {
  const [load3d, setLoad3d] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (window.matchMedia("(min-width: 768px)").matches && supportsWebGL2()) setLoad3d(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!load3d || failed) return <div><RoomFloorPlan design={design} />{!failed && <button type="button" onClick={() => supportsWebGL2() ? setLoad3d(true) : setFailed(true)} className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas" data-testid="load-3d-room">Load 3D room</button>}{failed && <p className="mt-4 text-sm text-ink-muted" role="status">3D is unavailable in this browser. The floor plan and design details remain available.</p>}</div>;
  return <RoomScene design={design} onFailure={() => setFailed(true)} />;
}
