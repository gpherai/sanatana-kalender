import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { DharmaCalendar } from "@/components/calendar";
import { TodayHero } from "@/components/ui";
import { PageLayout } from "@/components/layout";
import { getCategoryBgClass } from "@/lib/category-styles";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch upcoming events from database with category relation (7 days window)
  // Strip time component to UTC midnight so all-day events for today are included
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const sevenDaysLater = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7)
  );

  const upcomingEvents = await prisma.eventOccurrence.findMany({
    where: {
      date: {
        gte: today,
        lte: sevenDaysLater,
      },
    },
    include: {
      event: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 12, // Show more events within 7 days
  });

  // Fetch categories for the legend
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Group events by importance
  const majorEvents = upcomingEvents.filter((e) => e.event.importance === "MAJOR");
  const otherEvents = upcomingEvents.filter((e) => e.event.importance !== "MAJOR");

  return (
    <PageLayout spacing>
      {/* Hero: Today's Info */}
      <TodayHero />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Calendar - Takes 3 columns on xl screens */}
        <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg md:p-6 xl:col-span-3">
          <DharmaCalendar />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 xl:col-span-1">
          {/* Major Upcoming Events (7 days) */}
          {majorEvents.length > 0 && (
            <div className="bg-theme-gradient-subtle border-theme-primary-20 rounded-2xl border p-5 shadow-lg">
              <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="text-xl">⭐</span>
                Belangrijke Events (7 dagen)
              </h2>
              <div className="space-y-3">
                {majorEvents.slice(0, 5).map((occ) => {
                  const category = occ.event.category;
                  return (
                    <Link
                      key={occ.id}
                      href={`/events/${occ.event.id}`}
                      className="group bg-theme-surface-raised/60 hover:bg-theme-surface-raised block rounded-xl p-4 backdrop-blur-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{category?.icon || "📅"}</div>
                        <div className="min-w-0 flex-1">
                          <div className="group-hover:text-theme-primary text-theme-fg font-medium transition-colors">
                            {occ.event.name}
                          </div>
                          <div className="text-theme-fg-muted mt-0.5 text-sm">
                            {new Date(occ.date).toLocaleDateString("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                          {occ.endDate && (
                            <div className="text-theme-primary mt-1 text-xs">
                              {Math.ceil(
                                (new Date(occ.endDate).getTime() -
                                  new Date(occ.date).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) + 1}{" "}
                              dagen
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Upcoming Events (7 days) */}
          <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
            <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">📿</span>
              Binnenkort (7 dagen)
            </h2>

            {otherEvents.length === 0 && majorEvents.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl">🙏</div>
                <p className="text-theme-fg-muted text-sm">Geen aankomende events</p>
                <Link
                  href="/events/new"
                  className="text-theme-primary mt-2 inline-flex items-center gap-1 text-sm hover:opacity-80"
                >
                  <Plus className="h-4 w-4" />
                  Voeg er een toe
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {otherEvents.slice(0, 7).map((occ) => {
                  const category = occ.event.category;
                  return (
                    <Link
                      key={occ.id}
                      href={`/events/${occ.event.id}`}
                      className="group hover:bg-theme-surface-hover flex items-center gap-3 rounded-xl p-3 transition-colors"
                    >
                      <div className="text-xl">{category?.icon || "📅"}</div>
                      <div className="min-w-0 flex-1">
                        <div className="group-hover:text-theme-primary text-theme-fg truncate text-sm font-medium transition-colors">
                          {occ.event.name}
                        </div>
                        <div className="text-theme-fg-muted text-xs">
                          {new Date(occ.date).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                      <ArrowRight className="group-hover:text-theme-primary text-theme-fg-muted h-4 w-4 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Legend */}
          <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
            <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">🏷️</span>
              Categorieën
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="hover:bg-theme-surface-hover flex cursor-default items-center gap-2 rounded-lg p-2 transition-colors"
                  title={cat.displayName}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${getCategoryBgClass(cat.name, 20)}`}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-theme-fg-muted text-sm">{cat.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-theme-border border-t py-6 text-center">
        <p className="text-theme-fg-muted text-sm">
          🕉️ Dharma Calendar • Built with Next.js 16, Prisma 7, PostgreSQL
        </p>
      </footer>
    </PageLayout>
  );
}
