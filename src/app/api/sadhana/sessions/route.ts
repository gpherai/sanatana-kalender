import { NextRequest, NextResponse } from "next/server";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaSessionSchema } from "@/lib/validations";
import { createSadhanaSession, listSadhanaSessions } from "@/services/sadhana.service";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const fromStr = params.get("from");
    const toStr = params.get("to");

    const sessions = await listSadhanaSessions({
      from: fromStr ?? undefined,
      to: toStr ?? undefined,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    logError("[SADHANA_SESSIONS_GET]", error);
    return serverError("Kon sessies niet ophalen");
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSadhanaSessionSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const session = await createSadhanaSession(parsed.data);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    logError("[SADHANA_SESSIONS_POST]", error);
    return serverError("Kon sessie niet aanmaken");
  }
}
