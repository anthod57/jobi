import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const singleFile = process.env.WF_TEST_FILE;

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ["./src/test/vitest-ui-setup.ts"],
    environment: "node",
    globalSetup: ["./src/test/postgres-global-setup.ts"],
    include: singleFile
      ? [singleFile]
      : ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.wf/cache/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
