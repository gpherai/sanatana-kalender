import { getTermBySlug, getAllTerms, type EncyclopediaTerm } from "@/lib/encyclopedia";
import { extractHeadings, slugify } from "@/lib/mdx-headings";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ENCYCLOPEDIA_CATEGORY_CONFIG,
  ENCYCLOPEDIA_CATEGORY_FALLBACK,
} from "@/components/encyclopedia/category-config";
import { TableOfContents } from "@/components/encyclopedia/TableOfContents";
import { MobileTOC } from "@/components/encyclopedia/MobileTOC";

function childrenToText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (children !== null && typeof children === "object" && "props" in children) {
    return childrenToText(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props.children
    );
  }
  return "";
}

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

// Custom components for MDX rendering to match the theme
const components = {
  h2: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2
      id={slugify(childrenToText(children))}
      className="text-theme-fg mt-10 mb-4 text-2xl font-bold tracking-tight"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => (
    <h3
      id={slugify(childrenToText(children))}
      className="text-theme-fg mt-8 mb-3 text-xl font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h3>
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
  a: ({ children, href, ...rest }: React.ComponentProps<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-theme-primary focus-visible:ring-theme-primary rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-theme-primary focus-visible:ring-theme-primary rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
        {...rest}
      >
        {children}
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

  const headings = extractHeadings(term.content);
  const allTerms = getAllTerms();
  const parentTerm = term.parents?.[0] ? getTermBySlug(term.parents[0]) : null;

  // Prev/next — alphabetical order over all terms
  const sortedAll = [...allTerms].sort((a, b) => a.title.localeCompare(b.title, "nl"));
  const currentIdx = sortedAll.findIndex((t) => t.slug === term.slug);
  const prevTerm = currentIdx > 0 ? sortedAll[currentIdx - 1] : null;
  const nextTerm = currentIdx < sortedAll.length - 1 ? sortedAll[currentIdx + 1] : null;

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
      <div className="mx-auto max-w-6xl">
        <div className="text-theme-fg-muted mb-8 flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            href="/encyclopedie"
            className="hover:text-theme-primary focus-visible:ring-theme-primary flex items-center gap-1 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Encyclopedie
          </Link>
          {parentTerm && (
            <>
              <span>/</span>
              <Link
                href={`/encyclopedie/${parentTerm.slug}`}
                className="hover:text-theme-primary focus-visible:ring-theme-primary rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {parentTerm.title}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-theme-fg">{term.title}</span>
        </div>

        <div className="xl:grid xl:grid-cols-[1fr_15rem] xl:gap-12">
          <div>
            <MobileTOC headings={headings} />
            <article className="border-theme-border-subtle bg-theme-surface overflow-hidden rounded-[2rem] border shadow-xl">
              <div className="bg-theme-bg-subtle border-theme-border-subtle border-b p-8 md:p-12">
                <div className="mb-6 flex items-center gap-3">
                  {(() => {
                    const catCfg =
                      ENCYCLOPEDIA_CATEGORY_CONFIG[term.category] ??
                      ENCYCLOPEDIA_CATEGORY_FALLBACK;
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
                      className="theme-card theme-focus-ring group hover:border-theme-primary-30 relative flex flex-col p-6 transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1"
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
                        className="text-theme-primary focus-visible:ring-theme-primary rounded text-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >
                        Bekijk volledige groep &rarr;
                      </Link>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((member) => (
                        <Link
                          href={`/encyclopedie/${member.slug}`}
                          key={member.slug}
                          className="theme-card theme-focus-ring group hover:border-theme-primary-30 relative flex flex-col p-6 transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1"
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
                      className="theme-card theme-focus-ring group hover:border-theme-secondary-30 relative flex flex-col p-6 transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1"
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
                      className="theme-card theme-focus-ring group hover:border-theme-accent-20 relative flex flex-col p-6 transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1"
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

            {/* Prev / Next article navigation */}
            <nav aria-label="Artikel navigatie" className="mt-16 grid grid-cols-2 gap-4">
              {prevTerm ? (
                <Link
                  href={`/encyclopedie/${prevTerm.slug}`}
                  className="theme-card theme-focus-ring group flex flex-col gap-1 p-4 transition-all duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5"
                >
                  <span className="text-theme-fg-muted flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
                    <ArrowLeft className="h-3 w-3 transition-transform duration-200 motion-safe:group-hover:-translate-x-1" />
                    Vorige
                  </span>
                  <span className="text-theme-fg line-clamp-2 text-sm font-semibold">
                    {prevTerm.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextTerm ? (
                <Link
                  href={`/encyclopedie/${nextTerm.slug}`}
                  className="theme-card theme-focus-ring group flex flex-col items-end gap-1 p-4 text-right transition-all duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5"
                >
                  <span className="text-theme-fg-muted flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
                    Volgende
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
                  </span>
                  <span className="text-theme-fg line-clamp-2 text-sm font-semibold">
                    {nextTerm.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </div>

          {headings.length >= 2 && (
            <aside className="hidden xl:sticky xl:top-8 xl:block xl:self-start">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
