import { expect, test, type Page } from "@playwright/test";

const designId = "55555555-5555-4555-8555-555555555555";
async function signIn(page: Page, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill("demo-customer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("customer password 1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(next);
}

test.describe("Design quote submission", () => {
  test("protects the quote review URL and preserves its return path", async ({ page }) => {
    const path = `/designs/${designId}/quote`;
    await page.goto(path);
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
  });

  test("reviews estimates, prevents duplicate clicks, and submits a maker request", async ({ page }) => {
    const path = `/designs/${designId}/quote`;
    await signIn(page, path);
    await expect(page.getByRole("heading", { name: "Request quotes for My living room" })).toBeVisible();
    await expect(page.getByText("ERGO-GREY", { exact: false })).toBeVisible();
    await expect(page.getByText("ETB 8,500.00", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Will not be submitted" })).toBeVisible();
    await expect(page.getByText("Broken Side Table")).toBeVisible();
    await expect(page.getByText("Demo Customer")).toBeVisible();
    await expect(page.getByText("demo-customer@example.com")).toBeVisible();

    let submissions = 0;
    await page.route("**/v1/quote-requests/from-design", async (route) => { submissions += 1; await new Promise((resolve) => setTimeout(resolve, 250)); await route.continue(); });
    await page.getByLabel(/Phone/).fill("+251 911 000000");
    await page.getByLabel(/Delivery address/).fill("Bole, Addis Ababa");
    await page.getByLabel(/Note for makers/).fill("Please call first");
    await page.getByRole("checkbox").check();
    const send = page.getByRole("button", { name: "Send 1 quote request" });
    await send.click();
    await expect(page.getByRole("button", { name: "Sending requests…" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "Quote requests sent." })).toBeVisible();
    expect(submissions).toBe(1);
    await expect(page.getByText("pending", { exact: true })).toBeVisible();
    await expect(page.getByText("Broken Side Table")).toBeVisible();
  });

  test("shows rate limits and backend request IDs without automatic retries", async ({ page }) => {
    const path = `/designs/${designId}/quote`;
    await signIn(page, path);
    await page.getByRole("checkbox").check();
    await page.getByLabel(/Note for makers/).fill("trigger-rate");
    await page.getByRole("button", { name: "Send 1 quote request" }).click();
    await expect(page.getByText(/too many quote submissions/i)).toBeVisible();
    await expect(page.getByText(/mock-quote-429/)).toBeVisible();

    await page.getByLabel(/Note for makers/).fill("trigger-error");
    await page.getByRole("button", { name: "Send 1 quote request" }).click();
    await expect(page.getByText(/quote service could not complete/i)).toBeVisible();
    await expect(page.getByText(/mock-quote-500/)).toBeVisible();
  });

  test("links from the design and editor and keeps foreign designs strict 404", async ({ page }) => {
    await signIn(page, `/designs/${designId}`);
    await page.getByRole("link", { name: "Request quotes" }).click();
    await expect(page).toHaveURL(`/designs/${designId}/quote`);
    await page.goto(`/designs/${designId}/edit`);
    await expect(page.getByRole("link", { name: "Review and request quotes" })).toBeVisible();
    await page.goto("/designs/12345678-1234-4234-8234-123456789012/quote");
    await expect(page.getByText("404 · Not found")).toBeVisible();
  });

  test("splits one design submission into separate maker requests", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "seller splitting is contract behavior covered once");
    await signIn(page, "/designs");
    const created = await page.evaluate(async () => {
      const designResponse = await fetch("/v1/designs", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Two maker room", template: "living-room-5x6" }) });
      const design = await designResponse.json(); let etag = designResponse.headers.get("etag")!;
      const chair = await fetch(`/v1/designs/${design.id}/items`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": etag }, body: JSON.stringify({ product_id: "prod-2", variant_id: "88888888-8888-4888-8888-888888888888", x_mm: 1500, z_mm: 1500 }) });
      etag = chair.headers.get("etag")!;
      await fetch(`/v1/designs/${design.id}/items`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": etag }, body: JSON.stringify({ product_id: "prod-3", x_mm: 3500, z_mm: 3000 }) });
      return design.id as string;
    });
    await page.goto(`/designs/${created}/quote`);
    await expect(page.getByRole("heading", { name: "ErgoSeat" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "WoodCraft" })).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send 2 quote requests" }).click();
    await expect(page.getByRole("heading", { name: "Quote requests sent." })).toBeVisible();
    await expect(page.getByText("pending", { exact: true })).toHaveCount(2);
  });
});

