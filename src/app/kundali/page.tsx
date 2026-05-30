import type { Metadata } from "next";
import { KundaliContent } from "@/components/kundali/KundaliContent";

export const metadata: Metadata = { title: "Kundali" };

export default function KundaliPage() {
  return <KundaliContent />;
}
