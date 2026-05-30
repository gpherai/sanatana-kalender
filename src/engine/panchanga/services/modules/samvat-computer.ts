import { SAMVATSARA_NAMES } from "../../constants";

// Reference: Drik Panchang verification (2082 Vikrama = Kalayukta, 1947 Shaka = Vishvavasu)
const VIKRAMA_SAMVATSARA_OFFSET = 9;
const SHAKA_SAMVATSARA_OFFSET = 11;

export function computeSamvatData(
  gregorianYear: number,
  maasIdx: number,
  isAdhika: boolean
) {
  // Vikrama Samvat begins at Nija Chaitra Shukla Pratipada.
  // Adhika Chaitra does NOT trigger the year change — only Nija Chaitra does.
  const isNewYearOpen = maasIdx !== 11 && !(maasIdx === 0 && isAdhika);
  const vikramaYear = gregorianYear + 57 - (isNewYearOpen ? 0 : 1);
  const shakaYear = gregorianYear - 78 - (isNewYearOpen ? 0 : 1);

  const vikramaSamvatsaraIdx = (vikramaYear + VIKRAMA_SAMVATSARA_OFFSET) % 60;
  const shakaSamvatsaraIdx = (shakaYear + SHAKA_SAMVATSARA_OFFSET) % 60;

  return {
    vikramaYear,
    shakaYear,
    vikramaSamvatsaraIdx,
    shakaSamvatsaraIdx,
    vikramaSamvatsaraName: SAMVATSARA_NAMES[vikramaSamvatsaraIdx] ?? "Unknown",
    shakaSamvatsaraName: SAMVATSARA_NAMES[shakaSamvatsaraIdx] ?? "Unknown",
  };
}
