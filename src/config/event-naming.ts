/**
 * Event Naming Catalog
 *
 * Single source of truth for event definitions.
 * Events are auto-generated from these rules.
 *
 * Pattern: categories.ts (category definitions)
 * This file follows the same pattern but for events.
 */

export type RuleType =
  | "TITHI" // Match specific tithi (Ekadashi, Purnima, etc.)
  | "SOLAR" // Match Sankranti (solar transitions)
  | "NAKSHATRA" // Match nakshatra
  | "TITHI_NAKSHATRA" // Both tithi AND nakshatra
  | "WEEKDAY_TITHI" // Specific weekday + tithi
  | "CUSTOM"; // Complex rules

export interface EventNaming {
  key: string;
  name: string;
  category: string;
  eventType:
    | "FESTIVAL"
    | "PUJA"
    | "VRAT"
    | "JAYANTI"
    | "TITHI"
    | "SANKRANTI"
    | "ECLIPSE"
    | "OTHER";
  importance: "MAJOR" | "MODERATE" | "MINOR";
  ruleType: RuleType;
  ruleConfig: Record<string, unknown>;
  description?: string;
  tags?: string[];
  /**
   * How to derive the observation time window for each occurrence.
   * - NISHITA_KAAL: midpoint of the night (Janmashtami, Shivaratri, Kali Puja)
   * - PRADOSH_KAAL: sunset - 1h30 to sunset + 45min (Pradosh Vrat)
   * - SUNRISE: sunrise to sunrise + 2h (Ratha Saptami, Chhath morning)
   * - SUNSET: sunset - 30min to sunset + 1h (evening rituals)
   * Times are calculated per occurrence from DailyInfo sunrise/sunset data.
   */
  timingType?: "NISHITA_KAAL" | "PRADOSH_KAAL" | "SUNRISE" | "SUNSET";
  /**
   * Static observation time (HH:MM, 24h). Only for events with a truly
   * fixed clock time independent of sunrise/sunset. Prefer timingType instead.
   */
  startTime?: string;
  endTime?: string;
  /**
   * Keys of parent events in this catalog that this event belongs to.
   * Supports many-to-many: one event (e.g. a goddess day) can belong to
   * multiple parent series (e.g. Chaitra Navratri and Sharad Navratri).
   */
  parentKeys?: string[];
  /** Position within the parent series (1-based) */
  dayNumber?: number;
}

export const EVENT_NAMING_CATALOG: EventNaming[] = [
  // ==========================================================================
  // EKADASHI EVENTS (24 per year - 2 per lunar month)
  // Rule: TITHI with maas + paksha
  // ==========================================================================
  {
    key: "pausha_putrada_ekadashi",
    name: "Putrada Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "PAUSHA",
    },
    description:
      "Ekadashi in de Pausha Shukla paksha. Wordt verondersteld nageslacht (zonen) en algemene voorspoed te schenken.",
    tags: ["ekadashi", "vasten", "voorspoed", "zonen"],
  },
  {
    key: "pausha_saphala_ekadashi",
    name: "Saphala Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "PAUSHA",
    },
    description:
      'Betekent "vruchtbaar/succesvol". Het vasten (vrat) brengt succes in alle ondernemingen.',
    tags: ["ekadashi", "succes", "vasten"],
  },
  {
    key: "magha_sattila_ekadashi",
    name: "Sat-tila Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "MAGHA",
    },
    description: "Het offeren van sesam (til) in zeven vormen zuivert papa (zonden).",
    tags: ["ekadashi", "sesam", "til", "vasten"],
  },
  {
    key: "magha_jaya_ekadashi",
    name: "Jaya Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "MAGHA",
    },
    description:
      "Het vasten (vrat) bevrijdt van onwetendheid en brengt spirituele overwinning (jaya).",
    tags: ["ekadashi", "overwinning", "vasten"],
  },
  {
    key: "phalguna_vijaya_ekadashi",
    name: "Vijaya Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "PHALGUNA",
    },
    description:
      "Heer Rama hield een vrat op deze dag voordat Hij naar Lanka vertrok om Sita te redden.",
    tags: ["ekadashi", "overwinning", "rama", "vasten"],
  },
  {
    key: "phalguna_amalaki_ekadashi",
    name: "Amalaki Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "PHALGUNA",
    },
    description: "Gewijd aan de amalaki (amla) boom, heilig voor Heer Vishnu.",
    tags: ["amla", "ekadashi", "vasten", "vishnu"],
  },
  {
    key: "chaitra_papmochani_ekadashi",
    name: "Papmochani Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "CHAITRA",
    },
    description:
      'Betekent "verwijderaar van zonden". Een krachtige Ekadashi die alle papa (zonden) zuivert.',
    tags: ["ekadashi", "vasten", "zonden", "zuivering"],
  },
  {
    key: "chaitra_kamada_ekadashi",
    name: "Kamada Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "CHAITRA",
    },
    description:
      "Ekadashi die alle wensen (kama) vervult. Een Gandharva werd bevrijd van een vloek door deze vrat.",
    tags: ["ekadashi", "vasten", "verlossing", "wensen"],
  },
  {
    key: "vaishakha_varuthini_ekadashi",
    name: "Varuthini Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "VAISHAKHA",
    },
    description:
      "Vernietigt de grootste papa (zonden) en biedt bescherming tegen moeilijkheden.",
    tags: ["bescherming", "ekadashi", "vasten"],
  },
  {
    key: "vaishakha_mohini_ekadashi",
    name: "Mohini Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "VAISHAKHA",
    },
    description:
      "Vernoemd naar de Mohini avatar van Vishnu. Zeer gunstig voor het bereiken van moksha (bevrijding).",
    tags: ["ekadashi", "mohini", "moksha", "vasten"],
  },
  {
    key: "jyeshtha_apara_ekadashi",
    name: "Apara Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "JYESHTHA",
    },
    description:
      "Vernietigt papa (zonden) en schenkt moksha (bevrijding). Een zeer krachtige Ekadashi.",
    tags: ["ekadashi", "vasten", "zuivering"],
  },
  {
    key: "jyeshtha_nirjala_ekadashi",
    name: "Nirjala Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "JYESHTHA",
    },
    description:
      "De meest sobere Ekadashi - vasten (vrat) zonder zelfs water te drinken. Ook bekend als Bhima's Ekadashi.",
    tags: ["bhima", "ekadashi", "nirjala", "vasten"],
  },
  {
    key: "ashadha_yogini_ekadashi",
    name: "Yogini Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "ASHADHA",
    },
    description:
      "Zuivert papa (zonden) van vele levens en schenkt spirituele vooruitgang.",
    tags: ["ekadashi", "vasten", "yoga", "zuivering"],
  },
  {
    key: "ashadha_devshayani_ekadashi",
    name: "Devshayani Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "ASHADHA",
    },
    description:
      "Begin van Chaturmas - de vier heilige maanden waarin Heer Vishnu in yoga-nidra verblijft.",
    tags: ["chaturmas", "ekadashi", "vasten", "vishnu"],
  },
  {
    key: "shravana_kamika_ekadashi",
    name: "Kamika Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "SHRAVANA",
    },
    description: "Eén van de belangrijkste Ekadashis. Schenkt moksha (bevrijding).",
    tags: ["ekadashi", "moksha", "vasten"],
  },
  {
    key: "shravana_putrada_ekadashi",
    name: "Putrada Ekadashi (Shravana)",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "SHRAVANA",
    },
    description: "Schenkt nageslacht en heft kinderloosheid op.",
    tags: ["ekadashi", "kinderen", "vasten"],
  },
  {
    key: "bhadrapada_aja_ekadashi",
    name: "Aja Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "BHADRAPADA",
    },
    description: "Vernietigt alle papa (zonden) en schenkt spirituele verheffing.",
    tags: ["ekadashi", "vasten", "zuivering"],
  },
  {
    key: "bhadrapada_parsva_ekadashi",
    name: "Parsva Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "BHADRAPADA",
    },
    description:
      "Heer Vishnu draait Zich om op Zijn zij tijdens Zijn goddelijke slaap. Het midden van Chaturmas.",
    tags: ["chaturmas", "ekadashi", "vasten"],
  },
  {
    key: "ashwin_indira_ekadashi",
    name: "Indira Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "ASHWIN",
    },
    description: "Bevrijdt voorouders (pitru's) van lijden en schenkt hen vrede.",
    tags: ["ekadashi", "vasten", "voorouders"],
  },
  {
    key: "ashwin_papankusha_ekadashi",
    name: "Papankusha Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "ASHWIN",
    },
    description: "Vernietigt hopen papa (zonden) als een scherpe haak.",
    tags: ["ekadashi", "vasten", "zuivering"],
  },
  {
    key: "kartik_rama_ekadashi",
    name: "Rama Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "KARTIK",
    },
    description: "Schenkt moksha (bevrijding) en vernietigt alle papa (zonden).",
    tags: ["ekadashi", "rama", "vasten"],
  },
  {
    key: "kartik_prabodhini_ekadashi",
    name: "Prabodhini Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "KARTIK",
    },
    description:
      "Einde van Chaturmas - Heer Vishnu ontwaakt. Ook bekend als Dev Uthani Ekadashi.",
    tags: ["chaturmas", "dev uthani", "ekadashi", "vasten"],
  },
  {
    key: "margashirsha_utpanna_ekadashi",
    name: "Utpanna Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "MARGASHIRSHA",
    },
    description: "Viert de verschijning van Ekadashi Devi. Een zeer krachtige vrat.",
    tags: ["devi", "ekadashi", "vasten"],
  },
  {
    key: "margashirsha_mokshada_ekadashi",
    name: "Mokshada Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "MARGASHIRSHA",
    },
    description:
      "Schenkt moksha (bevrijding). In Zuid-India ook wel Vaikuntha Ekadashi genoemd.",
    tags: ["ekadashi", "moksha", "vaikuntha", "vasten"],
  },

  // ==========================================================================
  // SANKRANTI EVENTS (12 per year - solar transitions)
  // Rule: SOLAR with sankranti name
  // ==========================================================================
  {
    key: "makara_sankranti",
    name: "Makara Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MAJOR",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "MAKARA_SANKRANTI",
    },
    description:
      "De Zon treedt het teken Makara (Steenbok) binnen. Oogstfeest en het begin van Uttarayana (de noordwaartse reis van de Zon).",
    tags: ["oogst", "sankranti", "uttarayana", "zon"],
  },
  {
    key: "kumbha_sankranti",
    name: "Kumbha Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "KUMBHA_SANKRANTI",
    },
    description: "De Zon treedt het teken Kumbha (Waterman) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "meena_sankranti",
    name: "Meena Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "MEENA_SANKRANTI",
    },
    description:
      "De Zon treedt het teken Meena (Vissen) binnen. Een gunstig moment voor spirituele reiniging.",
    tags: ["sankranti", "zon"],
  },
  {
    key: "mesha_sankranti",
    name: "Mesha Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MAJOR",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "MESHA_SANKRANTI",
    },
    description:
      "De Zon treedt het teken Mesha (Ram) binnen. Hindoestaanse zonne-nieuwjaar. In Kerala ook Vishu genoemd.",
    tags: ["nieuwjaar", "sankranti", "vishu", "zon"],
  },
  {
    key: "vrishabha_sankranti",
    name: "Vrishabha Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "VRISHABHA_SANKRANTI",
    },
    description: "De Zon treedt het teken Vrishabha (Stier) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "mithuna_sankranti",
    name: "Mithuna Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "MITHUNA_SANKRANTI",
    },
    description: "De Zon treedt het teken Mithuna (Tweelingen) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "karka_sankranti",
    name: "Karka Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MAJOR",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "KARKA_SANKRANTI",
    },
    description:
      "De Zon treedt het teken Karka (Kreeft) binnen. Begin van Dakshinayana (de zuidwaartse reis van de Zon).",
    tags: ["dakshinayana", "sankranti", "zon"],
  },
  {
    key: "simha_sankranti",
    name: "Simha Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "SIMHA_SANKRANTI",
    },
    description: "De Zon treedt het teken Simha (Leeuw) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "kanya_sankranti",
    name: "Kanya Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "KANYA_SANKRANTI",
    },
    description: "De Zon treedt het teken Kanya (Maagd) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "tula_sankranti",
    name: "Tula Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "TULA_SANKRANTI",
    },
    description: "De Zon treedt het teken Tula (Weegschaal) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "vrishchika_sankranti",
    name: "Vrishchika Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "VRISHCHIKA_SANKRANTI",
    },
    description: "De Zon treedt het teken Vrishchika (Schorpioen) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },
  {
    key: "dhanu_sankranti",
    name: "Dhanu Sankranti",
    category: "surya",
    eventType: "SANKRANTI",
    importance: "MODERATE",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "DHANU_SANKRANTI",
    },
    description: "De Zon treedt het teken Dhanu (Boogschutter) binnen (Sankranti).",
    tags: ["sankranti", "zon"],
  },

  // ==========================================================================
  // PURNIMA EVENTS (12 per year)
  // Rule: TITHI with specific maas
  // ==========================================================================
  {
    key: "ashadha_guru_purnima",
    name: "Guru Purnima",
    category: "general",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "ASHADHA",
    },
    description:
      "Eerbetoon aan spirituele en academische leraren (guru's). De dag van Vyasa Purnima.",
    tags: ["guru", "leraar", "purnima", "vyasa"],
  },
  {
    key: "kartik_kartik_purnima",
    name: "Kartik Purnima",
    category: "general",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "KARTIK",
    },
    description:
      "De meest gunstige Purnima (volle maan). Karthigai Deepam in Zuid-India.",
    tags: ["deepam", "kartik", "licht", "purnima", "tripuri"],
  },
  {
    key: "pausha_pausha_purnima",
    name: "Pausha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "PAUSHA",
    },
    description:
      "Volle maan (Purnima) van de maand Pausha. Gunstig voor dana (liefdadigheid) en rituele baden.",
    tags: ["liefdadigheid", "purnima"],
  },
  {
    key: "magha_magha_purnima",
    name: "Magha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "MAGHA",
    },
    description:
      "Volle maan (Purnima) van de maand Magha. Belangrijk voor het eren van voorouders (pitru's).",
    tags: ["purnima", "voorouders"],
  },
  {
    key: "phalguna_holi_purnima",
    name: "Holi Purnima",
    category: "general",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "PHALGUNA",
    },
    description:
      "Volle maan (Purnima) voor Holi. Holika Dahan vindt plaats op deze nacht.",
    tags: ["holi", "holika dahan", "purnima"],
  },

  // === ADDITIONAL PURNIMAS ===
  {
    key: "chaitra_chaitra_purnima",
    name: "Chaitra Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "CHAITRA",
    },
    description:
      "Volle maan (Purnima) van de maand Chaitra. In sommige regio's ook Hanuman Jayanti.",
    tags: ["purnima"],
  },
  {
    key: "vaishakha_vaishakha_purnima",
    name: "Vaishakha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "VAISHAKHA",
    },
    description: "Buddha Purnima. De verschijning van Heer Boeddha.",
    tags: ["buddha", "purnima"],
  },
  {
    key: "jyeshtha_jyeshtha_purnima",
    name: "Jyeshtha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "JYESHTHA",
    },
    description: "Volle maan (Purnima) van de maand Jyeshtha. Vat Purnima Vrat.",
    tags: ["purnima", "vrat"],
  },
  {
    key: "ashadha_ashadha_purnima",
    name: "Ashadha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "ASHADHA",
    },
    description: "Guru Purnima. Eerbetoon aan spirituele leraren.",
    tags: ["guru", "purnima"],
  },
  {
    key: "shravana_shravana_purnima",
    name: "Shravana Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "SHRAVANA",
    },
    description: "Raksha Bandhan. Zussen binden een rakhi om de pols van hun broers.",
    tags: ["purnima", "raksha bandhan"],
  },
  {
    key: "bhadrapada_bhadrapada_purnima",
    name: "Bhadrapada Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "BHADRAPADA",
    },
    description: "Volle maan (Purnima) van de maand Bhadrapada.",
    tags: ["purnima"],
  },
  {
    key: "ashwina_sharad_purnima",
    name: "Sharad Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "ASHWIN",
    },
    description: "Herfstvolle maan (Purnima). Het mooiste maanlicht van het jaar.",
    tags: ["purnima", "sharad"],
  },
  {
    key: "margashirsha_margashirsha_purnima",
    name: "Margashirsha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "MARGASHIRSHA",
    },
    description: "Volle maan (Purnima) van de maand Margashirsha. Dattatreya Jayanti.",
    tags: ["dattatreya", "jayanti", "margashirsha", "purnima"],
  },

  // === EKADASHI (ADDITIONAL) ===
  {
    key: "shravana_gauna_kamika_ekadashi",
    name: "Gauna Kamika Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "SHRAVANA",
    },
    description: "Tweede Kamika Ekadashi waargenomen in de Shravana Krishna paksha.",
    tags: ["adhika", "ekadashi", "kamika", "shravana", "vasten"],
  },

  // === KALASHTAMI (maandelijks, Bhairava) ===
  {
    key: "kalashtami_monthly",
    name: "Kalashtami",
    category: "bhairava",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_KRISHNA", monthly: true },
    description:
      "Maandelijkse vastendag voor Kala Bhairava op de 8e dag van de donkere helft. De Krishna Ashtami is Bhairava's heilige dag.",
    tags: ["ashtami", "bhairava", "kalashtami", "maandelijks", "vrat"],
  },

  // === PRADOSH VRAT (maandelijks, 2x per maand) ===
  {
    key: "pradosh_vrat_krishna",
    name: "Pradosh Vrat (Krishna)",
    category: "shiva",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRAYODASHI_KRISHNA", monthly: true },
    description:
      "Pradosh Vrat op de 13e dag van de donkere helft. Tweewekelijks vasten gewijd aan Heer Shiva en Parvati. Een van de meest heilige Shiva-observanties.",
    tags: ["pradosh", "shiva", "trayodashi", "vrat"],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "pradosh_vrat_shukla",
    name: "Pradosh Vrat (Shukla)",
    category: "shiva",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRAYODASHI_SHUKLA", monthly: true },
    description:
      "Pradosh Vrat op de 13e dag van de lichte helft. Tweewekelijks vasten gewijd aan Heer Shiva en Parvati.",
    tags: ["pradosh", "shiva", "trayodashi", "vrat"],
    timingType: "PRADOSH_KAAL",
  },

  // === JAYANTIS (DEITY BIRTHDAYS) ===
  {
    key: "magha_saraswati_jayanti",
    name: "Saraswati Jayanti",
    category: "saraswati",
    eventType: "JAYANTI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PANCHAMI_SHUKLA", maas: "MAGHA" },
    description:
      "Verschijningsdag van Godin Saraswati. Valt op Vasant Panchami. Verering van kennis, muziek en kunsten.",
    tags: ["jayanti", "kennis", "panchami", "saraswati", "vasant"],
  },
  {
    key: "margashirsha_lakshmi_jayanti",
    name: "Lakshmi Jayanti",
    category: "lakshmi",
    eventType: "JAYANTI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MARGASHIRSHA" },
    description:
      "Verschijningsdag van Godin Lakshmi. De Margashirsha Purnima wordt in Noord-Indiase traditie als haar jayanti gevierd.",
    tags: ["jayanti", "lakshmi", "margashirsha", "purnima", "rijkdom"],
  },
  {
    key: "vaishakha_vaikasi_visakam",
    name: "Vaikasi Visakam",
    category: "skanda",
    eventType: "JAYANTI",
    importance: "MAJOR",
    ruleType: "NAKSHATRA",
    ruleConfig: { nakshatra: "VISHAKHA", maas: "VAISHAKHA" },
    description:
      "Verschijningsdag van Murugan (Skanda) in de Tamil traditie. Gevierd op de dag dat de Vishakha-nakshatra valt in de maand Vaishakha.",
    tags: ["jayanti", "murugan", "skanda", "tamil", "visakam"],
  },
  {
    key: "vaishakha_sita_navami",
    name: "Sita Navami",
    category: "rama",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "NAVAMI_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Verschijningsdag van Sita Devi. De heilige dag waarop de godin Sita, echtgenote van Heer Rama, op aarde verscheen.",
    tags: ["devi", "jayanti", "rama", "sita"],
  },
  {
    key: "bhadrapada_radhashtami",
    name: "Radhashtami",
    category: "krishna",
    eventType: "JAYANTI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_SHUKLA", maas: "BHADRAPADA" },
    description:
      "Verschijningsdag van Radha Rani, de geliefde van Heer Krishna. Valt precies 15 dagen na Krishna Janmashtami.",
    tags: ["bhadrapada", "jayanti", "krishna", "radha"],
  },
  {
    key: "chaitra_swaminarayan_jayanti",
    name: "Swaminarayan Jayanti",
    category: "vishnu",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "NAVAMI_SHUKLA",
      maas: "CHAITRA",
    },
    description: "Verschijning van Bhagwan Swaminarayan.",
    tags: ["jayanti", "swaminarayan"],
  },
  {
    key: "vaishakha_parashurama_jayanti",
    name: "Parashurama Jayanti",
    category: "vishnu",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "TRITIYA_SHUKLA",
      maas: "VAISHAKHA",
    },
    description: "Verschijning van Heer Parashurama, de 6e avatar van Vishnu.",
    tags: ["avatar", "jayanti", "parashurama"],
  },
  {
    key: "jyeshtha_narada_jayanti",
    name: "Narada Jayanti",
    category: "general",
    eventType: "JAYANTI",
    importance: "MINOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PRATIPADA_KRISHNA",
      maas: "JYESHTHA",
    },
    description: "Verschijning van de wijze (Rishi) Narada.",
    tags: ["jayanti", "narada", "rishi"],
  },
  {
    key: "shravana_gayatri_jayanti",
    name: "Gayatri Jayanti",
    category: "general",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "SHRAVANA",
    },
    description: "Verschijningsdag van de heilige Gayatri Mantra.",
    tags: ["gayatri", "jayanti", "mantra"],
  },
  {
    key: "bhadrapada_balarama_jayanti",
    name: "Balarama Jayanti",
    category: "vishnu",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "SHASHTHI_SHUKLA",
      maas: "BHADRAPADA",
    },
    description: "Verschijning van Heer Balarama, de oudere broer van Heer Krishna.",
    tags: ["balarama", "jayanti"],
  },

  // === FESTIVALS ===
  {
    key: "magha_ratha_saptami",
    name: "Ratha Saptami (Surya Jayanti)",
    category: "surya",
    eventType: "JAYANTI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "SAPTAMI_SHUKLA", maas: "MAGHA" },
    description:
      "De formele geboortedag van Surya Dev (Zonnegod). De zon bereikt zijn hoogste kracht en rijdt zijn zevenspan-wagen (ratha). Valt in Magha Shukla Saptami.",
    tags: ["jayanti", "magha", "ratha", "surya", "zon"],
    timingType: "SUNRISE",
  },
  {
    key: "shravana_sawan_shivaratri",
    name: "Sawan Shivaratri",
    category: "shiva",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_KRISHNA", maas: "SHRAVANA" },
    description:
      "Shivaratri in de heilige maand Shravana. Bijzonder auspicieus voor Shiva-bhakta's. Wordt gevierd met nachtwaken, abhishekam en bel-bladeren.",
    tags: ["sawan", "shiva", "shivaratri", "shravana", "vrat"],
  },
  {
    key: "ashwin_mahalaya_amavasya",
    name: "Mahalaya Amavasya",
    category: "general",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "ASHWIN" },
    description:
      "De laatste dag van Pitru Paksha (Sarvapitri Amavasya). De meest heilige dag om voorouders te eren via tarpan en shraddha. Inleiding op Sharad Navratri.",
    tags: ["amavasya", "paksha", "pitru", "shraddha", "voorouders"],
  },
  {
    key: "phalguna_holika_dahan",
    name: "Holika Dahan",
    category: "general",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "PHALGUNA",
    },
    description:
      "De nacht van het heilige vreugdevuur voor Holi. De verbranding van Holika.",
    tags: ["festival", "holi", "vuur"],
  },
  {
    key: "shravana_hariyali_teej",
    name: "Hariyali Teej",
    category: "durga",
    eventType: "FESTIVAL",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "TRITIYA_SHUKLA",
      maas: "SHRAVANA",
    },
    description: "Groene Teej. Geleefd door vrouwen voor huwelijksgeluk.",
    tags: ["festival", "teej", "vrouwen"],
  },
  {
    key: "bhadrapada_hartalika_teej",
    name: "Hartalika Teej",
    category: "durga",
    eventType: "FESTIVAL",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "TRITIYA_SHUKLA",
      maas: "BHADRAPADA",
    },
    description: "Teej gewijd aan de vereniging van Heer Shiva en Godin Parvati.",
    tags: ["festival", "parvati", "shiva", "teej"],
  },
  {
    key: "kartik_chhath_puja",
    name: "Chhath Puja",
    category: "surya",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "SHASHTHI_SHUKLA",
      maas: "KARTIK",
    },
    description: "Eeuwenoud Vedisch festival gewijd aan de Zonnegod (Surya Dev).",
    tags: ["chhath", "festival", "surya", "zon"],
  },
  {
    key: "kartik_govardhan_puja",
    name: "Govardhan Puja",
    category: "krishna",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PRATIPADA_SHUKLA",
      maas: "KARTIK",
    },
    description: "De dag na Diwali. Verering van de heilige Govardhan berg.",
    tags: ["festival", "govardhan", "krishna"],
  },
  {
    key: "kartik_kali_puja",
    name: "Kali Puja",
    category: "kali",
    eventType: "PUJA",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "KARTIK" },
    description:
      "Kali Puja (Shyama Puja) op de nacht van Diwali. In Oost-India (Bengalen) wordt op Kartika Amavasya niet Lakshmi maar Maa Kali vereerd met nacht-puja's, diyas en offers.",
    tags: ["amavasya", "bengalen", "diwali", "kali", "kartik", "puja"],
    timingType: "NISHITA_KAAL",
  },
  {
    key: "kartik_kali_chaudas",
    name: "Kali Chaudas",
    category: "kali",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "CHATURDASHI_KRISHNA",
      maas: "KARTIK",
    },
    description:
      "Kali Chaudas (ook Narak Chaturdashi). Verering van Maa Kali op de veertiende dag van de donkere helft van Kartik. Valt de dag voor Diwali.",
    tags: ["chaturdashi", "diwali", "festival", "kali"],
  },
  {
    key: "margashirsha_kalabhairav_jayanti",
    name: "Kala Bhairava Ashtami",
    category: "bhairava",
    eventType: "JAYANTI",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "ASHTAMI_KRISHNA",
      maas: "MARGASHIRSHA",
    },
    description:
      "Kalabhairav Jayanti. De verschijningsdag van Kala Bhairava, de heer van de tijd en bewaker van Kashi. Ashtami van de donkere helft van Margashirsha.",
    tags: ["bhairava", "jayanti", "kashi", "shiva"],
  },

  // ==========================================================================
  // ADHIKA MAAS EVENTS
  // These only occur in years with an intercalary (adhika) month.
  // In 2026: Adhika Jyeshtha (May–June).
  // ==========================================================================
  {
    key: "adhika_jyeshtha_padmini_ekadashi",
    name: "Padmini Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "JYESHTHA",
      isAdhikaOnly: true,
    },
    description:
      "Ekadashi in de Adhika (schrikkel) Jyeshtha maand. Komt alleen voor in jaren met een Adhika maand.",
    tags: ["adhika", "ekadashi", "padmini", "vasten"],
  },
  {
    key: "adhika_jyeshtha_parama_ekadashi",
    name: "Parama Ekadashi",
    category: "vishnu",
    eventType: "VRAT",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "JYESHTHA",
      isAdhikaOnly: true,
    },
    description:
      "Ekadashi in de Krishna paksha van Adhika Jyeshtha. Komt alleen voor in jaren met een Adhika maand.",
    tags: ["adhika", "ekadashi", "parama", "vasten"],
  },
  {
    key: "adhika_jyeshtha_purnima",
    name: "Adhika Jyeshtha Purnima",
    category: "general",
    eventType: "TITHI",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "JYESHTHA",
      isAdhikaOnly: true,
    },
    description:
      "Volle maan (Purnima) van de Adhika (schrikkel) Jyeshtha maand. Komt alleen voor in jaren met een Adhika maand.",
    tags: ["adhika", "jyeshtha", "purnima"],
  },

  // ==========================================================================
  // NAVRATRI FESTIVALS
  // Chaitra (Vasant) Navratri en Sharad (Maha) Navratri delen dezelfde
  // negen godinnen (Navadurga). Elke godin is kind van beide Navratri parents
  // via de EventSeriesEntry junction table.
  // ==========================================================================

  // --- Chaitra (Vasant) Navratri — begint Chaitra Shukla Pratipada ---
  {
    key: "chaitra_navratri",
    name: "Chaitra Navratri",
    category: "durga",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PRATIPADA_SHUKLA", maas: "CHAITRA", durationDays: 9 },
    description:
      "Negen heilige nachten gewijd aan de negen vormen van Godin Durga in het voorjaar (Vasant Navratri). Begint op Chaitra Shukla Pratipada en eindigt op Ram Navami.",
    tags: ["durga", "festival", "navratri", "negen nachten", "vasant", "vastijd"],
  },

  // --- Sharad (Maha) Navratri — begint Ashwin Shukla Pratipada ---
  {
    key: "sharad_navratri",
    name: "Sharad Navratri",
    category: "durga",
    eventType: "FESTIVAL",
    importance: "MAJOR",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PRATIPADA_SHUKLA", maas: "ASHWIN", durationDays: 9 },
    description:
      "Negen heilige nachten gewijd aan de negen vormen van Godin Durga in het najaar (Maha Navratri). Begint op Ashwin Shukla Pratipada en eindigt op Navami voor Vijayadashami.",
    tags: ["durga", "festival", "maha", "navratri", "negen nachten", "sharad", "vastijd"],
  },

  // --- Navadurga — de 9 godinnen, gedeeld door beide Navratris ---
  // ruleConfig.maas is een array zodat de recurrence service voor beide
  // maanden (Chaitra en Ashwin) een occurrence genereert.
  {
    key: "navadurga_dag1_shailputri",
    name: "Maa Shailputri",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PRATIPADA_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 1,
    description:
      "Dag 1 van Navratri. Verering van Maa Shailputri – dochter van de berg, incarnatie van Godin Parvati. Symbool van kracht en toewijding.",
    tags: ["durga", "navadurga", "navratri", "parvati", "shailputri"],
  },
  {
    key: "navadurga_dag2_brahmacharini",
    name: "Maa Brahmacharini",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "DWITIYA_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 2,
    description:
      "Dag 2 van Navratri. Verering van Maa Brahmacharini – de ascetische godin, symbool van zelfbeheersing en boete.",
    tags: ["brahmacharini", "durga", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag3_chandraghanta",
    name: "Maa Chandraghanta",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRITIYA_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 3,
    description:
      "Dag 3 van Navratri. Verering van Maa Chandraghanta – dapperheid en bescherming, met een halve maan op haar voorhoofd.",
    tags: ["chandraghanta", "durga", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag4_kushmanda",
    name: "Maa Kushmanda",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 4,
    description:
      "Dag 4 van Navratri. Verering van Maa Kushmanda – zij die het universum schiep met haar goddelijke glimlach.",
    tags: ["durga", "kushmanda", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag5_skandamata",
    name: "Maa Skandamata",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PANCHAMI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 5,
    description:
      "Dag 5 van Navratri. Verering van Maa Skandamata – moeder van Lord Kartikeya, symbool van moederliefde en bescherming.",
    tags: ["durga", "navadurga", "navratri", "skandamata"],
  },
  {
    key: "navadurga_dag6_katyayani",
    name: "Maa Katyayani",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "SHASHTHI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 6,
    description:
      "Dag 6 van Navratri. Verering van Maa Katyayani – de strijdersgodin, een felle verschijning van Durga.",
    tags: ["durga", "katyayani", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag7_kaalratri",
    name: "Maa Kaalratri",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "SAPTAMI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 7,
    description:
      "Dag 7 van Navratri. Verering van Maa Kaalratri – vernietiger van duisternis en onwetendheid.",
    tags: ["durga", "kaalratri", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag8_mahagauri",
    name: "Maa Mahagauri",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 8,
    description:
      "Dag 8 van Navratri (Durga Ashtami). Verering van Maa Mahagauri – godin van zuiverheid en vrede.",
    tags: ["ashtami", "durga", "mahagauri", "navadurga", "navratri"],
  },
  {
    key: "navadurga_dag9_siddhidatri",
    name: "Maa Siddhidatri",
    category: "durga",
    eventType: "PUJA",
    importance: "MODERATE",
    ruleType: "TITHI",
    ruleConfig: { tithi: "NAVAMI_SHUKLA", maas: ["CHAITRA", "ASHWIN"] },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 9,
    description:
      "Dag 9 van Navratri (Navami). Verering van Maa Siddhidatri – schenker van volmaaktheid en alle siddhis.",
    tags: ["durga", "navadurga", "navami", "navratri", "siddhidatri"],
  },
];
