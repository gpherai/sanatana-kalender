import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { cuidSchema, patchSadhanaPracticeSchema } from "@/lib/validations";
import {
  deactivateSadhanaPractice,
  SadhanaNotFoundError,
  updateSadhanaPractice,
} from "@/services/sadhana.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = patchSadhanaPracticeSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const { name, type, mantraText, countSize, notes, active } = parsed.data;
    const updated = await updateSadhanaPractice(id, {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(mantraText !== undefined && { mantraText: mantraText ?? null }),
      ...(countSize !== undefined && { countSize: countSize ?? null }),
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
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    await deactivateSadhanaPractice(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Beoefening");
    logError("[SADHANA_PRACTICE_DELETE]", error);
    return serverError("Kon beoefening niet verwijderen");
  }
}
