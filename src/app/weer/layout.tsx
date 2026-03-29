import type { Metadata } from "next";

export const metadata: Metadata = { title: "Weer" };

export default function WeerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
