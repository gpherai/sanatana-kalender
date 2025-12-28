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
  const groupedTerms = DICTIONARY_TERMS.reduce<Record<string, typeof DICTIONARY_TERMS>>((acc, term) => {
    if (!acc[term.category]) {
      acc[term.category] = [];
    }
    acc[term.category]!.push(term);
    return acc;
  }, {});

  // Sort terms within each category
  Object.keys(groupedTerms).forEach((key) => {
    groupedTerms[key]!.sort((a, b) => a.term.localeCompare(b.term));
  });

  // Get categories and sort them alphabetically
  const categories = (Object.keys(groupedTerms) as Array<keyof typeof groupedTerms>).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <PageLayout spacing>
      {/* Header Section with divine gradient background */}
      <div 
        className="relative overflow-hidden rounded-[2rem] border border-theme-border-subtle bg-theme-surface p-8 shadow-2xl md:p-16"
        style={{
          background: `linear-gradient(135deg, 
            color-mix(in oklch, var(--theme-primary) 12%, var(--theme-surface)),
            color-mix(in oklch, var(--theme-secondary) 8%, var(--theme-surface)),
            color-mix(in oklch, var(--theme-accent) 5%, var(--theme-surface))
          )`
        }}
      >
        {/* Decorative background elements - Static */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-theme-primary-20 blur-[100px] opacity-50" />
        <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-theme-secondary-20 blur-[100px] opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 relative">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-theme-border-strong/20 bg-theme-surface shadow-2xl ring-4 ring-theme-surface/50 backdrop-blur-md">
              <Book className="h-12 w-12 text-theme-primary" />
            </div>
          </div>
          
          <h1 className="mb-6 text-4xl font-black tracking-tight text-theme-fg md:text-6xl drop-shadow-sm">
            Sanskriet <span className="text-theme-primary">Woordenboek</span>
          </h1>
          <p className="max-max-w-2xl text-lg leading-relaxed text-theme-fg-secondary md:text-xl font-medium text-center">
            Verdiep je kennis van de Vedische tijdrekening en spirituele concepten met dit overzicht van essentiële termen.
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
              className="shadow-xl border border-theme-border-subtle rounded-3xl overflow-hidden"
            >
              <div className="grid gap-6 pt-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedTerms[category]?.map((item) => {
                  // Extract Sanskrit part if present for special styling
                  const parts = item.term.split(' (');
                  const mainTerm = parts[0];
                  const sanskritPart = parts[1] ? ` (${parts[1]}` : '';

                  return (
                    <div
                      key={item.term}
                      className="group relative flex flex-col rounded-2xl border border-theme-border bg-theme-bg-subtle/50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-theme-primary-30 hover:shadow-lg"
                    >
                      {/* Decorative accent - Standard color, slightly stronger on hover */}
                      <div className="absolute left-0 top-0 h-1.5 w-full bg-theme-primary-20 group-hover:bg-theme-primary-40 transition-colors duration-300" />
                      
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold tracking-tight text-theme-fg transition-colors duration-300">
                          {mainTerm}
                          <span className="text-sm font-normal text-theme-fg-muted ml-1 opacity-80">
                            {sanskritPart}
                          </span>
                        </h3>
                        <p className="text-[0.9375rem] leading-relaxed text-theme-fg-secondary transition-colors duration-300">
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

      <footer className="mt-20 border-t border-theme-border py-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-theme-surface-raised px-6 py-3 border border-theme-border-subtle shadow-sm">
          <p className="text-sm font-semibold text-theme-fg-muted">
            Staat een term er niet bij? Neem contact op voor toevoegingen.
          </p>
        </div>
      </footer>
    </PageLayout>
  );
}
