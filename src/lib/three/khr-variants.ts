import type { Material, Mesh, Object3D } from "three";

import type {
  ProductDetail,
  ProductMediaModel,
} from "@/lib/catalog/detail-types";

const EXTENSION = "KHR_materials_variants";

interface VariantDefinition {
  name: string;
}

interface VariantMapping {
  material: number;
  variants: number[];
}

interface RootExtension {
  variants: VariantDefinition[];
}

interface MeshExtension {
  mappings: VariantMapping[];
}

export interface MaterialParser {
  getDependency(type: "material", index: number): Promise<Material>;
}

function extension(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  const extensions = (value as { gltfExtensions?: unknown }).gltfExtensions;
  if (!extensions || typeof extensions !== "object") return undefined;
  return (extensions as Record<string, unknown>)[EXTENSION];
}

function readRootExtension(scene: Object3D): RootExtension | null {
  const value = extension(scene.userData);
  if (!value || typeof value !== "object") return null;
  const variants = (value as { variants?: unknown }).variants;
  if (!Array.isArray(variants)) return null;

  const normalized: VariantDefinition[] = [];
  for (const item of variants) {
    if (!item || typeof item !== "object" || typeof item.name !== "string") {
      return null;
    }
    normalized.push({ name: item.name });
  }
  return { variants: normalized };
}

function readMeshExtension(mesh: Mesh): MeshExtension | null {
  const value = extension(mesh.userData);
  if (!value || typeof value !== "object") return null;
  const mappings = (value as { mappings?: unknown }).mappings;
  if (!Array.isArray(mappings)) return null;

  const normalized: VariantMapping[] = [];
  for (const item of mappings) {
    if (!item || typeof item !== "object") return null;
    const material = (item as { material?: unknown }).material;
    const variants = (item as { variants?: unknown }).variants;
    if (
      !Number.isSafeInteger(material) ||
      typeof material !== "number" ||
      material < 0 ||
      !Array.isArray(variants) ||
      variants.some(
        (index) =>
          !Number.isSafeInteger(index) || typeof index !== "number" || index < 0,
      )
    ) {
      return null;
    }
    normalized.push({ material, variants: [...variants] as number[] });
  }
  return { mappings: normalized };
}

function meshesIn(scene: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  scene.traverse((object) => {
    if ((object as Mesh).isMesh) meshes.push(object as Mesh);
  });
  return meshes;
}

export function validatePreviewContract(
  scene: Object3D,
  model: ProductMediaModel,
  product: Pick<ProductDetail, "hasOptions" | "options" | "variants">,
) {
  const backendSkus = new Set(product.variants.map(({ sku }) => sku));
  for (const sku of backendSkus) {
    if (!model.variants.includes(sku)) {
      throw new Error(`Model contract is missing backend variant ${sku}.`);
    }
  }

  for (const option of product.options) {
    for (const value of option.values) {
      if (value.materialKey && !model.materials.includes(value.materialKey)) {
        throw new Error(
          `Model contract is missing material ${value.materialKey}.`,
        );
      }
    }
  }

  if (!product.hasOptions) return;

  const root = readRootExtension(scene);
  if (!root) throw new Error("The model has no usable KHR_materials_variants extension.");

  const names = root.variants.map(({ name }) => name);
  if (new Set(names).size !== names.length) {
    throw new Error("KHR_materials_variants names must be unique.");
  }
  for (const sku of backendSkus) {
    if (!names.includes(sku)) {
      throw new Error(`KHR_materials_variants is missing SKU ${sku}.`);
    }
  }

  const meshes = meshesIn(scene);
  if (meshes.length === 0 || meshes.some((mesh) => !readMeshExtension(mesh))) {
    throw new Error("The model has missing or invalid variant mesh mappings.");
  }

  for (const sku of backendSkus) {
    const index = names.indexOf(sku);
    if (
      !meshes.some((mesh) =>
        readMeshExtension(mesh)?.mappings.some(({ variants }) =>
          variants.includes(index),
        ),
      )
    ) {
      throw new Error(`No mesh mapping exists for SKU ${sku}.`);
    }
  }
}

export class VariantMaterialController {
  private readonly originals = new Map<Mesh, Material | Material[]>();
  private owned = new Set<Material>();
  private generation = 0;

  constructor(
    private readonly scene: Object3D,
    private readonly parser: MaterialParser,
  ) {
    for (const mesh of meshesIn(scene)) this.originals.set(mesh, mesh.material);
  }

  async select(sku: string) {
    const root = readRootExtension(this.scene);
    const variantIndex = root?.variants.findIndex(({ name }) => name === sku) ?? -1;
    if (variantIndex < 0) throw new Error(`Unknown exact KHR variant ${sku}.`);

    const generation = ++this.generation;
    const assignments: Array<{ mesh: Mesh; material: Material }> = [];

    for (const mesh of meshesIn(this.scene)) {
      const mapping = readMeshExtension(mesh)?.mappings.find(({ variants }) =>
        variants.includes(variantIndex),
      );
      if (!mapping) continue;
      const material = (await this.parser.getDependency(
        "material",
        mapping.material,
      )).clone();
      if (generation !== this.generation) {
        material.dispose();
        return false;
      }
      assignments.push({ mesh, material });
    }

    if (assignments.length === 0) {
      throw new Error(`No material mapping exists for SKU ${sku}.`);
    }

    this.disposeOwned();
    for (const [mesh, material] of this.originals) mesh.material = material;
    for (const { mesh, material } of assignments) {
      mesh.material = material;
      this.owned.add(material);
    }
    return true;
  }

  restore() {
    ++this.generation;
    this.disposeOwned();
    for (const [mesh, material] of this.originals) mesh.material = material;
  }

  dispose() {
    this.restore();
    this.originals.clear();
  }

  private disposeOwned() {
    for (const material of this.owned) material.dispose();
    this.owned.clear();
  }
}
