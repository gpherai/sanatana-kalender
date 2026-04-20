import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
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
  try {
    const { id } = await params;
    const parsed = patchPracticeSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const practice = await sadhanaRepo.findPracticeById(id);
    if (!practice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, type, mantra_text, notes, active } = parsed.data;
    const updated = await sadhanaRepo.updatePractice(id, {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(mantra_text !== undefined && { mantraText: mantra_text ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(active !== undefined && { active }),
    });
    return NextResponse.json(formatPractice(updated));
  } catch (error) {
    console.error("[SADHANA_PRACTICE_PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const practice = await sadhanaRepo.findPracticeById(id);
    if (!practice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await sadhanaRepo.deletePractice(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SADHANA_PRACTICE_DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
