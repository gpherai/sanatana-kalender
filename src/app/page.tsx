import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { DharmaCalendar } from "@/components/calendar/DharmaCalendar";
import { TodayHero } from "@/components/ui/TodayHero";
import { PageLayout } from "@/components/layout";

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
          categories: {
            include: { category: true },
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    // No take limit — show all events within the 7-day window
  });

  // Fetch categories for the legend
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

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
          {/* Upcoming Events (7 days) */}
          <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
            <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">📿</span>
              Binnenkort (7 dagen)
            </h2>

            {upcomingEvents.length === 0 ? (
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
                {upcomingEvents.map((occ) => {
                  const category = occ.event.categories[0]?.category ?? null;
                  const eventDate = new Date(occ.date);
                  const crossesYear = eventDate.getFullYear() !== now.getFullYear();
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
                          {eventDate.toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            ...(crossesYear ? { year: "numeric" } : {}),
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
              Godheden
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex cursor-default items-center gap-2 rounded-r-lg border-l-[3px] px-2.5 py-1.5"
                  style={{
                    borderLeftColor: cat.color,
                    background: `color-mix(in oklch, ${cat.color} 10%, transparent)`,
                  }}
                  title={cat.displayName}
                >
                  <span className="text-sm leading-none">{cat.icon}</span>
                  <span className="text-theme-fg-secondary truncate text-xs font-medium">
                    {cat.displayName}
                  </span>
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
