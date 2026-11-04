import { expect, test } from "@playwright/test";

test.describe("Product detail page", () => {
  test("navigates from catalog to product detail page on card click", async ({
    page,
  }) => {
    await page.goto("/catalog");

    const chairCardLink = page.getByRole("link", { name: "Ergo Task Chair" });
    await expect(chairCardLink).toBeVisible();
    await chairCardLink.click();

    await expect(page).toHaveURL("/products/ergoseat/ergo-task-chair");
    await expect(
      page.getByRole("heading", { name: "Ergo Task Chair" }),
    ).toBeVisible();
    await expect(
      page.locator("p.eyebrow", { hasText: "ErgoSeat" }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Ergo Task Chair — ErgoSeat · Interior");
    await expect(page.locator("main")).toHaveCount(1);
  });

  test("displays gallery, allows thumbnail switching and modal lightbox enlargement", async ({
    page,
  }) => {
    await page.goto("/products/ergoseat/ergo-task-chair");

    // Thumbnails exist
    const thumbnails = page.getByTestId("gallery-thumbnails");
    await expect(thumbnails).toBeVisible();

    const secondThumb = page.getByRole("button", {
      name: /View image 2 of 2/i,
    });
    await secondThumb.click();
    await expect(secondThumb).toHaveAttribute("aria-pressed", "true");

    // Enlarge trigger opens dialog
    const enlargeBtn = page.getByTestId("gallery-enlarge-trigger");
    await enlargeBtn.click();

    const closeBtn = page.getByTestId("gallery-dialog-close");
    await expect(closeBtn).toBeVisible();

    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  });

  test("resolves variant from URL query and allows option switching with URL update", async ({
    page,
  }) => {
    // 1. Direct navigation with shareable variant query
    await page.goto("/products/ergoseat/ergo-task-chair?variant=ERGO-GREY");

    await expect(page.getByTestId("selected-variant-sku")).toContainText(
      "SKU: ERGO-GREY",
    );
    await expect(page.getByTestId("selected-variant-price")).toContainText(
      "ETB 8,500.00",
    );
    await expect(
      page.getByTestId("selected-variant-availability"),
    ).toContainText("In stock");

    // The unavailable variant's option pill should be disabled
    const terracottaPill = page.getByRole("radio", { name: /Terracotta/i });
    await expect(terracottaPill).toBeDisabled();

    // 2. Click available option value (Blue)
    const bluePill = page.getByRole("radio", { name: /Blue/i });
    await bluePill.click();

    await expect(page).toHaveURL(/variant=ERGO-BLUE/);
    await expect(page.getByTestId("selected-variant-sku")).toContainText(
      "SKU: ERGO-BLUE",
    );
    await expect(page.getByTestId("selected-variant-price")).toContainText(
      "ETB 9,200.00",
    );
    await expect(
      page.getByTestId("selected-variant-availability"),
    ).toContainText("In stock");
  });

  test("displays unavailable variant clearly when navigated directly", async ({
    page,
  }) => {
    await page.goto("/products/ergoseat/ergo-task-chair?variant=ERGO-TERRACOTTA");

    await expect(page.getByTestId("selected-variant-sku")).toContainText(
      "SKU: ERGO-TERRACOTTA",
    );
    await expect(page.getByTestId("selected-variant-price")).toContainText(
      "ETB 9,800.00",
    );
    await expect(
      page.getByTestId("selected-variant-availability"),
    ).toContainText("Currently unavailable");

    // Own pill is selected and not disabled
    const terracottaPill = page.getByRole("radio", { name: /Terracotta/i });
    await expect(terracottaPill).toHaveAttribute("aria-checked", "true");
    await expect(terracottaPill).not.toBeDisabled();
  });

  test("replaces unknown SKU with canonical selected variant SKU", async ({
    page,
  }) => {
    await page.goto(
      "/products/ergoseat/ergo-task-chair?variant=UNKNOWN-NONEXISTENT-SKU",
    );

    await expect(page).toHaveURL(/variant=ERGO-GREY/);
    await expect(page.getByTestId("selected-variant-sku")).toContainText(
      "SKU: ERGO-GREY",
    );
  });

  test("displays non-configurable product with base price, weight, and no configurator", async ({
    page,
  }) => {
    await page.goto("/products/woodcraft/zenith-dining-table");

    await expect(
      page.getByRole("heading", { name: "Zenith Dining Table" }),
    ).toBeVisible();
    await expect(page.getByTestId("base-price")).toContainText(
      "ETB 22,000.00",
    );
    await expect(page.getByText("45 kg")).toBeVisible();
    await expect(page.getByText("2000 × 900 × 760 mm")).toBeVisible();
    await expect(
      page.getByTestId("product-configurator"),
    ).not.toBeVisible();
  });

  test("renders 404 page when product is not found", async ({ page }) => {
    await page.goto("/products/unknown-co/nonexistent-item");

    await expect(page.getByText("404 · Not found")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This room is still empty." }),
    ).toBeVisible();
  });

  test("shows the backend request ID when the detail API fails", async ({
    page,
  }) => {
    await page.goto("/products/ergoseat/trigger-error");

    await expect(
      page.getByRole("heading", {
        name: "Unable to load this furniture piece",
      }),
    ).toBeVisible();
    await expect(page.getByText(/mock-err-500/)).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
  });
});
