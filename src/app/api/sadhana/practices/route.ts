import { NextRequest, NextResponse } from "next/server";
import { formatPractice } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { createSadhanaPracticeSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";
    const practices = await sadhanaRepo.findAllPractices(activeOnly);
    return NextResponse.json(practices.map(formatPractice));
  } catch (error) {
    logError("[SADHANA_PRACTICES_GET]", error);
    return serverError("Kon beoefeningen niet ophalen");
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSadhanaPracticeSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { name, type, mantra_text, notes } = parsed.data;
    const practice = await sadhanaRepo.createPractice({
      name,
      type,
      mantraText: mantra_text ?? null,
      notes: notes ?? null,
    });
    return NextResponse.json(formatPractice(practice), { status: 201 });
  } catch (error) {
    logError("[SADHANA_PRACTICES_POST]", error);
    return serverError("Kon beoefening niet aanmaken");
  }
}
