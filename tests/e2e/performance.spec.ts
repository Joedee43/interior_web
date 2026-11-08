import { expect, test, type Page } from "@playwright/test";

// three.js sets window.__THREE__ when its module is evaluated, so the marker
// shows whether a page actually loaded the 3D code (not just a route chunk).
const threeLoaded = (page: Page) => page.evaluate(() => "__THREE__" in window);

async function signIn(page: Page, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill("demo-customer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("customer password 1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(next);
}

test.describe("3D code loading", () => {
  test("public pages without 3D never load three.js", async ({ page }) => {
    for (const [path, heading] of [["/", "Make room for certainty."], ["/catalog", "Curated Furniture Pieces"]] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await threeLoaded(page), `${path} loaded three.js`).toBe(false);
    }
  });

  test("account pages without 3D never load three.js", async ({ page }) => {
    await signIn(page, "/account");
    for (const [path, heading] of [["/account", "Demo Customer"], ["/designs", "My designs"], ["/quotes", "My quotes"]] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await threeLoaded(page), `${path} loaded three.js`).toBe(false);
    }
  });

  test("a product page loads three.js only once 3D is shown", async ({ page }, testInfo) => {
    await page.goto("/products/ergoseat/ergo-task-chair");
    if (testInfo.project.name === "mobile") {
      // Phones start on photos: the 3D code must wait for the customer.
      await expect(page.getByRole("tab", { name: "Photos" })).toHaveAttribute("aria-selected", "true");
      await page.waitForLoadState("networkidle");
      expect(await threeLoaded(page)).toBe(false);
      await page.getByRole("tab", { name: "3D view" }).click();
    }
    await expect(page.getByTestId("product-3d-preview")).toBeVisible();
    await expect.poll(() => threeLoaded(page)).toBe(true);
  });
});
