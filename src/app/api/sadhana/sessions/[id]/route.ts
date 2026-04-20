import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatSession } from "../../_helpers";
import * as sadhanaRepo from "@/repositories/sadhana.repository";

const patchSessionItemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.enum(["malas", "count"]).optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const patchSessionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  started_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(patchSessionItemSchema).min(1).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = patchSessionSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const existing = await sadhanaRepo.findSessionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { date, started_at, duration_minutes, notes, items } = parsed.data;

    // Use specific transaction-based repo method for complex updates
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
    console.error("[SADHANA_SESSION_PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await sadhanaRepo.findSessionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await sadhanaRepo.deleteSession(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SADHANA_SESSION_DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
