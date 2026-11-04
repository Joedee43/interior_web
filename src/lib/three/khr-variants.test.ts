import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { describe, expect, it, vi } from "vitest";

import type { ProductDetail, ProductMediaModel } from "@/lib/catalog/detail-types";
import { VariantMaterialController, validatePreviewContract } from "./khr-variants";

function fixture() {
  const scene = new Group();
  scene.userData.gltfExtensions = {
    KHR_materials_variants: { variants: [{ name: "SKU-GREY" }, { name: "SKU-BLUE" }] },
  };
  const meshes = [0, 1].map(() => {
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ name: "original" }));
    mesh.userData.gltfExtensions = {
      KHR_materials_variants: {
        mappings: [
          { material: 0, variants: [0] },
          { material: 1, variants: [1] },
        ],
      },
    };
    scene.add(mesh);
    return mesh;
  });
  const materials = [new MeshBasicMaterial({ name: "grey" }), new MeshBasicMaterial({ name: "blue" })];
  const parser = { getDependency: vi.fn(async (_type: "material", index: number) => materials[index]!) };
  return { scene, meshes, materials, parser };
}

const model: ProductMediaModel = {
  id: "model", url: "/chair.glb", contentType: "model/gltf-binary", sizeBytes: 10,
  position: 0, materials: ["fabric_grey", "fabric_blue"], variants: ["SKU-GREY", "SKU-BLUE"],
};
const product = {
  hasOptions: true,
  options: [{ id: "finish", name: "Finish", position: 0, values: [
    { id: "grey", name: "Grey", position: 0, materialKey: "fabric_grey" },
    { id: "blue", name: "Blue", position: 1, materialKey: "fabric_blue" },
  ] }],
  variants: [
    { sku: "SKU-GREY" }, { sku: "SKU-BLUE" },
  ],
} as ProductDetail;

describe("KHR materials variants", () => {
  it("validates exact backend SKUs, material keys, and multi-mesh mappings", () => {
    expect(() => validatePreviewContract(fixture().scene, model, product)).not.toThrow();
    expect(() => validatePreviewContract(fixture().scene, { ...model, variants: ["sku-grey"] }, product)).toThrow(/SKU-GREY/);
  });

  it("matches KHR names case-sensitively and changes every mapped mesh", async () => {
    const { scene, meshes, parser } = fixture();
    const controller = new VariantMaterialController(scene, parser);
    await expect(controller.select("sku-grey")).rejects.toThrow(/Unknown exact/);
    await expect(controller.select("SKU-BLUE")).resolves.toBe(true);
    expect(meshes.every((mesh) => mesh.material.name === "blue")).toBe(true);
  });

  it("restores originals and disposes preview-owned clones", async () => {
    const { scene, meshes, parser } = fixture();
    const originals = meshes.map(({ material }) => material);
    const controller = new VariantMaterialController(scene, parser);
    await controller.select("SKU-GREY");
    const clones = meshes.map(({ material }) => material as MeshBasicMaterial);
    const spies = clones.map((material) => vi.spyOn(material, "dispose"));
    controller.restore();
    expect(meshes.map(({ material }) => material)).toEqual(originals);
    expect(spies.every((spy) => spy.mock.calls.length === 1)).toBe(true);
  });

  it("lets only the last asynchronous selection win", async () => {
    const { scene, meshes, materials } = fixture();
    let releaseGrey!: () => void;
    const greyWait = new Promise<void>((resolve) => { releaseGrey = resolve; });
    const parser = { getDependency: async (_type: "material", index: number) => {
      if (index === 0) await greyWait;
      return materials[index]!;
    } };
    const controller = new VariantMaterialController(scene, parser);
    const grey = controller.select("SKU-GREY");
    await controller.select("SKU-BLUE");
    releaseGrey();
    await expect(grey).resolves.toBe(false);
    expect(meshes.every((mesh) => mesh.material.name === "blue")).toBe(true);
  });

  it("rejects missing extensions and incomplete mappings", () => {
    const { scene } = fixture();
    delete scene.userData.gltfExtensions;
    expect(() => validatePreviewContract(scene, model, product)).toThrow(/no usable/);
    const next = fixture();
    for (const mesh of next.meshes) delete mesh.userData.gltfExtensions;
    expect(() => validatePreviewContract(next.scene, model, product)).toThrow(/missing or invalid/);
  });

  it("does not require KHR mappings for non-configurable models", () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
    expect(() => validatePreviewContract(scene, { ...model, variants: [] }, {
      hasOptions: false, options: [], variants: [],
    })).not.toThrow();
  });
});
