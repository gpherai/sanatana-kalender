import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverError } from "@/lib/api-response";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        icon: true,
        color: true,
        description: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return serverError("Kon categorieën niet ophalen");
  }
}
