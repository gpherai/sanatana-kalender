import "server-only";

export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[*_`~[\](){}]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const level = match[1]!.length as 2 | 3;
    const rawText = match[2]!.trim();
    const text = rawText
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1");
    headings.push({ level, text, id: slugify(text) });
  }
  return headings;
}
