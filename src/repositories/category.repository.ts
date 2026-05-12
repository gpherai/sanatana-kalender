/**
 * Category Repository
 *
 * Data access layer for event categories (Godheden).
 *
 * @module repositories/category
 */

import "server-only";
import { prisma } from "@/lib/db";

/**
 * Find all categories ordered by sortOrder.
 */
export async function findAllCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Find a specific category by ID.
 */
export async function findCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  });
}
