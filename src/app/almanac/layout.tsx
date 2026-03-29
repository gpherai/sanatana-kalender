import type { Metadata } from "next";

export const metadata: Metadata = { title: "Almanak" };

export default function AlmanacLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
