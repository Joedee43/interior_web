import { expect, test, type Locator, type Page } from "@playwright/test";

async function clickAfterScroll(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.click({ force: true });
}

async function signIn(page: Page, next = "/designs") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill("demo-customer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("customer password 1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(next);
}

test.describe("Saved room designs", () => {
  test("protects the list and preserves its return URL", async ({ page }) => {
    await page.goto("/designs");
    await expect(page).toHaveURL(/\/login\?next=%2Fdesigns$/);
  });

  test("lists newest designs, links navigation, and preserves opaque pagination", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "My designs" })).toBeVisible();
    await expect(page.getByRole("link", { name: /My living room/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "My designs", exact: true }).first()).toBeVisible();
    await clickAfterScroll(page.getByRole("button", { name: "Load more designs" }));
    await expect(page.getByRole("link", { name: /Planning room 20/ })).toBeVisible();
  });

  test("renders the seeded room, exact SKU, position, estimate, and reset on desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop room behavior");
    await signIn(page, "/designs/55555555-5555-4555-8555-555555555555");
    await expect(page.getByRole("heading", { name: "My living room" })).toBeVisible();
    await expect(page.getByTestId("room-3d-scene")).toBeVisible();
    await expect(page.getByTestId("room-variant-skus")).toContainText("ERGO-GREY");
    await expect(page.getByText(/Position 1600, 0, 1800 mm · 30°/)).toBeVisible();
    await expect(page.getByText("ETB 8,500.00", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Broken Side Table" })).toBeVisible();
    await expect(page.getByText("Currently unavailable")).toBeVisible();
    await expect(page.getByTestId("room-3d-scene")).toBeVisible();
    await page.getByTestId("reset-room-view").click();
  });

  test("defers room GLBs on mobile until Load 3D room", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile room behavior");
    let modelRequests = 0;
    page.on("request", (request) => { if (request.url().includes("/v1/media/chair.glb")) modelRequests += 1; });
    await signIn(page, "/designs/55555555-5555-4555-8555-555555555555");
    await expect(page.getByTestId("room-floor-plan")).toBeVisible();
    await page.waitForTimeout(250);
    expect(modelRequests).toBe(0);
    await page.getByTestId("load-3d-room").click();
    await expect(page.getByTestId("room-3d-scene")).toBeVisible();
    await expect.poll(() => modelRequests).toBe(1);
  });

  test("creates a design from a template", async ({ page }, testInfo) => {
    await signIn(page, "/designs/new");
    await page.getByLabel("Design name").fill(`Template room ${testInfo.project.name}`);
    await page.getByRole("button", { name: /Home office 3×4 m/ }).click();
    await clickAfterScroll(page.getByRole("button", { name: "Create design" }));
    await expect(page).toHaveURL(/\/designs\/70000000-/);
    await expect(page.getByRole("heading", { name: `Template room ${testInfo.project.name}` })).toBeVisible();
    await expect(page.getByText("This room is ready for furniture.")).toBeVisible();
  });

  test("creates a custom room with metre inputs", async ({ page }, testInfo) => {
    await signIn(page, "/designs/new");
    await page.getByLabel("Design name").fill(`Custom studio ${testInfo.project.name}`);
    await page.getByRole("radio", { name: "Custom room" }).click();
    await page.getByLabel("Width (metres)").fill("4.25");
    await page.getByLabel("Depth (metres)").fill("5.5");
    await page.getByLabel("Height (metres)").fill("2.75");
    await clickAfterScroll(page.getByRole("button", { name: "Create design" }));
    await expect(page).toHaveURL(/\/designs\/70000000-/);
    await expect(page.getByText("4250 × 5500 × 2750 mm")).toBeVisible();
  });

  test("uses strict ownership 404 and preserves backend request IDs", async ({ page }) => {
    await signIn(page);
    await page.goto("/designs/12345678-1234-4234-8234-123456789012");
    await expect(page.getByText("404 · Not found")).toBeVisible();
    await page.goto("/designs/99999999-9999-4999-8999-999999999999");
    await expect(page.getByRole("heading", { name: "Unable to load this room" })).toBeVisible();
    await expect(page.getByText(/mock-design-detail-500/)).toBeVisible();
  });

  test("edits room settings and furniture with conflict-safe persistence", async ({ page }, testInfo) => {
    const roomName = `Editable room ${testInfo.project.name}`;
    await signIn(page, "/designs/new");
    await page.getByLabel("Design name").fill(roomName);
    await page.getByRole("button", { name: /Living room 5×6 m/ }).click();
    await clickAfterScroll(page.getByRole("button", { name: "Create design" }));
    await page.getByRole("link", { name: "Edit room" }).click();
    await expect(page.getByRole("heading", { name: `Edit ${roomName}` })).toBeVisible();

    const modelRequests: string[] = [];
    page.on("request", (request) => { if (request.url().endsWith(".glb")) modelRequests.push(request.url()); });
    if (testInfo.project.name === "mobile") {
      await expect(page.getByTestId("editable-floor-plan")).toBeVisible();
      await page.waitForTimeout(250);
      expect(modelRequests).toHaveLength(0);
    } else {
      await expect(page.getByTestId("room-3d-scene").first()).toBeVisible();
    }

    const renamed = `${roomName} revised`;
    await page.getByLabel("Name", { exact: true }).fill(renamed);
    await expect(page.getByRole("heading", { name: `Edit ${renamed}` })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Add opening" }).click();
    await expect(page.getByRole("button", { name: "Remove opening" })).toBeVisible();
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });

    await page.getByRole("button", { name: "Add furniture" }).click();
    await page.getByRole("button", { name: /Ergo Task Chair/ }).click();
    await page.getByRole("button", { name: "Place in room" }).click();
    await expect(page.getByRole("heading", { name: "Ergo Task Chair" })).toBeVisible();
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });

    await page.getByLabel("Rotation").fill("45");
    await page.waitForTimeout(600);
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });
    await page.getByLabel("Available finish").selectOption("89898989-8989-4898-8989-898989898989");
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });

    await page.reload();
    await page.getByRole("button", { name: "Select Ergo Task Chair" }).click();
    await expect(page.getByLabel("Rotation")).toHaveValue("45");
    await expect(page.getByLabel("Available finish")).toHaveValue("89898989-8989-4898-8989-898989898989");
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("Select furniture to edit its exact position, rotation or finish.")).toBeVisible();
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });
  });

  test("protects editor URLs and keeps editor ownership failures strict", async ({ page }) => {
    const editPath = "/designs/55555555-5555-4555-8555-555555555555/edit";
    await page.goto(editPath);
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(editPath)}`);
    await signIn(page);
    await page.goto("/designs/12345678-1234-4234-8234-123456789012/edit");
    await expect(page.getByText("404 · Not found")).toBeVisible();
  });

  test("detects a stale editor, reviews latest, and deletes with a current revision", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "cross-context concurrency is covered once");
    await signIn(page, "/designs/new");
    await page.getByLabel("Design name").fill("Concurrent room");
    await page.getByRole("button", { name: /Living room 5×6 m/ }).click();
    await clickAfterScroll(page.getByRole("button", { name: "Create design" }));
    await expect(page).toHaveURL(/\/designs\/70000000-/);
    const editUrl = `${page.url()}/edit`;
    await page.goto(editUrl);
    await expect(page.getByRole("heading", { name: "Edit Concurrent room" })).toBeVisible();

    const other = await page.context().newPage();
    await other.goto(editUrl);
    await expect(other.getByRole("heading", { name: "Edit Concurrent room" })).toBeVisible();

    await page.getByLabel("Name", { exact: true }).fill("Remote name");
    await page.waitForTimeout(600);
    await expect(page.locator('div[role="status"]')).toContainText("Saved", { timeout: 10_000 });
    await other.getByLabel("Name", { exact: true }).fill("My stale name");
    await other.waitForTimeout(600);
    await expect(other.locator('div[role="status"]')).toContainText("Conflict", { timeout: 10_000 });
    await other.getByRole("button", { name: "Review latest" }).click();
    await expect(other.getByRole("heading", { name: "Edit Remote name" })).toBeVisible();

    await other.getByRole("button", { name: "Delete design" }).click();
    await other.getByRole("button", { name: "Delete permanently" }).click();
    await expect(other).toHaveURL("/designs");
    await other.close();
  });
});
