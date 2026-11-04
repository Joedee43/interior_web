import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductDetail } from "@/lib/catalog/detail-types";

import { ProductMediaViewer } from "./product-media-viewer";

let desktop = false;
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function PreviewStub({
      selectedSku,
      onFailure,
    }: {
      selectedSku: string | null;
      onFailure: (message: string) => void;
    }) {
      return (
        <div data-testid="product-3d-preview">
          <output data-testid="preview-selected-sku">{selectedSku}</output>
          <button onClick={() => onFailure("broken model")}>Break preview</button>
          <button>Reset view</button>
        </div>
      );
    },
}));

const product: ProductDetail = {
  id: "chair", slug: "chair", name: "Chair",
  category: { slug: "chairs", name: "Chairs" },
  company: { slug: "maker", name: "Maker" },
  basePrice: { amount_minor: 100, currency: "ETB" },
  formattedBasePrice: "ETB 1.00",
  dimensions: { width_mm: 800, depth_mm: 800, height_mm: 900 },
  formattedDimensions: "800 × 800 × 900 mm",
  primaryImageUrl: "/chair.webp",
  images: [{
    id: "image", url: "/chair.webp", contentType: "image/webp", sizeBytes: 1,
    altText: "Chair", position: 0, isPrimary: true,
  }],
  model: {
    id: "model", url: "/chair.glb", contentType: "model/gltf-binary", sizeBytes: 10,
    position: 0, materials: ["grey", "blue"], variants: ["CHAIR-GREY", "CHAIR-BLUE"],
  },
  hasOptions: true,
  options: [{ id: "colour", name: "Colour", position: 0, values: [
    { id: "grey", name: "Grey", position: 0, materialKey: "grey" },
    { id: "blue", name: "Blue", position: 1, materialKey: "blue" },
  ] }],
  variants: [
    { id: "grey", sku: "CHAIR-GREY", price: { amount_minor: 100, currency: "ETB" }, formattedPrice: "ETB 1.00", available: true, position: 0, options: { Colour: "Grey" }, valueIds: ["grey"] },
    { id: "blue", sku: "CHAIR-BLUE", price: { amount_minor: 110, currency: "ETB" }, formattedPrice: "ETB 1.10", available: true, position: 1, options: { Colour: "Blue" }, valueIds: ["blue"] },
  ],
};

describe("ProductMediaViewer", () => {
  beforeEach(() => {
    desktop = false;
    searchParams = new URLSearchParams();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: desktop,
      media: "(min-width: 768px)",
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
  });

  it("starts with photos on mobile and defers the preview until selected", async () => {
    render(<ProductMediaViewer product={product} />);
    expect(screen.getByRole("tab", { name: "Photos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("product-3d-preview")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "3D view" }));
    expect(screen.getByTestId("product-3d-preview")).toBeInTheDocument();
  });

  it("automatically selects 3D on desktop after hydration", async () => {
    desktop = true;
    render(<ProductMediaViewer product={product} />);
    await waitFor(() => expect(screen.getByRole("tab", { name: "3D view" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
  });

  it("uses the exact URL-resolved SKU, including an available alternate", async () => {
    desktop = true;
    searchParams = new URLSearchParams("variant=CHAIR-BLUE");
    render(<ProductMediaViewer product={product} />);
    expect(await screen.findByTestId("preview-selected-sku")).toHaveTextContent("CHAIR-BLUE");
  });

  it("shows recoverable image fallback when preview reports failure", async () => {
    desktop = true;
    render(<ProductMediaViewer product={product} />);
    await userEvent.click(await screen.findByRole("button", { name: "Break preview" }));
    expect(screen.getByTestId("preview-fallback")).toHaveTextContent("broken model");
    expect(screen.getByRole("button", { name: "Retry 3D view" })).toBeInTheDocument();
  });

  it("renders the existing gallery without 3D tabs for image-only products", () => {
    render(<ProductMediaViewer product={{ ...product, model: null }} />);
    expect(screen.getByTestId("product-gallery")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "3D view" })).not.toBeInTheDocument();
  });
});
