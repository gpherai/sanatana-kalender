import { SAMVATSARA_NAMES } from "../../constants";

// Reference: Drik Panchang verification (2082 Vikrama = Kalayukta, 1947 Shaka = Vishvavasu)
const VIKRAMA_SAMVATSARA_OFFSET = 9;
const SHAKA_SAMVATSARA_OFFSET = 11;

export function computeSamvatData(
  gregorianYear: number,
  gregorianMonth: number,
  maasIdx: number,
  isAdhika: boolean
) {
  // Vikrama (and Shaka) Samvat begin at Nija Chaitra Shukla Pratipada (≈ March/April).
  // The Gregorian year rolls over on 1 Jan — mid lunar-year — so the lunar months that
  // fall in Jan–March BEFORE Nija Chaitra still belong to the previous Samvat year and
  // must subtract 1. Pre-Chaitra lunar months:
  //   - Magha (idx 10, Jan–Feb)        → always before the new year
  //   - Phalguna (idx 11, Feb–Mar)     → always before the new year
  //   - Pausha (idx 9, Dec–Jan)        → only its JANUARY portion is before the new year
  // Adhika Chaitra does NOT trigger the year change — only Nija Chaitra does.
  const isBeforeChaitraNewYear =
    maasIdx === 10 ||
    maasIdx === 11 ||
    (maasIdx === 9 && gregorianMonth === 1) ||
    (maasIdx === 0 && isAdhika);
  const yearShift = isBeforeChaitraNewYear ? 1 : 0;
  const vikramaYear = gregorianYear + 57 - yearShift;
  const shakaYear = gregorianYear - 78 - yearShift;

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
