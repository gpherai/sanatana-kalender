import Link from "next/link";
import type { findAllCategories } from "@/repositories/category.repository";

type Category = Awaited<ReturnType<typeof findAllCategories>>[number];

interface Props {
  categoriesPromise: Promise<Category[]>;
}

export async function CategoriesSection({ categoriesPromise }: Props) {
  const categories = await categoriesPromise;

  return (
    <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
      <h2 className="text-theme-fg mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="text-xl" aria-hidden="true">
          🏷️
        </span>
        Godheden
      </h2>
      <div className="grid grid-cols-2 gap-1.5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/events?categories=${encodeURIComponent(cat.name)}`}
            className="focus-visible:ring-theme-primary flex cursor-pointer items-center gap-2 rounded-r-lg border-l-[3px] px-2.5 py-1.5 transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none active:opacity-60"
            style={{
              borderLeftColor: cat.color,
              background: `color-mix(in oklch, ${cat.color} 10%, transparent)`,
            }}
            title={`Filter op ${cat.displayName}`}
          >
            <span className="text-sm leading-none">{cat.icon}</span>
            <span className="text-theme-fg-secondary truncate text-xs font-medium">
              {cat.displayName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
