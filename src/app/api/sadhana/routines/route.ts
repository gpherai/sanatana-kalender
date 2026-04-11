import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
  const routines = await prisma.sadhanaRoutine.findMany({
    where: { active: true },
    include: {
      items: {
        include: { practice: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

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
}

export async function POST(req: Request) {
  const body = createSchema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const routine = await prisma.sadhanaRoutine.create({
    data: {
      name: body.data.name,
      items: {
        create: body.data.items.map((it, idx) => ({
          practiceId: it.practice_id,
          quantity: it.quantity,
          unit: it.unit as "malas" | "count",
          sortOrder: it.sort_order ?? idx,
        })),
      },
    },
    include: {
      items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
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
}
