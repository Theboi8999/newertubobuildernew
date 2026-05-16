export const PHI = 1.618033988749895

export interface BuildingProportions {
  windowWidth: number
  windowHeight: number
  windowSpacing: number
  columnSpacing: number
  bandHeight: number
  parapetHeight: number
  corniceHeight: number
  plinthHeight: number
  pilasterWidth: number
  eaveOverhang: number
}

export function calculateProportions(
  tw: number,
  fh: number,
  _fc: number,
  spec?: string
): BuildingProportions {
  const isNarrow = !!spec && (spec.includes('shophouse') || spec.includes('terrace') || tw < 40)

  const windowHeight = round1(fh * 0.55)
  const windowWidth = round1(windowHeight / PHI)
  const windowSpacing = round1(windowWidth * PHI)
  const columnSpacing = round1(fh * PHI)

  const bandHeight = isNarrow ? 1.5 : 1.8
  const parapetHeight = Math.max(2.5, round1(fh * 0.35))
  const corniceHeight = Math.max(1.0, round1(fh * 0.10))
  const plinthHeight = Math.max(2.0, round1(fh * 0.18))
  const pilasterWidth = isNarrow ? 2.0 : 2.5
  const eaveOverhang = Math.max(1.0, round1(fh * 0.15))

  return { windowWidth, windowHeight, windowSpacing, columnSpacing, bandHeight, parapetHeight, corniceHeight, plinthHeight, pilasterWidth, eaveOverhang }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
