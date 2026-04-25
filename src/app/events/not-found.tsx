import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout";

export default function EventNotFound() {
  return (
    <PageLayout width="narrow">
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-theme-fg text-2xl font-bold">Event niet gevonden</p>
        <p className="text-theme-fg-muted text-sm">
          Dit event bestaat niet of is verwijderd.
        </p>
        <Link
          href="/events"
          className="text-theme-primary mt-2 inline-flex items-center gap-2 text-sm hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar Events
        </Link>
      </div>
    </PageLayout>
  );
}
