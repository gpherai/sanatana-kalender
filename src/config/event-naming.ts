/**
 * Event Naming Catalog
 *
 * Single source of truth for event definitions.
 * Events are auto-generated from these rules.
 *
 * Pattern: categories.ts (category definitions)
 * This file follows the same pattern but for events.
 */

import type { RuleConfigMap } from "@/config/rule-config.types";

export type RuleType = keyof RuleConfigMap;

export type EventNaming = {
  [K in RuleType]: {
    key: string;
    name: string;
    /** Category names ordered by priority. First = primary (color/icon on calendar). */
    categories: string[];
    /** Alternative names or names from other traditions for the same event */
    aliases?: string[];
    eventType:
      | "FESTIVAL"
      | "PUJA"
      | "VRAT"
      | "JAYANTI"
      | "TITHI"
      | "SANKRANTI"
      | "ECLIPSE"
      | "OTHER";
    ruleType: K;
    ruleConfig: RuleConfigMap[K];
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
    timingType?: "NISHITA_KAAL" | "PRADOSH_KAAL" | "SUNRISE" | "SUNSET" | "MADHYAHNA";
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
  };
}[RuleType];

export const EVENT_NAMING_CATALOG: EventNaming[] = [
  // ==========================================================================
  // EKADASHI EVENTS (24 per year - 2 per lunar month)
  // Rule: TITHI with maas + paksha
  // ==========================================================================
  {
    key: "pausha_putrada_ekadashi",
    name: "Putrada Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "VAISHAKHA",
    },
    description:
      "Varuthini Ekadashi is een belangrijke vastendag gewijd aan de Vamana-avatar van Heer Vishnu. 'Varuth' betekent 'bescherming' of 'schild'; het naleven van dit vasten beschermt tegen negatieve invloeden en vernietigt zonden. Volgens de overlevering staat de verdienste van dit vasten gelijk aan de donatie van goud tijdens een zonsverduistering. Toegewijden vasten (nirjala of met fruit/melk), voeren 's nachts de Jagran uit, chanten de Vishnu Sahasranama en lezen de Bhagavad Gita. In de Pushtimarg traditie is het ook de verschijningsdag van Shri Vallabhacharya.",
    tags: [
      "bescherming",
      "bhagavad gita",
      "ekadashi",
      "jagran",
      "vallabhacharya",
      "vamana",
      "vasten",
      "vishnu",
      "vishnu sahasranama",
    ],
  },
  {
    key: "vaishakha_mohini_ekadashi",
    name: "Mohini Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "VAISHAKHA",
    },
    description:
      "Mohini Ekadashi herdenkt de verschijning van Heer Vishnu in de gedaante van Mohini, zijn enige vrouwelijke avatar. Volgens de mythologie nam hij deze betoverende vorm aan tijdens het karnen van de oceaan (Samudra Manthan) om de Amrita (nectar der onsterfelijkheid) uit de handen van de asura's te redden. Het naleven van dit vasten zuivert alle zonden, verwijdert droefheid en wereldse gehechtheden en leidt tot ultieme bevrijding (Moksha). Toegewijden vereren Vishnu met Tulsi-bladeren en bloemen, zingen devotionele liederen en voeren na het vasten liefdadigheid (Daan) uit.",
    tags: [
      "amrita",
      "avatar",
      "daan",
      "ekadashi",
      "mohini",
      "moksha",
      "samudra manthan",
      "tulsi",
      "vasten",
      "vishnu",
    ],
  },
  {
    key: "jyeshtha_apara_ekadashi",
    name: "Apara Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_KRISHNA",
      maas: "JYESHTHA",
    },
    description:
      "Apara Ekadashi, ook bekend als Achala Ekadashi, is een krachtige vastendag gewijd aan de Trivikrama-avatar van Heer Vishnu. 'Apara' betekent 'onmetelijk' of 'grenzeloos', wat verwijst naar de onmetelijke spirituele verdienste (Punya) die het oplevert. Het naleven van dit vasten is berucht om het vernietigen van de zwaarste zonden (Papa), zoals het niet respecteren van de goeroe of het geven van valse getuigenissen, en effent het pad naar ultieme bevrijding (Moksha). De verdienste staat gelijk aan het driemaal baden in de heilige Ganges tijdens de maand Kartik of het uitvoeren van talrijke donaties. Toegewijden vasten strikt, lezen de Apara Ekadashi Vrat Katha, chanten Vishnu-mantra's en verrichten liefdadigheid (Daan).",
    tags: [
      "achala",
      "apara",
      "daan",
      "ekadashi",
      "jyeshtha",
      "katha",
      "moksha",
      "punya",
      "trivikrama",
      "vasten",
      "vishnu",
      "zuivering",
    ],
  },
  {
    key: "jyeshtha_nirjala_ekadashi",
    name: "Nirjala Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "MESHA_SANKRANTI",
    },
    description:
      "Mesha Sankranti markeert de overgang van de Zon (Surya) naar het sterrenbeeld Mesha (Ram) en luidt het hindoeïstische zonne-nieuwjaar in. Het is een viering van nieuwe energie, hoop en de lente. Gelovigen nemen voor zonsopgang een heilig bad (Snana) en offeren water aan de zonnegod (Surya Arghya) voor een gezond en voorspoedig jaar. Ook het doneren van voedsel of kleding (Daan) is zeer wenselijk op deze dag. Afhankelijk van de regio in India staat het bekend als Vaisakhi, Puthandu, Vishu of Bohag Bihu.",
    tags: [
      "arghya",
      "daan",
      "mesha",
      "nieuwjaar",
      "sankranti",
      "snana",
      "surya",
      "vishu",
      "zon",
    ],
  },
  {
    key: "vrishabha_sankranti",
    name: "Vrishabha Sankranti",
    categories: ["surya"],
    eventType: "SANKRANTI",
    ruleType: "SOLAR",
    ruleConfig: {
      sankranti: "VRISHABHA_SANKRANTI",
    },
    description:
      "Vrishabha Sankranti markeert het heilige moment waarop de Zon (Surya) vanuit Ram het sterrenbeeld Stier (Vrishabha) binnentreedt. Deze astrologische overgang luidt de start in van een nieuwe zonnemaand en symboliseert stabiliteit en volharding. Volgens de traditie is dit een zeer gunstige dag om niet alleen de Zonnegod te vereren, maar ook Heer Shiva en zijn heilige stier Nandi (Vrishabha). Gelovigen beginnen de dag voor zonsopkomst met een ritueel bad (Snana) en offeren water aan de opkomende zon (Surya Arghya). Het schenken van liefdadigheid (Daan), met name het doneren van voedsel, water of het helpen van koeien, levert op deze dag uitzonderlijk veel spirituele verdienste op.",
    tags: [
      "arghya",
      "daan",
      "nandi",
      "sankranti",
      "shiva",
      "snana",
      "stier",
      "surya",
      "vrishabha",
      "zon",
    ],
  },
  {
    key: "mithuna_sankranti",
    name: "Mithuna Sankranti",
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["surya"],
    eventType: "SANKRANTI",
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
    categories: ["general"],
    eventType: "FESTIVAL",
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
    categories: ["general"],
    eventType: "FESTIVAL",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "FESTIVAL",
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
    categories: ["general"],
    eventType: "TITHI",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "CHAITRA",
    },
    description:
      "Chaitra Purnima is de volle maan in de eerste hindoe-maand Chaitra en symboliseert spirituele reiniging. Gelovigen nemen een heilig bad (snan) voor zonsopgang, vasten de hele dag (vrat) en offeren water (arghya) aan de Maangod Chandra. De dag staat ook in het teken van de Satyanarayana Puja voor Lord Vishnu. In Noord-India viert men op deze dag Hanuman Jayanti, terwijl in Zuid-India (als Chitra Pournami) Chitragupta wordt vereerd, de bewaarder van ieders karma. Het is een uitstekende dag voor liefdadigheid (daan).",
    tags: [
      "purnima",
      "chaitra",
      "snan",
      "chandra",
      "chitragupta",
      "satyanarayana",
      "karma",
    ],
  },
  {
    key: "vaishakha_vaishakha_purnima",
    name: "Vaishakha Purnima",
    categories: ["general"],
    eventType: "TITHI",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "VAISHAKHA",
    },
    description:
      "Vaishakha Purnima, wijdverspreid gevierd als Buddha Purnima of Buddha Jayanti, is een uitzonderlijk heilige dag. Het herdenkt tegelijkertijd de geboorte, verlichting (Nirvana) en het uiteindelijke overlijden (Mahaparinirvana) van Gautama Boeddha, die binnen het hindoeïsme wordt beschouwd als de negende avatar van Heer Vishnu. Buiten de boeddhistische betekenis is deze volle maan (Purnima) ook uiterst gunstig in de Vedische traditie voor het nemen van een heilig bad (Snana) in rivieren zoals de Ganges en het doneren van water, voedsel of kleding aan behoeftigen (Daan). Gelovigen vereren Heer Vishnu, vaak door het uitvoeren of aanhoren van de Satyanarayana Katha en het chanten van mantra's.",
    tags: [
      "boeddha",
      "buddha jayanti",
      "daan",
      "katha",
      "mahaparinirvana",
      "nirvana",
      "purnima",
      "satyanarayana",
      "snana",
      "vaishakha",
      "vishnu",
    ],
  },
  {
    key: "jyeshtha_jyeshtha_purnima",
    name: "Jyeshtha Purnima",
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["general"],
    eventType: "TITHI",
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
    categories: ["vishnu"],
    eventType: "VRAT",
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
    categories: ["bhairava"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_KRISHNA", monthly: true },
    description:
      "Kalashtami (Kala Ashtami) is een maandelijkse hindoeïstische vastendag gewijd aan Heer Kaal Bhairav, de felle en beschermende manifestatie van Heer Shiva. Het wordt elke maand gevierd op de achtste dag (Ashtami) van de afnemende maan (Krishna Paksha). Gelovigen aanbidden Bhairava, de bewaker van tijd en vernietiger van ego, voor bescherming tegen negatieve energieën, angsten en obstakels. Het vasten (vrat) duurt vaak tot de avond, waarna men speciale puja's verricht, mantra's zoals het Kalabhairava Ashtakam reciteert, en zwarte honden (het rijdier of vahana van Bhairava) voert.",
    tags: [
      "ashtami",
      "bhairava",
      "hond",
      "kaal bhairav",
      "kalabhairava ashtakam",
      "kalashtami",
      "maandelijks",
      "shiva",
      "vasten",
      "vrat",
    ],
  },

  // === PRADOSH VRAT (maandelijks, 2x per maand) ===
  {
    key: "pradosh_vrat_krishna",
    name: "Pradosh Vrat (Krishna)",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRAYODASHI_KRISHNA", monthly: true },
    description:
      "Pradosh Vrat (Krishna Paksha) is de tweewekelijkse vastendag gewijd aan Heer Shiva en Godin Parvati op de 13e dag (Trayodashi) van de afnemende maan. Dit moment is speciaal bedoeld voor karmische reiniging, introspectie en het loslaten van negatieve gewoontes. Het hoogtepunt is de Pradosh Kaal (de schemering), wanneer Shiva volgens de legende in zijn meest vergevingsgezinde staat is nadat hij het Halahala-gif dronk tijdens het karnen van de oceaan. Toegewijden vasten de hele dag, wassen de Shiva Lingam (Abhishekam) met melk en honing, vereren de stier Nandi, en chanten de Maha Mrityunjaya Mantra.",
    tags: [
      "abhishekam",
      "halahala",
      "krishna paksha",
      "nandi",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "trayodashi",
      "vasten",
      "vrat",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "pradosh_vrat_shukla",
    name: "Pradosh Vrat (Shukla)",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRAYODASHI_SHUKLA", monthly: true },
    description:
      "Pradosh Vrat (Shukla Paksha) is de tweewekelijkse vastendag gewijd aan Heer Shiva en Godin Parvati op de 13e dag (Trayodashi) van de wassende maan. Tijdens de 'lichte helft' van de maand focust dit vasten zich op spirituele groei, het manifesteren van positiviteit en het verkrijgen van Shiva's zegen voor welvaart en geluk. Het belangrijkste ritueel vindt plaats tijdens de Pradosh Kaal (de schemering). Toegewijden vasten (strikt of met fruit/melk), voeren de Abhishekam (rituele wassing) van de Shiva Lingam uit met heilige items zoals melk, honing en Bael-bladeren (Bilva Patra), en chanten de Panchakshari Mantra (Om Namah Shivaya).",
    tags: [
      "abhishekam",
      "bael",
      "bilva patra",
      "om namah shivaya",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "shukla paksha",
      "trayodashi",
      "vasten",
      "vrat",
    ],
    timingType: "PRADOSH_KAAL",
  },

  // === JAYANTIS (DEITY BIRTHDAYS) ===
  {
    key: "magha_saraswati_jayanti",
    name: "Saraswati Jayanti",
    categories: ["saraswati"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PANCHAMI_SHUKLA", maas: "MAGHA" },
    description:
      "Verschijningsdag van Godin Saraswati. Valt op Vasant Panchami. Verering van kennis, muziek en kunsten.",
    tags: ["jayanti", "kennis", "panchami", "saraswati", "vasant"],
  },
  {
    key: "margashirsha_lakshmi_jayanti",
    name: "Lakshmi Jayanti",
    categories: ["lakshmi"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MARGASHIRSHA" },
    description:
      "Verschijningsdag van Godin Lakshmi. De Margashirsha Purnima wordt in Noord-Indiase traditie als haar jayanti gevierd.",
    tags: ["jayanti", "lakshmi", "margashirsha", "purnima", "rijkdom"],
  },
  {
    key: "vaishakha_vaikasi_visakam",
    name: "Vaikasi Visakam",
    categories: ["skanda"],
    eventType: "JAYANTI",
    ruleType: "NAKSHATRA",
    ruleConfig: { nakshatra: "VISHAKHA", maas: "VAISHAKHA" },
    description:
      "Vaikasi Visakam is een belangrijk Tamil festival ter ere van de geboorte van Heer Murugan (Skanda of Subrahmanya). Volgens de Kanda Puranam verscheen hij uit zes goddelijke vonken van Shiva's derde oog om het kwaad te vernietigen. Gevierd tijdens de Vishakha nakshatra, markeert het de overwinning van goed over kwaad en innerlijke kracht. Toegewijden bezoeken tempels voor uitgebreide Abhishekam (rituele wassingen), offeren zoete pongal, en dragen soms de Kavadi. Heilige hymnes zoals de Skanda Sashti Kavacham worden gereciteerd, en velen vasten om zonden te reinigen en voorspoed af te dwingen.",
    tags: [
      "abhishekam",
      "jayanti",
      "kavadi",
      "murugan",
      "skanda",
      "skanda sashti kavacham",
      "tamil",
      "vasten",
      "visakam",
    ],
  },
  {
    key: "vaishakha_sita_navami",
    name: "Sita Navami",
    categories: ["rama"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "NAVAMI_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Viering van de geboorte van Godin Sita (ook bekend als Janaki of Bhumija), de trouwe echtgenote van Heer Rama en een incarnatie van Godin Lakshmi. Volgens de epische Ramayana werd zij door Koning Janaka in een ploegvoor gevonden, wat haar nauwe verbondenheid met de aarde en de natuur symboliseert. Sita Navami wordt gevierd op de negende dag van de wassende maan, precies een maand na Ram Navami. Toegewijden vereren Sita voor haar absolute zuiverheid, toewijding, moed en opoffering door te vasten, tempels te bezoeken en de Ramayana of de Janaki Stotram te reciteren.",
    tags: [
      "bhumija",
      "devi",
      "janaki",
      "jayanti",
      "lakshmi",
      "navami",
      "rama",
      "ramayana",
      "sita",
      "vasten",
    ],
  },
  {
    key: "bhadrapada_radhashtami",
    name: "Radhashtami",
    categories: ["krishna"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_SHUKLA", maas: "BHADRAPADA" },
    description:
      "Verschijningsdag van Radha Rani, de geliefde van Heer Krishna. Valt precies 15 dagen na Krishna Janmashtami.",
    tags: ["bhadrapada", "jayanti", "krishna", "radha"],
  },
  {
    key: "chaitra_swaminarayan_jayanti",
    name: "Swaminarayan Jayanti",
    categories: ["vishnu"],
    eventType: "JAYANTI",
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
    categories: ["vishnu"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "TRITIYA_SHUKLA",
      maas: "VAISHAKHA",
    },
    description:
      "Viering van de geboorte van Heer Parashurama, de 6e incarnatie (avatar) van Heer Vishnu. Gevierd op Akshaya Tritiya, herdenkt deze dag de Krijger-Wijze die de aarde verloste van corrupte en tirannieke vorsten en zo de gerechtigheid (Dharma) herstelde. Gewapend met een goddelijke bijl (Parashu) die hem geschonken was door Shiva, vertegenwoordigt hij de unieke balans tussen spirituele kennis en onwrikbare moed. Parashurama is bovendien één van de Ashta Chiranjeevis (de acht onsterfelijken). Gelovigen vasten, verrichten puja's, doneren aan de behoeftigen en chanten de Vishnu Sahasranama.",
    tags: [
      "akshaya tritiya",
      "avatar",
      "bijl",
      "chiranjeevi",
      "dharma",
      "jayanti",
      "parashu",
      "parashurama",
      "vishnu",
      "vishnu sahasranama",
    ],
  },
  {
    key: "jyeshtha_narada_jayanti",
    name: "Narada Jayanti",
    categories: ["general"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PRATIPADA_KRISHNA",
      maas: "JYESHTHA",
    },
    description:
      "Viering van de geboorte van Devrishi Narada, de goddelijke boodschapper en zoon van Heer Brahma. Narada Muni reist onophoudelijk door de drie werelden (hemel, aarde, onderwereld) met zijn Veena (een muziekinstrument) in de hand, en zingt voortdurend lofzangen voor Heer Vishnu ('Narayana, Narayana'). Hij staat symbool voor pure devotie (Bhakti), communicatie en wijsheid, en wordt gezien als de eerste journalist en verhalenverteller in het hindoeïsme. Op deze dag vasten gelovigen, zingen ze bhajans, voeden ze Brahmanen, en reciteren ze de Vishnu Sahasranama om spirituele verlichting en zuiverheid van geest te bereiken.",
    tags: [
      "bhakti",
      "jayanti",
      "narada",
      "narayana",
      "prachar",
      "rishi",
      "veena",
      "vishnu",
    ],
  },
  {
    key: "shravana_gayatri_jayanti",
    name: "Gayatri Jayanti",
    categories: ["general"],
    eventType: "JAYANTI",
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
    categories: ["vishnu"],
    eventType: "JAYANTI",
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
    categories: ["surya"],
    eventType: "JAYANTI",
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
    categories: ["shiva"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_KRISHNA", maas: "SHRAVANA" },
    description:
      "Shivaratri in de heilige maand Shravana. Bijzonder auspicieus voor Shiva-bhakta's. Wordt gevierd met nachtwaken, abhishekam en bel-bladeren.",
    tags: ["sawan", "shiva", "shivaratri", "shravana", "vrat"],
  },
  {
    key: "ashwin_mahalaya_amavasya",
    name: "Mahalaya Amavasya",
    categories: ["general"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "ASHWIN" },
    description:
      "De laatste dag van Pitru Paksha (Sarvapitri Amavasya). De meest heilige dag om voorouders te eren via tarpan en shraddha. Inleiding op Sharad Navratri.",
    tags: ["amavasya", "paksha", "pitru", "shraddha", "voorouders"],
  },
  {
    key: "phalguna_holika_dahan",
    name: "Holika Dahan",
    categories: ["general"],
    eventType: "FESTIVAL",
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
    categories: ["durga"],
    eventType: "FESTIVAL",
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
    categories: ["durga"],
    eventType: "FESTIVAL",
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
    categories: ["surya"],
    eventType: "FESTIVAL",
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
    categories: ["krishna"],
    eventType: "FESTIVAL",
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
    categories: ["kali", "mahavidya"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "KARTIK" },
    description:
      "Kali Puja (Shyama Puja) op de nacht van Diwali. In Oost-India (Bengalen) wordt op Kartika Amavasya niet Lakshmi maar Maa Kali vereerd met nacht-puja's, diyas en offers.",
    tags: ["amavasya", "bengalen", "diwali", "kali", "kartik", "mahavidya", "puja"],
    timingType: "NISHITA_KAAL",
  },
  {
    key: "kartik_diwali",
    name: "Diwali",
    categories: ["lakshmi"],
    aliases: ["Deepawali", "Kamala Jayanti", "Lakshmi Puja"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "KARTIK" },
    description:
      "Het Festival van Lichten op Kartika Amavasya. Maa Lakshmi (Kamala, de tiende Mahavidya) wordt vereerd als godin van welvaart en geluk. Huizen en tempels worden verlicht met diyas.",
    tags: ["amavasya", "diwali", "festival", "kamala", "kartik", "lakshmi", "lichten"],
  },
  {
    key: "kartik_kali_chaudas",
    name: "Kali Chaudas",
    categories: ["kali"],
    eventType: "FESTIVAL",
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
    categories: ["bhairava"],
    eventType: "JAYANTI",
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
    categories: ["vishnu"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "EKADASHI_SHUKLA",
      maas: "JYESHTHA",
      isAdhikaOnly: true,
    },
    description:
      "Padmini Ekadashi (of Purushottama Ekadashi) is een uiterst zeldzame en heilige vastendag die uitsluitend valt tijdens de lichte helft (Shukla Paksha) van de extra toegevoegde schrikkelmaand, Adhika Maas (Purushottama Maas). Deze maand is speciaal toegewijd aan Heer Vishnu. Het vasten op Padmini Ekadashi wordt beschouwd als exponentieel krachtiger dan op reguliere Ekadashi's en kan decennia van negatief karma en zonden vernietigen. Volgens de overlevering baadt men bij voorkeur vroeg in een heilige rivier, neemt men een strikt vasten in acht (zonder graan of peulvruchten), blijft men de hele nacht wakker (Jagran) om de Vishnu Sahasranama te chanten, en wordt er volop gedoneerd (Daan) om ultieme spirituele bevrijding (Moksha) te bereiken.",
    tags: [
      "adhika",
      "daan",
      "ekadashi",
      "jagran",
      "moksha",
      "padmini",
      "purushottama",
      "shukla paksha",
      "vasten",
      "vishnu",
    ],
  },
  {
    key: "adhika_jyeshtha_parama_ekadashi",
    name: "Parama Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
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
    key: "adhika_jyeshtha_adhika_jyeshtha_purnima",
    name: "Adhika Jyeshtha Purnima",
    categories: ["general"],
    eventType: "TITHI",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "PURNIMA",
      maas: "JYESHTHA",
      isAdhikaOnly: true,
    },
    description:
      "Adhika Jyeshtha Purnima is de volle maan van de extra schrikkelmaand (Adhika Maas) in Jyeshtha. Omdat de Adhika maand ook wel Purushottama Maas wordt genoemd en volledig is gewijd aan Heer Vishnu, wordt deze Purnima als spiritueel zeer krachtig beschouwd. Het markeert het hoogtepunt van een maand vol extra devotie en boetedoening. Gelovigen vieren deze dag door een heilig bad (Snan) te nemen, de Satyanarayana Puja uit te voeren en te doneren (Daan). Het is een uitstekend moment voor het reciteren van heilige teksten en japa om spirituele verdienste te maximaliseren die alleen in deze zeldzame maanden verkregen kan worden.",
    tags: [
      "adhika",
      "daan",
      "japa",
      "jyeshtha",
      "purnima",
      "purushottama",
      "satyanarayana",
      "snan",
      "vasten",
      "vishnu",
    ],
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
    categories: ["durga"],
    eventType: "FESTIVAL",
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
    categories: ["durga"],
    eventType: "FESTIVAL",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
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
    categories: ["durga"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "NAVAMI_SHUKLA",
      maas: ["CHAITRA", "ASHWIN"],
      kshayaNextDay: true,
    },
    parentKeys: ["chaitra_navratri", "sharad_navratri"],
    dayNumber: 9,
    description:
      "Dag 9 van Navratri (Navami). Verering van Maa Siddhidatri – schenker van volmaaktheid en alle siddhis.",
    tags: ["durga", "navadurga", "navami", "navratri", "siddhidatri"],
  },

  // --- Dasha Mahavidyas ---
  {
    key: "ma_tara_jayanti",
    name: "Ma Tara Jayanti",
    categories: ["tara", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "NAVAMI_SHUKLA", maas: "CHAITRA" },
    description:
      "Geboortedag van Ma Tara, de tweede van de Dasha Mahavidyas. Tara belichaamt bevrijdende kennis en bescherming bij het oversteken van het oceaan van samsara. Wordt voornamelijk in de tantrische tradities van Bengalen en Assam vereerd.",
    tags: ["chaitra", "jayanti", "mahavidya", "navami", "tara"],
  },
  {
    key: "magha_lalita_jayanti",
    name: "Lalita Jayanti",
    categories: ["lalita", "mahavidya"],
    aliases: ["Tripura Sundari Jayanti"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MAGHA" },
    description:
      "Geboortedag van Maa Lalita Tripura Sundari, de derde van de Dasha Mahavidyas. Lalita belichaamt goddelijke schoonheid, zaligheid en de drie werelden (hemel, aarde, onderwereld). Geviert op Magha Purnima.",
    tags: ["jayanti", "lalita", "magha", "mahavidya", "purnima", "tripura sundari"],
  },
  {
    key: "vaishakha_matangi_jayanti",
    name: "Matangi Jayanti",
    categories: ["matangi", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRITIYA_SHUKLA", maas: "VAISHAKHA", kshayaNextDay: true },
    description:
      "Viering van de geboorte van Godin Matangi, de negende Dasha Mahavidya, vaak de 'Tantrische Saraswati' genoemd. Zij is de godin van het gesproken woord (Para-Vaikhari), ultieme wijsheid, muziek en kunst. In een unieke esoterische traditie wordt zij vaak 'Uchchhishta Chandalini' genoemd; zij aanvaardt restjes of deels gegeten voedsel (uchchhishta) om gelovigen eraan te herinneren dat het goddelijke ook aanwezig is in wat door de maatschappij als onzuiver wordt beschouwd. Ze heerst over de planeet Mercurius. Toegewijden vereren haar met de Hreem-mantra voor welsprekendheid, artistiek meesterschap en intellectuele kracht.",
    tags: [
      "dasha mahavidya",
      "jayanti",
      "mahavidya",
      "matangi",
      "mercurius",
      "saraswati",
      "tantra",
      "tritiya",
      "uchchhishta",
      "vaishakha",
      "wijsheid",
    ],
  },
  {
    key: "vaishakha_bagalamukhi_jayanti",
    name: "Bagalamukhi Jayanti",
    categories: ["bagalamukhi", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Bagalamukhi Jayanti viert de verschijning van Godin Bagalamukhi, de achtste van de Dasha Mahavidyas (Tantrische wijsheidsgodinnen). Zij staat bekend als de 'Pitambara Maa' (de Godin gekleed in het geel) en bezit de goddelijke kracht om vijanden te verlammen, kwade intenties te stoppen en spraak te beheersen. Ze wordt vaak aangeroepen voor overwinning in juridische geschillen, debatten en ter bescherming tegen verborgen vijanden. Haar aanbidding kenmerkt zich door een strikte voorkeur voor de kleur geel. Toegewijden dragen gele kleding, offeren gele bloemen en gele zoetigheden, en chanten haar krachtige mantra's met behulp van een kurkuma (Haldi) mala.",
    tags: [
      "ashtami",
      "bagalamukhi",
      "bescherming",
      "dasha mahavidya",
      "geel",
      "haldi",
      "jayanti",
      "mantra",
      "pitambara",
      "vaishakha",
      "vijanden",
    ],
  },
  {
    key: "vaishakha_chhinnamasta_jayanti",
    name: "Chhinnamasta Jayanti",
    categories: ["chhinnamasta", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Chhinnamasta Jayanti viert de manifestatie van Godin Chhinnamasta, de zesde van de Dasha Mahavidyas. Zij is de ontzagwekkende, zelf-onthoofde godin die in één hand haar eigen afgehakte hoofd vasthoudt en haar eigen bloed drinkt. Dit krachtige beeld symboliseert de ultieme opoffering van het ego, de vernietiging van valse illusies, en het ontwaken van de Kundalini-energie. Omdat haar verering voornamelijk Tantrisch van aard is, wordt ze vaak in afzondering aanbeden door gevorderde sadhaka's. Rituelen omvatten intense meditatie, het reciteren van de Chhinnamasta Mantra, en het bidden om spirituele transformatie, onverschrokkenheid en het overwinnen van innerlijke demonen.",
    tags: [
      "chaturdashi",
      "chhinnamasta",
      "dasha mahavidya",
      "ego",
      "jayanti",
      "kundalini",
      "mantra",
      "meditatie",
      "tantra",
      "vaishakha",
      "zelfopoffering",
    ],
  },
  {
    key: "jyeshtha_dhumavati_jayanti",
    name: "Dhumavati Jayanti",
    categories: ["dhumavati", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_SHUKLA", maas: "JYESHTHA" },
    description:
      "Geboortedag van Maa Dhumavati, de zevende van de Dasha Mahavidyas. Dhumavati is de rookgrijze weduwe-godin van de leegte, ongunstigheid en diepe wijsheid voorbij illusie.",
    tags: ["ashtami", "dhumavati", "jayanti", "jyeshtha", "mahavidya"],
  },
  {
    key: "bhadrapada_kali_jayanti",
    name: "Kali Jayanti",
    categories: ["kali", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_KRISHNA", maas: "BHADRAPADA" },
    description:
      "Geboortedag van Maa Kali, de eerste en hoogste van de Dasha Mahavidyas. Kali is de godin van tijd, verandering en bevrijding. Zij vernietigt het kwaad en beschermt haar devotees.",
    tags: ["ashtami", "bhadrapada", "jayanti", "kali", "krishna paksha", "mahavidya"],
  },
  {
    key: "bhadrapada_bhuvaneshvari_jayanti",
    name: "Bhuvaneshvari Jayanti",
    categories: ["bhuvaneshvari", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "DWADASHI_SHUKLA", maas: "BHADRAPADA" },
    description:
      "Geboortedag van Maa Bhuvaneshvari, de vierde van de Dasha Mahavidyas. Bhuvaneshvari is de koningin van het universum — de ruimte zelf als goddelijk vrouwelijk principe.",
    tags: ["bhadrapada", "bhuvaneshvari", "dwadashi", "jayanti", "mahavidya"],
  },
  {
    key: "margashirsha_bhairavi_jayanti",
    name: "Bhairavi Jayanti",
    categories: ["bhairavi", "mahavidya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MARGASHIRSHA" },
    description:
      "Geboortedag van Maa Bhairavi, de vijfde van de Dasha Mahavidyas. Bhairavi is de felle godin van vuur, vernietiging en bevrijding. Zij is de kosmische energie die alles verteert.",
    tags: ["bhairavi", "jayanti", "mahavidya", "margashirsha", "purnima"],
  },

  // ==========================================================================
  // GANESH CHATURTHI & VINAYAKA CHATURTHI
  // ==========================================================================
  {
    key: "bhadrapada_ganesh_chaturthi",
    name: "Ganesh Chaturthi",
    categories: ["ganesha"],
    aliases: ["Ganeshotsav", "Vinayaka Chaturthi"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "BHADRAPADA" },
    timingType: "MADHYAHNA",
    description:
      "Geboortedag van Heer Ganesha op Bhadrapada Shukla Chaturthi. De Madhyahna-puja (middagpuja) is het meest auspicieuze moment. Ganeshotsav duurt 10 dagen tot Ganesha Visarjan.",
    tags: ["bhadrapada", "chaturthi", "festival", "ganesha", "ganeshotsav"],
  },
  {
    key: "bhadrapada_ganesha_visarjan",
    name: "Ganesha Visarjan",
    categories: ["ganesha"],
    aliases: ["Anant Chaturdashi"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_SHUKLA", maas: "BHADRAPADA" },
    description:
      "De afsluitende dag van Ganeshotsav. Het Ganesha-beeld wordt na een feestelijke processie ondergedompeld in water (visarjan). Valt op Anant Chaturdashi, 10 dagen na Ganesh Chaturthi.",
    tags: [
      "anant chaturdashi",
      "bhadrapada",
      "chaturdashi",
      "festival",
      "ganesha",
      "visarjan",
    ],
  },
  {
    key: "monthly_vinayaka_chaturthi",
    name: "Vinayaka Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", monthly: true },
    timingType: "MADHYAHNA",
    description:
      "Vinayaka Chaturthi is de maandelijkse viering van Heer Ganesha op de vierde dag (Chaturthi) van de wassende maan. Ganesha staat symbool als de 'Verwijderaar van Obstakels' (Vighnaharta) en 'God van het Begin'. Een toegewijde verering op deze dag verwijdert fysieke obstakels en innerlijke trots. Gelovigen verrichten een uitgebreide puja, bij voorkeur tijdens Madhyahna (het middaguur), brengen Modaks, fruit en Durva-gras als offergaven en zoeken zijn zegen voor wijsheid en voorspoed. In de maand Bhadrapada valt de grote 10-daagse viering (Ganesh Chaturthi).",
    tags: [
      "chaturthi",
      "durva",
      "ganesha",
      "maandelijks",
      "madhyahna",
      "modak",
      "puja",
      "vighnaharta",
      "vinayaka",
    ],
  },

  // ==========================================================================
  // SANKASHTI CHATURTHI (MAANDELIJKS + SPECIALE GEVALLEN)
  // ==========================================================================
  {
    key: "sankashti_chaturthi_monthly",
    name: "Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", monthly: true },
    description:
      "Sankashti Chaturthi ('bevrijding van obstakels') is een maandelijkse vastendag gewijd aan Heer Ganesha, de Vighnaharta. Het wordt gevierd op de vierde dag (Chaturthi) van de afnemende maan (Krishna Paksha). Toegewijden vasten van zonsopgang tot maanopkomst en bidden om hulp bij het wegnemen van problemen en hindernissen in het leven. De vasten mag pas gebroken worden ná de maanopkomst (Darshan) en het offeren van water (Arghya) aan de maan. Vaak worden Modaks en Laddus geofferd en de Ganesha Atharvashirsha gereciteerd.",
    tags: [
      "ganesha",
      "maan",
      "maandelijks",
      "sankashti",
      "vasten",
      "vighnaharta",
      "darshan",
      "arghya",
    ],
  },
  {
    key: "angaraki_sankashti_chaturthi",
    name: "Angaraki Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "WEEKDAY_TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", weekday: 2 },
    description:
      "Angaraki Sankashti Chaturthi is een uiterst gunstige vastendag gewijd aan Heer Ganesha die ontstaat wanneer Sankashti Chaturthi (de vierde dag van de afnemende maan) op een dinsdag (Mangalvar) valt. Volgens de legende was de planeet Mars (Mangal of Angaraka) een grote toegewijde van Ganesha. Als zegen bepaalde Ganesha dat een Chaturthi op dinsdag naar hem zou worden vernoemd en de hoogste verdienste zou opleveren. Eén Angaraki Chaturthi vasten wordt beschouwd als evenveel waard als het vasten op alle reguliere Sankashti's van het hele jaar. Toegewijden vasten strikt gedurende de dag en verbreken dit pas in de avond na het waarnemen en vereren van de maan (Chandrodaya). Ganesha wordt hierbij vereerd met Modaks, Durva-gras en de Ganapati Atharvashirsha.",
    tags: [
      "angaraka",
      "chandrodaya",
      "chaturthi",
      "dinsdag",
      "durva",
      "ganesha",
      "mangal",
      "mangalvar",
      "mars",
      "modak",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "magha_sakat_chauth",
    name: "Sakat Chauth",
    categories: ["ganesha"],
    aliases: ["Tilkut Chauth", "Lambodara Sankashti"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "MAGHA" },
    description:
      "Ook bekend als Tilkut Chauth of Lambodara Sankashti. Eerste Sankashti Chaturthi van het jaar. Devotees vasten tot maanzicht en bieden til (sesam) laddoos aan Ganesha.",
    tags: ["ganesha", "sakat", "sankashti", "tilkut", "vasten"],
  },
  {
    key: "margashirsha_akhuratha_sankashti",
    name: "Akhuratha Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "MARGASHIRSHA" },
    description:
      "Maandelijkse Chaturthi gewijd aan Lord Ganesha. Devotees vasten en breken het vasten na het zien van de maan. December's Sankashti wordt Akhuratha genoemd.",
    tags: ["chaturthi", "ganesha", "maandelijks", "sankashti"],
  },
  {
    key: "magha_ganesh_jayanti",
    name: "Ganesh Jayanti",
    categories: ["ganesha"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "MAGHA" },
    description:
      "Geboortedag van Lord Ganesha volgens de Magha traditie. Wordt gevierd op Shukla Chaturthi in de Magha maand. Devotees vasten, voeren puja's uit en bieden modak en durva gras aan.",
    tags: ["durva", "ganesha", "geboorte", "jayanti", "modak"],
  },

  // ==========================================================================
  // GROTE FESTIVALS
  // ==========================================================================
  {
    key: "phalguna_maha_shivaratri",
    name: "Maha Shivaratri",
    categories: ["shiva"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_KRISHNA", maas: "PHALGUNA" },
    timingType: "NISHITA_KAAL",
    description:
      "De grote nacht van Shiva. Bhakta's houden een vrat (vasten) en blijven de hele nacht wakker ter ere van Heer Shiva. Er worden speciale abhishekam rituelen uitgevoerd met melk, honing en bilvabladeren.",
    tags: ["abhishekam", "nachtelijk", "shiva", "vasten"],
  },
  {
    key: "phalguna_holi",
    name: "Holi",
    categories: ["krishna"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "PHALGUNA" },
    description:
      "Het festival van kleuren. Viert de overwinning van goed over kwaad en de komst van de lente. De avond ervoor wordt Holika Dahan gevierd met een ritueel vreugdevuur.",
    tags: ["holika", "kleuren", "lente", "vishnu"],
  },
  {
    key: "chaitra_ram_navami",
    name: "Ram Navami",
    categories: ["rama"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "NAVAMI_SHUKLA", maas: "CHAITRA" },
    description:
      "Verschijningsdag van Heer Rama, de zevende avatar van Vishnu. Wordt gevierd met bhajans, het lezen van de Ramayana en het aanbieden van prasad in tempels.",
    tags: ["avatar", "geboorte", "rama", "ramayana"],
  },
  {
    key: "chaitra_hanuman_jayanti",
    name: "Hanuman Jayanti",
    categories: ["hanuman"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "CHAITRA" },
    description:
      "Viering van de geboorte van Heer Hanuman (Pavanputra), de trouwe dienaar van Heer Rama en de 11e incarnatie van Lord Shiva. Hanuman staat symbool voor ultieme toewijding, onbaatzuchtigheid, fysieke kracht en spirituele zuiverheid. Gelovigen bezoeken mandirs, offeren sindoor en zoetigheden, en bidden om kracht en bescherming tegen negatieve energieën. De dag wordt voornamelijk gevierd met het veelvuldig reciteren van de Hanuman Chalisa en het lezen van de Sundara Kanda uit de Ramayana.",
    tags: ["chalisa", "geboorte", "hanuman", "sundara kanda", "sindoor", "pavanputra"],
  },
  {
    key: "vaishakha_akshaya_tritiya",
    name: "Akshaya Tritiya",
    categories: ["vishnu"],
    eventType: "TITHI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "TRITIYA_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Akshaya Tritiya (Akha Teej) is één van de drie meest gunstige dagen (Sade-Teen Muhurtas) van het jaar. 'Akshaya' betekent onvergankelijk: elke nobele daad, liefdadigheid (daan) of spirituele praktijk verricht op deze dag geeft eeuwigdurende verdienste. De dag herdenkt verschillende heilige gebeurtenissen, waaronder de geboorte van Parashurama (de 6e avatar van Vishnu), de neerdaling van de Ganges, en het schenken van onuitputtelijke rijkdom aan Sudama door Heer Krishna. Gelovigen bidden tot Vishnu en Lakshmi, doneren kleding en voedsel, en starten nieuwe ondernemingen of kopen goud als symbool van blijvende welvaart.",
    tags: [
      "akha teej",
      "akshaya",
      "daan",
      "ganges",
      "goud",
      "gunstig",
      "lakshmi",
      "parashurama",
      "sudama",
      "tritiya",
      "vishnu",
    ],
  },
  {
    key: "shravana_raksha_bandhan",
    name: "Raksha Bandhan",
    categories: ["general"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "SHRAVANA" },
    description:
      "Festival van de broeder-zuster band. Zussen binden een rakhi (beschermende draad) om de pols van hun broers, die beloven hen te beschermen.",
    tags: ["bescherming", "broer", "rakhi", "zus"],
  },
  {
    key: "shravana_krishna_janmashtami",
    name: "Krishna Janmashtami",
    categories: ["krishna"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "ASHTAMI_KRISHNA", maas: "SHRAVANA" },
    timingType: "NISHITA_KAAL",
    description:
      "Verschijningsdag van Heer Krishna. Wordt gevierd met een vrat (vasten) tot middernacht (het geboorte-moment), gevolgd door aarti, bhajans en het breken van de vasten met prasad.",
    tags: ["dahi handi", "geboorte", "krishna", "middernacht"],
  },
  {
    key: "ashwin_dussehra",
    name: "Dussehra",
    categories: ["rama"],
    aliases: ["Vijayadashami"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "DASHAMI_SHUKLA", maas: "ASHWIN" },
    description:
      "Overwinning van Heer Rama op Ravana en van Godin Durga op Mahishasura. Symboliseert de triomf van goed over kwaad. Ravana-effigie's worden verbrand.",
    tags: ["durga", "overwinning", "rama", "ravana"],
  },
  {
    key: "kartik_karwa_chauth",
    name: "Karwa Chauth",
    categories: ["durga"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "KARTIK" },
    description:
      "Vastendag voor gehuwde vrouwen die vasten voor het lange leven van hun echtgenoten. Het vasten wordt gebroken na het zien van de maan door een zeef.",
    tags: ["huwelijk", "maan", "vasten", "vrouwen"],
  },
  {
    key: "kartik_tulsi_vivah",
    name: "Tulsi Vivah",
    categories: ["vishnu"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "DWADASHI_SHUKLA", maas: "KARTIK" },
    description:
      "Ceremonieel huwelijk van de Tulsi plant met Lord Vishnu (als Shaligram). Markeert het einde van Chaturmas en het begin van het huwelijksseizoen.",
    tags: ["huwelijk", "shaligram", "tulsi", "vishnu"],
  },

  // ==========================================================================
  // EXTRA JAYANTIS
  // ==========================================================================
  {
    key: "vaishakha_narasimha_jayanti",
    name: "Narasimha Jayanti",
    categories: ["narasimha"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_SHUKLA", maas: "VAISHAKHA" },
    description:
      "Narasimha Jayanti is de verschijningsdag van Heer Narasimha, de machtige half-mens, half-leeuw avatar (incarnatie) van Heer Vishnu. Hij manifesteerde zich uit een stenen pilaar tijdens de schemering om zijn grote toegewijde, de jonge Prahlada, te beschermen en de wrede demonenkoning Hiranyakashipu te verslaan. Deze dag symboliseert de ultieme overwinning van dharma (gerechtigheid) op adharma (kwaad) en de onvoorwaardelijke liefde van de Heer voor zijn devotees. Gelovigen vasten gedurende de dag en verbreken dit pas in de avondschemering, het moment waarop Narasimha verscheen. Speciale puja's, het chanten van de Narasimha Kavacha en het offeren van zoetigheden, fruit en bloemen vormen het hart van de viering.",
    tags: [
      "avatar",
      "bescherming",
      "chaturdashi",
      "dharma",
      "hiranyakashipu",
      "jayanti",
      "narasimha",
      "narasimha kavacha",
      "prahlada",
      "puja",
      "vasten",
      "vishnu",
    ],
  },
  {
    key: "jyeshtha_shani_jayanti",
    name: "Shani Jayanti",
    categories: ["general"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "JYESHTHA" },
    description:
      "Geboortedag van Shani Dev (Saturnus). Devotees aanbidden Shani om negatieve effecten van Saturnus in hun horoscoop te verminderen. Til (sesam) olie wordt geofferd.",
    tags: ["graha", "saturnus", "shani", "til"],
  },
  {
    key: "ashadha_jagannath_rath_yatra",
    name: "Jagannath Rath Yatra",
    categories: ["vishnu"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "DWITIYA_SHUKLA", maas: "ASHADHA" },
    description:
      "Jaarlijkse processie van Lord Jagannath, Balabhadra en Subhadra in Puri. De deities worden op enorme houten wagens (ratha's) door de straten getrokken.",
    tags: ["jagannath", "processie", "puri", "ratha"],
  },
  {
    key: "margashirsha_dattatreya_jayanti",
    name: "Dattatreya Jayanti",
    categories: ["dattatreya"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MARGASHIRSHA" },
    description:
      "Geboortedag van Lord Dattatreya, een samensmelting van Brahma, Vishnu en Shiva. Hij is de adi-guru (eerste leraar) en wordt vereerd door zowel Shaiva als Vaishnava tradities.",
    tags: ["avadhuta", "dattatreya", "guru", "trimurti"],
  },
  {
    key: "margashirsha_gita_jayanti",
    name: "Gita Jayanti",
    categories: ["krishna"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "EKADASHI_SHUKLA", maas: "MARGASHIRSHA" },
    description:
      "Viert de dag waarop Lord Krishna de Bhagavad Gita onderwees aan Arjuna op het slagveld van Kurukshetra. Er worden speciale lezingen en recitaties van de Gita gehouden.",
    tags: ["arjuna", "filosofie", "gita", "krishna", "kurukshetra"],
  },
  {
    key: "margashirsha_vaikunta_ekadashi",
    name: "Vaikunta Ekadashi",
    categories: ["vishnu"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "EKADASHI_SHUKLA", maas: "MARGASHIRSHA" },
    description:
      "De meest heilige Ekadashi, ook bekend als Mukkoti Ekadashi. Het wordt geloofd dat de poorten van Vaikunta (Vishnu's verblijf) op deze dag opengaan. Zeer belangrijk in Zuid-India.",
    tags: ["ekadashi", "moksha", "poort", "vaikunta", "vishnu"],
  },

  // ==========================================================================
  // SPECIFIEKE TITHI OBSERVATIES
  // ==========================================================================
  {
    key: "pausha_amavasya",
    name: "Pausha Amavasya",
    categories: ["general"],
    eventType: "TITHI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "AMAVASYA", maas: "PAUSHA" },
    description:
      "Nieuwe maan dag van de maand Pausha. Traditioneel een dag voor pitru tarpan (voorouder verering) en introspectie. Gunstig voor meditatie en spirituele praktijken.",
    tags: ["amavasya", "meditatie", "nieuwe maan", "voorouders"],
  },

  // ==========================================================================
  // TAMIL / ZUID-INDIASE TRADITIES
  // ==========================================================================
  {
    key: "makara_tamil_pongal",
    name: "Thai Pongal",
    categories: ["surya"],
    aliases: ["Pongal"],
    eventType: "FESTIVAL",
    ruleType: "SOLAR",
    ruleConfig: { sankranti: "MAKARA_SANKRANTI" },
    description:
      "Tamil oogstfestival dat de zonnewende viert. Pongal (zoete rijst) wordt gekookt tot het overkookt als teken van overvloed. Valt op Makar Sankranti. Festival duurt vier dagen: Bhogi, Thai Pongal, Mattu Pongal, Kaanum Pongal.",
    tags: ["oogst", "overvloed", "pongal", "tamil", "zon"],
  },
  {
    key: "kartik_karthigai_deepam",
    name: "Karthigai Deepam",
    categories: ["shiva"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "KARTIK" },
    description:
      "Tamil festival van lichten gevierd in de maand Karthigai. Huizen worden verlicht met olielampen (kuthuvilakku). In Tiruvannamalai wordt een enorm vuur ontstoken op de Arunachala berg.",
    tags: ["arunachala", "deepam", "lichten", "tamil", "tiruvannamalai"],
  },
  {
    key: "kartik_skanda_sashti",
    name: "Skanda Sashti",
    categories: ["skanda"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "SHASHTHI_SHUKLA", maas: "KARTIK" },
    description:
      "Zes dagen durend festival ter ere van Heer Murugan/Skanda. Viert zijn overwinning op de demon Surapadman. Zeer populair in Tamil Nadu en andere Zuid-Indiase staten.",
    tags: ["murugan", "skanda", "surapadman", "tamil", "vel"],
  },
  {
    key: "magha_thaipusam",
    name: "Thaipusam",
    categories: ["skanda"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: { tithi: "PURNIMA", maas: "MAGHA" },
    description:
      "Festival ter ere van Heer Murugan. Bhakta's dragen kavadi's (versierde structuren) en sommigen doorboren hun lichaam met speren als teken van devotie en boetedoening.",
    tags: ["devotie", "kavadi", "maleisië", "murugan", "tamil"],
  },
];
