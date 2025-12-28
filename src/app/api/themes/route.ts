import { NextResponse } from "next/server";
import { THEME_CATALOG } from "@/config/themes";

/**
 * GET /api/themes
 *
 * Returns available themes from THEME_CATALOG (source of truth).
 *
 * Note: This endpoint exists for API completeness but is NOT required
 * for runtime theme functionality. ThemeProvider uses THEME_CATALOG directly.
 *
 * The response format matches what the database Theme table would return,
 * but we serve from the catalog to ensure consistency and avoid DB calls.
 */
export async function GET() {
  // Transform catalog to API response format
  const themes = THEME_CATALOG.map((t) => ({
    id: t.name, // Use name as ID since catalog doesn't have IDs
    name: t.name,
    displayName: t.displayName,
    description: t.description,
    isDefault: t.isDefault,
    isSpecial: t.isSpecial ?? false,
    colors: t.colors,
    background: t.background ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return NextResponse.json(themes);
}
