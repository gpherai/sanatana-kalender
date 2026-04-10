import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatGoal } from "../_helpers";

export async function GET() {
  const goals = await prisma.sadhanaGoal.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals.map(formatGoal));
}

export async function POST(req: Request) {
  const body = await req.json();
  const goal = await prisma.sadhanaGoal.create({
    data: {
      type: body.type,
      targetMalas: body.target_malas,
      targetMinutes: body.target_minutes ?? null,
      active: true,
    },
  });
  return NextResponse.json(formatGoal(goal), { status: 201 });
}
