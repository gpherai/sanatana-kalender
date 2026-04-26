import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { SadhanaTracker } from "@/components/sadhana/SadhanaTracker";
import { getSadhanaDashboardInit } from "@/services/sadhana-dashboard.service";

export const metadata: Metadata = { title: "Sadhana" };

export const dynamic = "force-dynamic";

export default async function SadhanaPage() {
  const initData = await getSadhanaDashboardInit();

  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Sadhana laden..." />}>
      <PageLayout>
        <SadhanaTracker initialData={initData} />
      </PageLayout>
    </Suspense>
  );
}
