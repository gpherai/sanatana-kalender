import { NextRequest, NextResponse } from "next/server";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaPracticeSchema } from "@/lib/validations";
import {
  deactivateSadhanaPractice,
  SadhanaNotFoundError,
  updateSadhanaPractice,
} from "@/services/sadhana.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaPracticeSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { name, type, mantra_text, notes, active } = parsed.data;
    const updated = await updateSadhanaPractice(id, {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(mantra_text !== undefined && { mantraText: mantra_text ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(active !== undefined && { active }),
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Beoefening");
    logError("[SADHANA_PRACTICE_PATCH]", error);
    return serverError("Kon beoefening niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deactivateSadhanaPractice(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Beoefening");
    logError("[SADHANA_PRACTICE_DELETE]", error);
    return serverError("Kon beoefening niet verwijderen");
  }
}
