import { Book } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { getAllTerms } from "@/lib/encyclopedia";
import {
  EncyclopediaOverview,
  type TermSummary,
} from "@/components/encyclopedia/EncyclopediaOverview";

export const metadata = {
  title: "Encyclopedie",
  description:
    "Uitgebreide definities van Sanskriet termen gebruikt in de Dharma Calendar.",
};

export default function DictionaryPage() {
  const allTerms = getAllTerms();

  // Strip MDX content — client component only needs summary fields
  const termSummaries: TermSummary[] = allTerms.map(
    ({
      slug,
      title,
      sanskrit,
      category,
      shortDescription,
      parent,
      isGroup,
      priority,
    }) => ({
      slug,
      title,
      sanskrit,
      category,
      shortDescription,
      parent,
      isGroup,
      priority,
    })
  );

  // Group by category
  const groupedTerms = termSummaries.reduce<Record<string, TermSummary[]>>(
    (acc, term) => {
      if (!acc[term.category]) acc[term.category] = [];
      acc[term.category]!.push(term);
      return acc;
    },
    {}
  );

  // Sort within each category
  Object.values(groupedTerms).forEach((terms) => {
    terms.sort((a, b) => {
      if ((a.priority ?? 99) !== (b.priority ?? 99)) {
        return (a.priority ?? 99) - (b.priority ?? 99);
      }
      return a.title.localeCompare(b.title);
    });
  });

  const categories = Object.keys(groupedTerms).sort((a, b) => a.localeCompare(b));
  const totalCount = termSummaries.length;

  return (
    <PageLayout spacing>
      {/* Hero */}
      <div
        className="border-theme-border-subtle bg-theme-surface relative overflow-hidden rounded-[2rem] border p-8 shadow-2xl md:p-16"
        style={{
          background: `linear-gradient(135deg,
            color-mix(in oklch, var(--theme-primary) 12%, var(--theme-surface)),
            color-mix(in oklch, var(--theme-secondary) 8%, var(--theme-surface)),
            color-mix(in oklch, var(--theme-accent) 5%, var(--theme-surface))
          )`,
        }}
      >
        <div className="bg-theme-primary-20 absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-[100px]" />
        <div className="bg-theme-secondary-20 absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8">
            <div className="border-theme-border-strong/20 bg-theme-surface ring-theme-surface/50 relative flex h-24 w-24 items-center justify-center rounded-3xl border shadow-2xl ring-4 backdrop-blur-md">
              <Book className="text-theme-primary h-12 w-12" />
            </div>
          </div>

          <h1 className="text-theme-fg mb-6 text-4xl font-black tracking-tight md:text-6xl">
            Sanskriet <span className="text-theme-primary">Encyclopedie</span>
          </h1>
          <p className="text-theme-fg-secondary max-w-2xl text-center text-lg leading-relaxed font-medium md:text-xl">
            Een diepgaande gids door de spirituele en astronomische wijsheid van Sanātana
            Dharma. Ontdek de betekenis van godheden, kosmische principes en de heilige
            ritmes van de tijd.
          </p>
        </div>
      </div>

      {/* Search + category grid (client) */}
      <EncyclopediaOverview
        groupedTerms={groupedTerms}
        categories={categories}
        totalCount={totalCount}
      />

      <footer className="border-theme-border mt-20 border-t py-12 text-center">
        <div className="bg-theme-surface-raised border-theme-border-subtle inline-flex items-center gap-2 rounded-full border px-6 py-3 shadow-sm">
          <p className="text-theme-fg-muted text-sm font-semibold">
            Staat een term er niet bij? Neem contact op voor toevoegingen.
          </p>
        </div>
      </footer>
    </PageLayout>
  );
}
