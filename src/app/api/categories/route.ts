import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { getAllCategories } from "@/services/category.service";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    logError("Error fetching categories:", error);
    return serverError("Kon categorieën niet ophalen");
  }
}
