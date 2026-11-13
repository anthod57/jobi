import path from "node:path";
import { defineConfig } from "vitest/config";

const singleFile = process.env.WF_TEST_FILE;

export default defineConfig({
  test: {
    environment: "node",
    include: singleFile
      ? [singleFile]
      : ["**/*.test.ts", "**/*.test.tsx"],
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
