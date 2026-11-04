import { expect, test, type Page } from "@playwright/test";

async function signIn(
  page: Page,
  email = "demo-customer@example.com",
  password = "customer password 1",
) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test.describe("Customer authentication", () => {
  test("redirects a protected account request to login with its return path", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
    await expect(
      page.getByRole("heading", { name: "Return to your room." }),
    ).toBeVisible();
  });

  test("signs in, survives refresh, and signs out", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL("/account");
    await expect(
      page.getByRole("heading", { name: "Demo Customer" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Demo Customer" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  });

  test("registers a customer and starts a session", async ({ page }, testInfo) => {
    const email = `new-${testInfo.project.name}-${testInfo.retry}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Full name").fill("New Customer");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("password 123");
    await page.getByLabel("Confirm password").fill("password 123");
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page).toHaveURL("/account");
    await expect(
      page.getByRole("heading", { name: "New Customer" }),
    ).toBeVisible();
    await expect(page.getByText(/no active company memberships/i)).toBeVisible();
  });

  test("shows duplicate email on the registration field", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Duplicate Customer");
    await page.getByLabel("Email address").fill("demo-customer@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password 123");
    await page.getByLabel("Confirm password").fill("password 123");
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByLabel("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText(/mock-auth-register-409/)).toBeVisible();
  });

  test("shows invalid credentials without revealing account state", async ({ page }) => {
    await signIn(page, "missing@example.com", "wrong password");
    await expect(page.locator("form [role=alert]")).toContainText(
      "Invalid email or password",
    );
  });

  test("shows rate-limit and unexpected request IDs", async ({ page }) => {
    await signIn(page, "rate-limit@example.com", "password 123");
    await expect(page.locator("form [role=alert]")).toContainText("Too many attempts");
    await expect(page.locator("form [role=alert]")).toContainText("mock-auth-429");

    await page.getByLabel("Email address").fill("trigger-error@example.com");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("form [role=alert]")).toContainText(
      "mock-auth-login-500",
    );
  });

  test("rejects an external return URL", async ({ page }) => {
    await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("Email address").fill("demo-customer@example.com");
    await page.getByLabel("Password", { exact: true }).fill("customer password 1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/account");
  });

  test("redirects an authenticated user away from auth pages", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL("/account");
    await page.goto("/register?next=%2Fcatalog");
    await expect(page).toHaveURL("/catalog");
  });

  test("shows the backend request ID when protected account lookup fails", async ({
    page,
  }) => {
    await signIn(page, "account-error@example.com", "password 123");
    await expect(
      page.getByRole("heading", { name: "Unable to check your account" }),
    ).toBeVisible();
    await expect(page.getByText(/mock-auth-me-500/)).toBeVisible();
  });

  test("toggles password visibility between masked and plain text", async ({
    page,
  }) => {
    await page.goto("/login");

    const passwordInput = page.getByLabel("Password", { exact: true });
    await passwordInput.fill("secret-password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = page.getByTestId("password-toggle-password");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});

