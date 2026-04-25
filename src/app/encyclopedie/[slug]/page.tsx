import { getTermBySlug, getAllTerms, type EncyclopediaTerm } from "@/lib/encyclopedia";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft, MoonStar, Clock, Sparkles, Users, Sun, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export async function generateStaticParams() {
  const terms = getAllTerms();
  return terms.map((term) => ({
    slug: term.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);

  if (!term) {
    return {
      title: "Term niet gevonden",
    };
  }

  return {
    title: `${term.title} | Encyclopedie`,
    description: term.shortDescription,
  };
}

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; chipClass: string }> = {
  Astronomie: { icon: MoonStar, chipClass: "encyl-chip-astronomie" },
  Tijd: { icon: Clock, chipClass: "encyl-chip-tijd" },
  "Speciale dagen": { icon: Sparkles, chipClass: "encyl-chip-speciale" },
  Devatās: { icon: Users, chipClass: "encyl-chip-devatas" },
  Navagraha: { icon: Sun, chipClass: "encyl-chip-navagraha" },
  Algemeen: { icon: Info, chipClass: "encyl-chip-algemeen" },
};

// Custom components for MDX rendering to match the theme
const components = {
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      className="text-theme-fg mt-10 mb-4 text-2xl font-bold tracking-tight"
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      className="text-theme-fg mt-8 mb-3 text-xl font-semibold tracking-tight"
      {...props}
    />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="text-theme-fg mb-6 leading-relaxed" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      className="text-theme-fg-secondary marker:text-theme-primary mb-6 ml-6 list-disc space-y-2"
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className="text-theme-fg-secondary marker:text-theme-primary mb-6 ml-6 list-decimal space-y-2"
      {...props}
    />
  ),
  li: (props: React.ComponentProps<"li">) => <li className="pl-1" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="text-theme-fg font-semibold" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => {
    const isInternal = props.href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={props.href!}
          className="text-theme-primary font-medium hover:underline"
        >
          {props.children}
        </Link>
      );
    }
    return (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="text-theme-primary font-medium hover:underline"
        {...props}
      >
        {props.children}
      </a>
    );
  },
};

export default async function TermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);

  if (!term) {
    notFound();
  }

  const allTerms = getAllTerms();
  const parentTerm = term.parents?.[0] ? getTermBySlug(term.parents[0]) : null;

  const isChildOf = (t: EncyclopediaTerm, slug: string) =>
    (t.parents ?? []).includes(slug);

  const termParents = term.parents ?? [];

  // 1. Identify direct child groups
  const childGroups = allTerms
    .filter((t) => isChildOf(t, term.slug) && t.isGroup)
    .sort((a, b) => {
      if (a.priority !== b.priority) return (a.priority || 99) - (b.priority || 99);
      return a.title.localeCompare(b.title);
    });

  // 2. Map each group to its children
  const groupedManifestations = childGroups.map((group) => ({
    group,
    members: allTerms
      .filter((t) => isChildOf(t, group.slug))
      .sort((a, b) => {
        if ((a.priority || 99) !== (b.priority || 99)) {
          return (a.priority || 99) - (b.priority || 99);
        }
        return a.title.localeCompare(b.title);
      }),
  }));

  // 3. Identify direct standalone manifestations
  const standaloneManifestations = allTerms
    .filter((t) => isChildOf(t, term.slug) && !t.isGroup)
    .sort((a, b) => {
      if ((a.priority || 99) !== (b.priority || 99)) {
        return (a.priority || 99) - (b.priority || 99);
      }
      return a.title.localeCompare(b.title);
    });

  // 4. Siblings — articles that share at least one parent with the current article
  const siblings =
    termParents.length > 0
      ? allTerms
          .filter((t) => {
            if (t.slug === term.slug) return false;
            if (isChildOf(t, term.slug)) return false;
            const tParents = t.parents ?? [];
            return termParents.some((p) => tParents.includes(p));
          })
          .sort((a, b) => {
            if ((a.priority || 99) !== (b.priority || 99))
              return (a.priority || 99) - (b.priority || 99);
            return a.title.localeCompare(b.title);
          })
          .slice(0, 12)
      : [];

  // 5. Other related terms — same category, not already shown above
  const siblingSlugSet = new Set(siblings.map((s) => s.slug));
  const otherRelated = allTerms
    .filter((t) => {
      return (
        t.category === term.category &&
        t.slug !== term.slug &&
        !isChildOf(t, term.slug) &&
        !(term.parents ?? []).includes(t.slug) &&
        !siblingSlugSet.has(t.slug) &&
        !t.isGroup
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 6);

  return (
    <PageLayout spacing>
      <div className="mx-auto max-w-5xl">
        <div className="text-theme-fg-muted mb-8 flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            href="/encyclopedie"
            className="hover:text-theme-primary flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Encyclopedie
          </Link>
          {parentTerm && (
            <>
              <span>/</span>
              <Link
                href={`/encyclopedie/${parentTerm.slug}`}
                className="hover:text-theme-primary transition-colors"
              >
                {parentTerm.title}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-theme-fg">{term.title}</span>
        </div>

        <article className="border-theme-border-subtle bg-theme-surface overflow-hidden rounded-[2rem] border shadow-xl">
          <div className="bg-theme-bg-subtle border-theme-border-subtle border-b p-8 md:p-12">
            <div className="mb-6 flex items-center gap-3">
              {(() => {
                const catCfg = CATEGORY_CONFIG[term.category] ?? {
                  icon: Info,
                  chipClass: "encyl-chip-algemeen",
                };
                const CatIcon = catCfg.icon;
                return (
                  <span
                    className={`encyl-chip-base ${catCfg.chipClass} px-3 py-1 text-sm font-semibold`}
                  >
                    <CatIcon className="h-4 w-4" />
                    {term.category}
                  </span>
                );
              })()}
            </div>

            <h1 className="text-theme-fg mb-3 text-4xl font-black tracking-tight md:text-5xl">
              {term.title}
            </h1>

            {(term.devanagari || term.sanskrit) && (
              <div className="mt-1 space-y-0.5">
                {term.devanagari && (
                  <p className="text-theme-fg-secondary text-2xl font-medium md:text-3xl">
                    {term.devanagari}
                  </p>
                )}
                {term.sanskrit && (
                  <p className="text-theme-fg-muted text-base font-medium italic">
                    {term.sanskrit}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-8 md:p-12">
            <div className="prose prose-theme mx-auto max-w-3xl">
              <MDXRemote source={term.content} components={components} />
            </div>
          </div>
        </article>

        {/* 1. Standalone Manifestations / Group Members Section (First) */}
        {standaloneManifestations.length > 0 && (
          <div className="mt-16">
            <h2 className="text-theme-fg mb-8 text-3xl font-black tracking-tight">
              {term.isGroup
                ? `Leden van de ${term.title}`
                : groupedManifestations.length > 0
                  ? "Directe Manifestaties"
                  : "Manifestaties & Vormen"}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {standaloneManifestations.map((child) => (
                <Link
                  href={`/encyclopedie/${child.slug}`}
                  key={child.slug}
                  className="theme-card theme-focus-ring group hover:border-theme-primary-30 relative flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-theme-primary-20 group-hover:bg-theme-primary-40 absolute top-0 left-0 h-1.5 w-full rounded-t-2xl transition-colors duration-300" />
                  <h3 className="text-theme-fg mb-2 text-xl font-bold tracking-tight">
                    {child.title}
                  </h3>
                  <p className="text-theme-fg-secondary line-clamp-2 text-sm leading-relaxed">
                    {child.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 2. Grouped Manifestations (Prioritized list) */}
        {groupedManifestations.map(
          ({ group, members }) =>
            members.length > 0 && (
              <div key={group.slug} className="mt-16">
                <div className="border-theme-border mb-8 flex items-end justify-between border-b pb-4">
                  <h2 className="text-theme-fg text-3xl font-black tracking-tight">
                    {group.title}
                  </h2>
                  <Link
                    href={`/encyclopedie/${group.slug}`}
                    className="text-theme-primary text-sm font-semibold hover:underline"
                  >
                    Bekijk volledige groep &rarr;
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <Link
                      href={`/encyclopedie/${member.slug}`}
                      key={member.slug}
                      className="theme-card theme-focus-ring group hover:border-theme-primary-30 relative flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="bg-theme-primary-20 group-hover:bg-theme-primary-40 absolute top-0 left-0 h-1.5 w-full rounded-t-2xl transition-colors duration-300" />
                      <h3 className="text-theme-fg mb-2 text-xl font-bold tracking-tight">
                        {member.title}
                      </h3>
                      <p className="text-theme-fg-secondary line-clamp-2 text-sm leading-relaxed">
                        {member.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
        )}

        {/* 3. Siblings — other manifestations sharing the same parent(s) */}
        {siblings.length > 0 && (
          <div className="mt-16">
            <h2 className="text-theme-fg mb-8 text-3xl font-black tracking-tight">
              Gerelateerde Manifestaties
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling) => (
                <Link
                  href={`/encyclopedie/${sibling.slug}`}
                  key={sibling.slug}
                  className="theme-card theme-focus-ring group hover:border-theme-secondary-30 relative flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-theme-secondary-20 group-hover:bg-theme-secondary-40 absolute top-0 left-0 h-1.5 w-full rounded-t-2xl transition-colors duration-300" />
                  <h3 className="text-theme-fg mb-2 text-xl font-bold tracking-tight">
                    {sibling.title}
                  </h3>
                  <p className="text-theme-fg-secondary line-clamp-2 text-sm leading-relaxed">
                    {sibling.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 4. Related Subjects Section (Last) */}
        {otherRelated.length > 0 && (
          <div className="mt-16">
            <h2 className="text-theme-fg mb-8 text-3xl font-black tracking-tight">
              Gerelateerde Onderwerpen
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherRelated.map((related) => (
                <Link
                  href={`/encyclopedie/${related.slug}`}
                  key={related.slug}
                  className="theme-card theme-focus-ring group hover:border-theme-accent-20 relative flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="bg-theme-accent-15 group-hover:bg-theme-accent-20 absolute top-0 left-0 h-1.5 w-full rounded-t-2xl transition-colors duration-300" />
                  <h3 className="text-theme-fg mb-2 text-xl font-bold tracking-tight">
                    {related.title}
                  </h3>
                  <p className="text-theme-fg-secondary line-clamp-2 text-sm leading-relaxed">
                    {related.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
