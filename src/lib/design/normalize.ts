import type {
  DesignDetail,
  DesignItem,
  DesignPage,
  DesignSummary,
  FloorType,
  RoomDimensions,
  RoomFeatures,
  RoomOpening,
  RoomTemplate,
  Wall,
} from "./types";

export class DesignContractError extends Error {
  constructor(message: string) {
    super(`design contract ${message}`);
    this.name = "DesignContractError";
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPattern = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const colorPattern = /^#[0-9A-F]{6}$/;
const floors = new Set<FloorType>(["oak", "tile", "carpet", "concrete"]);
const walls = new Set<Wall>(["north", "south", "east", "west"]);

function fail(message: string): never {
  throw new DesignContractError(message);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be an object`);
  return value as Record<string, unknown>;
}

function string(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== "string") fail(`${field} must be a string`);
  const result = value.trim();
  if (!allowEmpty && !result) fail(`${field} must not be empty`);
  return result;
}

function integer(value: unknown, field: string, min = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < min) fail(`${field} must be a safe integer of at least ${min}`);
  return value as number;
}

function uuid(value: unknown, field: string): string {
  const result = string(value, field);
  if (!uuidPattern.test(result)) fail(`${field} must be a UUID`);
  return result;
}

function date(value: unknown, field: string): string {
  const result = string(value, field);
  if (Number.isNaN(Date.parse(result))) fail(`${field} must be a date-time`);
  return result;
}

function nullableUuid(value: unknown, field: string): string | null {
  return value === null ? null : uuid(value, field);
}

function nullableUrl(value: unknown, field: string): string | null {
  if (value === null) return null;
  const result = string(value, field);
  if (!result.startsWith("/") && !/^https?:\/\//.test(result)) fail(`${field} must be an HTTP or relative URL`);
  return result;
}

function room(value: unknown, field: string): RoomDimensions {
  const item = record(value, field);
  const result = {
    widthMm: integer(item.width_mm, `${field}.width_mm`, 1000),
    depthMm: integer(item.depth_mm, `${field}.depth_mm`, 1000),
    heightMm: integer(item.height_mm, `${field}.height_mm`, 2000),
  };
  if (result.widthMm > 30000 || result.depthMm > 30000 || result.heightMm > 6000) fail(`${field} exceeds room limits`);
  return result;
}

function productDimensions(value: unknown, field: string): RoomDimensions {
  const item = record(value, field);
  return {
    widthMm: integer(item.width_mm, `${field}.width_mm`, 1),
    depthMm: integer(item.depth_mm, `${field}.depth_mm`, 1),
    heightMm: integer(item.height_mm, `${field}.height_mm`, 1),
  };
}

function opening(value: unknown, roomValue: RoomDimensions, field: string): RoomOpening {
  const item = record(value, field);
  if (item.type !== "door" && item.type !== "window") fail(`${field}.type is invalid`);
  if (typeof item.wall !== "string" || !walls.has(item.wall as Wall)) fail(`${field}.wall is invalid`);
  const result: RoomOpening = {
    type: item.type,
    wall: item.wall as Wall,
    offsetMm: integer(item.offset_mm, `${field}.offset_mm`),
    widthMm: integer(item.width_mm, `${field}.width_mm`, 300),
    heightMm: integer(item.height_mm, `${field}.height_mm`, 300),
    sillMm: integer(item.sill_mm, `${field}.sill_mm`),
  };
  const wallLength = result.wall === "north" || result.wall === "south" ? roomValue.widthMm : roomValue.depthMm;
  if (result.offsetMm + result.widthMm > wallLength || result.sillMm + result.heightMm > roomValue.heightMm) fail(`${field} does not fit its wall`);
  return result;
}

function features(value: unknown, roomValue: RoomDimensions, field: string): RoomFeatures {
  const item = record(value, field);
  const wallColor = item.wall_color === undefined ? undefined : string(item.wall_color, `${field}.wall_color`);
  if (wallColor !== undefined && !colorPattern.test(wallColor)) fail(`${field}.wall_color is invalid`);
  let floor: FloorType | undefined;
  if (item.floor !== undefined) {
    if (typeof item.floor !== "string" || !floors.has(item.floor as FloorType)) fail(`${field}.floor is invalid`);
    floor = item.floor as FloorType;
  }
  if (!Array.isArray(item.openings) || item.openings.length > 20) fail(`${field}.openings must be an array with at most 20 entries`);
  return { wallColor, floor, openings: item.openings.map((entry, index) => opening(entry, roomValue, `${field}.openings[${index}]`)) };
}

function summary(value: unknown, field: string): DesignSummary {
  const item = record(value, field);
  const result: DesignSummary = {
    id: uuid(item.id, `${field}.id`),
    name: string(item.name, `${field}.name`),
    templateId: nullableUuid(item.template_id, `${field}.template_id`),
    room: room(item.room, `${field}.room`),
    itemCount: integer(item.item_count, `${field}.item_count`),
    createdAt: date(item.created_at, `${field}.created_at`),
    updatedAt: date(item.updated_at, `${field}.updated_at`),
  };
  if ([...result.name].length > 100) fail(`${field}.name is too long`);
  return result;
}

function designItem(value: unknown, field: string): DesignItem {
  const item = record(value, field);
  const position = record(item.position, `${field}.position`);
  const product = record(item.product, `${field}.product`);
  const variantId = nullableUuid(product.variant_id, `${field}.product.variant_id`);
  const sku = product.sku === null ? null : string(product.sku, `${field}.product.sku`);
  if ((variantId === null) !== (sku === null)) fail(`${field}.product.variant_id and sku must both be null or present`);
  if (sku !== null && !skuPattern.test(sku)) fail(`${field}.product.sku is invalid`);
  const optionRecord = record(product.options, `${field}.product.options`);
  const options: Record<string, string> = {};
  for (const [key, raw] of Object.entries(optionRecord)) options[string(key, `${field}.product.options key`)] = string(raw, `${field}.product.options.${key}`);
  if (variantId === null && Object.keys(options).length > 0) fail(`${field}.product.options must be empty without a variant`);
  const price = record(product.price, `${field}.product.price`);
  const currency = string(price.currency, `${field}.product.price.currency`);
  if (!/^[A-Z]{3}$/.test(currency)) fail(`${field}.product.price.currency is invalid`);
  const rotationDeg = item.rotation_deg;
  if (typeof rotationDeg !== "number" || !Number.isFinite(rotationDeg) || rotationDeg < 0 || rotationDeg >= 360) fail(`${field}.rotation_deg is invalid`);
  if (typeof item.available !== "boolean") fail(`${field}.available must be boolean`);
  return {
    id: uuid(item.id, `${field}.id`),
    position: { xMm: integer(position.x_mm, `${field}.position.x_mm`), yMm: integer(position.y_mm, `${field}.position.y_mm`), zMm: integer(position.z_mm, `${field}.position.z_mm`) },
    rotationDeg,
    available: item.available,
    product: {
      id: uuid(product.id, `${field}.product.id`),
      slug: string(product.slug, `${field}.product.slug`),
      name: string(product.name, `${field}.product.name`),
      companySlug: string(product.company_slug, `${field}.product.company_slug`),
      companyName: string(product.company_name, `${field}.product.company_name`),
      variantId, sku, options,
      price: { amountMinor: integer(price.amount_minor, `${field}.product.price.amount_minor`), currency },
      dimensions: productDimensions(product.dimensions, `${field}.product.dimensions`),
      primaryImageUrl: nullableUrl(product.primary_image_url, `${field}.product.primary_image_url`),
      modelUrl: nullableUrl(product.model_url, `${field}.product.model_url`),
    },
    updatedAt: date(item.updated_at, `${field}.updated_at`),
  };
}

export function normalizeRoomTemplates(value: unknown): RoomTemplate[] {
  const root = record(value, "response");
  if (!Array.isArray(root.templates)) fail("response.templates must be an array");
  const ids = new Set<string>();
  return root.templates.map((entry, index) => {
    const item = record(entry, `templates[${index}]`);
    const id = uuid(item.id, `templates[${index}].id`);
    if (ids.has(id)) fail("templates contains duplicate IDs");
    ids.add(id);
    const slug = string(item.slug, `templates[${index}].slug`);
    if (!slugPattern.test(slug)) fail(`templates[${index}].slug is invalid`);
    const dimensions = room(item.room, `templates[${index}].room`);
    return { id, slug, name: string(item.name, `templates[${index}].name`), description: string(item.description, `templates[${index}].description`, true), room: dimensions, features: features(item.features, dimensions, `templates[${index}].features`), sortOrder: integer(item.sort_order, `templates[${index}].sort_order`), updatedAt: date(item.updated_at, `templates[${index}].updated_at`) };
  });
}

export function normalizeDesignPage(value: unknown): DesignPage {
  const root = record(value, "response");
  if (!Array.isArray(root.designs)) fail("response.designs must be an array");
  if (root.next_cursor !== null && typeof root.next_cursor !== "string") fail("response.next_cursor must be a string or null");
  const designs = root.designs.map((entry, index) => summary(entry, `designs[${index}]`));
  if (new Set(designs.map(({ id }) => id)).size !== designs.length) fail("response.designs contains duplicate IDs");
  return { designs, nextCursor: root.next_cursor };
}

export function normalizeDesignDetail(value: unknown): DesignDetail {
  const root = record(value, "response");
  const base = summary(root, "response");
  const normalizedFeatures = features(root.features, base.room, "response.features");
  if (!Array.isArray(root.items)) fail("response.items must be an array");
  const items = root.items.map((entry, index) => designItem(entry, `response.items[${index}]`));
  if (new Set(items.map(({ id }) => id)).size !== items.length || base.itemCount !== items.length) fail("response item counts are inconsistent");
  const estimate = record(root.estimate, "response.estimate");
  const itemCount = integer(estimate.item_count, "response.estimate.item_count");
  const unavailableCount = integer(estimate.unavailable_count, "response.estimate.unavailable_count");
  if (!Array.isArray(estimate.totals)) fail("response.estimate.totals must be an array");
  const totals = estimate.totals.map((entry, index) => {
    const total = record(entry, `response.estimate.totals[${index}]`);
    const currency = string(total.currency, `response.estimate.totals[${index}].currency`);
    if (!/^[A-Z]{3}$/.test(currency)) fail(`response.estimate.totals[${index}].currency is invalid`);
    return { companySlug: string(total.company_slug, `response.estimate.totals[${index}].company_slug`), companyName: string(total.company_name, `response.estimate.totals[${index}].company_name`), currency, amountMinor: integer(total.amount_minor, `response.estimate.totals[${index}].amount_minor`), items: integer(total.items, `response.estimate.totals[${index}].items`, 1) };
  });
  if (itemCount !== items.length || unavailableCount !== items.filter(({ available }) => !available).length || totals.reduce((sum, total) => sum + total.items, 0) !== itemCount - unavailableCount) fail("response.estimate counts are inconsistent");
  return { ...base, features: normalizedFeatures, items, estimate: { note: string(estimate.note, "response.estimate.note"), itemCount, unavailableCount, totals } };
}
