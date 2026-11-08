import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const designId = "55555555-5555-4555-8555-555555555555";
const quotedRequest = "85000000-0000-4000-8000-000000000002";
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function signIn(page: Page, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill("demo-customer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("customer password 1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(next);
}

// Report only what a person needs to fix: rule, impact, and for a few
// elements the selector, its HTML and axe's explanation (which includes the
// measured colours for contrast failures).
async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 5).map((node) => ({
      target: node.target.join(" "),
      html: node.html.slice(0, 160),
      why: [...node.any, ...node.all, ...node.none].map((check) => check.message).join(" | "),
    })),
  }));
  expect(summary).toEqual([]);
}

const publicPages: Array<{ path: string; heading: string | RegExp }> = [
  { path: "/", heading: "Make room for certainty." },
  { path: "/catalog", heading: "Curated Furniture Pieces" },
  { path: "/products/ergoseat/ergo-task-chair", heading: "Ergo Task Chair" },
  { path: "/login", heading: "Return to your room." },
  { path: "/register", heading: "Start with a room of your own." },
  { path: "/no-such-page", heading: "This room is still empty." },
];

const accountPages: Array<{ path: string; heading: string | RegExp }> = [
  { path: "/account", heading: "Demo Customer" },
  { path: "/designs", heading: "My designs" },
  { path: `/designs/${designId}`, heading: "My living room" },
  { path: `/designs/${designId}/edit`, heading: "Edit My living room" },
  { path: `/designs/${designId}/quote`, heading: "Request quotes for My living room" },
  { path: "/quotes", heading: "My quotes" },
  { path: `/quotes/${quotedRequest}`, heading: "ErgoSeat" },
];

test.describe("Accessibility (WCAG 2.1 A/AA)", () => {
  for (const { path, heading } of publicPages) {
    test(`public page ${path} has no violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expectNoViolations(page);
    });
  }

  for (const { path, heading } of accountPages) {
    test(`account page ${path} has no violations`, async ({ page }) => {
      await signIn(page, path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expectNoViolations(page);
    });
  }
});
