"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Info, MoonStar, Clock, Sparkles, Users, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/Section";

// =============================================================================
// TYPES
// =============================================================================

export type TermSummary = {
  slug: string;
  title: string;
  sanskrit: string;
  category: string;
  shortDescription: string;
  parents?: string[];
  isGroup?: boolean;
  priority?: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    color: "primary" | "secondary" | "accent" | "muted";
    barClass: string;
  }
> = {
  Astronomie: { icon: MoonStar, color: "secondary", barClass: "encyl-bar-astronomie" },
  Tijd: { icon: Clock, color: "primary", barClass: "encyl-bar-tijd" },
  "Speciale dagen": { icon: Sparkles, color: "accent", barClass: "encyl-bar-speciale" },
  Devatās: { icon: Users, color: "muted", barClass: "encyl-bar-devatas" },
  Navagraha: { icon: Sun, color: "secondary", barClass: "encyl-bar-navagraha" },
  Algemeen: { icon: Info, color: "muted", barClass: "encyl-bar-algemeen" },
};

// =============================================================================
// TERM CARD
// =============================================================================

function TermCard({
  item,
  showCategory = false,
  barClass = "encyl-bar-algemeen",
}: {
  item: TermSummary;
  showCategory?: boolean;
  barClass?: string;
}) {
  // Strip Devanagari and comma from sanskrit field (e.g. "tithi, तिथि" → "tithi")
  const sanitizedSanskrit = item.sanskrit
    ? item.sanskrit.replace(/,?\s*[ऀ-ॿ०-९]+.*$/, "").trim()
    : "";
  const sanskritPart = sanitizedSanskrit ? ` (${sanitizedSanskrit})` : "";
  return (
    <Link
      href={`/encyclopedie/${item.slug}`}
      className="theme-card theme-interactive theme-focus-ring group relative flex flex-col p-6 duration-200 motion-safe:hover:-translate-y-1"
    >
      <div className={`${barClass} absolute top-0 left-0 h-1.5 w-full rounded-t-2xl`} />
      <div className="space-y-2">
        {showCategory && (
          <span className="text-theme-fg-muted text-xs font-medium tracking-wide uppercase">
            {item.category}
          </span>
        )}
        <h3 className="text-theme-fg text-xl font-bold tracking-tight transition-colors duration-300">
          {item.title}
          <span className="text-theme-fg-muted ml-1 text-sm font-normal opacity-80">
            {sanskritPart}
          </span>
        </h3>
        <p className="text-theme-fg-secondary line-clamp-3 text-[0.9375rem] leading-relaxed transition-colors duration-300">
          {item.shortDescription}
        </p>
      </div>
    </Link>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EncyclopediaOverview({
  groupedTerms,
  categories,
  totalCount,
}: {
  groupedTerms: Record<string, TermSummary[]>;
  categories: string[];
  totalCount: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return null;
    const all = categories.flatMap((cat) => groupedTerms[cat] ?? []);
    const normalize = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    // Alternate transliterations → canonical normalized form
    const SYNONYMS: [string, string][] = [
      ["ganesh", "ganesa"],
      ["ganapati", "ganesa"],
      ["vinayaka", "ganesa"],
      ["vighnesh", "ganesa"],
      ["shiva", "siva"],
      ["vishnu", "visnu"],
      ["lakshmi", "laksmi"],
      ["krishna", "krsna"],
      ["narayana", "narayana"],
      ["durga", "durga"],
      ["parvati", "parvati"],
    ];
    const nq = normalize(q);
    const terms = new Set([nq]);
    for (const [a, b] of SYNONYMS) {
      if (nq.includes(a)) terms.add(nq.replace(a, b));
      if (nq.includes(b)) terms.add(nq.replace(b, a));
    }
    return all.filter((t) => {
      const haystack = normalize(
        `${t.title} ${t.sanskrit} ${t.shortDescription} ${t.slug}`
      );
      return [...terms].some((term) => haystack.includes(term));
    });
  }, [q, categories, groupedTerms]);

  return (
    <div className="space-y-10">
      {/* Search */}
      <div className="relative">
        <Search className="text-theme-fg-muted pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Zoek in ${totalCount} termen…`}
          className="border-theme-border bg-theme-surface text-theme-fg placeholder:text-theme-fg-muted focus:border-theme-primary w-full rounded-2xl border py-3 pr-10 pl-12 text-base shadow-sm transition-colors focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-theme-fg-muted hover:text-theme-fg focus-visible:ring-theme-primary absolute top-1/2 right-3 flex min-h-[44px] min-w-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Zoekterm wissen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null ? (
        searchResults.length === 0 ? (
          <div className="text-theme-fg-muted py-20 text-center">
            <p>
              Geen resultaten voor{" "}
              <span className="text-theme-fg font-semibold">&ldquo;{query}&rdquo;</span>.
            </p>
            <p className="mt-2 text-sm">
              Probeer een andere spelling of een Sanskriet-equivalent.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-theme-fg-muted mb-6 text-sm">
              {searchResults.length} resultaten voor{" "}
              <span className="text-theme-fg font-semibold">&ldquo;{query}&rdquo;</span>
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((item) => (
                <TermCard
                  key={item.slug}
                  item={item}
                  showCategory
                  barClass={
                    CATEGORY_CONFIG[item.category]?.barClass ?? "encyl-bar-algemeen"
                  }
                />
              ))}
            </div>
          </div>
        )
      ) : (
        /* Normal grouped view */
        <div className="space-y-16">
          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category] ?? {
              icon: Info,
              color: "primary" as const,
              barClass: "encyl-bar-algemeen",
            };
            const items = groupedTerms[category] ?? [];

            const itemsToShow =
              category === "Navagraha"
                ? items
                : items.filter((t) => !t.parents?.length || t.isGroup);

            if (itemsToShow.length === 0) return null;

            return (
              <Section
                key={category}
                title={category}
                count={itemsToShow.length}
                icon={config.icon}
                iconColor={config.color}
                className="border-theme-border-subtle overflow-hidden rounded-3xl border shadow-xl"
              >
                <div className="grid gap-6 pt-4 md:grid-cols-2 xl:grid-cols-3">
                  {itemsToShow.map((item) => (
                    <TermCard key={item.slug} item={item} barClass={config.barClass} />
                  ))}
                </div>
              </Section>
            );
          })}
        </div>
      )}
    </div>
  );
}
