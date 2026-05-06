import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaSessionSchema, optionalDateStringSchema } from "@/lib/validations";
import { createSadhanaSession, listSadhanaSessions } from "@/services/sadhana.service";
import { z } from "zod";

const sessionQuerySchema = z.object({
  from: optionalDateStringSchema,
  to: optionalDateStringSchema,
});

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const parsed = sessionQuerySchema.safeParse({
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);

    const sessions = await listSadhanaSessions({
      from: parsed.data.from || undefined,
      to: parsed.data.to || undefined,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    logError("[SADHANA_SESSIONS_GET]", error);
    return serverError("Kon sessies niet ophalen");
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = createSadhanaSessionSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const session = await createSadhanaSession(parsed.data);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    logError("[SADHANA_SESSIONS_POST]", error);
    return serverError("Kon sessie niet aanmaken");
  }
}
