import { NextRequest, NextResponse } from "next/server";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaSessionSchema } from "@/lib/validations";
import {
  deleteSadhanaSession,
  SadhanaNotFoundError,
  updateSadhanaSession,
} from "@/services/sadhana.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaSessionSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const session = await updateSadhanaSession(id, parsed.data);

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Sessie");
    logError("[SADHANA_SESSION_PATCH]", error);
    return serverError("Kon sessie niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteSadhanaSession(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Sessie");
    logError("[SADHANA_SESSION_DELETE]", error);
    return serverError("Kon sessie niet verwijderen");
  }
}
