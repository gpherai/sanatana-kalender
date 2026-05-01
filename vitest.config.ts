import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    // environmentMatchGlobs: [
    //   ['src/app/api/**', 'node'],
    //   ['src/services/**', 'node'],
    //   ['src/server/**', 'node'],
    //   ['src/lib/**', 'node'],
    //   ['src/scripts/**', 'node'],
    //   ['prisma/**', 'node'],
    // ],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./__mocks__/server-only.ts"),
    },
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "src/scripts/**",
        "src/generated/**",
        "src/types/**",
        "src/config/**",
        "*.config.{ts,mjs}",
        "vitest.setup.ts",
        "prisma/**",
      ],
    },
  },
});
