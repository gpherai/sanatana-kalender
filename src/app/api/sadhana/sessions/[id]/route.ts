import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  notFoundError,
  parseJsonBody,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { cuidSchema, patchSadhanaSessionSchema } from "@/lib/validations";
import {
  deleteSadhanaSession,
  SadhanaNotFoundError,
  updateSadhanaSession,
} from "@/services/sadhana.service";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = patchSadhanaSessionSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const session = await updateSadhanaSession(id, parsed.data);

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Sessie");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return errorResponse("Beoefening niet gevonden", 400);
    }
    logError("[SADHANA_SESSION_PATCH]", error);
    return serverError("Kon sessie niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!cuidSchema.safeParse(id).success)
      return errorResponse("Ongeldig ID formaat", 400);
    await deleteSadhanaSession(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SadhanaNotFoundError) return notFoundError("Sessie");
    logError("[SADHANA_SESSION_DELETE]", error);
    return serverError("Kon sessie niet verwijderen");
  }
}
