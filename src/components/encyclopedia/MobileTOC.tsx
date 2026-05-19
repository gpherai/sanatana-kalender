"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/mdx-headings";

export function MobileTOC({ headings }: { headings: Heading[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (headings.length < 2) return null;

  return (
    <div className="border-theme-border bg-theme-surface-raised mb-6 overflow-hidden rounded-2xl border xl:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="focus-visible:ring-theme-primary flex w-full cursor-pointer items-center justify-between px-4 py-3 focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-theme-fg text-sm font-semibold">Inhoudsopgave</span>
        <ChevronDown
          className={cn(
            "text-theme-fg-muted h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-theme-border border-t px-4 pt-2 pb-4">
          <nav aria-label="Inhoudsopgave">
            <ul className="space-y-1">
              {headings.map(({ id, text, level }) => (
                <li key={id} className={level === 3 ? "ml-3" : ""}>
                  <a
                    href={`#${id}`}
                    onClick={() => setIsOpen(false)}
                    className="text-theme-fg-muted hover:text-theme-fg block rounded px-2 py-1 text-sm leading-snug transition-colors"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
