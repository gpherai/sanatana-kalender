"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/mdx-headings";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const offset = 120;
      let current = headings[0]?.id ?? "";
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Inhoudsopgave">
      <p className="text-theme-fg-muted mb-3 text-xs font-semibold tracking-widest uppercase">
        In dit artikel
      </p>
      <ul className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? "ml-3" : ""}>
            <a
              href={`#${id}`}
              className={`block rounded px-2 py-1 text-sm leading-snug transition-colors ${
                activeId === id
                  ? "text-theme-primary font-medium"
                  : "text-theme-fg-muted hover:text-theme-fg"
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
