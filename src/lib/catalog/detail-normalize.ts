import { formatDimensions, formatPrice, formatWeight } from "./format";
import type {
  ProductDetail,
  ProductMediaImage,
  ProductMediaModel,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "./detail-types";
import { CatalogContractError, normalizeCategory } from "./normalize";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const skuPattern = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const swatchPattern = /^#[0-9A-F]{6}$/;
const materialPattern = /^[a-z0-9_]{1,64}$/;

function fail(message: string): never {
  throw new CatalogContractError(`product detail ${message}`);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }
  const result = value.trim();
  if (!allowEmpty && result.length === 0) {
    fail(`${field} must not be empty`);
  }
  return result;
}

function safeInteger(
  value: unknown,
  field: string,
  minimum: number,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    fail(`${field} must be a safe integer of at least ${minimum}`);
  }
  return value as number;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return string(value, field);
}

function nullablePositiveInteger(
  value: unknown,
  field: string,
): number | null {
  if (value === null) return null;
  return safeInteger(value, field, 1);
}

function price(
  value: unknown,
  field: string,
  expectedCurrency?: string,
) {
  const item = record(value, field);
  const amountMinor = safeInteger(item.amount_minor, `${field}.amount_minor`, 0);
  const currency = string(item.currency, `${field}.currency`);
  if (!/^[A-Z]{3}$/.test(currency)) {
    fail(`${field}.currency must be a three-letter uppercase code`);
  }
  if (expectedCurrency && currency !== expectedCurrency) {
    fail(`${field}.currency must match the product currency`);
  }
  return { amount_minor: amountMinor, currency };
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) fail(`${field} must be an array`);
  const seen = new Set<string>();
  return value.map((entry, index) => {
    const result = string(entry, `${field}[${index}]`);
    if (seen.has(result)) fail(`${field} contains a duplicate value`);
    seen.add(result);
    return result;
  });
}

function image(
  value: unknown,
  productName: string,
  mediaIds: Set<string>,
): ProductMediaImage {
  const item = record(value, "images[]");
  const id = string(item.id, "images[].id");
  if (mediaIds.has(id)) fail("contains duplicate media IDs");
  mediaIds.add(id);
  if (item.kind !== "image") fail("images[].kind must be image");
  const contentType = string(item.content_type, "images[].content_type");
  if (!imageTypes.has(contentType)) {
    fail("images[].content_type must be image/jpeg, image/png or image/webp");
  }
  const width =
    item.width === undefined
      ? undefined
      : safeInteger(item.width, "images[].width", 1);
  const height =
    item.height === undefined
      ? undefined
      : safeInteger(item.height, "images[].height", 1);
  if ((width === undefined) !== (height === undefined)) {
    fail("images[].width and images[].height must appear together");
  }
  if (typeof item.is_primary !== "boolean") {
    fail("images[].is_primary must be a boolean");
  }
  const altText =
    item.alt_text === undefined
      ? productName
      : string(item.alt_text, "images[].alt_text", true) || productName;
  return {
    id,
    url: string(item.url, "images[].url"),
    contentType: contentType as ProductMediaImage["contentType"],
    sizeBytes: safeInteger(item.size_bytes, "images[].size_bytes", 1),
    altText,
    width,
    height,
    position: safeInteger(item.position, "images[].position", 0),
    isPrimary: item.is_primary,
  };
}

function model(
  value: unknown,
  mediaIds: Set<string>,
): ProductMediaModel | null {
  if (value === null) return null;
  const item = record(value, "model");
  const id = string(item.id, "model.id");
  if (mediaIds.has(id)) fail("contains duplicate media IDs");
  mediaIds.add(id);
  if (item.kind !== "model") fail("model.kind must be model");
  if (item.content_type !== "model/gltf-binary") {
    fail("model.content_type must be model/gltf-binary");
  }
  return {
    id,
    url: string(item.url, "model.url"),
    contentType: "model/gltf-binary",
    sizeBytes: safeInteger(item.size_bytes, "model.size_bytes", 1),
    position: safeInteger(item.position, "model.position", 0),
    materials: stringArray(item.materials, "model.materials"),
    variants: stringArray(item.variants, "model.variants"),
  };
}

export function normalizeProductDetail(raw: unknown): ProductDetail {
  const item = record(raw, "response");
  const id = string(item.id, "id");
  const slug = string(item.slug, "slug");
  const name = string(item.name, "name");
  const description = string(item.description, "description", true) || undefined;
  const category = normalizeCategory(item.category);
  const companyRaw = record(item.company, "company");
  const company = {
    slug: string(companyRaw.slug, "company.slug"),
    name: string(companyRaw.name, "company.name"),
  };
  const basePrice = price(item.price, "price");
  const dimensionsRaw = record(item.dimensions, "dimensions");
  const dimensions = {
    width_mm: safeInteger(dimensionsRaw.width_mm, "dimensions.width_mm", 1),
    depth_mm: safeInteger(dimensionsRaw.depth_mm, "dimensions.depth_mm", 1),
    height_mm: safeInteger(dimensionsRaw.height_mm, "dimensions.height_mm", 1),
  };
  const weightG = nullablePositiveInteger(item.weight_g, "weight_g");
  const publishedAt = nullableString(item.published_at, "published_at");
  if (publishedAt !== null && Number.isNaN(Date.parse(publishedAt))) {
    fail("published_at must be a valid date-time");
  }
  const primaryImageUrl = nullableString(
    item.primary_image_url,
    "primary_image_url",
  );

  if (!Array.isArray(item.images)) fail("images must be an array");
  const mediaIds = new Set<string>();
  const images = item.images.map((entry) => image(entry, name, mediaIds));
  const primaryImages = images.filter((entry) => entry.isPrimary);
  if (primaryImages.length > 1) fail("must not contain multiple primary images");
  if (primaryImageUrl === null && primaryImages.length > 0) {
    fail("primary_image_url must identify the primary gallery image");
  }
  if (
    primaryImageUrl !== null &&
    (primaryImages.length !== 1 || primaryImages[0]?.url !== primaryImageUrl)
  ) {
    fail("primary_image_url must match the primary gallery image");
  }
  images.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.position - b.position;
  });
  const normalizedModel = model(item.model, mediaIds);

  if (!Array.isArray(item.options)) fail("options must be an array");
  const optionIds = new Set<string>();
  const optionNames = new Set<string>();
  const valueIds = new Set<string>();
  const valueIdToOption = new Map<string, { option: string; value: string }>();
  const options: ProductOption[] = item.options.map((rawOption) => {
    const optionRaw = record(rawOption, "options[]");
    const optionId = string(optionRaw.id, "options[].id");
    const optionName = string(optionRaw.name, "options[].name");
    const optionNameKey = optionName.toLocaleLowerCase("en");
    if (optionIds.has(optionId)) fail("contains duplicate option IDs");
    if (optionNames.has(optionNameKey)) fail("contains duplicate option names");
    optionIds.add(optionId);
    optionNames.add(optionNameKey);
    if (!Array.isArray(optionRaw.values) || optionRaw.values.length === 0) {
      fail("options[].values must be a non-empty array");
    }
    const valueNames = new Set<string>();
    const values: ProductOptionValue[] = optionRaw.values.map((rawValue) => {
      const valueRaw = record(rawValue, "options[].values[]");
      const valueId = string(valueRaw.id, "options[].values[].id");
      const valueName = string(valueRaw.name, "options[].values[].name");
      const valueNameKey = valueName.toLocaleLowerCase("en");
      if (valueIds.has(valueId)) fail("contains duplicate option value IDs");
      if (valueNames.has(valueNameKey)) {
        fail("contains duplicate value names within an option");
      }
      valueIds.add(valueId);
      valueNames.add(valueNameKey);
      valueIdToOption.set(valueId, { option: optionName, value: valueName });
      let swatchHex: string | undefined;
      if (valueRaw.swatch_hex !== null) {
        swatchHex = string(valueRaw.swatch_hex, "options[].values[].swatch_hex");
        if (!swatchPattern.test(swatchHex)) {
          fail("options[].values[].swatch_hex is invalid");
        }
      }
      let materialKey: string | undefined;
      if (valueRaw.material_key !== null) {
        materialKey = string(
          valueRaw.material_key,
          "options[].values[].material_key",
        );
        if (!materialPattern.test(materialKey)) {
          fail("options[].values[].material_key is invalid");
        }
      }
      return {
        id: valueId,
        name: valueName,
        position: safeInteger(
          valueRaw.position,
          "options[].values[].position",
          0,
        ),
        swatchHex,
        materialKey,
      };
    });
    values.sort((a, b) => a.position - b.position);
    return {
      id: optionId,
      name: optionName,
      position: safeInteger(optionRaw.position, "options[].position", 0),
      values,
    };
  });
  options.sort((a, b) => a.position - b.position);

  if (!Array.isArray(item.variants)) fail("variants must be an array");
  const variantIds = new Set<string>();
  const skus = new Set<string>();
  const combinations = new Set<string>();
  const variants: ProductVariant[] = item.variants.map((rawVariant) => {
    const variantRaw = record(rawVariant, "variants[]");
    const variantId = string(variantRaw.id, "variants[].id");
    const sku = string(variantRaw.sku, "variants[].sku");
    if (!skuPattern.test(sku)) fail("variants[].sku is invalid");
    if (variantIds.has(variantId)) fail("contains duplicate variant IDs");
    if (skus.has(sku)) fail("contains duplicate variant SKUs");
    variantIds.add(variantId);
    skus.add(sku);
    if (typeof variantRaw.available !== "boolean") {
      fail("variants[].available must be a boolean");
    }
    if (!Array.isArray(variantRaw.value_ids)) {
      fail("variants[].value_ids must be an array");
    }
    const selectedIds = variantRaw.value_ids.map((entry, index) =>
      string(entry, `variants[].value_ids[${index}]`),
    );
    if (new Set(selectedIds).size !== selectedIds.length) {
      fail("variants[].value_ids contains duplicates");
    }
    if (selectedIds.length !== options.length) {
      fail("each variant must choose exactly one value for every option");
    }
    const selectedOptions = new Set<string>();
    for (const selectedId of selectedIds) {
      const selection = valueIdToOption.get(selectedId);
      if (!selection) fail("variants[].value_ids contains an unknown value ID");
      selectedOptions.add(selection.option);
    }
    if (selectedOptions.size !== options.length) {
      fail("each variant must cover every option exactly once");
    }
    const combination = [...selectedIds].sort().join(":");
    if (combinations.has(combination)) fail("contains duplicate combinations");
    combinations.add(combination);

    const optionsRaw = record(variantRaw.options, "variants[].options");
    const expectedOptions = Object.fromEntries(
      selectedIds.map((selectedId) => {
        const selection = valueIdToOption.get(selectedId);
        if (!selection) fail("contains an unknown selected value");
        return [selection.option, selection.value];
      }),
    );
    const optionEntries = Object.entries(optionsRaw);
    if (
      optionEntries.length !== options.length ||
      optionEntries.some(
        ([optionName, valueName]) =>
          typeof valueName !== "string" ||
          expectedOptions[optionName] !== valueName,
      )
    ) {
      fail("variants[].options does not match variants[].value_ids");
    }
    const variantPrice = price(
      variantRaw.price,
      "variants[].price",
      basePrice.currency,
    );
    return {
      id: variantId,
      sku,
      price: variantPrice,
      formattedPrice: formatPrice(variantPrice),
      available: variantRaw.available,
      position: safeInteger(variantRaw.position, "variants[].position", 0),
      options: expectedOptions,
      valueIds: selectedIds,
    };
  });
  variants.sort((a, b) => a.position - b.position);

  if ((options.length === 0) !== (variants.length === 0)) {
    fail("options and variants must either both be empty or both be present");
  }
  const availablePrices = variants
    .filter((variant) => variant.available)
    .map((variant) => variant.price.amount_minor);
  if (
    availablePrices.length > 0 &&
    basePrice.amount_minor !== Math.min(...availablePrices)
  ) {
    fail("base price must equal the cheapest available variant");
  }

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
    model: normalizedModel,
    options,
    variants,
    hasOptions: options.length > 0,
  };
}
