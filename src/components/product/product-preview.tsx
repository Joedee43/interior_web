"use client";

import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import type { ProductDetail } from "@/lib/catalog/detail-types";
import { VariantMaterialController, validatePreviewContract } from "@/lib/three/khr-variants";
import { normalizeModelPivot, warnForDimensionMismatch } from "@/lib/three/model-bounds";

interface ProductPreviewProps {
  product: ProductDetail;
  selectedSku: string | null;
  onFailure: (message: string) => void;
  retryKey: number;
}

interface BoundaryProps {
  children: React.ReactNode;
  onFailure: (message: string) => void;
  resetKey: number;
}

class PreviewBoundary extends Component<BoundaryProps> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onFailure(
      error instanceof Error ? error.message : "The 3D preview could not be shown.",
    );
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function watchForContextLoss(
  canvas: HTMLCanvasElement,
  onFailure: (message: string) => void,
) {
  const contextLost = (event: Event) => {
    event.preventDefault();
    onFailure("The WebGL context was lost.");
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  return () => canvas.removeEventListener("webglcontextlost", contextLost);
}

function ContextLossGuard({ onFailure }: { onFailure: (message: string) => void }) {
  const canvas = useThree(({ gl }) => gl.domElement);
  useEffect(() => watchForContextLoss(canvas, onFailure), [canvas, onFailure]);
  return null;
}

function LoadedModel({
  product,
  selectedSku,
  onFailure,
}: Omit<ProductPreviewProps, "retryKey">) {
  const model = product.model!;
  // false: no Draco decoder, which drei would fetch from Google's CDN (the
  // CSP blocks it). Product GLBs must be self-contained; a Draco model fails
  // into the image fallback.
  const gltf = useGLTF(model.url, false);
  const invalidate = useThree(({ invalidate }) => invalidate);
  const scene = useMemo(() => {
    const cloned = skeletonClone(gltf.scene);
    cloned.userData.gltfExtensions = gltf.userData.gltfExtensions;
    return cloned;
  }, [gltf]);
  const controller = useMemo(
    () => new VariantMaterialController(scene, gltf.parser),
    [gltf.parser, scene],
  );

  useLayoutEffect(() => {
    try {
      validatePreviewContract(scene, model, product);
      const bounds = normalizeModelPivot(scene);
      warnForDimensionMismatch(`${product.id}/${model.id}`, bounds, product.dimensions);
    } catch (error) {
      onFailure(error instanceof Error ? error.message : "The model is invalid.");
    }
  }, [model, onFailure, product, scene]);

  useEffect(() => {
    let active = true;
    if (!product.hasOptions || !selectedSku) {
      controller.restore();
      invalidate();
      return () => {
        active = false;
      };
    }

    void controller.select(selectedSku).then(
      () => {
        if (active) invalidate();
      },
      (error: unknown) => {
        if (active) {
          onFailure(
            error instanceof Error
              ? error.message
              : "The selected 3D finish could not be shown.",
          );
        }
      },
    );

    return () => {
      active = false;
    };
  }, [controller, invalidate, onFailure, product.hasOptions, selectedSku]);

  useEffect(() => () => controller.dispose(), [controller]);

  return <primitive object={scene} dispose={null} />;
}

function Scene({
  product,
  selectedSku,
  onFailure,
  controlsRef,
}: Omit<ProductPreviewProps, "retryKey"> & {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  return (
    <>
      <color attach="background" args={["#f2eee7"]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.7} />
      <Bounds fit clip observe margin={1.25}>
        <Suspense fallback={null}>
          <LoadedModel
            product={product}
            selectedSku={selectedSku}
            onFailure={onFailure}
          />
        </Suspense>
      </Bounds>
      <gridHelper args={[8, 16, "#c9c1b5", "#ded8cf"]} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        minDistance={1.2}
        maxDistance={8}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.45, 0]}
      />
    </>
  );
}

export function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function clearFailedModel(url: string) {
  useGLTF.clear(url);
}

export default function ProductPreview({
  product,
  selectedSku,
  onFailure,
  retryKey,
}: ProductPreviewProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const webGL2Available = useMemo(() => supportsWebGL2(), []);

  useEffect(() => {
    if (!webGL2Available) onFailure("WebGL2 is unavailable in this browser.");
  }, [onFailure, webGL2Available]);

  if (!webGL2Available) {
    return (
      <div className="aspect-[4/3] rounded-2xl border border-ink/10 bg-canvas-deep/40" role="img" aria-label="3D preview unavailable" />
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink/10 bg-canvas-deep/40" data-testid="product-3d-preview">
      <PreviewBoundary onFailure={onFailure} resetKey={retryKey}>
        <Canvas
          key={retryKey}
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [1.8, 1.35, 2.2], fov: 42, near: 0.01, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          role="img"
          aria-label={`Interactive 3D preview of ${product.name}`}
        >
          <ContextLossGuard onFailure={onFailure} />
          <Scene
            product={product}
            selectedSku={selectedSku}
            onFailure={onFailure}
            controlsRef={controlsRef}
          />
        </Canvas>
      </PreviewBoundary>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
        <p className="rounded-full bg-canvas/90 px-3 py-1.5 text-[11px] text-ink/70 shadow-sm backdrop-blur-sm">
          Drag to orbit · Scroll or pinch to zoom
        </p>
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-ink/10 bg-canvas/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur-sm hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          onClick={() => controlsRef.current?.reset()}
          data-testid="reset-3d-view"
        >
          Reset view
        </button>
      </div>
      {selectedSku && (
        <output className="sr-only" data-testid="preview-selected-sku">
          3D finish: {selectedSku}
        </output>
      )}
    </div>
  );
}
