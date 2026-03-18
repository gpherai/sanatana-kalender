import { Book, Info, MoonStar, Clock, Sparkles, Users } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Section } from "@/components/ui/Section";
import { DICTIONARY_TERMS } from "@/lib/dictionary";

export const metadata = {
  title: "Woordenboek - Dharma Calendar",
  description: "Definities van Sanskriet termen gebruikt in de Dharma Calendar.",
};

export default function DictionaryPage() {
  // Group terms by category and sort them alphabetically within each category
  const groupedTerms = DICTIONARY_TERMS.reduce<Record<string, typeof DICTIONARY_TERMS>>(
    (acc, term) => {
      if (!acc[term.category]) {
        acc[term.category] = [];
      }
      acc[term.category]!.push(term);
      return acc;
    },
    {}
  );

  // Sort terms within each category
  Object.keys(groupedTerms).forEach((key) => {
    groupedTerms[key]!.sort((a, b) => a.term.localeCompare(b.term));
  });

  // Get categories and sort them alphabetically
  const categories = (Object.keys(groupedTerms) as Array<keyof typeof groupedTerms>).sort(
    (a, b) => a.localeCompare(b)
  );

  return (
    <PageLayout spacing>
      {/* Header Section with divine gradient background */}
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
        {/* Decorative background elements - Static */}
        <div className="bg-theme-primary-20 absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-[100px]" />
        <div className="bg-theme-secondary-20 absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="border-theme-border-strong/20 bg-theme-surface ring-theme-surface/50 relative flex h-24 w-24 items-center justify-center rounded-3xl border shadow-2xl ring-4 backdrop-blur-md">
              <Book className="text-theme-primary h-12 w-12" />
            </div>
          </div>

          <h1 className="text-theme-fg mb-6 text-4xl font-black tracking-tight drop-shadow-sm md:text-6xl">
            Sanskriet <span className="text-theme-primary">Woordenboek</span>
          </h1>
          <p className="max-max-w-2xl text-theme-fg-secondary text-center text-lg leading-relaxed font-medium md:text-xl">
            Verdiep je kennis van de Vedische tijdrekening en spirituele concepten met dit
            overzicht van essentiële termen.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-16">
        {categories.map((category) => {
          let categoryIcon = Info;
          let categoryColor: "primary" | "secondary" | "accent" | "muted" = "primary";

          if (category === "Astronomie") {
            categoryIcon = MoonStar;
            categoryColor = "secondary";
          } else if (category === "Tijd") {
            categoryIcon = Clock;
            categoryColor = "primary";
          } else if (category === "Speciale dagen") {
            categoryIcon = Sparkles;
            categoryColor = "accent";
          } else if (category === "Devatās") {
            categoryIcon = Users;
            categoryColor = "muted";
          }

          return (
            <Section
              key={category}
              title={category}
              icon={categoryIcon}
              iconColor={categoryColor}
              className="border-theme-border-subtle overflow-hidden rounded-3xl border shadow-xl"
            >
              <div className="grid gap-6 pt-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedTerms[category]?.map((item) => {
                  // Extract Sanskrit part if present for special styling
                  const parts = item.term.split(" (");
                  const mainTerm = parts[0];
                  const sanskritPart = parts[1] ? ` (${parts[1]}` : "";

                  return (
                    <div
                      key={item.term}
                      className="group border-theme-border bg-theme-bg-subtle/50 hover:border-theme-primary-30 relative flex flex-col rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Decorative accent - Standard color, slightly stronger on hover */}
                      <div className="bg-theme-primary-20 group-hover:bg-theme-primary-40 absolute top-0 left-0 h-1.5 w-full transition-colors duration-300" />

                      <div className="space-y-3">
                        <h3 className="text-theme-fg text-xl font-bold tracking-tight transition-colors duration-300">
                          {mainTerm}
                          <span className="text-theme-fg-muted ml-1 text-sm font-normal opacity-80">
                            {sanskritPart}
                          </span>
                        </h3>
                        <p className="text-theme-fg-secondary text-[0.9375rem] leading-relaxed transition-colors duration-300">
                          {item.definition}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          );
        })}
      </div>

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
