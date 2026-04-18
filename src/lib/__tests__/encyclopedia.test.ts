import { describe, it, expect, vi, beforeEach } from "vitest";
import * as encyclopedia from "../encyclopedia";
import fs from "fs";

describe("encyclopedia helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue("/mock/path");
  });

  describe("getAllTerms", () => {
    it("returns empty array if directory does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      expect(encyclopedia.getAllTerms()).toEqual([]);
    });

    it("returns terms from mdx files", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(fs, "readdirSync").mockReturnValue(["test.mdx", "invalid.txt"] as any);
      vi.spyOn(fs, "readFileSync").mockReturnValue(`---
title: Test Title
sanskrit: Test Sanskrit
category: Astronomie
shortDescription: Short desc
priority: 1
---
Content here`);

      const terms = encyclopedia.getAllTerms();
      expect(terms).toHaveLength(1);
      expect(terms[0]).toMatchObject({
        slug: "test",
        title: "Test Title",
        sanskrit: "Test Sanskrit",
        category: "Astronomie",
        content: "Content here",
      });
    });

    it("uses default values for optional fields", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(fs, "readdirSync").mockReturnValue(["minimal.mdx"] as any);
      vi.spyOn(fs, "readFileSync").mockReturnValue(`---
title: Minimal
category: Tijd
---
Minimal content`);

      const terms = encyclopedia.getAllTerms();
      expect(terms[0]).toMatchObject({
        slug: "minimal",
        sanskrit: "",
        shortDescription: "",
        isGroup: false,
        priority: 99,
      });
    });
  });

  describe("getTermBySlug", () => {
    it("returns term for a valid slug", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValue(`---
title: Found
category: Algemeen
---
Found it`);

      const term = encyclopedia.getTermBySlug("valid-slug");
      expect(term).not.toBeNull();
      expect(term?.title).toBe("Found");
    });

    it("returns null on error", () => {
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("File not found");
      });

      const term = encyclopedia.getTermBySlug("invalid-slug");
      expect(term).toBeNull();
    });
  });
});
