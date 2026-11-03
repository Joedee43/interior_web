import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { ProductMediaImage } from "@/lib/catalog/detail-types";
import { ProductGallery } from "./product-gallery";

const mockImages: ProductMediaImage[] = [
  {
    id: "img-1",
    url: "/media/chair-front.jpg",
    altText: "Front view of chair",
    position: 1,
    isPrimary: true,
  },
  {
    id: "img-2",
    url: "/media/chair-side.jpg",
    altText: "Side view of chair",
    position: 2,
    isPrimary: false,
  },
];

describe("ProductGallery", () => {
  it("renders empty fallback when no images provided", () => {
    render(<ProductGallery images={[]} productName="Sample Chair" />);

    expect(screen.getByTestId("product-image-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("gallery-thumbnails")).not.toBeInTheDocument();
  });

  it("renders primary image and allows switching via thumbnails", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={mockImages} productName="Sample Chair" />);

    // Primary image is currently front view
    const initialImg = screen.getByRole("img", {
      name: "Front view of chair",
    });
    expect(initialImg).toBeInTheDocument();
    expect(initialImg).toHaveAttribute("src", "/media/chair-front.jpg");

    // Thumbnails exist
    const thumbnails = screen.getByTestId("gallery-thumbnails");
    expect(thumbnails).toBeInTheDocument();

    const secondThumb = screen.getByRole("button", {
      name: /View image 2 of 2: Side view of chair/i,
    });
    expect(secondThumb).toHaveAttribute("aria-pressed", "false");

    // Click second thumbnail
    await user.click(secondThumb);

    expect(secondThumb).toHaveAttribute("aria-pressed", "true");
    const updatedImg = screen.getByRole("img", { name: "Side view of chair" });
    expect(updatedImg).toBeInTheDocument();
    expect(updatedImg).toHaveAttribute("src", "/media/chair-side.jpg");
  });

  it("opens and closes the Radix Dialog lightbox on user interaction", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={mockImages} productName="Sample Chair" />);

    const enlargeBtn = screen.getByTestId("gallery-enlarge-trigger");
    expect(enlargeBtn).toBeInTheDocument();

    // Click to open dialog
    await user.click(enlargeBtn);

    const closeBtn = screen.getByTestId("gallery-dialog-close");
    expect(closeBtn).toBeInTheDocument();

    // Click close button
    await user.click(closeBtn);

    expect(screen.queryByTestId("gallery-dialog-close")).not.toBeInTheDocument();
  });
});
