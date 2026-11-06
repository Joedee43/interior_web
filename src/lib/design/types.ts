export interface RoomDimensions {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

export type FloorType = "oak" | "tile" | "carpet" | "concrete";
export type Wall = "north" | "south" | "east" | "west";

export interface RoomOpening {
  type: "door" | "window";
  wall: Wall;
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  sillMm: number;
}

export interface RoomFeatures {
  wallColor?: string;
  floor?: FloorType;
  openings: RoomOpening[];
}

export interface RoomTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  room: RoomDimensions;
  features: RoomFeatures;
  sortOrder: number;
  updatedAt: string;
}

export interface DesignSummary {
  id: string;
  name: string;
  templateId: string | null;
  room: RoomDimensions;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignItem {
  id: string;
  position: { xMm: number; yMm: number; zMm: number };
  rotationDeg: number;
  available: boolean;
  product: {
    id: string;
    slug: string;
    name: string;
    companySlug: string;
    companyName: string;
    variantId: string | null;
    sku: string | null;
    options: Record<string, string>;
    price: { amountMinor: number; currency: string };
    dimensions: RoomDimensions;
    primaryImageUrl: string | null;
    modelUrl: string | null;
  };
  updatedAt: string;
}

export interface DesignEstimate {
  note: string;
  itemCount: number;
  unavailableCount: number;
  totals: Array<{
    companySlug: string;
    companyName: string;
    currency: string;
    amountMinor: number;
    items: number;
  }>;
}

export interface DesignDetail extends DesignSummary {
  features: RoomFeatures;
  items: DesignItem[];
  estimate: DesignEstimate;
}

export interface DesignPage {
  designs: DesignSummary[];
  nextCursor: string | null;
}
