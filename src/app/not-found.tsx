import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout";

export default function NotFound() {
  return (
    <PageLayout width="narrow">
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-theme-fg text-2xl font-bold">Pagina niet gevonden</p>
        <p className="text-theme-fg-muted text-sm">
          Deze pagina bestaat niet of is verplaatst.
        </p>
        <Link
          href="/"
          className="text-theme-primary focus-visible:ring-theme-primary mt-2 inline-flex items-center gap-2 rounded text-sm hover:underline focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </Link>
      </div>
    </PageLayout>
  );
}
