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
    /**
     * When true, Adhika (leap) month occurrences are included in addition to
     * the regular (Nija) month. Default false (only Nija maas matched).
     * Example: kartik_kartik_purnima — includes Adhika KARTIK so the Nov
     * occurrence is found before the Nija Dec occurrence in adhika years.
     */
    includeAdhika?: boolean;
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
      "Kamada Ekadashi is de eerste Ekadashi na het hindoeïstische nieuwjaar en staat bekend als de vervuller van alle oprechte wensen ('Kama'). Volgens de Puranas werd een Gandharva genaamd Lalit door deze heilige vastendag bevrijd van een vloek die hem in een monster had veranderd. Het naleven van dit vasten zuivert de geest, verwijdert zonden en helpt bij het overwinnen van lust en woede. Toegewijden vereren Heer Vishnu (als Krishna), reciteren de Vishnu Sahasranama en lezen de specifieke Vrat Katha. Het is een krachtige dag voor spirituele groei en het transformeren van negatieve eigenschappen in positieve kwaliteiten.",
    tags: [
      "chaitra",
      "ekadashi",
      "gandharva",
      "kama",
      "lalit",
      "shukla paksha",
      "vasten",
      "verlossing",
      "vishnu",
      "wensen",
    ],
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
      "De Ekadashi van Margashirsha Shukla Paksha, in Noord-India gevierd als Mokshada Ekadashi. Volgens de traditie is dit de dag waarop Krishna de Bhagavad Gita sprak tot Arjuna op het slagveld van Kurukshetra — vandaar ook wel Gita Jayanti. In Zuid-India wordt dezelfde dag gevierd als Vaikunta Ekadashi (zie aparte entry).",
    tags: ["ekadashi", "moksha", "gita-jayanti", "krishna", "vasten"],
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
    key: "kartik_vaikuntha_chaturdashi",
    name: "Vaikuntha Chaturdashi",
    categories: ["vishnu", "shiva"],
    eventType: "FESTIVAL",
    ruleType: "TITHI",
    ruleConfig: {
      tithi: "CHATURDASHI_SHUKLA",
      maas: "KARTIK",
      nishitakalDateRule: true,
    },
    includeAdhika: true,
    timingType: "NISHITA_KAAL",
    description:
      "De dag voor Kartik Purnima waarop Vishnu en Shiva samen worden vereerd. Vishnu-aanbidding tijdens Nishitakal (middernacht); Shiva-aanbidding bij Arunodaya (dageraad).",
    tags: ["chaturdashi", "kartik", "nishita kaal", "shiva", "vishnu"],
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
    includeAdhika: true,
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

  // === MASIK SHIVARATRI (maandelijks, Shiva) ===
  {
    key: "masik_shivaratri",
    name: "Masik Shivaratri",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURDASHI_KRISHNA", monthly: true },
    timingType: "NISHITA_KAAL",
    description:
      "Masik Shivaratri valt elke maand op de Krishna Chaturdashi (14e tithi van de afnemende maan). Elk maandelijks vasten is gewijd aan Heer Shiva en Shakti. Devotees vasten, blijven wakker en verrichten Shiva Puja tijdens de Nishita Kaal — het heilige middernachtvenster. De Masik Shivaratri in Phalguna-maand is de verheven Maha Shivaratri; die in Shravana staat bekend als Sawan Shivaratri.",
    tags: [
      "chaturdashi",
      "krishna paksha",
      "maandelijks",
      "masik",
      "nishita kaal",
      "shiva",
      "shivaratri",
      "vasten",
    ],
  },

  // === PRADOSH VRAT (benoemd naar weekdag, 2x per maand) ===
  // Elke Trayodashi (13e tithi) krijgt de naam van de weekdag waarop hij valt.
  // 7 weekdagen × 2 paksha (Shukla + Krishna) = 14 entries.
  // Shani Pradosh (zaterdag) en Soma Pradosh (maandag) zijn bijzonder gunstig.
  {
    key: "soma_pradosh_shukla",
    name: "Soma Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 1 },
    description:
      "Soma Pradosh Vrat valt op een Trayodashi die op een maandag (Somavar) ligt. Maandag is de dag van Soma (de Maan) en van Heer Shiva — Somavar Pradosh staat daarmee dubbel in het teken van Shiva. Het vasten schenkt emotionele harmonie, familiezegen en de bescherming van Godin Parvati. Devotees vasten tot na zonsondergang, wassen de Shiva Lingam met melk en pancha-amrit en chanten Om Namah Shivaya.",
    tags: [
      "maandag",
      "parvati",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "soma",
      "trayodashi",
      "vasten",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "bhauma_pradosh_shukla",
    name: "Bhauma Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 2 },
    description:
      "Bhauma Pradosh Vrat valt op een Trayodashi die op een dinsdag (Mangalavar) ligt. Dinsdag is de dag van Bhauma (Mars, Mangal). Dit Pradosh versterkt moed, doorzettingsvermogen en bescherming tegen vijanden. Het is bijzonder gunstig voor het overwinnen van obstakels en voor de gezondheid van het bloed en de vitaliteit. Devotees offeren rode bloemen en reciteren de Maha Mrityunjaya Mantra.",
    tags: [
      "bhauma",
      "bescherming",
      "dinsdag",
      "mangal",
      "mars",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "trayodashi",
      "vasten",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "budha_pradosh_shukla",
    name: "Budha Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 3 },
    description:
      "Budha Pradosh Vrat valt op een Trayodashi die op een woensdag (Budhavar) ligt. Woensdag is de dag van Budha (Mercurius), de planeet van intellect en communicatie. Dit Pradosh schenkt helderheid van geest, verbeterde concentratie en succes in onderwijs en handel. Devotees vasten en offeren groene bloemen of bilva-bladeren.",
    tags: [
      "budha",
      "intellect",
      "mercurius",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "trayodashi",
      "vasten",
      "woensdag",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "guru_pradosh_shukla",
    name: "Guru Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 4 },
    description:
      "Guru Pradosh Vrat valt op een Trayodashi die op een donderdag (Guruvaar) ligt. Donderdag is de dag van Guru Brihaspati (Jupiter), de leraar van de goden. Dit Pradosh verdiept spirituele kennis, versterkt geloof en brengt de zegen van leermeester en voorspoed. Devotees vasten en reciteren de Shiva Sahasranama.",
    tags: [
      "brihaspati",
      "donderdag",
      "guru",
      "jupiter",
      "kennis",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "trayodashi",
      "vasten",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "shukra_pradosh_shukla",
    name: "Shukra Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 5 },
    description:
      "Shukra Pradosh Vrat valt op een Trayodashi die op een vrijdag (Shukravar) ligt. Vrijdag is de dag van Shukra (Venus), de planeet van liefde, schoonheid en welvaart. Dit Pradosh schenkt huwelijksgeluk, harmonie in relaties en materiële overvloed. Devotees offeren witte bloemen en melk aan Shiva en Parvati gezamenlijk.",
    tags: [
      "liefde",
      "parvati",
      "pradosh",
      "pradosh kaal",
      "shiva",
      "shukra",
      "trayodashi",
      "vasten",
      "venus",
      "vrijdag",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "shani_pradosh_shukla",
    name: "Shani Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 6 },
    description:
      "Shani Pradosh Vrat valt op een Trayodashi die op een zaterdag (Shanivaar) ligt. Zaterdag is de dag van Shani (Saturnus), de planeet van karma en rechtvaardigheid. Shani Pradosh is bijzonder krachtig: het samenspel van Shiva's vergeving en Shani's karmische wet maakt dit vasten uiterst geschikt voor het zuiveren van oude karma, het verlichten van Sade Sati-effecten en het streven naar bevrijding (moksha). Devotees vasten strikt en offeren sesam (til) en sesamolie aan Shiva.",
    tags: [
      "karma",
      "moksha",
      "pradosh",
      "pradosh kaal",
      "sade sati",
      "saturnus",
      "shani",
      "shiva",
      "til",
      "trayodashi",
      "vasten",
      "zaterdag",
    ],
    timingType: "PRADOSH_KAAL",
  },
  {
    key: "ravi_pradosh_shukla",
    name: "Ravi Pradosh Vrat",
    categories: ["shiva"],
    eventType: "VRAT",
    ruleType: "PRADOSH",
    ruleConfig: { weekday: 0 },
    description:
      "Ravi Pradosh Vrat valt op een Trayodashi die op een zondag (Ravivaar) ligt. Zondag is de dag van Ravi (de Zon), de bron van leven en kracht. Dit Pradosh schenkt gezondheid, levensenergie, zelfvertrouwen en succes in leiderschap. Devotees vasten en verrichten de Surya-Shiva puja — Shiva als de kosmische zon (Maheshvara) wordt aanbeden met rode bloemen en sindhoor.",
    tags: [
      "gezondheid",
      "pradosh",
      "pradosh kaal",
      "ravi",
      "shiva",
      "zon",
      "zondag",
      "trayodashi",
      "vasten",
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
    key: "maargazhi_arudra_darshan",
    name: "Arudra Darshan",
    categories: ["shiva"],
    eventType: "FESTIVAL",
    ruleType: "NAKSHATRA",
    ruleConfig: {
      nakshatra: "ARDRA",
      maargazhiRule: true,
    },
    description:
      "Arudra Darshan is een Tamil festival gewijd aan de Nataraja-verschijning van Heer Shiva — de kosmische danser. Het wordt gevierd op de dag dat de Ardra nakshatra (Thiruvathirai) valt tijdens de Maargazhi maand (zon in Dhanu). In tempels wordt Nataraja bij het aanbreken van de dageraad (Arunodaya) vereerd met Vedische hymnen en rituele wassingen. De dag geldt als de verjaardag van Shiva in de Tamil traditie. Sommige jaren valt de Ardra nakshatra niet tijdens Maargazhi en wordt het festival dat jaar niet gevierd.",
    tags: [
      "ardra",
      "arunodaya",
      "maargazhi",
      "nakshatra",
      "nataraja",
      "shiva",
      "tamil",
      "thiruvathirai",
    ],
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
    description: "Groene Teej. Gevierd door vrouwen voor huwelijksgeluk.",
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
      "Chaitra Navratri, ook wel Vasant Navratri genoemd, is een negen nachten durend festival in de lente gewijd aan de negen vormen van Godin Durga (Navdurga). Het festival begint op de eerste dag van de hindoe-maand Chaitra en markeert tevens het begin van het hindoeïstische nieuwjaar (Gudi Padwa/Ugadi). Gedurende deze negen dagen vereren toegewijden de Shakti-energie voor spirituele kracht, overwinning op het innerlijke kwaad en zuivering. Belangrijke rituelen zijn Ghatasthapana (het plaatsen van een heilige pot), het zaaien van gerst, het reciteren van de Durga Saptashati en strikt vasten. De viering culmineert op de negende dag met Ram Navami, de verschijningsdag van Heer Rama.",
    tags: [
      "chaitra",
      "durga",
      "durga saptashati",
      "festival",
      "ghatasthapana",
      "gudi padwa",
      "navdurga",
      "navratri",
      "shakti",
      "ugadi",
      "vasant",
      "vasten",
    ],
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
      "Maa Shailputri ('Dochter van de Bergen') is de eerste vorm van Godin Durga die wordt vereerd tijdens Navratri. Ze is de reïncarnatie van Sati en de dochter van de koning der bergen, Himavat. Ze berijdt een stier (Nandi) en houdt een drietand (Trishula) en een lotusbloem vast. Shailputri symboliseert de wortelchakra (Muladhara) en herinnert toegewijden aan de kracht van vastberadenheid en spirituele ontwaking. Op deze eerste dag vindt het Ghatasthapana-ritueel plaats, waarbij de goddelijke energie wordt uitgenodigd in huis.",
    tags: [
      "chaturdashi",
      "durga",
      "ghatasthapana",
      "himavat",
      "muladhara",
      "nandi",
      "navadurga",
      "navratri",
      "parvati",
      "shailputri",
      "trishula",
    ],
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
      "Op de tweede dag van Navratri wordt Maa Brahmacharini vereerd, de godin die onwankelbare boete (Tapasya) en ascese uitvoerde om Heer Shiva als echtgenoot te verkrijgen. Ze wordt afgebeeld met een rozenkrans (Japa Mala) in haar rechterhand en een waterpot (Kamandalu) in haar linkerhand. Brahmacharini symboliseert toewijding, zelfbeheersing en de kracht van kennis. Ze regeert over de Swadhisthana-chakra. Toegewijden bidden tot haar voor spirituele vooruitgang, discipline en innerlijke vrede.",
    tags: [
      "ascese",
      "brahmacharini",
      "durga",
      "japa mala",
      "kamandalu",
      "navadurga",
      "navratri",
      "swadhisthana",
      "tapasya",
    ],
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
      "Maa Chandraghanta, de derde vorm van Durga, wordt vereerd voor vrede en welvaart. Ze draagt een halve maan in de vorm van een bel (Ghanta) op haar voorhoofd, waarvan het geluid de boze geesten en demonen verdrijft. Ze is de belichaming van dapperheid, rechtvaardigheid en spirituele kracht. Chandraghanta berijdt een tijger en is uitgerust met vele wapens, klaar voor de strijd maar tegelijkertijd vol mededogen voor haar devotees. Ze regeert over de Manipura-chakra en schenkt toegewijden moed en de kracht om hun angsten te overwinnen.",
    tags: [
      "bravery",
      "chandraghanta",
      "durga",
      "ghanta",
      "manipura",
      "navadurga",
      "navratri",
      "tijger",
    ],
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
      "Maa Kushmanda wordt vereerd op de vierde dag van Navratri. Ze wordt beschouwd als de schepper van het hele universum, die zij tot leven bracht met haar zachte glimlach toen er slechts duisternis was. 'Ku' betekent klein, 'Ushma' betekent warmte of energie, en 'Anda' betekent ei; samen staat het voor het kosmische ei van schepping. Ze verblijft in de kern van de zon en regeert over de Anahata-chakra. Haar acht armen (Ashtabhuja) dragen wapens, een rozenkrans en een honingpot. Ze schenkt haar devotees gezondheid, rijkdom en kracht.",
    tags: [
      "anahata",
      "ashtabhuja",
      "creatie",
      "durga",
      "kushmanda",
      "navadurga",
      "navratri",
      "schepping",
    ],
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
      "De vijfde dag van Navratri is gewijd aan Maa Skandamata, de moeder van Lord Skanda (ook bekend als Kartikeya of Murugan), de opperbevelhebber van het goddelijke leger. Ze wordt afgebeeld zittend op een leeuw, met de jonge Skanda op haar schoot. Skandamata symboliseert de zuivere vorm van moederliefde, mededogen en bescherming. Ze regeert over de Vishuddha-chakra. Door haar te vereren, verkrijgen toegewijden niet alleen haar zegeningen, maar ook de zegeningen van haar zoon Skanda, wat leidt tot innerlijke zuivering en spirituele vreugde.",
    tags: [
      "durga",
      "kartikeya",
      "moederliefde",
      "navadurga",
      "navratri",
      "skanda",
      "skandamata",
      "vishuddha",
    ],
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
      "Maa Katyayani, de zesde vorm van Durga, is de felle krijgersgodin die werd geboren uit de gecombineerde woede en energie van de goden om de demon Mahishasura te vernietigen. Ze is vernoemd naar de wijze Katyan, die haar als eerste mocht vereren. Ze berijdt een majestueuze leeuw en draagt vier armen met een zwaard en een lotus. Katyayani regeert over de Ajna-chakra (het derde oog) en staat symbool voor moed, vastberadenheid en spirituele overwinning. Ze wordt vaak door jonge ongehuwde vrouwen vereerd om een goede levenspartner te vinden.",
    tags: [
      "ajna",
      "durga",
      "katyayani",
      "mahishasura",
      "navadurga",
      "navratri",
      "overwinning",
      "warrior",
    ],
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
      "Maa Kaalratri, de zevende en meest angstaanjagende vorm van Durga, wordt vereerd op de zevende dag. Haar naam betekent de 'Nacht van de Tijd' of de 'Vernietiger van Duisternis'. Ze heeft een donkere huid, warrig haar en drie ogen die vuur spuwen. Ondanks haar felle verschijning is ze 'Shubhankari' (schenker van goeds) en verzekert ze haar devotees van bescherming tegen angst en onheil. Ze vernietigt onwetendheid en negativiteit. Kaalratri regeert over de Sahasrara-chakra en schenkt spirituele krachten (Siddhis). Ze berijdt een ezel en houdt een zwaard en een ijzeren haak vast.",
    tags: [
      "bescherming",
      "durga",
      "kaalratri",
      "navadurga",
      "navratri",
      "sahasrara",
      "siddhis",
      "shubhankari",
    ],
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
      "Op de achtste dag (Durga Ashtami) wordt Maa Mahagauri vereerd. Haar naam betekent 'extreem wit' of 'stralend', wat verwijst naar haar zuiverheid en vrede nadat zij door Shiva werd gewassen in het water van de Ganges. Ze symboliseert sereniteit, mededogen en de reiniging van karma. Mahagauri berijdt een stier en draagt witte kleding. Ze wordt vaak vereerd tijdens het Kanya Puja-ritueel, waarbij jonge meisjes als levende incarnaties van de godin worden aanbeden. Ze regeert over de Soma-chakra en schenkt haar devotees innerlijke rust en bevrijding van lijden.",
    tags: [
      "ashtami",
      "durga",
      "durga ashtami",
      "kanya puja",
      "mahagauri",
      "navadurga",
      "navratri",
      "soma",
    ],
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
      "De negende dag (Maha Navami) is gewijd aan Maa Siddhidatri, de schenker van alle bovennatuurlijke volmaaktheden (Siddhis). Ze wordt afgebeeld zittend op een lotusbloem of leeuw, met vier armen die de discus, de knots, de schelp en de lotus vasthouden. Volgens de Puranas verkreeg Heer Shiva al zijn krachten door haar te vereren, wat leidde tot de vorm van Ardhanarishwara. Ze regeert over de Nirvana-chakra en staat symbool voor ultieme vervulling en spiritueel succes. Op deze dag voltooien toegewijden hun vasten en voeren ze vaak de Kanya Puja uit om de negen vormen van Shakti te eren.",
    tags: [
      "durga",
      "kanya puja",
      "navadurga",
      "navami",
      "navratri",
      "nirvana",
      "shakti",
      "siddhidatri",
      "siddhis",
    ],
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
  // ==========================================================================
  // VINAYAKA CHATURTHI — PER MAAND MET MANIFESTATIENAAM
  // Elke Shukla Paksha Chaturthi is gewijd aan een specifieke manifestatie
  // van Ganesha, bepaald door de Hindu maandnaam (maas).
  // Jyeshtha heeft drie varianten: Varada (alleen in Adhika-jaren, reguliere maand),
  // Pradyumna (alleen in niet-Adhika jaren, reguliere maand) en
  // Pradyumna Adhika (altijd in de Adhika Jyeshtha maand).
  // ==========================================================================
  {
    key: "pausha_vighneshvara_chaturthi",
    name: "Vighneshvara Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "PAUSHA" },
    timingType: "MADHYAHNA",
    description:
      "Vighneshvara Chaturthi valt in de Pausha maand op Shukla Chaturthi. Vighneshvara betekent 'Heer van de obstakels' — hij die zowel obstakels schept als wegneemt. Devotees verrichten madhyahna-puja met modak, durva-gras en rode bloemen en bidden voor zijn bescherming bij nieuwe ondernemingen.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "phalguna_dhundhiraja_chaturthi",
    name: "Dhundhiraja Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "PHALGUNA" },
    timingType: "MADHYAHNA",
    description:
      "Dhundhiraja Chaturthi valt in de Phalguna maand op Shukla Chaturthi. Dhundhiraja — 'hij die gezocht wordt door allen' — is de manifestatie van Ganesha als de meest begeerde zegengever. Verering tijdens madhyahna (middag) schenkt succes bij doelen die lang verborgen of moeilijk bereikbaar leken.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "chaitra_vasudeva_chaturthi",
    name: "Vasudeva Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "CHAITRA" },
    timingType: "MADHYAHNA",
    description:
      "Vasudeva Chaturthi valt in de Chaitra maand op Shukla Chaturthi. Vasudeva — 'hij die in alle wezens woont' — eert Ganesha als de alomtegenwoordige kosmische kracht. De madhyahna-puja aan het begin van het Hindu nieuwe jaar (Chaitra) geeft een auspicieuze start met bescherming en voorspoed.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "vaishakha_sankarshana_chaturthi",
    name: "Sankarshana Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "VAISHAKHA" },
    timingType: "MADHYAHNA",
    description:
      "Sankarshana Chaturthi valt in de Vaishakha maand op Shukla Chaturthi. Sankarshana — 'hij die trekt en bindt' — eert Ganesha als de kracht die obstakels uit de weg ruimt en het pad bereidt. Madhyahna-puja met durva-gras en modak versterkt toewijding en mentale kracht.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "jyeshtha_pradyumna_chaturthi",
    name: "Pradyumna Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "JYESHTHA" },
    timingType: "MADHYAHNA",
    description:
      "Pradyumna Chaturthi valt op de reguliere Jyeshtha Shukla Chaturthi. Pradyumna — 'de allermachtigste' — eert Ganesha als de meest verheven kracht die het intellect en de creativiteit verlicht. Madhyahna-puja met modak, durva en rode hibiscusbloemen brengt succes in kennis en kunsten.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "adhika_jyeshtha_varada_chaturthi",
    name: "Varada Chaturthi",
    categories: ["ganesha"],
    aliases: ["Adhika Jyeshtha Vinayaka Chaturthi"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "JYESHTHA", isAdhikaOnly: true },
    timingType: "MADHYAHNA",
    description:
      "Varada Chaturthi valt in de Adhika Jyeshtha maand op Shukla Chaturthi. Varada betekent 'zegengever' — Ganesha in zijn meest gunstige, schenkende gedaante. In jaren met een schrikkelmaand (Adhika Jyeshtha) valt deze zeldzame observance als extra gelegenheid; devotees bidden voor vervulling van wensen en offeren modak, nariyal en bloemen.",
    tags: ["adhika", "chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "ashadha_aniruddha_chaturthi",
    name: "Aniruddha Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "ASHADHA" },
    timingType: "MADHYAHNA",
    description:
      "Aniruddha Chaturthi valt in de Ashadha maand op Shukla Chaturthi. Aniruddha — 'hij die niet tegengehouden kan worden' — eert Ganesha als de onweerstaanbare kracht die elk obstakel overwint. Verering tijdens madhyahna schenkt onbelemmerd succes en beschermt tegen negatieve invloeden.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "shravana_durva_ganapati_chaturthi",
    name: "Durva Ganapati Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "SHRAVANA" },
    timingType: "MADHYAHNA",
    description:
      "Durva Ganapati Chaturthi valt in de Shravana maand op Shukla Chaturthi. Durva-gras (Bermuda-gras) is de meest geliefde offergave van Ganesha — elk paar durva-halmpjes representeert een bede. Deze dag is bijzonder gunstig voor het aanbieden van bundels durva-gras tijdens de madhyahna-puja voor gezondheid, lang leven en welvaart.",
    tags: ["chaturthi", "durva", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "ashwina_kapardisha_chaturthi",
    name: "Kapardisha Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "ASHWIN" },
    timingType: "MADHYAHNA",
    description:
      "Kapardisha Chaturthi valt in de Ashwina maand op Shukla Chaturthi. Kapardisha — 'Ganesha met de verstrengelde haarlokken' — symboliseert ascetische wijsheid en kosmische kennis. De Ashwina-puja na Navaratri versterkt de innerlijke kracht en bezegelt de zegeningen van het festivalseizoen.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vinayaka"],
  },
  {
    key: "kartika_labha_chaturthi",
    name: "Labha Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "KARTIK" },
    timingType: "MADHYAHNA",
    description:
      "Labha Chaturthi valt in de Kartika maand op Shukla Chaturthi, vier dagen na Diwali. Labha betekent 'winst, gewin' — bijzonder gunstig voor handelaars, ondernemers en iedereen die een nieuw boekjaar begint. In Gujarat staat deze dag bekend als Labha Pancham en markeert het begin van het Hindu nieuwe handelsjaar.",
    tags: [
      "chaturthi",
      "diwali",
      "ganesha",
      "handelaar",
      "labha",
      "madhyahna",
      "puja",
      "vinayaka",
    ],
  },
  {
    key: "margashirsha_krichchhra_chaturthi",
    name: "Krichchhra Chaturthi",
    categories: ["ganesha"],
    eventType: "PUJA",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "MARGASHIRSHA" },
    timingType: "MADHYAHNA",
    description:
      "Krichchhra Chaturthi valt in de Margashirsha maand op Shukla Chaturthi. Krichchhra betekent 'moeilijk, inspannend' — deze dag is gewijd aan het overwinnen van hardnekkige obstakels en langdurige beproevingen. Vasten en madhyahna-puja aan Ganesha brengen kracht bij grote uitdagingen en verlangen naar bevrijding.",
    tags: ["chaturthi", "ganesha", "madhyahna", "puja", "vasten", "vinayaka"],
  },

  // ==========================================================================
  // SANKASHTI CHATURTHI — PER MAAND MET MANIFESTATIENAAM
  // Elke Krishna Paksha Chaturthi is gewijd aan een specifieke manifestatie
  // van Ganesha, bepaald door de Hindu maandnaam (maas).
  // Angaraki Chaturthi (dinsdag) vervangt de maandspecifieke naam op die dag.
  // ==========================================================================
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
  // --- Magha: Sakat Chauth (Lambodara) — zie magha_sakat_chauth hieronder ---
  {
    key: "magha_sakat_chauth",
    name: "Sakat Chauth",
    categories: ["ganesha"],
    aliases: ["Tilkut Chauth", "Lambodara Sankashti"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "MAGHA" },
    description:
      "Sakat Chauth, ook bekend als Tilkut Chauth of Lambodara Sankashti, valt op Krishna Chaturthi in de maand Magha. Lambodara ('hij met de ronde buik') symboliseert Ganesha die het gehele universum in zich draagt. Devotees vasten van zonsopgang tot maanopkomst en bieden til (sesam) laddoos en sesamzaad aan. Dit is de eerste Sankashti Chaturthi van het kalenderjaar en geldt als bijzonder heilig.",
    tags: ["ganesha", "lambodara", "sakat", "sankashti", "tilkut", "vasten"],
  },
  {
    key: "phalguna_dwijapriya_sankashti",
    name: "Dwijapriya Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "PHALGUNA" },
    description:
      "Dwijapriya betekent 'geliefd door de tweemaal-geborenen' — de Brahmins, geleerden en allen die de kennis-weg bewandelen. In deze manifestatie wordt Ganesha vereerd als beschermer van kennis, studie en Vedische tradities. Phalguna is de laatste maand van het Hindu jaar, waardoor deze Sankashti ook een afsluiting en zuivering symboliseert voor het nieuwe jaar. Devotees vasten van zonsopgang tot maanopkomst en reciteren de Ganesha Atharvashirsha.",
    tags: ["arghya", "darshan", "dwijapriya", "ganesha", "sankashti", "vasten"],
  },
  {
    key: "chaitra_bhalachandra_sankashti",
    name: "Bhalachandra Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "CHAITRA" },
    description:
      "Bhalachandra betekent 'hij met de halve maan op het voorhoofd'. In deze manifestatie draagt Ganesha de wassende sikkel van Chandra als ornament, waarmee hij verbonden is met de maancyclus en de stroom van de tijd. Chaitra is de eerste maand van het Hindu jaar, en Bhalachandra Sankashti valt kort na Ugadi/Gudi Padwa. Devotees vasten van zonsopgang tot maanopkomst en vereren de maan bij opkomst met een wateroffering.",
    tags: [
      "arghya",
      "bhalachandra",
      "chandra",
      "darshan",
      "ganesha",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "vaishakha_vikata_sankashti",
    name: "Vikata Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "VAISHAKHA" },
    description:
      "Vikata betekent 'de formidabele' of 'de buitengewone'. In deze krachtige manifestatie staat Ganesha bekend als verwijderaar van zelfs de hardnekkigste obstakels en overwindt hij Kama, de god van verlangen. Vaishakha is een bijzonder heilige maand. Devotees vasten van zonsopgang tot maanopkomst en reciteren de Sankat Nashan Ganesha Stotram.",
    tags: ["arghya", "darshan", "ganesha", "sankashti", "vasten", "vikata"],
  },
  {
    key: "jyeshtha_ekadanta_sankashti",
    name: "Ekadanta Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "JYESHTHA" },
    description:
      "Ekadanta betekent 'hij met één slagtand'. Ganesha brak zijn tweede slagtand om als pen te dienen bij het optekenen van de Mahabharata onder dictaat van Vyasa — symbool van totale toewijding aan kennis en offer. Dit is de traditionele naam voor de Sankashti van de reguliere Jyeshtha-maand. Devotees vasten van zonsopgang tot maanopkomst.",
    tags: ["arghya", "darshan", "ekadanta", "ganesha", "jyeshtha", "sankashti", "vasten"],
  },
  {
    key: "adhika_jyeshtha_vibhuvana_sankashti",
    name: "Vibhuvana Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "JYESHTHA", isAdhikaOnly: true },
    description:
      "Vibhuvana betekent 'hij die alle werelden doordringt en beheerst'. In deze alomtegenwoordige manifestatie is Ganesha aanwezig in alle drie de werelden. Deze Sankashti valt uitsluitend in jaren met een Adhika (schrikkel) Jyeshtha-maand — de extra schrikkelmaand krijgt zijn eigen Sankashti-naam buiten de reguliere twaalfmaandse cyclus. Devotees vasten van zonsopgang tot maanopkomst.",
    tags: [
      "adhika",
      "arghya",
      "darshan",
      "ganesha",
      "jyeshtha",
      "sankashti",
      "vasten",
      "vibhuvana",
    ],
  },
  {
    key: "ashadha_krishnapingala_sankashti",
    name: "Krishnapingala Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "ASHADHA" },
    description:
      "Krishnapingala betekent 'hij met donkere en goudgele ogen' of 'de donker-glinsterende'. Dit is een imposante manifestatie van Ganesha met een donkere tint en vurige gouden ogen die alle hindernissen verbranden. Ashadha markeert het begin van Chaturmas, de heilige regenmoesson-periode. Devotees vasten en offeren durva-gras en rode bloemen.",
    tags: [
      "arghya",
      "chaturmas",
      "darshan",
      "durva",
      "ganesha",
      "krishnapingala",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "shravana_gajanana_sankashti",
    name: "Gajanana Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "SHRAVANA" },
    description:
      "Gajanana betekent 'hij met het olifantsgezicht' — de meest fundamentele en bekende beschrijving van Ganesha. Shravana is een van de heiligste maanden van het jaar, gewijd aan zowel Shiva als Vishnu, en Gajanana Sankashti valt midden in deze intensief spirituele periode. Devotees vasten van zonsopgang tot maanopkomst en vereren het olifantsgezicht als symbool van wijsheid en kracht.",
    tags: ["arghya", "darshan", "gajanana", "ganesha", "sankashti", "shravana", "vasten"],
  },
  {
    key: "bhadrapada_heramba_sankashti",
    name: "Heramba Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "BHADRAPADA" },
    description:
      "Heramba betekent 'beschermer van de zwakken'. In deze bijzondere manifestatie heeft Ganesha vijf hoofden en tien armen en rijdt hij op een leeuw in plaats van zijn gebruikelijke muis. Heramba Ganapati is de beschermer in tijden van gevaar en wordt bijzonder vereerd in Nepal en de Himalaya-regio. Bhadrapada is ook de maand van het grote Ganesh Chaturthi-festival, waardoor de hele maand in het teken staat van Ganesha.",
    tags: [
      "arghya",
      "bhadrapada",
      "darshan",
      "ganesha",
      "heramba",
      "leeuw",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "ashwina_vighnaraja_sankashti",
    name: "Vighnaraja Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "ASHWIN" },
    description:
      "Vighnaraja betekent 'Koning der obstakels'. Als heer over alle hindernissen kan Ganesha ze zowel scheppen als verwijderen. In deze manifestatie wordt hij vereerd om zijn kracht als obstakelbeheerser te richten op het wegnemen van blokkades in het leven van de toegewijde. Ashwina volgt op de grote Navaratri-periode. Devotees vasten van zonsopgang tot maanopkomst.",
    tags: ["arghya", "darshan", "ganesha", "sankashti", "vasten", "vighnaraja"],
  },
  {
    key: "kartika_vakratunda_sankashti",
    name: "Vakratunda Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "KARTIK" },
    description:
      "Vakratunda betekent 'hij met de gekromde slurf'. Dit is de eerste en meest primaire van de 32 klassieke vormen van Ganesha. Vakratunda rijdt op een leeuw en staat bekend als verwijderaar van hoogmoed en vals bewustzijn. Kartika is een bijzonder heilige maand die volgt op de Sharad Navaratri. Devotees vasten van zonsopgang tot maanopkomst.",
    tags: [
      "arghya",
      "darshan",
      "ganesha",
      "kartika",
      "sankashti",
      "vakratunda",
      "vasten",
    ],
  },
  {
    key: "margashirsha_ganadhipa_sankashti",
    name: "Ganadhipa Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "MARGASHIRSHA" },
    description:
      "Ganadhipa betekent 'Heer van de Gana's' — de hemelse wezens die Shiva dienen. Als aanvoerder van het goddelijke gevolg van Shiva heeft Ganesha gezag over alle ganas. In de Bhagavad Gita noemt Krishna de maand Margashirsha als zijn favoriete maand, waardoor ook deze Sankashti een bijzondere heiligheid draagt. Devotees vasten van zonsopgang tot maanopkomst.",
    tags: [
      "arghya",
      "darshan",
      "ganadhipa",
      "ganesha",
      "margashirsha",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "pausha_akhuratha_sankashti",
    name: "Akhuratha Sankashti Chaturthi",
    categories: ["ganesha"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "PAUSHA" },
    description:
      "Akhuratha betekent 'hij wiens rijdier de muis is' (Akhura = muis, ratha = voertuig). De muis Mushika vertegenwoordigt ego en verlangen die Ganesha beheerst en berijdt — symbool voor de overwinning van wijsheid op de verspreide geest. Pausha is een koude wintermaand, en deze Sankashti is de laatste van het Vikrama Samvat-jaar, wat haar een krachtig moment van bezinning en zuivering maakt.",
    tags: [
      "akhuratha",
      "arghya",
      "darshan",
      "ganesha",
      "muis",
      "pausha",
      "sankashti",
      "vasten",
    ],
  },
  {
    key: "bhadrapada_bahula_chaturthi",
    name: "Bahula Chaturthi",
    categories: ["general"],
    aliases: ["Bahula Chauth"],
    eventType: "VRAT",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_KRISHNA", maas: "BHADRAPADA" },
    description:
      "Bahula Chaturthi is een vastendag gewijd aan de koe (Gau Mata) en moederliefde. Het verhaal gaat over Bahula, een vrome koe die op weg naar haar kalf werd tegengehouden door een leeuw. Ze beloofde hem terug te keren na haar kalf te hebben gevoed — en ze hield haar woord, ook wetende dat de dood haar wachtte. De leeuw was zo diep bewogen door haar trouw en moederliefde dat hij haar vrijliet. Vrouwen vasten voor het welzijn van hun kinderen en vee, en bieden gras en voedsel aan koeien aan als daad van verering.",
    tags: ["bahula", "gau", "kinderen", "koe", "moeder", "vasten", "vee"],
  },
  {
    key: "magha_ganesh_jayanti",
    name: "Ganesh Jayanti",
    categories: ["ganesha"],
    aliases: ["Gauriganesha Chaturthi"],
    eventType: "JAYANTI",
    ruleType: "TITHI",
    ruleConfig: { tithi: "CHATURTHI_SHUKLA", maas: "MAGHA" },
    timingType: "MADHYAHNA",
    description:
      "Geboortedag van Lord Ganesha volgens de Magha traditie, ook bekend als Gauriganesha Chaturthi. Wordt gevierd op Shukla Chaturthi in de Magha maand. Devotees vasten, voeren madhyahna-puja's uit en bieden modak en durva-gras aan.",
    tags: [
      "chaturthi",
      "durva",
      "ganesha",
      "geboorte",
      "jayanti",
      "madhyahna",
      "modak",
      "vinayaka",
    ],
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
    key: "bhadrapada_vamana_jayanti",
    name: "Vamana Jayanti",
    categories: ["vishnu"],
    eventType: "JAYANTI",
    ruleType: "TITHI_NAKSHATRA",
    ruleConfig: { tithi: "DWADASHI_SHUKLA", nakshatra: "SHRAVANA", maas: "BHADRAPADA" },
    description:
      "Verschijningsdag van Heer Vamana, de vijfde avatar van Heer Vishnu en Zijn eerste incarnatie in menselijke gedaante. Geboren op de Dwadashi tithi van Bhadrapada Shukla Paksha onder de Shravana nakshatra, als zoon van godin Aditi en rishi Kashyapa. Vamana — de dwerg-brahmaan — manifesteerde zich om de hemel (Swarga Loka) te bevrijden van de tirannieke doch vrome koning Bali. Door in drie stappen (Trivikrama) hemel en aarde te doormeten, en Bali's hoofd als derde stap te aanvaarden, stuurde Hij hem naar de onderwereld (Patala Loka) en herstelde Hij het bestuur van Indra. Als blijk van respect voor de overgave van Bali schonk Vishnu hem het recht zijn onderdanen eenmaal per jaar te bezoeken — dit thuisbezoek wordt in Kerala gevierd als Onam en elders als Bali Pratipada. Gelovigen vasten, verrichten Vishnu puja en reciteren de Vishnu Sahasranama.",
    tags: [
      "avatar",
      "bali",
      "bhadrapada",
      "dwadashi",
      "jayanti",
      "shravana nakshatra",
      "trivikrama",
      "vamana",
      "vishnu",
      "vishnu sahasranama",
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
