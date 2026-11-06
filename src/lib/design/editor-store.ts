"use client";

import { createContext, createElement, useContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { ApiError } from "@/lib/api/error";
import { clearAuthenticatedState } from "@/lib/query/client";
import { createDesignItem, deleteDesignItem, fetchRevisionedDesignDetail, updateDesign, updateDesignItem, type CreateDesignItemInput, type UpdateDesignInput, type UpdateDesignItemInput } from "./api";
import type { DesignDetail, DesignItem } from "./types";

export type SaveStatus = "saved" | "saving" | "unsaved" | "conflict" | "error";
type Operation = { run: (revision: number) => Promise<number>; key: string };

export interface EditorState {
  design: DesignDetail;
  revision: number;
  selectedItemId: string | null;
  status: SaveStatus;
  requestId?: string;
  message?: string;
  conflictLatest?: { design: DesignDetail; revision: number };
  selectItem: (id: string | null) => void;
  previewItem: (id: string, optimistic: (item: DesignItem) => DesignItem) => void;
  patchDesign: (input: UpdateDesignInput, optimistic: (design: DesignDetail) => DesignDetail) => void;
  patchItem: (id: string, input: UpdateDesignItemInput, optimistic: (item: DesignItem) => DesignItem) => void;
  addItem: (input: CreateDesignItemInput) => void;
  removeItem: (id: string) => void;
  retry: () => void;
  reviewLatest: () => void;
  applyMine: () => void;
  reload: () => Promise<void>;
}

export function createEditorStore(initial: DesignDetail, revision: number, onUnauthorized?: () => void): StoreApi<EditorState> {
  let failed: Operation | undefined;
  let pending: Operation[] = [];
  let running = false;
  const store = createStore<EditorState>((set, get) => {
    const reconcile = async () => {
      if (pending.length !== 0 || running || get().status !== "saved") return;
      try {
        const latest = await fetchRevisionedDesignDetail(initial.id);
        if (pending.length === 0 && !running && latest.revision >= get().revision) set({ design: latest.data, revision: latest.revision });
      } catch { /* The confirmed mutation remains visible; a later refresh retries. */ }
    };
    const drain = async () => {
      if (running || get().status === "conflict" || get().status === "error") return;
      running = true;
      while (pending.length > 0) {
        const operation = pending.shift()!;
        set({ status: "saving" });
        try {
          const next = await operation.run(get().revision);
          set({ revision: next });
        } catch (error) {
          failed = operation;
          if (error instanceof ApiError && error.status === 401) onUnauthorized?.();
          if (error instanceof ApiError && error.code === "stale_revision") {
            try {
              const latest = await fetchRevisionedDesignDetail(initial.id);
              set({ status: "conflict", conflictLatest: { design: latest.data, revision: latest.revision }, requestId: error.requestId, message: "This room changed in another editor." });
              running = false;
              return;
            } catch { /* fall through to retryable error */ }
          }
          set({ status: "error", requestId: error instanceof ApiError ? error.requestId : undefined, message: error instanceof Error ? error.message : "The change could not be saved." });
          running = false;
          return;
        }
      }
      running = false;
      failed = undefined;
      set({ status: "saved" });
      void reconcile();
    };
    const enqueue = (operation: Operation) => {
      const existing = pending.findIndex(({ key }) => key === operation.key);
      if (existing >= 0) pending[existing] = operation;
      else pending.push(operation);
      set({ status: "unsaved", requestId: undefined, message: undefined });
      void drain();
    };
    return {
      design: initial, revision, selectedItemId: null, status: "saved",
      selectItem: (id) => set({ selectedItemId: id }),
      previewItem: (id, optimistic) => set(({ design }) => ({ design: { ...design, items: design.items.map((item) => item.id === id ? optimistic(item) : item) } })),
      patchDesign: (input, optimistic) => {
        set(({ design }) => ({ design: optimistic(design) }));
        enqueue({ key: "design", run: async (current) => {
          const design = get().design;
          const result = await updateDesign(initial.id, current, { ...input, name: design.name, width_mm: design.room.widthMm, depth_mm: design.room.depthMm, height_mm: design.room.heightMm, features: { wall_color: design.features.wallColor, floor: design.features.floor, openings: design.features.openings.map((opening) => ({ type: opening.type, wall: opening.wall, offset_mm: opening.offsetMm, width_mm: opening.widthMm, height_mm: opening.heightMm, sill_mm: opening.sillMm })) } });
          set(({ design }) => ({ design: { ...result.data, items: design.items, itemCount: design.itemCount, estimate: design.estimate } }));
          return result.revision;
        } });
      },
      patchItem: (id, input, optimistic) => {
        set(({ design }) => ({ design: { ...design, items: design.items.map((item) => item.id === id ? optimistic(item) : item) } }));
        enqueue({ key: `item:${id}`, run: async (current) => {
          const item = get().design.items.find((candidate) => candidate.id === id);
          if (!item) return current;
          const result = await updateDesignItem(initial.id, id, current, { ...input, x_mm: item.position.xMm, y_mm: item.position.yMm, z_mm: item.position.zMm, rotation_deg: item.rotationDeg, ...(item.product.variantId ? { variant_id: item.product.variantId } : {}) });
          set(({ design }) => ({ design: { ...design, items: design.items.map((candidate) => candidate.id === id ? result.data : candidate) } }));
          return result.revision;
        } });
      },
      addItem: (input) => enqueue({ key: "add", run: async (current) => { const result = await createDesignItem(initial.id, current, input); set(({ design }) => ({ selectedItemId: result.data.id, design: { ...design, itemCount: design.itemCount + 1, items: [...design.items, result.data] } })); return result.revision; } }),
      removeItem: (id) => {
        const previous = get().design.items.find((item) => item.id === id);
        set(({ design }) => ({ selectedItemId: null, design: { ...design, itemCount: design.itemCount - 1, items: design.items.filter((item) => item.id !== id) } }));
        enqueue({ key: `delete:${id}`, run: async (current) => { try { return await deleteDesignItem(initial.id, id, current); } catch (error) { if (previous) set(({ design }) => ({ design: { ...design, itemCount: design.itemCount + 1, items: [...design.items, previous] } })); throw error; } } });
      },
      retry: () => { if (failed) { const operation = failed; failed = undefined; set({ status: "unsaved" }); pending.unshift(operation); void drain(); } },
      reviewLatest: () => { const latest = get().conflictLatest; if (latest) { failed = undefined; pending = []; set({ design: latest.design, revision: latest.revision, conflictLatest: undefined, status: "saved", selectedItemId: null }); } },
      applyMine: () => { const latest = get().conflictLatest; const operation = failed; if (latest && operation) { failed = undefined; set({ revision: latest.revision, conflictLatest: undefined, status: "unsaved" }); pending.unshift(operation); void drain(); } },
      reload: async () => { const latest = await fetchRevisionedDesignDetail(initial.id); failed = undefined; pending = []; set({ design: latest.data, revision: latest.revision, status: "saved", conflictLatest: undefined, selectedItemId: null }); },
    };
  });
  return store;
}

const EditorContext = createContext<StoreApi<EditorState> | null>(null);
export function EditorProvider({ design, revision, children }: { design: DesignDetail; revision: number; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [store] = useState(() => createEditorStore(design, revision, () => clearAuthenticatedState(queryClient)));
  return createElement(EditorContext.Provider, { value: store }, children);
}
export function useEditor<T>(selector: (state: EditorState) => T): T {
  const store = useContext(EditorContext);
  if (!store) throw new Error("EditorProvider is missing");
  return useStore(store, selector);
}
