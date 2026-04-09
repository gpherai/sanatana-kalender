import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatPractice } from "../_helpers";

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";
  const practices = await prisma.sadhanaPractice.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(practices.map(formatPractice));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.type) {
    return NextResponse.json({ error: "name and type required" }, { status: 422 });
  }
  const practice = await prisma.sadhanaPractice.create({
    data: { name: body.name, type: body.type, notes: body.notes ?? null },
  });
  return NextResponse.json(formatPractice(practice), { status: 201 });
}
