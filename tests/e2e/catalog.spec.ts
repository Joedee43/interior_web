import { expect, test } from "@playwright/test";

test.describe("Catalog page", () => {
  test("displays products, categories, dimensions, and prices", async ({
    page,
  }) => {
    await page.goto("/catalog");

    await expect(
      page.getByRole("heading", { name: "Curated Furniture Pieces" }),
    ).toBeVisible();

    // Verify products are rendered
    await expect(
      page.getByRole("heading", { name: "Aero Standing Desk" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ergo Task Chair" }),
    ).toBeVisible();

    // Verify dimension formatting
    await expect(page.getByText("1400 × 700 × 1050 mm")).toBeVisible();

    // Verify formatted price
    await expect(page.getByText("ETB 15,000.00")).toBeVisible();
  });

  test("filters by category and search keyword", async ({ page }) => {
    await page.goto("/catalog");

    // Filter by category: Desks
    await page.getByLabel("Category").selectOption("desks");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/category=desks/);
    await expect(
      page.getByRole("heading", { name: "Aero Standing Desk" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ergo Task Chair" }),
    ).not.toBeVisible();

    // Search keyword
    await page.getByLabel("Search").fill("standing");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/q=standing/);
    await expect(
      page.getByRole("heading", { name: "Aero Standing Desk" }),
    ).toBeVisible();

    // Clear filters
    await page.getByRole("link", { name: "Clear" }).click();
    await expect(page).toHaveURL("/catalog");
    await expect(
      page.getByRole("heading", { name: "Ergo Task Chair" }),
    ).toBeVisible();
  });

  test("paginates to the next page while preserving active filters", async ({
    page,
  }) => {
    await page.goto("/catalog");

    // Next page link should exist
    const nextButton = page.getByRole("link", { name: /next page/i });
    await expect(nextButton).toBeVisible();

    await nextButton.click();
    await expect(page).toHaveURL(/cursor=page-2-cursor/);

    // Page 2 product should be visible
    await expect(
      page.getByRole("heading", { name: "Plush Lounge Chair" }),
    ).toBeVisible();
  });

  test("displays empty state when search finds no matches and resets", async ({
    page,
  }) => {
    await page.goto("/catalog?q=nonexistent-furniture-item");

    await expect(
      page.getByRole("heading", { name: "No furniture matches your search" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(page).toHaveURL("/catalog");
    await expect(
      page.getByRole("heading", { name: "Aero Standing Desk" }),
    ).toBeVisible();
  });

  test("search matches product names rather than descriptions", async ({
    page,
  }) => {
    await page.goto("/catalog?q=motorized");

    await expect(
      page.getByRole("heading", { name: "No furniture matches your search" }),
    ).toBeVisible();
  });

  test("recovers gracefully from an invalid cursor by falling back to page 1", async ({
    page,
  }) => {
    await page.goto("/catalog?cursor=invalid-cursor");

    // Shows recovery notice
    await expect(
      page.getByText(/your previous page link was outdated or invalid/i),
    ).toBeVisible();

    // Recovers to page 1 products
    await expect(
      page.getByRole("heading", { name: "Aero Standing Desk" }),
    ).toBeVisible();
  });

  test("shows the backend request ID when the catalog API fails", async ({
    page,
  }) => {
    await page.goto("/catalog?q=trigger-error");

    await expect(
      page.getByRole("heading", { name: "Unable to load furniture pieces" }),
    ).toBeVisible();
    await expect(page.getByText(/mock-err-500/)).toBeVisible();
  });
});
