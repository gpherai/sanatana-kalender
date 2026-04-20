import { NextResponse } from "next/server";
import { z } from "zod";
import * as sadhanaRepo from "@/repositories/sadhana.repository";

const itemSchema = z.object({
  practice_id: z.string().min(1),
  quantity: z.number().int().min(1),
  unit: z.enum(["malas", "count"]).default("malas"),
  sort_order: z.number().int().default(0),
});

const createSchema = z.object({
  name: z.string().min(1).max(80),
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  try {
    const routines = await sadhanaRepo.findAllRoutines();
    return NextResponse.json(
      routines.map((r) => ({
        id: r.id,
        name: r.name,
        items: r.items.map((i) => ({
          id: i.id,
          practice_id: i.practiceId,
          practice_name: i.practice.name,
          practice_type: i.practice.type,
          quantity: i.quantity,
          unit: i.unit,
          sort_order: i.sortOrder,
        })),
      }))
    );
  } catch (error) {
    console.error("[SADHANA_ROUTINES_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = createSchema.safeParse(await req.json());
    if (!body.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const routine = await sadhanaRepo.createRoutine({
      name: body.data.name,
      items: {
        create: body.data.items.map((it, idx) => ({
          practiceId: it.practice_id,
          quantity: it.quantity,
          unit: it.unit as "malas" | "count",
          sortOrder: it.sort_order ?? idx,
        })),
      },
    });

    return NextResponse.json(
      {
        id: routine.id,
        name: routine.name,
        items: routine.items.map((i) => ({
          id: i.id,
          practice_id: i.practiceId,
          practice_name: i.practice.name,
          practice_type: i.practice.type,
          quantity: i.quantity,
          unit: i.unit,
          sort_order: i.sortOrder,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SADHANA_ROUTINES_POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
