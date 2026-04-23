import { NextRequest, NextResponse } from "next/server";
import { formatSession } from "@/services/sadhana-formatters";
import * as sadhanaRepo from "@/repositories/sadhana.repository";
import { serverError, validationError, notFoundError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { patchSadhanaSessionSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSadhanaSessionSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const existing = await sadhanaRepo.findSessionById(id);
    if (!existing) return notFoundError("Sessie");

    const { date, started_at, duration_minutes, notes, items } = parsed.data;

    const session = await sadhanaRepo.updateSessionWithItems(
      id,
      date ?? (existing.date as Date).toISOString().split("T")[0]!,
      started_at !== undefined ? started_at : existing.startedAt?.toISOString(),
      duration_minutes !== undefined ? duration_minutes : existing.durationMinutes,
      notes !== undefined ? notes : existing.notes,
      items ??
        existing.items.map((i) => ({
          practice_id: i.practiceId,
          quantity: i.quantity,
          unit: i.unit,
          duration_minutes: i.durationMinutes,
          notes: i.notes,
        }))
    );

    return NextResponse.json(formatSession(session));
  } catch (error) {
    logError("[SADHANA_SESSION_PATCH]", error);
    return serverError("Kon sessie niet bijwerken");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await sadhanaRepo.findSessionById(id);
    if (!existing) return notFoundError("Sessie");

    await sadhanaRepo.deleteSession(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logError("[SADHANA_SESSION_DELETE]", error);
    return serverError("Kon sessie niet verwijderen");
  }
}
