export type FacadeToken =
  | 'PILASTER' | 'WINDOW' | 'DOOR' | 'SHUTTER' | 'BALCONY'
  | 'ARCH' | 'GARAGEDOOR' | 'TOWER' | 'GATE' | 'BLANK'

export interface FacadeElement {
  type: FacadeToken
  x: number
  width: number
  height: number
}

const TOKEN_REL_WIDTHS: Record<FacadeToken, number> = {
  PILASTER: 0.5,
  WINDOW: 1.0,
  DOOR: 1.2,
  SHUTTER: 1.0,
  BALCONY: 1.5,
  ARCH: 1.2,
  GARAGEDOOR: 3.0,
  TOWER: 1.5,
  GATE: 2.0,
  BLANK: 1.0,
}

function tokenHeight(type: FacadeToken, fh: number): number {
  switch (type) {
    case 'PILASTER':    return fh
    case 'WINDOW':      return fh * 0.55
    case 'DOOR':        return fh * 0.75
    case 'SHUTTER':     return fh * 0.55
    case 'BALCONY':     return fh * 0.40
    case 'ARCH':        return fh * 0.70
    case 'GARAGEDOOR':  return fh * 0.85
    case 'TOWER':       return fh
    case 'GATE':        return fh * 0.85
    case 'BLANK':       return fh
    default:            return fh * 0.50
  }
}

export function parseFacadeGrammar(
  grammar: string,
  tw: number,
  fh: number,
  margin = 2.0
): FacadeElement[] {
  const tokens = grammar
    .toUpperCase()
    .split('|')
    .map(t => t.trim())
    .filter(Boolean) as FacadeToken[]

  if (tokens.length === 0) return []

  const availW = Math.max(4, tw - margin * 2)
  const totalRel = tokens.reduce((s, t) => s + (TOKEN_REL_WIDTHS[t] ?? 1.0), 0)

  const elements: FacadeElement[] = []
  let cx = margin

  for (const token of tokens) {
    const rel = TOKEN_REL_WIDTHS[token] ?? 1.0
    const w = (rel / totalRel) * availW
    elements.push({
      type: token,
      x: cx + w / 2,
      width: w,
      height: tokenHeight(token, fh),
    })
    cx += w
  }

  return elements
}
