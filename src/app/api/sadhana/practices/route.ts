import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatPractice } from "../_helpers";
import * as sadhanaRepo from "@/repositories/sadhana.repository";

const createPracticeSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["mantra_japa", "parayana", "other"]),
  mantra_text: z.string().max(2000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("active_only") !== "false";
    const practices = await sadhanaRepo.findAllPractices(activeOnly);
    return NextResponse.json(practices.map(formatPractice));
  } catch (error) {
    console.error("[SADHANA_PRACTICES_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createPracticeSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { name, type, mantra_text, notes } = parsed.data;
    const practice = await sadhanaRepo.createPractice({
      name,
      type,
      mantraText: mantra_text ?? null,
      notes: notes ?? null,
    });
    return NextResponse.json(formatPractice(practice), { status: 201 });
  } catch (error) {
    console.error("[SADHANA_PRACTICES_POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
