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
  parent?: string;
  isGroup?: boolean;
  priority?: number;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORY_CONFIG: Record<
  string,
  { icon: LucideIcon; color: "primary" | "secondary" | "accent" | "muted" }
> = {
  Astronomie: { icon: MoonStar, color: "secondary" },
  Tijd: { icon: Clock, color: "primary" },
  "Speciale dagen": { icon: Sparkles, color: "accent" },
  Devatās: { icon: Users, color: "muted" },
  Navagraha: { icon: Sun, color: "secondary" },
};

// =============================================================================
// TERM CARD
// =============================================================================

function TermCard({
  item,
  showCategory = false,
}: {
  item: TermSummary;
  showCategory?: boolean;
}) {
  const sanskritPart = item.sanskrit ? ` (${item.sanskrit})` : "";
  return (
    <Link
      href={`/encyclopedie/${item.slug}`}
      className="group border-theme-border bg-theme-surface hover:border-theme-primary-30 focus:ring-theme-primary focus:ring-offset-theme-bg relative flex flex-col rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      <div className="bg-theme-primary-20 group-hover:bg-theme-primary-40 absolute top-0 left-0 h-1.5 w-full rounded-t-2xl transition-colors duration-300" />
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
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sanskrit.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q)
    );
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
            className="text-theme-fg-muted hover:text-theme-fg absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer transition-colors"
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
            Geen resultaten voor{" "}
            <span className="text-theme-fg font-semibold">&ldquo;{query}&rdquo;</span>.
          </div>
        ) : (
          <div>
            <p className="text-theme-fg-muted mb-6 text-sm">
              {searchResults.length} resultaten voor{" "}
              <span className="text-theme-fg font-semibold">&ldquo;{query}&rdquo;</span>
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((item) => (
                <TermCard key={item.slug} item={item} showCategory />
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
            };
            const items = groupedTerms[category] ?? [];

            const itemsToShow =
              category === "Navagraha" ? items : items.filter((t) => !t.parent);

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
                    <TermCard key={item.slug} item={item} />
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
