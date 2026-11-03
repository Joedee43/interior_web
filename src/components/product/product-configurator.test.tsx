import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductDetail } from "@/lib/catalog/detail-types";
import { ProductConfigurator } from "./product-configurator";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/products/demo/lounge-chair",
  useSearchParams: () => mockSearchParams,
}));

const mockProduct: ProductDetail = {
  id: "prod-1",
  slug: "lounge-chair",
  name: "Lounge Chair",
  category: { slug: "chairs", name: "Chairs" },
  company: { slug: "demo", name: "Demo Furniture" },
  basePrice: { amount_minor: 450000, currency: "ETB" },
  formattedBasePrice: "ETB 4,500.00",
  dimensions: { width_mm: 600, depth_mm: 650, height_mm: 850 },
  formattedDimensions: "600 × 650 × 850 mm",
  primaryImageUrl: null,
  images: [],
  model: null,
  hasOptions: true,
  options: [
    {
      id: "opt-color",
      name: "Colour",
      position: 1,
      values: [
        { id: "val-grey", name: "Grey", position: 1, swatchHex: "#808080" },
        { id: "val-blue", name: "Blue", position: 2, swatchHex: "#0000ff" },
      ],
    },
  ],
  variants: [
    {
      id: "var-1",
      sku: "CHAIR-GREY",
      price: { amount_minor: 450000, currency: "ETB" },
      formattedPrice: "ETB 4,500.00",
      available: true,
      position: 1,
      options: { Colour: "Grey" },
      valueIds: ["val-grey"],
    },
    {
      id: "var-2",
      sku: "CHAIR-BLUE",
      price: { amount_minor: 490000, currency: "ETB" },
      formattedPrice: "ETB 4,900.00",
      available: false, // unavailable
      position: 2,
      options: { Colour: "Blue" },
      valueIds: ["val-blue"],
    },
  ],
};

describe("ProductConfigurator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders nothing when product has no options", () => {
    const noOptionsProduct: ProductDetail = {
      ...mockProduct,
      hasOptions: false,
      options: [],
      variants: [],
    };

    const { container } = render(
      <ProductConfigurator product={noOptionsProduct} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders selected variant price, SKU, availability and option pills", () => {
    render(<ProductConfigurator product={mockProduct} />);

    expect(screen.getByTestId("selected-variant-price")).toHaveTextContent(
      "ETB 4,500.00",
    );
    expect(screen.getByTestId("selected-variant-sku")).toHaveTextContent(
      "SKU: CHAIR-GREY",
    );
    expect(
      screen.getByTestId("selected-variant-availability"),
    ).toHaveTextContent("In stock");

    const greyPill = screen.getByRole("radio", { name: /Grey/i });
    expect(greyPill).toHaveAttribute("aria-checked", "true");

    // Blue variant is unavailable, so its button is disabled when Grey is selected
    const bluePill = screen.getByRole("radio", { name: /Blue/i });
    expect(bluePill).toBeDisabled();
  });

  it("calls router.replace with new variant SKU on option value select", async () => {
    const user = userEvent.setup();

    // Make both variants available
    const productAllAvailable: ProductDetail = {
      ...mockProduct,
      variants: mockProduct.variants.map((v) => ({ ...v, available: true })),
    };

    render(<ProductConfigurator product={productAllAvailable} />);

    const bluePill = screen.getByRole("radio", { name: /Blue/i });
    expect(bluePill).not.toBeDisabled();

    await user.click(bluePill);

    expect(mockReplace).toHaveBeenCalledWith(
      "/products/demo/lounge-chair?variant=CHAIR-BLUE",
      { scroll: false },
    );
  });

  it("replaces unknown SKU with canonical selected variant SKU", () => {
    mockSearchParams = new URLSearchParams("variant=NONEXISTENT_SKU");

    render(<ProductConfigurator product={mockProduct} />);

    expect(mockReplace).toHaveBeenCalledWith(
      "/products/demo/lounge-chair?variant=CHAIR-GREY",
      { scroll: false },
    );
  });

  it("renders unavailable state clearly when valid unavailable SKU is requested", () => {
    mockSearchParams = new URLSearchParams("variant=CHAIR-BLUE");

    render(<ProductConfigurator product={mockProduct} />);

    expect(screen.getByTestId("selected-variant-price")).toHaveTextContent(
      "ETB 4,900.00",
    );
    expect(screen.getByTestId("selected-variant-sku")).toHaveTextContent(
      "SKU: CHAIR-BLUE",
    );
    expect(
      screen.getByTestId("selected-variant-availability"),
    ).toHaveTextContent("Currently unavailable");

    // Its own pill is checked and NOT disabled
    const bluePill = screen.getByRole("radio", { name: /Blue/i });
    expect(bluePill).toHaveAttribute("aria-checked", "true");
    expect(bluePill).not.toBeDisabled();
  });
});
