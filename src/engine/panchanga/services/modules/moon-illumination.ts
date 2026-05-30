import * as swisseph from "swisseph";
import { swe_pheno_ut } from "../../utils/astro";

export async function computeMoonIllumination(
  sunriseJD: number,
  flags: number,
  sunPos: { longitude: number },
  moonPos: { longitude: number }
) {
  const pheno = await swe_pheno_ut(sunriseJD, swisseph.SE_MOON, flags);
  const illumination = pheno.phaseIllum * 100;
  let elongation = moonPos.longitude - sunPos.longitude;
  if (elongation < 0) elongation += 360;
  const waxing = elongation < 180;
  return { illumination, waxing, phaseAngle: pheno.phaseAngle };
}
