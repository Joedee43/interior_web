import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const MOCK_API = `http://127.0.0.1:${process.env.MOCK_API_PORT || 5055}`;
const expiredQuote = "85000000-0000-4000-8000-000000000003";

async function signIn(page: Page, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill("demo-customer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("customer password 1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(next);
}

// Each test acts on its own quote (test-only mock route), because desktop and
// mobile projects run the same test in parallel against one mock server.
async function createQuote(request: APIRequestContext, data: { status?: string; revision?: number; expired?: boolean } = {}): Promise<string> {
  const response = await request.post(`${MOCK_API}/__mock/quote-requests`, { data });
  expect(response.ok()).toBe(true);
  return (await response.json()).id as string;
}

async function confirm(page: Page, action: string) {
  await page.getByRole("button", { name: action }).click();
  await page.getByRole("dialog").getByRole("button", { name: action }).click();
}

test.describe("Customer quote management", () => {
  test("protects the quote list and filters by status", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent("/quotes")}`);
    await signIn(page, "/quotes");
    await expect(page.getByRole("heading", { name: "My quotes" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ErgoSeat/ }).first()).toBeVisible();

    const filters = page.getByRole("navigation", { name: "Filter quotes by status" });
    await filters.getByRole("link", { name: "Quote received" }).click();
    await expect(page).toHaveURL("/quotes?status=quoted");
    await expect(filters.getByRole("link", { name: "Quote received" })).toHaveAttribute("aria-current", "page");
    const cards = page.locator('a[href^="/quotes/"]');
    await expect(cards.first()).toBeVisible();
    for (const card of await cards.all()) await expect(card).toContainText("Quote received");
  });

  test("accepts a quote after confirming the revision on screen", async ({ page, request }) => {
    const id = await createQuote(request, { status: "quoted", revision: 1 });
    await signIn(page, `/quotes/${id}`);
    await expect(page.getByText("Delivery to Bole")).toBeVisible();

    await page.getByRole("button", { name: "Accept quote" }).click();
    await expect(page.getByRole("dialog")).toContainText("revision 1");
    await page.getByRole("dialog").getByRole("button", { name: "Accept quote" }).click();

    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your decision" })).toHaveCount(0);
  });

  test("rejects a quote and cancels a pending request", async ({ page, request }) => {
    const quoted = await createQuote(request, { status: "quoted", revision: 1 });
    const pending = await createQuote(request, { status: "pending", revision: 0 });

    await signIn(page, `/quotes/${quoted}`);
    await confirm(page, "Reject quote");
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible();

    await page.goto(`/quotes/${pending}`);
    await expect(page.getByRole("button", { name: "Accept quote" })).toHaveCount(0);
    await confirm(page, "Cancel request");
    await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  });

  test("asks for a fresh review when the maker revises before acceptance", async ({ page, request }) => {
    const id = await createQuote(request, { status: "quoted", revision: 1 });
    await signIn(page, `/quotes/${id}`);
    await expect(page.getByText(/Quote revision 1/)).toBeVisible();

    const revised = await request.post(`${MOCK_API}/__mock/quote-requests/${id}/revise`);
    expect(revised.ok()).toBe(true);
    await confirm(page, "Accept quote");

    // Next.js also renders a hidden role="alert" route announcer on every page.
    const alert = page.getByRole("alert").filter({ hasText: /revised this quote/ });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("mock-quote-stale");
    await expect(page.getByText(/Quote revision 2/)).toBeVisible();
    await expect(page.getByText("Quote received", { exact: true })).toBeVisible();
  });

  test("an expired quote can be rejected but not accepted", async ({ page }) => {
    await signIn(page, `/quotes/${expiredQuote}`);
    await expect(page.getByText(/This quote expired on/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject quote" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept quote" })).toHaveCount(0);
  });

  test("another customer's or an unknown request is a 404", async ({ page }) => {
    await signIn(page, "/quotes");
    await page.goto("/quotes/12345678-1234-4234-8234-123456789012");
    await expect(page.getByText("404 · Not found")).toBeVisible();
  });
});
