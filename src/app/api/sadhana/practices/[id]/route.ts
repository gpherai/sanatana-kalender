import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatPractice } from "../../_helpers";

type Params = { params: Promise<{ id: string }> };

const patchPracticeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["mantra_japa", "parayana", "other"]).optional(),
  mantra_text: z.string().max(2000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = patchPracticeSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const practice = await prisma.sadhanaPractice.findUnique({ where: { id } });
  if (!practice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, type, mantra_text, notes, active } = parsed.data;
  const updated = await prisma.sadhanaPractice.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(mantra_text !== undefined && { mantraText: mantra_text ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json(formatPractice(updated));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const practice = await prisma.sadhanaPractice.findUnique({ where: { id } });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sadhanaPractice.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
