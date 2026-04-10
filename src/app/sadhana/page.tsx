import type { Metadata } from "next";
import { PageLayout } from "@/components/layout";
import { SadhanaTracker } from "@/components/sadhana/SadhanaTracker";

export const metadata: Metadata = { title: "Sadhana" };

export default function SadhanaPage() {
  return (
    <PageLayout>
      <SadhanaTracker />
    </PageLayout>
  );
}
