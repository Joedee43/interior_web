import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const root = path.dirname(fileURLToPath(import.meta.url));
const TEST_PORT = Number(process.env.TEST_PORT || 3005);
const MOCK_API_PORT = Number(process.env.MOCK_API_PORT || 5055);
const BASE_URL = `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node tests/mock-api.mjs",
      cwd: root,
      port: MOCK_API_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev -- -p ${TEST_PORT}`,
      cwd: root,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(TEST_PORT),
        API_INTERNAL_URL: `http://127.0.0.1:${MOCK_API_PORT}`,
        NEXT_DIST_DIR: ".next-playwright",
      },
    },
  ],
});
