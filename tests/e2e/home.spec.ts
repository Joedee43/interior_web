import { expect, test } from "@playwright/test";

test("customer landing page is usable and navigates to catalog", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Make room for certainty." }),
  ).toBeVisible();

  if (testInfo.project.name === "mobile") {
    await expect(
      page.getByRole("link", { name: "Browse Catalog", exact: true }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Catalog", exact: true }),
    ).toBeVisible();
  }

  // Click primary CTA
  await page.getByRole("link", { name: "Browse furniture" }).click();
  await expect(page).toHaveURL(/\/catalog/);
  await expect(
    page.getByRole("heading", { name: "Curated Furniture Pieces" }),
  ).toBeVisible();
});
