"use client";

import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DesignDetail, DesignItem, Wall } from "@/lib/design/types";
import { buildWallSegments, degreesToYRadians, itemWorldPosition } from "@/lib/design/room-geometry";
import { VariantMaterialController } from "@/lib/three/khr-variants";
import { normalizeModelPivot, warnForDimensionMismatch } from "@/lib/three/model-bounds";
import { watchForContextLoss } from "@/components/product/product-preview";

class ItemBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Placeholder({ item }: { item: DesignItem }) {
  const { widthMm, depthMm, heightMm } = item.product.dimensions;
  return <mesh position={[0, heightMm / 2000, 0]} castShadow><boxGeometry args={[widthMm / 1000, heightMm / 1000, depthMm / 1000]} /><meshStandardMaterial color={item.available ? "#8b806f" : "#b26b52"} roughness={0.9} /></mesh>;
}

function LoadedFurniture({ item }: { item: DesignItem }) {
  const gltf = useGLTF(item.product.modelUrl!);
  const invalidate = useThree(({ invalidate }) => invalidate);
  const [failure, setFailure] = useState<Error>();
  const { scene, bounds } = useMemo(() => {
    const cloned = skeletonClone(gltf.scene);
    cloned.userData.gltfExtensions = gltf.userData.gltfExtensions;
    return { scene: cloned, bounds: normalizeModelPivot(cloned) };
  }, [gltf]);
  const controller = useMemo(() => new VariantMaterialController(scene, gltf.parser), [gltf.parser, scene]);
  useEffect(() => {
    warnForDimensionMismatch(`design-item/${item.product.id}/${item.product.modelUrl}`, bounds, { width_mm: item.product.dimensions.widthMm, depth_mm: item.product.dimensions.depthMm, height_mm: item.product.dimensions.heightMm });
  }, [bounds, item]);
  useEffect(() => {
    let active = true;
    if (item.product.sku) void controller.select(item.product.sku).then(() => { if (active) invalidate(); }, (error: unknown) => { if (active) setFailure(error instanceof Error ? error : new Error("Variant mapping failed")); });
    else { controller.restore(); invalidate(); }
    return () => { active = false; };
  }, [controller, invalidate, item.product.sku]);
  useEffect(() => () => controller.dispose(), [controller]);
  if (failure) throw failure;
  return <primitive object={scene} dispose={null} />;
}

interface EditingControls {
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
  onPreviewMove: (id: string, xMm: number, zMm: number) => void;
  onCommitMove: (id: string, xMm: number, zMm: number) => void;
}

function PlacedFurniture({ design, item, editing, onDragStart }: { design: DesignDetail; item: DesignItem; editing?: EditingControls; onDragStart?: (id: string) => void }) {
  const position = itemWorldPosition(design.room, item);
  const fallback = <Placeholder item={item} />;
  return <group position={position} rotation={[0, degreesToYRadians(item.rotationDeg), 0]} onPointerDown={editing ? (event) => { event.stopPropagation(); editing.onSelect(item.id); onDragStart?.(item.id); } : undefined}><ItemBoundary fallback={fallback}>{item.product.modelUrl ? <Suspense fallback={fallback}><LoadedFurniture item={item} /></Suspense> : fallback}</ItemBoundary>{editing?.selectedItemId === item.id && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(item.product.dimensions.widthMm, item.product.dimensions.depthMm) / 1900, Math.max(item.product.dimensions.widthMm, item.product.dimensions.depthMm) / 1700, 32]} /><meshBasicMaterial color="#a94f35" /></mesh>}{!item.available && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><ringGeometry args={[0.35, 0.42, 32]} /><meshBasicMaterial color="#b5412d" /></mesh>}</group>;
}

function wallPosition(wall: Wall, start: number, length: number, bottom: number, height: number, width: number, depth: number): [number, number, number] {
  const along = start + length / 2;
  if (wall === "north") return [along - width / 2, bottom + height / 2, -depth / 2];
  if (wall === "south") return [along - width / 2, bottom + height / 2, depth / 2];
  if (wall === "west") return [-width / 2, bottom + height / 2, along - depth / 2];
  return [width / 2, bottom + height / 2, along - depth / 2];
}

function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const canvas = useThree(({ gl }) => gl.domElement);
  useEffect(() => watchForContextLoss(canvas, onFailure), [canvas, onFailure]);
  return null;
}

function BoundedPan({ controlsRef, width, depth, height }: { controlsRef: React.RefObject<OrbitControlsImpl | null>; width: number; depth: number; height: number }) {
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const clampTarget = () => {
      const { target } = controls;
      target.set(
        Math.max(-width / 2, Math.min(width / 2, target.x)),
        Math.max(0, Math.min(height, target.y)),
        Math.max(-depth / 2, Math.min(depth / 2, target.z)),
      );
    };
    controls.addEventListener("change", clampTarget);
    return () => controls.removeEventListener("change", clampTarget);
  }, [controlsRef, depth, height, width]);
  return null;
}

function Scene({ design, controlsRef, onFailure, editing }: { design: DesignDetail; controlsRef: React.RefObject<OrbitControlsImpl | null>; onFailure: () => void; editing?: EditingControls }) {
  const width = design.room.widthMm / 1000;
  const depth = design.room.depthMm / 1000;
  const wallColor = design.features.wallColor ?? "#F2EFE9";
  const floorColors = { oak: "#a77b4f", tile: "#d8d4ca", carpet: "#777469", concrete: "#aaa7a0" };
  const [dragging, setDragging] = useState<string | null>(null);
  const floorPoint = (event: ThreeEvent<PointerEvent>) => ({ x: Math.round((event.point.x + width / 2) * 1000), z: Math.round((event.point.z + depth / 2) * 1000) });
  return <><ContextGuard onFailure={onFailure} /><color attach="background" args={["#e8e3db"]} /><ambientLight intensity={1.5} /><directionalLight position={[4, 8, 3]} intensity={2.2} castShadow /><Bounds fit clip observe margin={1.2}><group><mesh position={[0, -0.04, 0]} receiveShadow onPointerMove={editing ? (event) => { if (dragging) { event.stopPropagation(); const point = floorPoint(event); editing.onPreviewMove(dragging, point.x, point.z); } } : undefined} onPointerUp={editing ? (event) => { if (dragging) { const point = floorPoint(event); editing.onCommitMove(dragging, point.x, point.z); setDragging(null); } } : undefined}><boxGeometry args={[width, 0.08, depth]} /><meshStandardMaterial color={floorColors[design.features.floor ?? "oak"]} roughness={0.9} /></mesh>{buildWallSegments(design.room, design.features.openings).map((segment, index) => { const horizontal = segment.wall === "north" || segment.wall === "south"; return <mesh key={`${segment.wall}-${index}`} position={wallPosition(segment.wall, segment.alongStartM, segment.alongLengthM, segment.bottomM, segment.heightM, width, depth)} castShadow><boxGeometry args={horizontal ? [segment.alongLengthM, segment.heightM, 0.08] : [0.08, segment.heightM, segment.alongLengthM]} /><meshStandardMaterial color={wallColor} transparent opacity={0.72} roughness={0.95} /></mesh>; })}{design.items.map((item) => <PlacedFurniture key={item.id} design={design} item={item} editing={editing} onDragStart={setDragging} />)}</group></Bounds><OrbitControls ref={controlsRef} makeDefault enabled={!dragging} enablePan minDistance={1} maxDistance={Math.max(width, depth) * 2.5} maxPolarAngle={Math.PI / 2.02} target={[0, Math.min(1, design.room.heightMm / 2000), 0]} /><BoundedPan controlsRef={controlsRef} width={width} depth={depth} height={design.room.heightMm / 1000} /></>;
}

export default function RoomScene({ design, onFailure, editing }: { design: DesignDetail; onFailure: () => void; editing?: EditingControls }) {
  const controls = useRef<OrbitControlsImpl>(null);
  return <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10" data-testid="room-3d-scene"><Canvas frameloop="demand" dpr={[1, 2]} shadows camera={{ position: [5, 5, 7], fov: 45, near: 0.01, far: 200 }} aria-label={`Interactive 3D room for ${design.name}`} onPointerMissed={() => editing?.onSelect(null)}><Scene design={design} controlsRef={controls} onFailure={onFailure} editing={editing} /></Canvas><output className="sr-only" data-testid="room-variant-skus">3D variants: {design.items.map((item) => item.product.sku ?? "original").join(", ")}</output><div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3"><p className="rounded-full bg-canvas/90 px-3 py-1.5 text-[11px] text-ink/70">{editing ? "Select and drag furniture · Drag empty space to orbit" : "Drag to orbit · Scroll or pinch to zoom · Shift-drag to pan"}</p><button type="button" onClick={() => controls.current?.reset()} className="pointer-events-auto rounded-full border border-ink/10 bg-canvas/90 px-3 py-1.5 text-xs font-medium" data-testid="reset-room-view">Reset view</button></div></div>;
}
