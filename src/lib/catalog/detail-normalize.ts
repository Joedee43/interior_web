import { formatDimensions, formatPrice, formatWeight } from "./format";
import { normalizeCategory } from "./normalize";
import type {
  ProductDetail,
  ProductMediaImage,
  ProductMediaModel,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "./detail-types";

export function normalizeProductDetail(raw: unknown): ProductDetail | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === "string" ? item.id.trim() : "";
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";

  if (!id || !slug || !name) {
    return null;
  }

  let category;
  try {
    category = normalizeCategory(item.category);
  } catch {
    return null;
  }

  const companyRaw = (item.company as Record<string, unknown>) ?? {};
  const companySlug =
    typeof companyRaw.slug === "string" ? companyRaw.slug.trim() : "";
  const companyName =
    typeof companyRaw.name === "string" ? companyRaw.name.trim() : "";
  if (!companySlug || !companyName) {
    return null;
  }
  const company = { slug: companySlug, name: companyName };

  const priceRaw = (item.price as Record<string, unknown>) ?? {};
  const amountMinor =
    typeof priceRaw.amount_minor === "number" ? priceRaw.amount_minor : -1;
  const currency =
    typeof priceRaw.currency === "string" && priceRaw.currency.trim().length > 0
      ? priceRaw.currency.trim().toUpperCase()
      : "";
  if (amountMinor < 0 || !currency) {
    return null;
  }
  const basePrice = { amount_minor: amountMinor, currency };

  const dimRaw = (item.dimensions as Record<string, unknown>) ?? {};
  if (
    typeof dimRaw.width_mm !== "number" ||
    typeof dimRaw.depth_mm !== "number" ||
    typeof dimRaw.height_mm !== "number"
  ) {
    return null;
  }
  const dimensions = {
    width_mm: dimRaw.width_mm,
    depth_mm: dimRaw.depth_mm,
    height_mm: dimRaw.height_mm,
  };

  const weightG =
    typeof item.weight_g === "number" && item.weight_g > 0
      ? item.weight_g
      : null;

  const publishedAt =
    typeof item.published_at === "string" ? item.published_at : null;

  const primaryImageUrl =
    typeof item.primary_image_url === "string" &&
    item.primary_image_url.trim().length > 0
      ? item.primary_image_url.trim()
      : null;

  const description =
    typeof item.description === "string" ? item.description.trim() : undefined;

  // 1. Normalize Media (images and model)
  const images: ProductMediaImage[] = [];
  if (item.images !== undefined && item.images !== null) {
    if (!Array.isArray(item.images)) {
      return null;
    }
    for (const imgRaw of item.images) {
      if (typeof imgRaw !== "object" || imgRaw === null) {
        return null;
      }
      const img = imgRaw as Record<string, unknown>;
      const imgId = typeof img.id === "string" ? img.id.trim() : "";
      const url = typeof img.url === "string" ? img.url.trim() : "";
      if (!imgId || !url) {
        return null; // Reject invalid media
      }
      images.push({
        id: imgId,
        url,
        altText:
          typeof img.alt_text === "string" && img.alt_text.trim().length > 0
            ? img.alt_text.trim()
            : name,
        width: typeof img.width === "number" ? img.width : undefined,
        height: typeof img.height === "number" ? img.height : undefined,
        position: typeof img.position === "number" ? img.position : 0,
        isPrimary: Boolean(img.is_primary),
      });
    }
  }

  // Sort images: primary first, then position ascending
  images.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.position - b.position;
  });

  let model: ProductMediaModel | null = null;
  if (item.model !== undefined && item.model !== null) {
    if (typeof item.model !== "object") {
      return null;
    }
    const m = item.model as Record<string, unknown>;
    const modelId = typeof m.id === "string" ? m.id.trim() : "";
    const modelUrl = typeof m.url === "string" ? m.url.trim() : "";
    if (!modelId || !modelUrl) {
      return null; // Reject invalid media
    }
    model = {
      id: modelId,
      url: modelUrl,
      sizeBytes: typeof m.size_bytes === "number" ? m.size_bytes : undefined,
      materials: Array.isArray(m.materials)
        ? m.materials.filter((s): s is string => typeof s === "string")
        : [],
      variants: Array.isArray(m.variants)
        ? m.variants.filter((s): s is string => typeof s === "string")
        : [],
    };
  }

  // 2. Normalize Options and Values
  const options: ProductOption[] = [];
  const validValueIds = new Set<string>();
  const valueIdToOptionId = new Map<string, string>();

  if (item.options !== undefined && item.options !== null) {
    if (!Array.isArray(item.options)) {
      return null;
    }
    for (const optRaw of item.options) {
      if (typeof optRaw !== "object" || optRaw === null) {
        return null;
      }
      const opt = optRaw as Record<string, unknown>;
      const optId = typeof opt.id === "string" ? opt.id.trim() : "";
      const optName = typeof opt.name === "string" ? opt.name.trim() : "";
      if (!optId || !optName) {
        return null;
      }

      const values: ProductOptionValue[] = [];
      if (opt.values !== undefined && opt.values !== null) {
        if (!Array.isArray(opt.values)) {
          return null;
        }
        for (const valRaw of opt.values) {
          if (typeof valRaw !== "object" || valRaw === null) {
            return null;
          }
          const val = valRaw as Record<string, unknown>;
          const valId = typeof val.id === "string" ? val.id.trim() : "";
          const valName =
            typeof val.name === "string" ? val.name.trim() : "";
          if (!valId || !valName) {
            return null;
          }
          values.push({
            id: valId,
            name: valName,
            position: typeof val.position === "number" ? val.position : 0,
            swatchHex:
              typeof val.swatch_hex === "string" &&
              val.swatch_hex.trim().length > 0
                ? val.swatch_hex.trim()
                : undefined,
            materialKey:
              typeof val.material_key === "string" &&
              val.material_key.trim().length > 0
                ? val.material_key.trim()
                : undefined,
          });
          validValueIds.add(valId);
          valueIdToOptionId.set(valId, optId);
        }
      }
      values.sort((a, b) => a.position - b.position);

      options.push({
        id: optId,
        name: optName,
        position: typeof opt.position === "number" ? opt.position : 0,
        values,
      });
    }
  }
  options.sort((a, b) => a.position - b.position);

  // 3. Normalize Variants & validate combinations
  const variants: ProductVariant[] = [];
  const seenCombinations = new Set<string>();

  if (item.variants !== undefined && item.variants !== null) {
    if (!Array.isArray(item.variants)) {
      return null;
    }
    for (const varRaw of item.variants) {
      if (typeof varRaw !== "object" || varRaw === null) {
        return null;
      }
      const v = varRaw as Record<string, unknown>;
      const varId = typeof v.id === "string" ? v.id.trim() : "";
      const sku = typeof v.sku === "string" ? v.sku.trim() : "";
      if (!varId || !sku) {
        return null;
      }

      const vPriceRaw = (v.price as Record<string, unknown>) ?? {};
      const vAmount =
        typeof vPriceRaw.amount_minor === "number"
          ? vPriceRaw.amount_minor
          : -1;
      const vCurrency =
        typeof vPriceRaw.currency === "string"
          ? vPriceRaw.currency.trim().toUpperCase()
          : currency;
      if (vAmount < 0) {
        return null;
      }
      const vPrice = { amount_minor: vAmount, currency: vCurrency };

      const valueIds: string[] = [];
      if (v.value_ids !== undefined && v.value_ids !== null) {
        if (!Array.isArray(v.value_ids)) {
          return null;
        }
        for (const vid of v.value_ids) {
          if (typeof vid === "string" && vid.trim().length > 0) {
            const cleanVid = vid.trim();
            if (!validValueIds.has(cleanVid)) {
              return null; // Reject unknown value IDs
            }
            valueIds.push(cleanVid);
          }
        }
      }

      // If options exist, each variant must cover exactly all options (incomplete combinations rejected)
      if (options.length > 0) {
        if (valueIds.length !== options.length) {
          return null; // Incomplete combination
        }
        const coveredOptions = new Set(
          valueIds.map((vid) => valueIdToOptionId.get(vid)),
        );
        if (coveredOptions.size !== options.length) {
          return null; // Missing or duplicate option coverage
        }
      } else if (valueIds.length > 0) {
        return null; // Value IDs provided but product has no options
      }

      // Combination uniqueness check
      const sortedCombination = [...valueIds].sort().join(":");
      if (seenCombinations.has(sortedCombination)) {
        return null; // Duplicate combinations rejected
      }
      seenCombinations.add(sortedCombination);

      const optionsMap: Record<string, string> = {};
      if (typeof v.options === "object" && v.options !== null) {
        for (const [k, val] of Object.entries(v.options)) {
          if (typeof val === "string") {
            optionsMap[k] = val;
          }
        }
      }

      variants.push({
        id: varId,
        sku,
        price: vPrice,
        formattedPrice: formatPrice(vPrice),
        available: Boolean(v.available),
        position: typeof v.position === "number" ? v.position : 0,
        options: optionsMap,
        valueIds,
      });
    }
  }
  variants.sort((a, b) => a.position - b.position);

  // If options exist without variants, or variants without options
  if ((options.length > 0 && variants.length === 0) || (options.length === 0 && variants.length > 0)) {
    return null;
  }

  const hasOptions = options.length > 0 && variants.length > 0;

  return {
    id,
    slug,
    name,
    description,
    category,
    company,
    basePrice,
    formattedBasePrice: formatPrice(basePrice),
    dimensions,
    formattedDimensions: formatDimensions(dimensions),
    weightG,
    formattedWeight: formatWeight(weightG),
    publishedAt,
    primaryImageUrl,
    images,
    model,
    options,
    variants,
    hasOptions,
  };
}
