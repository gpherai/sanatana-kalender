import { Suspense } from "react";
import { DateTime } from "luxon";
import { DharmaCalendar } from "@/components/calendar/DharmaCalendar";
import { PageLayout } from "@/components/layout";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logError } from "@/lib/utils";
import { findAllCategories } from "@/repositories/category.repository";
import { findUpcomingOccurrences } from "@/repositories/event.repository";
import { panchangaService } from "@/services/panchanga.service";
import { getWeatherDashboard } from "@/services/weather.service";
import { UPCOMING_DAYS_AFTER_TODAY } from "@/services/home.service";
import { TodayHeroSection } from "@/components/home/TodayHeroSection";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import {
  TodayHeroSkeleton,
  UpcomingEventsSkeleton,
  CategoriesSkeleton,
} from "@/components/home/HomeSkeletons";

export const dynamic = "force-dynamic";

export default function Home() {
  const now = DateTime.now().setZone(DEFAULT_LOCATION.timezone);
  const today = now.startOf("day");

  const eventsPromise = findUpcomingOccurrences(UPCOMING_DAYS_AFTER_TODAY, now);
  const categoriesPromise = findAllCategories();
  const weatherPromise = Promise.race([
    getWeatherDashboard().catch((error) => {
      logError("[Home] Failed to fetch weather dashboard", error);
      return null;
    }),
    // Prevent slow weather API from blocking TodayHero beyond panchanga (~500ms + buffer)
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
  const panchangaPromise = panchangaService.calculateDaily(
    now.toJSDate(),
    DEFAULT_LOCATION,
    DEFAULT_LOCATION.timezone
  );

  return (
    <PageLayout spacing>
      <Suspense fallback={<TodayHeroSkeleton />}>
        <TodayHeroSection
          panchangaPromise={panchangaPromise}
          eventsPromise={eventsPromise}
          weatherPromise={weatherPromise}
          today={today}
        />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="bg-theme-surface-raised rounded-2xl p-4 shadow-lg md:p-6 xl:col-span-3">
          <DharmaCalendar />
        </div>

        <div className="space-y-6 xl:col-span-1">
          <Suspense fallback={<UpcomingEventsSkeleton />}>
            <UpcomingEventsSection eventsPromise={eventsPromise} todayYear={today.year} />
          </Suspense>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection categoriesPromise={categoriesPromise} />
          </Suspense>
        </div>
      </div>

      <footer className="border-theme-border border-t py-6 text-center">
        <p className="text-theme-fg-muted text-sm">
          <span aria-hidden="true">🕉️</span> Dharma Calendar • Built with Next.js, Prisma,
          PostgreSQL
        </p>
      </footer>
    </PageLayout>
  );
}
