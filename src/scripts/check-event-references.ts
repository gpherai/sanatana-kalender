/**
 * Check cleaned Drik Panchang reference files against EventOccurrence records.
 *
 * Usage:
 *   npm run check:events
 *   npm run check:events -- --start 2026-01-01 --end 2029-12-31
 *   npm run check:events -- --output .project/reports/event-reference-check.md
 */

import "dotenv/config";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

type ReferenceEntry = {
  sourceFile: string;
  sourceType: string;
  sourceLines?: string;
  title: string;
  date: string;
  names: string[];
  relation: "primary" | "variant" | "related" | "context";
};

type DbEvent = {
  id: string;
  name: string;
  aliases: string[];
  occurrences: {
    date: Date;
    endDate: Date | null;
  }[];
};

type CheckStatus =
  | "ok"
  | "date_mismatch"
  | "alias_or_variant_needed"
  | "missing_event"
  | "out_of_range";

type CheckResult = {
  status: CheckStatus;
  reference: ReferenceEntry;
  matchedEvents: DbEvent[];
  matchedBy: "exact" | "derived" | "none";
  covered: boolean;
  dbDates: string[];
  nearestDbDates: string[];
  note: string;
};

const DEFAULT_SOURCE_DIR = "docs/reference/eventscheck-clean";
const DEFAULT_OUTPUT = ".project/reports/event-reference-check.md";
const DEFAULT_START = "2026-01-01";
const DEFAULT_END = "2029-12-31";

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const sourceDir = getArg("source") ?? DEFAULT_SOURCE_DIR;
const outputPath = getArg("output") ?? DEFAULT_OUTPUT;
const startArg = getArg("start") ?? DEFAULT_START;
const endArg = getArg("end") ?? DEFAULT_END;
const failOnIssues = process.argv.includes("--fail-on-issues");

async function main() {
  const start = parseIsoDate(startArg);
  const end = parseIsoDate(endArg);

  if (start > end) {
    throw new Error("--start must be before --end");
  }

  const referenceEntries = await readReferenceEntries(sourceDir);
  const dbEvents = await readDbEvents(start, end);
  const eventIndex = buildEventIndex(dbEvents);

  const results = referenceEntries.map((entry) =>
    checkReferenceEntry(entry, startArg, endArg, eventIndex)
  );

  const report = buildReport(results, {
    sourceDir,
    start: startArg,
    end: endArg,
    dbEventCount: dbEvents.length,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, "utf8");

  const statusCounts = countBy(results, (result) => result.status);
  console.log(`Checked ${results.length} cleaned reference entries`);
  console.log(`Range: ${startArg}..${endArg}`);
  console.log(`Report: ${outputPath}`);
  for (const status of [
    "ok",
    "date_mismatch",
    "alias_or_variant_needed",
    "missing_event",
    "out_of_range",
  ] satisfies CheckStatus[]) {
    console.log(`${status}: ${statusCounts.get(status) ?? 0}`);
  }

  const issueCount =
    (statusCounts.get("date_mismatch") ?? 0) +
    (statusCounts.get("alias_or_variant_needed") ?? 0) +
    (statusCounts.get("missing_event") ?? 0);

  if (failOnIssues && issueCount > 0) {
    process.exitCode = 1;
  }
}

async function readReferenceEntries(dir: string): Promise<ReferenceEntry[]> {
  const files = (await readdir(dir))
    .filter((fileName) => fileName.endsWith(".md"))
    .filter((fileName) => fileName !== "README.md" && fileName !== "INDEX.md")
    .sort((a, b) => a.localeCompare(b));

  const entries: ReferenceEntry[] = [];
  for (const fileName of files) {
    const fullPath = path.join(dir, fileName);
    const text = await readFile(fullPath, "utf8");
    entries.push(...parseCleanMarkdownFile(fileName, text));
  }

  return entries;
}

function parseCleanMarkdownFile(fileName: string, text: string): ReferenceEntry[] {
  const lines = text.split(/\r?\n/);
  const sourceFile =
    readFrontmatterValue(lines, "source_file") ?? `${DEFAULT_SOURCE_DIR}/${fileName}`;
  const sourceType = readFrontmatterValue(lines, "source_type") ?? "unknown";

  const entries: ReferenceEntry[] = [];
  let current: Partial<ReferenceEntry> | undefined;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current?.title && current.date) {
        entries.push(finalizeReferenceEntry(current, sourceFile, sourceType));
      }
      current = {
        sourceFile,
        sourceType,
        title: line.slice(3).trim(),
        names: [],
        relation: "primary",
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith("- Date: ")) {
      const dateMatch = /^- Date: (\d{4}-\d{2}-\d{2})/.exec(line);
      if (dateMatch) {
        current.date = dateMatch[1];
      }
      continue;
    }

    if (line.startsWith("- Names: ")) {
      current.names = line
        .slice("- Names: ".length)
        .split(";")
        .map((name) => name.trim())
        .filter(Boolean);
      continue;
    }

    if (line.startsWith("- Relation: ")) {
      const relation = line.slice("- Relation: ".length).trim();
      if (
        relation === "primary" ||
        relation === "variant" ||
        relation === "related" ||
        relation === "context"
      ) {
        current.relation = relation;
      }
      continue;
    }

    if (line.startsWith("- Source lines: ")) {
      current.sourceLines = line.slice("- Source lines: ".length).trim();
    }
  }

  if (current?.title && current.date) {
    entries.push(finalizeReferenceEntry(current, sourceFile, sourceType));
  }

  return entries;
}

function finalizeReferenceEntry(
  entry: Partial<ReferenceEntry>,
  sourceFile: string,
  sourceType: string
): ReferenceEntry {
  const names = unique([entry.title!, ...(entry.names ?? [])]);
  return {
    sourceFile,
    sourceType,
    sourceLines: entry.sourceLines,
    title: entry.title!,
    date: entry.date!,
    names,
    relation: entry.relation ?? "primary",
  };
}

function readFrontmatterValue(lines: string[], key: string): string | undefined {
  const prefix = `${key}: `;
  return lines
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

async function readDbEvents(start: Date, end: Date): Promise<DbEvent[]> {
  return prisma.event.findMany({
    select: {
      id: true,
      name: true,
      aliases: true,
      occurrences: {
        where: {
          OR: [
            { date: { gte: start, lte: end } },
            { date: { lte: end }, endDate: { gte: start } },
          ],
        },
        select: {
          date: true,
          endDate: true,
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

function buildEventIndex(events: DbEvent[]): Map<string, DbEvent[]> {
  const index = new Map<string, DbEvent[]>();

  for (const event of events) {
    for (const name of [event.name, ...event.aliases]) {
      for (const key of nameKeys(name)) {
        const existing = index.get(key) ?? [];
        existing.push(event);
        index.set(key, existing);
      }
    }
  }

  return index;
}

function checkReferenceEntry(
  reference: ReferenceEntry,
  start: string,
  end: string,
  eventIndex: Map<string, DbEvent[]>
): CheckResult {
  if (reference.date < start || reference.date > end) {
    return {
      status: "out_of_range",
      reference,
      matchedEvents: [],
      matchedBy: "none",
      covered: false,
      dbDates: [],
      nearestDbDates: [],
      note: `outside configured range ${start}..${end}`,
    };
  }

  const exactMatches = findMatches(reference.names, eventIndex);
  if (exactMatches.length > 0) {
    return resultForMatches(reference, exactMatches, "exact");
  }

  const derivedNames = deriveFallbackNames(reference);
  const derivedMatches = findMatches(derivedNames, eventIndex);
  if (derivedMatches.length > 0) {
    const result = resultForMatches(reference, derivedMatches, "derived");
    if (result.covered) {
      return {
        ...result,
        status: "alias_or_variant_needed",
        note: `reference name is not modeled directly; matched via ${derivedNames.join(", ")}`,
      };
    }
    return {
      ...result,
      status: "date_mismatch",
      note: `derived event exists but reference date is not covered; derived from ${derivedNames.join(", ")}`,
    };
  }

  return {
    status: "missing_event",
    reference,
    matchedEvents: [],
    matchedBy: "none",
    covered: false,
    dbDates: [],
    nearestDbDates: [],
    note: "no event name or alias matched",
  };
}

function resultForMatches(
  reference: ReferenceEntry,
  events: DbEvent[],
  matchedBy: "exact" | "derived"
): CheckResult {
  const covered = events.some((event) =>
    event.occurrences.some((occurrence) =>
      occurrenceCoversDate(occurrence, reference.date)
    )
  );
  const dbDates = events.flatMap((event) => event.occurrences.map(formatOccurrenceRange));
  const nearestDbDates = nearestDates(reference.date, events);

  return {
    status: covered ? "ok" : "date_mismatch",
    reference,
    matchedEvents: events,
    matchedBy,
    covered,
    dbDates,
    nearestDbDates,
    note: covered ? "date covered by DB occurrence" : "event exists but date is missing",
  };
}

function findMatches(names: string[], eventIndex: Map<string, DbEvent[]>): DbEvent[] {
  const matches = new Map<string, DbEvent>();

  for (const name of names) {
    for (const key of nameKeys(name)) {
      for (const event of eventIndex.get(key) ?? []) {
        matches.set(event.id, event);
      }
    }
  }

  return [...matches.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function nameKeys(name: string): string[] {
  const strict = normalizeName(name);
  const withoutVrat = strict
    .replace(/\bvrat\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const withoutChaturthiSuffix = withoutVrat
    .replace(/\bsankashti chaturthi\b/g, "sankashti")
    .replace(/\bchaturthi\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return unique([strict, withoutVrat, withoutChaturthiSuffix]).filter(Boolean);
}

function deriveFallbackNames(reference: ReferenceEntry): string[] {
  const derived: string[] = [];

  for (const name of reference.names) {
    derived.push(
      name
        .replace(/^(Adhika|Gauna|Vaishnava)\s+/i, "")
        .replace(/\s+Parana$/i, "")
        .trim()
    );
    derived.push(name.replace(/\s+Vrat$/i, "").trim());
    derived.push(name.replace(/\s+Purnima Vrat$/i, " Purnima").trim());
    derived.push(name.replace(/^Pausha Putrada Ekadashi$/i, "Putrada Ekadashi"));
    derived.push(
      name.replace(/^Shravana Putrada Ekadashi$/i, "Putrada Ekadashi (Shravana)")
    );
    derived.push(name.replace(/^Devutthana Ekadashi$/i, "Prabodhini Ekadashi"));
    derived.push(name.replace(/^Tulasi Vivah$/i, "Tulsi Vivah"));
    derived.push(name.replace(/^Rama Navami$/i, "Ram Navami"));
    derived.push(name.replace(/^Papamochani Ekadashi$/i, "Papmochani Ekadashi"));
    derived.push(name.replace(/^Shattila Ekadashi$/i, "Sat-tila Ekadashi"));
    derived.push(name.replace(/^Pongal$/i, "Thai Pongal"));
    derived.push(name.replace(/^Kalabhairav Jayanti$/i, "Kala Bhairava Ashtami"));
  }

  return unique(
    derived.filter((name) => name.length > 0 && !reference.names.includes(name))
  );
}

function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bmaa\b/g, "ma")
    .replace(/\bvrata\b/g, "vrat")
    .replace(/\s+/g, " ")
    .trim();
}

function occurrenceCoversDate(
  occurrence: { date: Date; endDate: Date | null },
  date: string
): boolean {
  const start = dateToIso(occurrence.date);
  const end = occurrence.endDate ? dateToIso(occurrence.endDate) : start;
  return start <= date && date <= end;
}

function nearestDates(referenceDate: string, events: DbEvent[]): string[] {
  const ref = parseIsoDate(referenceDate).getTime();
  return events
    .flatMap((event) =>
      event.occurrences.map((occurrence) => ({
        range: formatOccurrenceRange(occurrence),
        distance: Math.abs(parseIsoDate(dateToIso(occurrence.date)).getTime() - ref),
      }))
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map((item) => item.range);
}

function formatOccurrenceRange(occurrence: { date: Date; endDate: Date | null }): string {
  const start = dateToIso(occurrence.date);
  const end = occurrence.endDate ? dateToIso(occurrence.endDate) : start;
  return start === end ? start : `${start}..${end}`;
}

function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function buildReport(
  results: CheckResult[],
  context: { sourceDir: string; start: string; end: string; dbEventCount: number }
): string {
  const counts = countBy(results, (result) => result.status);
  const inRangeResults = results.filter((result) => result.status !== "out_of_range");
  const issueResults = inRangeResults.filter((result) => result.status !== "ok");

  const lines: string[] = [
    "# Event Reference Check",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Reference source: \`${context.sourceDir}\``,
    `Range: \`${context.start}\` to \`${context.end}\``,
    `DB events loaded: ${context.dbEventCount}`,
    "",
    "## Summary",
    "",
    `- Total reference entries: ${results.length}`,
    `- In range: ${inRangeResults.length}`,
    `- Out of range: ${counts.get("out_of_range") ?? 0}`,
    `- OK: ${counts.get("ok") ?? 0}`,
    `- Date mismatch: ${counts.get("date_mismatch") ?? 0}`,
    `- Alias or variant needed: ${counts.get("alias_or_variant_needed") ?? 0}`,
    `- Missing event: ${counts.get("missing_event") ?? 0}`,
    "",
    "## Status Meaning",
    "",
    "- `ok`: reference title/name maps to an event or alias and the DB occurrence covers the reference date.",
    "- `date_mismatch`: event exists, but no DB occurrence covers the reference date.",
    "- `alias_or_variant_needed`: a base event exists on the date, but the reference name itself is not modeled as an event or alias.",
    "- `missing_event`: no DB event or alias could be mapped.",
    "- `out_of_range`: reference entry is outside the configured range and was not checked against DB.",
    "",
  ];

  appendResultsSection(lines, "Date Mismatches", issueResults, "date_mismatch");
  appendResultsSection(
    lines,
    "Alias Or Variant Needed",
    issueResults,
    "alias_or_variant_needed"
  );
  appendResultsSection(lines, "Missing Events", issueResults, "missing_event");

  lines.push("## OK Samples", "");
  for (const result of inRangeResults
    .filter((item) => item.status === "ok")
    .slice(0, 30)) {
    lines.push(
      `- ${result.reference.date} — ${result.reference.title} -> ${result.matchedEvents
        .map((event) => event.name)
        .join(", ")}`
    );
  }

  lines.push("", "## Out Of Range", "");
  for (const result of results.filter((item) => item.status === "out_of_range")) {
    lines.push(
      `- ${result.reference.date} — ${result.reference.title} (${shortSource(result.reference)})`
    );
  }

  return `${lines.join("\n")}\n`;
}

function appendResultsSection(
  lines: string[],
  title: string,
  results: CheckResult[],
  status: CheckStatus
) {
  const matching = results.filter((result) => result.status === status);
  lines.push(`## ${title}`, "");

  if (matching.length === 0) {
    lines.push("No findings.", "");
    return;
  }

  lines.push("| Ref date | Reference | DB match | DB dates | Source | Note |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const result of matching) {
    lines.push(
      [
        result.reference.date,
        result.reference.title,
        result.matchedEvents.length > 0
          ? result.matchedEvents.map((event) => event.name).join("; ")
          : "-",
        result.nearestDbDates.length > 0 ? result.nearestDbDates.join("; ") : "-",
        shortSource(result.reference),
        result.note,
      ]
        .map(escapeTableCell)
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |")
    );
  }
  lines.push("");
}

function shortSource(reference: ReferenceEntry): string {
  const fileName = path.basename(reference.sourceFile);
  return reference.sourceLines ? `${fileName}:${reference.sourceLines}` : fileName;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
