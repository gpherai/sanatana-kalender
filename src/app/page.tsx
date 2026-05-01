import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { DharmaCalendar } from "@/components/calendar/DharmaCalendar";
import { TodayHero } from "@/components/ui/TodayHero";
import { PageLayout } from "@/components/layout";
import { DateTime } from "luxon";
import { DEFAULT_LOCATION, EVENT_TYPES } from "@/lib/domain";
import { getHomePageData } from "@/services/home.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { todayYear, upcomingEvents, categories, weatherDash, dailyInfo, todayEvents } =
    await getHomePageData();

  return (
    <PageLayout spacing>
      {/* Hero: Today's Info */}
      <TodayHero
        dailyInfo={dailyInfo}
        todayEvents={todayEvents}
        currentWeather={weatherDash?.current ?? null}
      />

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
              <span className="text-xl" aria-hidden="true">
                📿
              </span>
              Binnenkort (7 dagen)
            </h2>

            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl" aria-hidden="true">
                  🙏
                </div>
                <p className="text-theme-fg-muted text-sm">Geen aankomende events</p>
                <Link
                  href="/events/new"
                  className="text-theme-primary focus-visible:ring-theme-primary mt-2 inline-flex items-center gap-1 rounded text-sm hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
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
                  const eventYear = DateTime.fromJSDate(eventDate, {
                    zone: DEFAULT_LOCATION.timezone,
                  }).year;
                  const crossesYear = eventYear !== todayYear;
                  const typeLabel =
                    occ.event.eventType && occ.event.eventType !== "OTHER"
                      ? (EVENT_TYPES.find((type) => type.value === occ.event.eventType)
                          ?.label ?? null)
                      : null;
                  return (
                    <Link
                      key={occ.id}
                      href={`/events/${occ.event.id}`}
                      className="group hover:bg-theme-surface-hover focus-visible:ring-theme-primary flex items-center gap-3 rounded-xl p-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:opacity-75"
                      style={{ touchAction: "manipulation" }}
                    >
                      <div className="text-xl" aria-hidden="true">
                        {category?.icon || "📅"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="group-hover:text-theme-primary text-theme-fg truncate text-sm font-medium transition-colors">
                          {occ.event.name}
                        </div>
                        <div className="text-theme-fg-muted flex items-center gap-1.5 text-xs">
                          <span>
                            {eventDate.toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                              timeZone: DEFAULT_LOCATION.timezone,
                              ...(crossesYear ? { year: "numeric" } : {}),
                            })}
                          </span>
                          {typeLabel && (
                            <>
                              <span className="text-theme-border">·</span>
                              <span className="text-theme-fg-muted">{typeLabel}</span>
                            </>
                          )}
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
              <span className="text-xl" aria-hidden="true">
                🏷️
              </span>
              Godheden
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/events?categories=${encodeURIComponent(cat.name)}`}
                  className="focus-visible:ring-theme-primary flex cursor-pointer items-center gap-2 rounded-r-lg border-l-[3px] px-2.5 py-1.5 transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:opacity-60"
                  style={{
                    borderLeftColor: cat.color,
                    background: `color-mix(in oklch, ${cat.color} 10%, transparent)`,
                  }}
                  title={`Filter op ${cat.displayName}`}
                >
                  <span className="text-sm leading-none">{cat.icon}</span>
                  <span className="text-theme-fg-secondary truncate text-xs font-medium">
                    {cat.displayName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-theme-border border-t py-6 text-center">
        <p className="text-theme-fg-muted text-sm">
          <span aria-hidden="true">🕉️</span> Dharma Calendar • Built with Next.js 16,
          Prisma 7, PostgreSQL
        </p>
      </footer>
    </PageLayout>
  );
}
