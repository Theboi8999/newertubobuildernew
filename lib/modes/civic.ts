import type { BlueprintPart } from '../blueprint-compiler'

interface CivicInput {
  tw: number
  td: number
  fh: number
  fc: number
  wallBase: number
  ec: string
  em: string
  rc: string
  ac: string
  hasColonnade: boolean
  colonnadeDepth: number
  roofType: 'flat' | 'dome' | 'pediment'
}

export function buildCivic(i: CivicInput): BlueprintPart[] {
  const parts: BlueprintPart[] = []
  const { tw, td, fh, fc, wallBase, ec, em, rc, ac, hasColonnade, colonnadeDepth, roofType } = i

  let seq = 1
  function p(name: string, color: string, material: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
    parts.push({ name: `CIV_${name}_${seq++}`, color, material, x, y, z, sx, sy, sz })
  }

  // Foundation / podium — civic buildings have raised podiums
  const podiumH = wallBase + 1.5
  p('Podium', ec, em, 0, podiumH / 2, 0, tw + 2, podiumH, td + 2)
  // Podium steps
  for (let s = 0; s < 4; s++) {
    p('Step', ec, em, 0, s * 0.6, td / 2 + 1 + s * 0.5, tw - s * 2, 0.6, 1.2)
  }

  // Colonnade / portico on front face
  if (hasColonnade) {
    const colH = fh * 1.2
    const colCount = Math.max(4, Math.floor(tw / 8))
    const colSpacing = tw / colCount
    const colD = colonnadeDepth

    for (let c = 0; c < colCount; c++) {
      const cx = -tw / 2 + colSpacing * (c + 0.5)
      const colW = 1.8
      // Shaft
      p('ColShaft', ac, 'SmoothPlastic', cx, podiumH + colH / 2, td / 2 + colD / 2, colW, colH, colW)
      // Capital (Ionic scroll suggestion)
      p('ColCapital', ac, 'SmoothPlastic', cx, podiumH + colH + 0.5, td / 2 + colD / 2, colW + 1.0, 1.0, colW + 0.6)
      // Base
      p('ColBase', ac, 'SmoothPlastic', cx, podiumH + 0.4, td / 2 + colD / 2, colW + 0.8, 0.8, colW + 0.6)
    }

    // Entablature (architrave + frieze + cornice)
    const entY = podiumH + colH
    p('Architrave', ac, 'SmoothPlastic', 0, entY + 0.6, td / 2 + colD / 2, tw + 0.5, 1.2, colD + 0.5)
    p('Frieze', ec, em, 0, entY + 1.8, td / 2 + colD / 2, tw + 0.5, 1.5, colD)
    p('Cornice', ac, 'SmoothPlastic', 0, entY + 2.8, td / 2 + colD / 2, tw + 1.5, 0.8, colD + 1.0)
  }

  // Main walls per floor
  for (let f = 0; f < fc; f++) {
    const floorY = podiumH + f * fh + fh / 2

    p('WallFront', ec, em, 0, floorY, td / 2, tw, fh, 0.8)
    p('WallBack', ec, em, 0, floorY, -td / 2, tw, fh, 0.8)
    p('WallLeft', ec, em, -tw / 2, floorY, 0, 0.8, fh, td)
    p('WallRight', ec, em, tw / 2, floorY, 0, 0.8, fh, td)
    p('FloorSlab', 'Medium stone grey', 'SmoothPlastic', 0, podiumH + f * fh, 0, tw, 0.4, td)

    // Horizontal banding between floors (classical string courses)
    if (f < fc - 1) {
      p('StringCourse', ac, 'SmoothPlastic', 0, podiumH + (f + 1) * fh - 0.5, td / 2 + 0.05, tw + 0.6, 0.8, 0.5)
      p('StringCourse', ac, 'SmoothPlastic', 0, podiumH + (f + 1) * fh - 0.5, -td / 2 - 0.05, tw + 0.6, 0.8, 0.5)
    }

    // Windows — tall arched windows
    const winW = 3.5
    const winH = fh * 0.55
    const winY = floorY + fh * 0.05
    const winCount = Math.max(2, Math.floor(tw / 9))
    const winSpacing = tw / winCount

    for (let w = 0; w < winCount; w++) {
      const wx = -tw / 2 + winSpacing * (w + 0.5)
      // Skip center on ground floor for entrance
      if (f === 0 && w === Math.floor(winCount / 2)) continue
      p('Win', 'Light blue', 'Glass', wx, winY, td / 2 + 0.1, winW, winH, 0.2)
      p('WinFrame', ac, 'SmoothPlastic', wx, winY, td / 2 + 0.15, winW + 0.4, winH + 0.5, 0.25)
      // Arch head
      p('WinArch', ac, 'SmoothPlastic', wx, winY + winH / 2 + 0.3, td / 2 + 0.15, winW + 0.4, 0.6, 0.25)
      // Lintel above arch
      p('WinLintel', ac, 'SmoothPlastic', wx, winY + winH / 2 + 1.0, td / 2 + 0.18, winW + 1.2, 0.35, 0.4)
      // Sill
      p('WinSill', ac, 'SmoothPlastic', wx, winY - winH / 2 - 0.1, td / 2 + 0.2, winW + 1.0, 0.4, 0.5)
    }

    // Cornice belt at top of each floor
    p('Cornice', ac, 'SmoothPlastic', 0, podiumH + (f + 1) * fh - 0.4, td / 2 + 0.08, tw + 0.8, 0.8, 0.5)

    // Grand entrance — ground floor only
    if (f === 0) {
      const entCx = 0
      const entW = 5
      const entH = fh * 0.85
      p('EntDoor', ac, 'SmoothPlastic', entCx, podiumH + entH / 2, td / 2 + 0.1, entW, entH, 0.3)
      p('EntDoorFrame', ac, 'SmoothPlastic', entCx, podiumH + entH / 2, td / 2 + 0.15, entW + 0.6, entH + 0.4, 0.3)
      p('EntArch', ac, 'SmoothPlastic', entCx, podiumH + entH + 0.4, td / 2 + 0.15, entW + 0.6, 0.8, 0.3)
      // Portico beam above entrance
      p('EntPortico', ac, 'SmoothPlastic', entCx, podiumH + entH + 1.6, td / 2 + 0.5, entW + 3.0, 1.0, 2.0)
      // 2 flanking columns
      for (const sign of [-1, 1]) {
        const colX = sign * (entW / 2 + 1.2)
        p('EntCol', ac, 'SmoothPlastic', colX, podiumH + entH / 2, td / 2 + 1.2, 1.2, entH, 1.2)
      }
      // 3 entrance steps
      for (let s = 0; s < 3; s++) {
        p('EntStep', ec, em, entCx, podiumH - 0.3 - s * 0.6, td / 2 + 0.8 + s * 0.9, entW + s * 1.4, 0.6, 1.8)
      }
    }
  }

  // Roof
  const roofY = podiumH + fc * fh
  if (roofType === 'flat') {
    p('Roof', rc, 'SmoothPlastic', 0, roofY + 0.4, 0, tw + 1, 0.8, td + 1)
    // Parapet
    p('Parapet', ec, em, 0, roofY + 1.5, 0, tw + 1, 2.5, td + 1)
    p('ParapetCap', ac, 'SmoothPlastic', 0, roofY + 2.8, 0, tw + 2, 0.5, td + 2)
  } else if (roofType === 'dome') {
    // Central dome suggestion
    p('DomeBase', rc, 'SmoothPlastic', 0, roofY + 1, 0, tw * 0.4, 2, tw * 0.4)
    p('Dome', rc, 'SmoothPlastic', 0, roofY + 5, 0, tw * 0.35, 8, tw * 0.35)
    p('Lantern', ac, 'SmoothPlastic', 0, roofY + 9, 0, 3, 4, 3)
    // Flat roof around dome
    p('Roof', rc, 'SmoothPlastic', 0, roofY + 0.4, 0, tw + 1, 0.8, td + 1)
  } else {
    // Pediment
    p('PedimentLeft', rc, 'SmoothPlastic', -tw / 4, roofY + 2, td / 2 + 0.1, tw / 2, 4, 0.6)
    p('PedimentRight', rc, 'SmoothPlastic', tw / 4, roofY + 2, td / 2 + 0.1, tw / 2, 4, 0.6)
    p('Roof', rc, 'SmoothPlastic', 0, roofY + 0.4, 0, tw + 1, 0.8, td + 1)
  }

  // Corner quoins (all floors)
  const quoinH = 2
  const quoinPositions = [
    [-tw / 2 - 0.5, td / 2 + 0.5],
    [tw / 2 + 0.5, td / 2 + 0.5],
    [-tw / 2 - 0.5, -td / 2 - 0.5],
    [tw / 2 + 0.5, -td / 2 - 0.5],
  ]
  for (const [qx, qz] of quoinPositions) {
    for (let qf = 0; qf < fc; qf++) {
      const qCount = Math.floor(fh / quoinH)
      for (let qi = 0; qi < qCount; qi++) {
        p('Quoin', ac, em, qx, podiumH + qf * fh + qi * quoinH + quoinH / 2, qz, 1.2, quoinH - 0.2, 1.2)
      }
    }
  }

  return parts
}
