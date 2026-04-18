import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@/components/layout";
import { SadhanaTracker } from "@/components/sadhana/SadhanaTracker";

export const metadata: Metadata = { title: "Sadhana" };

export default function SadhanaPage() {
  return (
    <Suspense fallback={<PageLayout loading loadingMessage="Sadhana laden..." />}>
      <PageLayout>
        <SadhanaTracker />
      </PageLayout>
    </Suspense>
  );
}
