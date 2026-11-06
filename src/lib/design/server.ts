import "server-only";

import { cache } from "react";
import type { operations } from "@/lib/api/generated/schema";
import { ApiError } from "@/lib/api/error";
import { serverApiFetch } from "@/lib/api/server";
import { DESIGN_PAGE_SIZE } from "./api";
import { normalizeDesignDetail, normalizeDesignPage, normalizeRoomTemplates } from "./normalize";
import type { DesignDetail, DesignPage, RoomTemplate } from "./types";

type TemplatesResponse = operations["listRoomTemplates"]["responses"][200]["content"]["application/json"];
type ListResponse = operations["listDesigns"]["responses"][200]["content"]["application/json"];
type DetailResponse = operations["getDesign"]["responses"][200]["content"]["application/json"];

export const getRoomTemplates = cache(async (): Promise<RoomTemplate[]> => {
  const raw = await serverApiFetch<TemplatesResponse>("/v1/room-templates", { cache: "no-store" });
  return normalizeRoomTemplates(raw);
});

export const getInitialDesignPage = cache(async (): Promise<DesignPage> => {
  const raw = await serverApiFetch<ListResponse>(`/v1/designs?limit=${DESIGN_PAGE_SIZE}`, { cache: "no-store" });
  return normalizeDesignPage(raw);
});

export const getDesign = cache(async (id: string): Promise<DesignDetail | null> => {
  try {
    const raw = await serverApiFetch<DetailResponse>(`/v1/designs/${encodeURIComponent(id)}` as `/v1/${string}`, { cache: "no-store" });
    return normalizeDesignDetail(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
