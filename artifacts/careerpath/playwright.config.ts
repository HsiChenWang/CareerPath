import { defineConfig } from "@playwright/test";

const port = 4175;

export default defineConfig({
  testDir: "./tests",
  outputDir: "/tmp/careerpath-playwright-results",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: `PORT=${port} BASE_PATH=/ pnpm --filter @workspace/careerpath run dev`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
