/**
 * Special-theme token coverage guard.
 *
 * Enforces that every theme in the `special` category fully drives the design
 * system in BOTH light and dark mode, using `shri-ganesha` as the golden
 * template (see src/styles/themes/TOKEN-CONTRACT.md).
 *
 * - Rule 1 (light): theme light block defines every token Ganesha's light block does.
 * - Rule 2 (dark):  theme dark block defines every token Ganesha's dark block does.
 *
 * The required sets are derived from shri-ganesha.css at test time, so they
 * self-track: improving the golden template raises the bar for all themes.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEME_CATALOG } from "../themes";

const url = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const SPECIAL_DIR = url("../../styles/themes/special/");
const GLOBALS_CSS = url("../../app/globals.css");
const GOLDEN = "shri-ganesha";

/** Names of `--theme-*` tokens DECLARED (followed by `:`) in a CSS fragment. */
function declaredTokens(fragment: string): Set<string> {
  return new Set(fragment.match(/--theme-[a-z0-9-]+(?=\s*:)/g) ?? []);
}

/** Read a theme file and return the token sets declared in its light & dark blocks. */
function themeBlocks(name: string): { light: Set<string>; dark: Set<string> } {
  const css = readFileSync(`${SPECIAL_DIR}${name}.css`, "utf8");
  const darkSel = `.dark[data-theme="${name}"]`;
  const di = css.indexOf(darkSel);

  // Light block: first `[data-theme="name"] {` ... first line-leading `}` before the dark selector.
  const lightPart = di >= 0 ? css.slice(0, di) : css;
  const lsel = `[data-theme="${name}"]`;
  const lOpen = lightPart.indexOf("{", lightPart.indexOf(lsel));
  const lClose = lightPart.indexOf("\n}", lOpen);
  const light = declaredTokens(lightPart.slice(lOpen, lClose));

  // Dark block: from the dark selector to its first line-leading `}`.
  let dark = new Set<string>();
  if (di >= 0) {
    const dOpen = css.indexOf("{", di);
    const dClose = css.indexOf("\n}", dOpen);
    dark = declaredTokens(css.slice(dOpen, dClose));
  }
  return { light, dark };
}

const specials = THEME_CATALOG.filter((t) => t.category === "special");
const golden = themeBlocks(GOLDEN);
const LIGHT_REQ = [...golden.light].sort();
const DARK_REQ = [...golden.dark].sort();

const missing = (required: string[], have: Set<string>) =>
  required.filter((t) => !have.has(t)).map((t) => t.replace("--theme-", ""));

describe("Special theme token coverage", () => {
  it("derives a sane contract from the golden template", () => {
    // Floor guards against the reference being accidentally gutted (which would
    // silently shrink the required set and let incomplete themes pass).
    expect(LIGHT_REQ.length).toBeGreaterThanOrEqual(150);
    expect(DARK_REQ.length).toBeGreaterThanOrEqual(130);
    expect(LIGHT_REQ).toEqual(expect.arrayContaining(DARK_REQ));
  });

  it("registers at least the three original special themes", () => {
    const names = specials.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["shri-ganesha", "bhairava-nocturne", "narasimha-jwala"])
    );
  });

  it.each(specials.map((t) => t.name))(
    "%s — light block covers the full contract (Rule 1)",
    (name) => {
      const { light } = themeBlocks(name);
      const gaps = missing(LIGHT_REQ, light);
      expect(gaps, `light block missing tokens: ${gaps.join(", ")}`).toEqual([]);
    }
  );

  it.each(specials.map((t) => t.name))(
    "%s — dark block redefines all mode-varying tokens (Rule 2, no leak)",
    (name) => {
      const { dark } = themeBlocks(name);
      const gaps = missing(DARK_REQ, dark);
      expect(gaps, `dark block missing tokens: ${gaps.join(", ")}`).toEqual([]);
    }
  );

  it("keeps catalog, css files, and globals imports in sync", () => {
    const fileNames = new Set(
      readdirSync(SPECIAL_DIR)
        .filter((f) => f.endsWith(".css"))
        .map((f) => f.replace(/\.css$/, ""))
    );
    const catalogNames = new Set(specials.map((t) => t.name));
    const globals = readFileSync(GLOBALS_CSS, "utf8");

    // Every cataloged special has a css file + a globals @import.
    for (const name of catalogNames) {
      expect(fileNames, `missing css file for cataloged theme "${name}"`).toContain(name);
      expect(
        globals.includes(`special/${name}.css`),
        `missing globals.css @import for "${name}"`
      ).toBe(true);
    }
    // No orphan css file without a catalog entry.
    for (const file of fileNames) {
      expect(catalogNames, `css file "${file}.css" has no catalog entry`).toContain(file);
    }
  });
});
