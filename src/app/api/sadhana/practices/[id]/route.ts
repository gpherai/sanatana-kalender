import { NextRequest, NextResponse } from "next/server";
import { formatPractice } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaPracticeSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaPracticeSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const practice = await sadhanaRepo.findPracticeById(id);
    if (!practice) return notFoundError("Beoefening");

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
    logError("[SADHANA_PRACTICE_PATCH]", error);
    return serverError("Kon beoefening niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const practice = await sadhanaRepo.findPracticeById(id);
    if (!practice) return notFoundError("Beoefening");

    await sadhanaRepo.deletePractice(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[SADHANA_PRACTICE_DELETE]", error);
    return serverError("Kon beoefening niet verwijderen");
  }
}
