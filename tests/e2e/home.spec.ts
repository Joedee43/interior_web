import { expect, test } from "@playwright/test";

test("foundation landing page is usable", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make room for certainty." }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(
      page.getByRole("link", { name: "Explore the build" }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "View the foundation" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Quiet infrastructure for a visual product.",
    }),
  ).toBeVisible();
});
