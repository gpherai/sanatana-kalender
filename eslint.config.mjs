import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-app directories that should not be linted
    "_dev/**",
    "coverage/**",
    "e2e/**",
    "scripts/**",
    "prisma/**",
    // Root config files (not app code)
    "*.config.{ts,mjs,js,cjs}",
    // Root utility scripts
    "*.js",
  ]),
  {
    rules: {
      // tsc enforces this via noUnusedLocals + noUnusedParameters (strict mode)
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
