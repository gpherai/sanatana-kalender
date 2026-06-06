import "server-only";
import type { Event } from "@/generated/prisma/client";
import type { GeneratedOccurrence } from "@/engine";

export type { GeneratedOccurrence };

export interface RecurrenceOptions {
  startDate: Date;
  endDate: Date;
  location?: { name: string; lat: number; lon: number };
  timezone?: string;
  maxOccurrences?: number;
}

export type RecurrenceStrategy = (
  event: Event,
  startDate: Date,
  endDate: Date
) => Promise<GeneratedOccurrence[]>;
