import "server-only";
import { findAllCategories } from "@/repositories/category.repository";

export function getAllCategories() {
  return findAllCategories();
}
