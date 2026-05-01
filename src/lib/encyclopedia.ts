import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const encyclopediaDirectory = path.join(process.cwd(), "src/content/encyclopedia");

export interface EncyclopediaTerm {
  slug: string;
  title: string;
  sanskrit: string;
  devanagari?: string;
  category:
    | "Algemeen"
    | "Astronomie"
    | "Devatās"
    | "Speciale dagen"
    | "Tijd"
    | "Navagraha";
  shortDescription: string;
  parents?: string[];
  isGroup?: boolean;
  priority?: number;
  content: string;
}

export function getAllTerms(): EncyclopediaTerm[] {
  if (!fs.existsSync(encyclopediaDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(encyclopediaDirectory);

  const allTerms = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(encyclopediaDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        sanskrit: data.sanskrit || "",
        devanagari: data.devanagari || undefined,
        category: data.category,
        shortDescription: data.shortDescription || "",
        parents: data.parents,
        isGroup: data.isGroup || false,
        priority: data.priority !== undefined ? data.priority : 99,
        content,
      } as EncyclopediaTerm;
    });

  return allTerms;
}

export function getTermBySlug(slug: string): EncyclopediaTerm | null {
  try {
    const fullPath = path.join(encyclopediaDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title,
      sanskrit: data.sanskrit || "",
      devanagari: data.devanagari || undefined,
      category: data.category,
      shortDescription: data.shortDescription || "",
      parents: data.parents,
      isGroup: data.isGroup || false,
      priority: data.priority !== undefined ? data.priority : 99,
      content,
    } as EncyclopediaTerm;
  } catch (_error) {
    return null;
  }
}
