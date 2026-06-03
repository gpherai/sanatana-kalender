import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

const encyclopediaDirectory = path.join(process.cwd(), "src/content/encyclopedia");

export const ENCYCLOPEDIA_CATEGORIES = [
  "Algemeen",
  "Astronomie",
  "Devatās",
  "Speciale dagen",
  "Tijd",
  "Navagraha",
] as const;

export type EncyclopediaCategory = (typeof ENCYCLOPEDIA_CATEGORIES)[number];

export interface EncyclopediaTerm {
  slug: string;
  title: string;
  sanskrit: string;
  devanagari?: string;
  category: EncyclopediaCategory;
  shortDescription: string;
  parents?: string[];
  isGroup?: boolean;
  priority?: number;
  content: string;
}

/**
 * Frontmatter schema. Validated at build time (SSG) so a typo in `category` or a
 * missing `title` fails the build loudly instead of silently rendering a fallback
 * category / `undefined` title. Defaults mirror the previous manual defaulting.
 */
const frontmatterSchema = z.object({
  title: z.string().min(1),
  sanskrit: z.string().optional().default(""),
  devanagari: z.string().optional(),
  category: z.enum(ENCYCLOPEDIA_CATEGORIES),
  shortDescription: z.string().optional().default(""),
  parents: z.array(z.string()).optional(),
  isGroup: z.boolean().optional().default(false),
  priority: z.number().optional().default(99),
});

function buildTerm(
  rawData: unknown,
  content: string,
  slug: string,
  fileName: string
): EncyclopediaTerm {
  const parsed = frontmatterSchema.safeParse(rawData);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid frontmatter in ${fileName}: ${issues}`);
  }
  return { slug, content, ...parsed.data };
}

export function getAllTerms(): EncyclopediaTerm[] {
  if (!fs.existsSync(encyclopediaDirectory)) {
    return [];
  }

  return fs
    .readdirSync(encyclopediaDirectory)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(encyclopediaDirectory, fileName);
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      return buildTerm(data, content, slug, fileName);
    });
}

export function getTermBySlug(slug: string): EncyclopediaTerm | null {
  try {
    const fullPath = path.join(encyclopediaDirectory, `${slug}.mdx`);
    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    return buildTerm(data, content, slug, `${slug}.mdx`);
  } catch (_error) {
    return null;
  }
}
