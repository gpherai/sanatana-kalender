import { MoonStar, Clock, Sparkles, Users, Sun, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryChipConfig {
  icon: LucideIcon;
  chipClass: string;
}

export const ENCYCLOPEDIA_CATEGORY_CONFIG: Record<string, CategoryChipConfig> = {
  Astronomie: { icon: MoonStar, chipClass: "encyl-chip-astronomie" },
  Tijd: { icon: Clock, chipClass: "encyl-chip-tijd" },
  "Speciale dagen": { icon: Sparkles, chipClass: "encyl-chip-speciale" },
  Devatās: { icon: Users, chipClass: "encyl-chip-devatas" },
  Navagraha: { icon: Sun, chipClass: "encyl-chip-navagraha" },
  Algemeen: { icon: Info, chipClass: "encyl-chip-algemeen" },
};

export const ENCYCLOPEDIA_CATEGORY_FALLBACK: CategoryChipConfig = {
  icon: Info,
  chipClass: "encyl-chip-algemeen",
};
