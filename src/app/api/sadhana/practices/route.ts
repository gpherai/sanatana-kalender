import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatPractice } from "../_helpers";

const createPracticeSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["mantra_japa", "parayana", "other"]),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";
  const practices = await prisma.sadhanaPractice.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(practices.map(formatPractice));
}

export async function POST(req: NextRequest) {
  const parsed = createPracticeSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, type, notes } = parsed.data;
  const practice = await prisma.sadhanaPractice.create({
    data: { name, type, notes: notes ?? null },
  });
  return NextResponse.json(formatPractice(practice), { status: 201 });
}
