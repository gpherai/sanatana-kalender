import type { KnipConfig } from "knip";

const config: KnipConfig = {
  next: true,
  entry: [
    "src/app/**/{page,layout,loading,error,not-found,route}.{ts,tsx}",
    "src/scripts/*.ts",
  ],
  ignoreDependencies: [
    // Used via Prisma pg adapter, not direct imports
    "pg",
    "@types/pg",
    // Used by Next.js build pipeline (browserslist)
    "baseline-browser-mapping",
    // Transitive peer dependency of @tailwindcss/postcss, not a direct install
    "postcss",
  ],
  ignoreBinaries: ["powershell"],
  ignoreExportsUsedInFile: true,
};

export default config;
