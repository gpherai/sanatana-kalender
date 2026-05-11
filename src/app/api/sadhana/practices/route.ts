import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaPracticeSchema } from "@/lib/validations";
import { createSadhanaPractice, listSadhanaPractices } from "@/services/sadhana.service";

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";
    const practices = await listSadhanaPractices(activeOnly);
    return NextResponse.json(practices);
  } catch (error) {
    logError("[SADHANA_PRACTICES_GET]", error);
    return serverError("Kon beoefeningen niet ophalen");
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(req);
    if (!bodyResult.ok) return bodyResult.response;
    const parsed = createSadhanaPracticeSchema.safeParse(bodyResult.data);
    if (!parsed.success) return validationError(parsed.error);

    const { name, type, mantraText, countSize, notes } = parsed.data;
    const practice = await createSadhanaPractice({
      name,
      type,
      mantraText: mantraText ?? null,
      countSize: countSize ?? null,
      notes: notes ?? null,
    });
    return NextResponse.json(practice, { status: 201 });
  } catch (error) {
    logError("[SADHANA_PRACTICES_POST]", error);
    return serverError("Kon beoefening niet aanmaken");
  }
}
