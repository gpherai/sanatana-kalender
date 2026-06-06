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
    // Runtime dependency for generated Prisma client (src/generated/prisma imports @prisma/client/runtime/client)
    "@prisma/client",
    // Used by Next.js build pipeline (browserslist)
    "baseline-browser-mapping",
  ],
  ignoreBinaries: [],
  ignoreExportsUsedInFile: true,
};

export default config;
