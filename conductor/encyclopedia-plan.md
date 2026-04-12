# Encyclopedie Implementatieplan

## Objective
Het "Woordenboek" (`src/app/woordenboek`) upgraden naar een volwaardige "Encyclopedie". De huidige statische array in `src/lib/dictionary.ts` wordt vervangen door individuele Markdown/MDX-bestanden. Dit maakt het mogelijk om rijke, gestructureerde content (zoals etymologie, uitgebreide betekenis, rituelen en gerelateerde termen) per term te beheren, wat schaalbaarder is en de code schoon houdt.

## Scope & Impact
- **Nieuwe Dependencies:** Toevoegen van `next-mdx-remote` (voor het renderen van MDX) en `gray-matter` (voor het parsen van frontmatter).
- **Data Architectuur:** Nieuwe map `src/content/encyclopedia/` waar elke term zijn eigen `.mdx` bestand krijgt.
- **UI/UX:**
  - De bestaande woordenboek overzichtspagina wordt omgebouwd om data uit de MDX-bestanden te lezen.
  - Er komt een nieuwe dynamische detailpagina (bijv. `/woordenboek/[slug]`) om de uitgebreide informatie van een term te tonen.

## Implementation Steps

### 1. Setup Dependencies
- Installeer de benodigde packages voor MDX verwerking:
  `npm install next-mdx-remote gray-matter`
- Installeer evt. de types: `npm install -D @types/mdx`

### 2. Structuur & Template Creëren
- Maak de map `src/content/encyclopedia/` aan.
- Creëer een standaard MDX-template voor alle termen.
  **Voorbeeld (dharma.mdx):**
  ```mdx
  ---
  title: "Dharma"
  sanskrit: "dharma, धर्म"
  category: "Algemeen"
  shortDescription: "Een kernbegrip dat verwijst naar orde en juist handelen: plicht, ethiek en de manier van leven in harmonie met ṛta."
  ---

  ## Etymologie
  Afgeleid van de Sanskriet wortel *dhṛ*, wat "dragen" of "ondersteunen" betekent.

  ## Uitgebreide Betekenis
  [Gedetailleerde uitleg over Dharma...]

  ## Ritueel en Gebruik
  [Hoe het in de praktijk/dagelijks leven wordt toegepast...]

  ## Gerelateerde Termen
  - Adharma
  - Karma
  - Ṛta
  ```

### 3. Data Access Layer
- Maak een nieuwe utility `src/lib/encyclopedia.ts` met functies om de bestanden in te lezen:
  - `getAllTerms()`: Leest alle `.mdx` bestanden, parst de frontmatter via `gray-matter` en retourneert een gesorteerde lijst (voor de overzichtspagina).
  - `getTermBySlug(slug)`: Leest de inhoud van een specifiek bestand voor de detailpagina.

### 4. Migratie van Bestaande Termen
- Converteer de 41 bestaande termen uit `src/lib/dictionary.ts` naar individuele `.mdx` bestanden in `src/content/encyclopedia/`.
- Deel de huidige `definition` op in de gestructureerde secties (indien mogelijk) of vul ze tijdelijk als "Uitgebreide Betekenis" totdat er meer content beschikbaar is.

### 5. UI Updates
- **Overzichtspagina (`src/app/woordenboek/page.tsx`):**
  - Pas deze aan zodat hij `getAllTerms()` gebruikt.
  - Zorg dat de kaartjes klikbaar zijn en linken naar de detailpagina.
- **Detailpagina (`src/app/woordenboek/[slug]/page.tsx`):**
  - Bouw een nieuwe pagina die de MDX content rendert (met `MDXRemote` of een vergelijkbare Next.js MDX opzet).
  - Gebruik de bestaande design system componenten (zoals `Section`, kleuren, styling) om de MDX-secties (H2, paragrafen, lijsten) prachtig te renderen in lijn met de rest van de Sanatana Kalender.

### 6. Cleanup
- Verwijder het oude `src/lib/dictionary.ts` bestand zodra de migratie en UI-updates succesvol zijn afgerond.

## Verification & Testing
- Controleer of alle categorieën op de overzichtspagina correct laden.
- Navigeer naar een specifieke term en verifieer dat de MDX correct wordt geparst en gerenderd met de juiste styling.
- Voer `npm run validate` uit om te verzekeren dat er geen TypeScript, ESLint of Prettier fouten zijn geïntroduceerd.
