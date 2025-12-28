export interface DictionaryTerm {
  term: string;
  definition: string;
  category: "Algemeen" | "Astronomie" | "Devatās" | "Speciale dagen" | "Tijd";
}

export const DICTIONARY_TERMS: DictionaryTerm[] = [
  // Algemeen
  {
    term: "Dharma (dharma, धर्म)",
    definition: "Een kernbegrip dat verwijst naar orde en juist handelen: plicht, ethiek, rechtvaardigheid en de manier van leven die in harmonie is met ṛta (kosmische orde). Dharma verschilt per situatie (rol, levensfase, context) en gaat zowel over persoonlijke integriteit als maatschappelijke verantwoordelijkheid.",
    category: "Algemeen",
  },
  {
    term: "Japa (japa, जप)",
    definition: "De meditatieve herhaling van een mantra of godennaam, vaak met behulp van een mālā (gebedssnoer).",
    category: "Algemeen",
  },
  {
    term: "Jayantī (jayantī, जयन्ती)",
    definition: "De viering van de geboortedag van een godheid, avatāra of grote heilige (bijv. Gaṇeśa Jayantī of Hanumān Jayantī).",
    category: "Algemeen",
  },
  {
    term: "Pūjā (pūjā, पूजा)",
    definition: "Een ritueel eerbetoon aan een godheid of spiritueel ideaal. Het omvat vaak het offeren van licht (ārati), bloemen, water en voedsel (prasāda), vergezeld van mantra’s en gebeden.",
    category: "Algemeen",
  },
  {
    term: "Sādhana (sādhana, साधना)",
    definition: "Dagelijkse spirituele oefening of discipline gericht op het bereiken van een spiritueel doel, zuivering of zelfverwerkelijking.",
    category: "Algemeen",
  },
  {
    term: "Vrata (vrata, व्रत)",
    definition: "Een gelofte of spirituele discipline, meestal gepaard gaand met vasten en gebed op specifieke dagen (zoals Ekādaśī), bedoeld om zelfbeheersing te vergroten en devotie te verdiepen.",
    category: "Algemeen",
  },

  // Astronomie
  {
    term: "Ayanāṃśa (ayanāṃśa, अयनांश)",
    definition: "Het verschil in lengtegraad tussen de tropische (westerse) en siderische (Vedische) dierenriem, veroorzaakt door de precessie van de aardas.",
    category: "Astronomie",
  },
  {
    term: "Grahaṇa (grahaṇa, ग्रहण)",
    definition: "Een eclips. Sūrya-grahaṇa is een zonsverduistering en Candra-grahaṇa is een maansverduistering.",
    category: "Astronomie",
  },
  {
    term: "Karaṇa (karaṇa, करण)",
    definition: "Een halve tithi. Elke tithi bestaat uit twee karaṇa’s (1e helft en 2e helft). Er zijn 11 karaṇa-types: 7 “bewegende” die in een patroon herhalen, en 4 “vaste” die op specifieke momenten voorkomen.",
    category: "Astronomie",
  },
  {
    term: "Nakṣatra (nakṣatra, नक्षत्र)",
    definition: "Een maan-huis: de ecliptica is verdeeld in 27 sectoren van 13°20′. De maan beweegt gemiddeld in ongeveer één nakṣatra per dag.",
    category: "Astronomie",
  },
  {
    term: "Rāśi (rāśi, राशि)",
    definition: "Een dierenriemteken in de siderische (sterren-)dierenriem. Er zijn 12 rāśi’s (bijv. Meṣa/Aries, Vṛṣabha/Taurus, enz.).",
    category: "Astronomie",
  },
  {
    term: "Yoga (yoga, योग)",
    definition: "Een pañcāṅga-factor gebaseerd op de som van de lengtegraden van zon en maan. Deze som wordt ingedeeld in 27 yoga’s.",
    category: "Astronomie",
  },

  // Devatās
  {
    term: "Dattātreya (dattātreya, दत्तात्रेय)",
    definition: "Een manifestatie die de Trimūrti (Brahmā, Viṣṇu, Śiva) verenigt, vaak gezien als een Ādi Guru (oer-leraar) in meerdere tradities.",
    category: "Devatās",
  },
  {
    term: "Durgā (durgā, दुर्गा)",
    definition: "De onoverwinnelijke Moedergodin die de goddelijke śakti (kracht) belichaamt en negativiteit overwint.",
    category: "Devatās",
  },
  {
    term: "Gaṇeśa (gaṇeśa, गणेश)",
    definition: "De god met het olifantenhoofd, vereerd als wegnemer van hindernissen (Vighneśvara) en heer van wijsheid en een nieuw begin.",
    category: "Devatās",
  },
  {
    term: "Hanumān (hanumān, हनुमान्)",
    definition: "De toegewijde dienaar van Rāma, symbool van onbaatzuchtige dienstbaarheid, kracht, moed en devotie.",
    category: "Devatās",
  },
  {
    term: "Kṛṣṇa (kṛṣṇa, कृष्ण)",
    definition: "De achtste avatāra van Viṣṇu, leraar van de Bhagavad Gītā en symbool van goddelijke liefde, vreugde en wijsheid.",
    category: "Devatās",
  },
  {
    term: "Lakṣmī (lakṣmī, लक्ष्मी)",
    definition: "De godin van overvloed en welvaart (spiritueel én materieel), licht en voorspoed.",
    category: "Devatās",
  },
  {
    term: "Rāma (rāma, राम)",
    definition: "De zevende avatāra van Viṣṇu, bekend als Maryādā Puruṣottama (ideaal van juist handelen) en voorbeeld van dharma.",
    category: "Devatās",
  },
  {
    term: "Sarasvatī (sarasvatī, सरस्वती)",
    definition: "De godin van kennis, muziek, kunst, spraak en wijsheid.",
    category: "Devatās",
  },
  {
    term: "Śiva (śiva, शिव)",
    definition: "De transformator binnen de Trimūrti; verwoester van onwetendheid en belichaming van puur bewustzijn en transcendentie.",
    category: "Devatās",
  },
  {
    term: "Skanda (skanda, स्कन्द)",
    definition: "Ook bekend als Kārttikeya of Murugan; god van kracht, overwinning en leiding, zoon van Śiva en Pārvatī.",
    category: "Devatās",
  },
  {
    term: "Viṣṇu (viṣṇu, विष्णु)",
    definition: "De instandhouder binnen de Trimūrti. Hij incarneert als diverse avatāra’s (zoals Rāma en Kṛṣṇa) om dharma te herstellen.",
    category: "Devatās",
  },

  // Speciale dagen
  {
    term: "Amāvasyā (amāvasyā, अमावस्या)",
    definition: "De nieuwe maan: de maan staat dicht bij de zon en de nacht is relatief donker. Vaak geassocieerd met voorouderrituelen (zoals pitṛ-tarpaṇa) en verstilling.",
    category: "Speciale dagen",
  },
  {
    term: "Ekādaśī (ekādaśī, एकादशी)",
    definition: "De 11e tithi van elke pakṣa. Komt twee keer per maanmaand voor. Traditioneel een heilige dag voor Viṣṇu-verering.",
    category: "Speciale dagen",
  },
  {
    term: "Pradoṣa / Pradosham (pradoṣa, प्रदोष)",
    definition: "Een gunstige periode rond zonsondergang op Trayodaśī (de 13e tithi), vooral heilig voor Śiva.",
    category: "Speciale dagen",
  },
  {
    term: "Pūrṇimā (pūrṇimā, पूर्णिमा)",
    definition: "De volle maan. Wordt als gunstig beschouwd voor spirituele beoefening, japa en pūjā.",
    category: "Speciale dagen",
  },
  {
    term: "Saṅkrānti (saṅkrānti, संक्रान्ति)",
    definition: "De overgang van de zon naar een nieuwe rāśi (siderisch). Dit markeert het begin van een nieuwe zonnemaand.",
    category: "Speciale dagen",
  },

  // Tijd
  {
    term: "Adhika Māsa (adhika māsa, अधिक मास)",
    definition: "Een schrikkelmaand in de hindoeïstische kalender, toegevoegd om de maanmaanden in pas te houden met het zonnejaar.",
    category: "Tijd",
  },
  {
    term: "Amānta (amānta, अमान्त)",
    definition: "Maankalendersysteem waarbij de maand eindigt op Amāvasyā (nieuwe maan).",
    category: "Tijd",
  },
  {
    term: "Kṛṣṇa Pakṣa (kṛṣṇa pakṣa, कृष्ण पक्ष)",
    definition: "De afnemende (donkere) helft van de maanmaand: van Pūrṇimā naar Amāvasyā.",
    category: "Tijd",
  },
  {
    term: "Māsa (māsa, मास)",
    definition: "Een maand in de hindoeïstische kalender, doorgaans gebaseerd op de maancyclus (amānta of pūrṇimānta).",
    category: "Tijd",
  },
  {
    term: "Pakṣa (pakṣa, पक्ष)",
    definition: "Een halve maanmaand, bestaande uit 15 tithi’s: Śukla Pakṣa (wassend) of Kṛṣṇa Pakṣa (afnemend).",
    category: "Tijd",
  },
  {
    term: "Praviṣṭe / Gate (praviṣṭe / gate, प्रविष्टे / गते)",
    definition: "Dagenteller binnen een zonnemaand vanaf saṅkrānti: gate betekent “zoveel dagen verstreken”, praviṣṭe duidt de “lopende/ingegane” dag sinds saṅkrānti.",
    category: "Tijd",
  },
  {
    term: "Pūrṇimānta (pūrṇimānta, पूर्णिमान्त)",
    definition: "Maankalendersysteem waarbij de maand eindigt op Pūrṇimā (volle maan).",
    category: "Tijd",
  },
  {
    term: "Rāhukāla (rāhukāla, राहुकाल)",
    definition: "Een dagelijks tijdvak dat traditioneel als minder gunstig geldt voor nieuwe starten. De lengte is 1/8 van de daglichtperiode (dus varieert per dag).",
    category: "Tijd",
  },
  {
    term: "Saṃvatsara (saṃvatsara, संवत्सर)",
    definition: "Een jaar binnen een cyclus van 60 jaar, waarbij elk jaar een eigen naam draagt.",
    category: "Tijd",
  },
  {
    term: "Śaka Saṃvat (śaka saṃvat, शक संवत्)",
    definition: "Een jaartelling die in India officieel gebruikt wordt als nationale kalender, traditioneel beginnend in 78 n.Chr.",
    category: "Tijd",
  },
  {
    term: "Śukla Pakṣa (śukla pakṣa, शुक्ल पक्ष)",
    definition: "De wassende (heldere) helft van de maanmaand: van Amāvasyā naar Pūrṇimā.",
    category: "Tijd",
  },
  {
    term: "Tithi (tithi, तिथि)",
    definition: "Een “maan-dag”: de tijd waarin de hoekafstand tussen maan en zon met 12° toeneemt. Er zijn 30 tithi’s per maanmaand.",
    category: "Tijd",
  },
  {
    term: "Udaya Tithi (udaya tithi, उदय तिथि)",
    definition: "De tithi die heerst op het moment van zonsopgang; in veel kalenders bepalend voor de “dag-tithi”.",
    category: "Tijd",
  },
  {
    term: "Vāra (vāra, वार)",
    definition: "Een dag van de week (bijv. Somavāra). Elke dag is traditioneel verbonden met een specifieke graha.",
    category: "Tijd",
  },
  {
    term: "Vikrama Saṃvat (vikrama saṃvat, विक्रम संवत्)",
    definition: "Een historische hindoeïstische jaartelling, meestal ongeveer 56–57 jaar vóór/voorlopend t.o.v. de gregoriaanse jaartelling (afhankelijk van regio en maand-systeem).",
    category: "Tijd",
  },
];