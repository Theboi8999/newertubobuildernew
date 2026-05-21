import type { BlueprintPart } from '../blueprint-compiler'

interface ResidentialInput {
  tw: number        // total width
  td: number        // total depth
  fh: number        // floor height
  fc: number        // floor count
  wallBase: number
  ec: string        // exterior color
  em: string        // exterior material
  rc: string        // roof color
  ac: string        // accent color
  hasBalcony: boolean
  hasGarage: boolean
  roofType: 'shed' | 'gable' | 'hip' | 'flat'
}

export function buildResidential(i: ResidentialInput): BlueprintPart[] {
  const parts: BlueprintPart[] = []
  const { tw, td, fh, fc, wallBase, ec, em, rc, ac, hasBalcony, hasGarage, roofType } = i

  console.log('[residential] tw:', tw, 'td:', td, 'fh:', fh, 'fc:', fc, 'roofType:', roofType)
  console.log('[TRACE] buildResidential called with fc:', fc, 'tw:', tw)
  console.log('[TRACE] hasGarage:', hasGarage, 'hasBalcony:', hasBalcony)
  console.log('[res] em value:', em, 'ec value:', ec)

  let seq = 1
  function p(name: string, color: string, material: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, transparency = 0): void {
    parts.push({ name: `RES_${name}_${seq++}`, color, material, x, y, z, sx, sy, sz, transparency })
  }

  const timberColor = 'Sand yellow'
  const timberMat = 'wood'
  const garageDoorColor = 'Medium stone grey'
  // front wall face at z=0; building extends into negative z (centre = -td/2, back = -td)
  const frontZ = 0

  // ── Walls + windows per floor ─────────────────────────────────────────────────
  for (let f = 0; f < fc; f++) {
    const floorBot = wallBase + f * fh
    const floorMid = floorBot + fh / 2

    // Solid brick shell (all 4 faces)
    const wFront = f === 0 ? 'WallFront' : 'WF_U_Front'
    const wBack  = f === 0 ? 'WallBack'  : 'WF_U_Back'
    const wLeft  = f === 0 ? 'WallLeft'  : 'WF_U_Left'
    const wRight = f === 0 ? 'WallRight' : 'WF_U_Right'
    p(wFront, ec, 'brick', 0,       floorMid, frontZ - 0.4, tw,  fh, 0.8)
    p(wBack,  ec, 'brick', 0,       floorMid, -td,       tw,  fh, 0.8)
    p(wLeft,  ec, 'brick', -tw / 2, floorMid, -td / 2,   0.8, fh, td)
    p(wRight, ec, 'brick',  tw / 2, floorMid, -td / 2,   0.8, fh, td)

    // Concrete floor slab
    p('FloorSlab', 'Medium stone grey', 'concrete', 0, floorBot, -td / 2, tw, 0.4, td)

    if (f === 0) {
      // ── GROUND FLOOR ─────────────────────────────────────────────────────────
      if (hasGarage) {
        // Two large garage doors — each 19 studs wide, 9 studs tall
        const garW = 19
        const garH = 9
        const garGap = 0.8
        const garLeftEdge = -tw / 2 + 0.5

        const g1x = garLeftEdge + garW / 2
        const g2x = garLeftEdge + garW + garGap + garW / 2
        console.log('garage doors at x:', g1x, g2x)

        let gIdx = 0
        for (const gx of [g1x, g2x]) {
          // Dark frame border around door (behind panels)
          p(`GarFrame_${gIdx}`, 'Really black', 'smoothplastic', gx, wallBase + garH / 2, frontZ + 0.05, garW + 0.4, garH + 0.3, 0.4)
          // 3 horizontal panels per door
          const panH = garH / 3
          for (let gp = 0; gp < 3; gp++) {
            p(`GarPanel_${gIdx}`, garageDoorColor, 'smoothplastic',
              gx, wallBase + panH * (gp + 0.5), frontZ + 0.18, garW - 0.5, panH - 0.25, 0.25)
          }
          // 2 horizontal shadow lines between panels
          for (let gp = 1; gp < 3; gp++) {
            p(`GarBar_${gIdx}`, ac, 'smoothplastic',
              gx, wallBase + panH * gp, frontZ + 0.22, garW - 0.5, 0.22, 0.16)
          }
          // Vertical centre rail
          p(`GarCRail_${gIdx}`, ac, 'smoothplastic', gx, wallBase + garH / 2, frontZ + 0.22, 0.28, garH, 0.16)
          // Narrow window strip at top of door
          p(`GarTopWin_${gIdx}`, 'Institutional white', 'smoothplastic', gx, wallBase + garH + 0.3, frontZ + 0.20, garW - 1.0, 0.6, 0.15, 0.12)
          gIdx++
        }

        // ONE small window to the right of garage doors
        const rightEdge = tw / 2 - 0.5
        const g2RightEdge = g2x + garW / 2
        const rightSpace = rightEdge - g2RightEdge
        if (rightSpace >= 4) {
          const swW = Math.min(rightSpace - 2, 7)
          const swH = fh * 0.38
          const swX = g2RightEdge + rightSpace / 2
          const swY = wallBase + fh * 0.42
          // Black recess
          p('WRec',     ac,                   'smoothplastic', swX, swY, frontZ + 0.02, swW + 1.0, swH + 0.6, 0.25)
          // Glass
          p('Win',      'Institutional white', 'smoothplastic', swX, swY, frontZ + 0.08, swW,       swH,       0.15, 0.12)
          // Frame
          p('WinFrame', ac,                   'smoothplastic', swX, swY, frontZ + 0.12, swW + 0.4, swH + 0.4, 0.18)
          // H-bar + V-bar
          p('WinHBar',  ac, 'smoothplastic', swX, swY, frontZ + 0.15, swW, 0.22, 0.14)
          p('WinVBar',  ac, 'smoothplastic', swX, swY, frontZ + 0.15, 0.22, swH, 0.14)
        }

        // Front door (right of small window zone, within building)
        const doorX = g2x + garW / 2 + 1 + 1.5
        if (doorX + 1.5 < tw / 2 - 0.5) {
          const doorH = fh * 0.72
          p('Door',      'Reddish brown', 'wood',          doorX, wallBase + doorH / 2, frontZ + 0.08, 2.5,       doorH,       0.15)
          p('DoorFrame', ac,              'smoothplastic', doorX, wallBase + doorH / 2, frontZ + 0.12, 3.0, doorH + 0.4, 0.18)
        }

      } else {
        // No garage — evenly spaced windows
        const winCount = Math.max(2, Math.floor(tw / 9))
        const winSpacing = tw / winCount
        const winW = 4
        const winH = fh * 0.45
        const winY = wallBase + fh * 0.5
        for (let w = 0; w < winCount; w++) {
          const wx = -tw / 2 + winSpacing * (w + 0.5)
          p('Win',      'Institutional white', 'smoothplastic', wx, winY, frontZ + 0.08, winW,       winH,       0.15, 0.12)
          p('WinFrame', ac,                   'smoothplastic', wx, winY, frontZ + 0.12, winW + 0.4, winH + 0.4, 0.18)
        }
      }

    } else {
      // ── UPPER FLOOR: 3 large portrait windows with 4-pane grid ───────────────
      const winCount = 3
      const winSpacing = tw / winCount
      const winW = fh * 0.65   // portrait: narrower than tall
      const winH = fh * 0.76
      const winY = floorBot + fh * 0.5

      for (let w = 0; w < winCount; w++) {
        const wx = -tw / 2 + winSpacing * (w + 0.5)

        // Thin dark backing behind glass (shadow box)
        p(`Win_${f}_Rec`,   ec,                    'smoothplastic', wx, winY, frontZ + 0.04, winW + 1.0, winH + 1.0, 0.35)
        // Glass pane proud of wall face
        p(`Win_${f}`,       'Institutional white', 'smoothplastic', wx, winY, frontZ + 0.20, winW - 0.3, winH - 0.3, 0.15, 0.15)
        // Outer frame (between recess and glass)
        p(`Win_${f}_Frame`, ac,                   'smoothplastic', wx, winY, frontZ + 0.12, winW + 0.6, winH + 0.6, 0.35)
        // Horizontal mid-bar
        p(`Win_${f}_HBar`,  ac,                   'smoothplastic', wx, winY, frontZ + 0.15, winW,       0.3,        0.22)
        // Vertical mid-bar
        p(`Win_${f}_VBar`,  ac,                   'smoothplastic', wx, winY, frontZ + 0.15, 0.3,        winH,       0.22)
        // Window sill
        p(`Win_${f}_Sill`,  ec,                   em,              wx, winY - winH / 2 - 0.3, frontZ + 0.2, winW + 1.2, 0.4, 0.55)
      }
    }
  }

  // ── BALCONY (extends in NEGATIVE z, in front of building face) ──────────────
  if (hasBalcony) {
    const balW = tw * 0.70
    const balD = 4.0
    const balY = wallBase + fh

    // Single concrete slab extending forward (negative z)
    p('BalConc', 'Light stone grey', 'concrete',
      0, balY + 0.25, frontZ + balD / 2, balW, 0.5, balD)

    // Timber deck on top
    p('BalDeck', timberColor, timberMat,
      0, balY + 0.6, frontZ + balD / 2, balW - 0.2, 0.2, balD - 0.2)

    // Posts along front edge (most negative z)
    const postSpacing = 2.5
    const postCount = Math.floor(balW / postSpacing) + 1
    for (let pp = 0; pp < postCount; pp++) {
      const px = -balW / 2 + pp * (balW / (postCount - 1))
      p('BalPost', timberColor, timberMat,
        px, balY + 2.1, frontZ + balD - 0.15, 0.25, 3.2, 0.25)
    }

    // Glass infill panels between posts
    for (let pp = 0; pp < postCount - 1; pp++) {
      const px = -balW / 2 + pp * (balW / (postCount - 1)) + (balW / (postCount - 1)) / 2
      const panW = balW / (postCount - 1) - 0.4
      p('BalPanel', 'Institutional white', 'smoothplastic',
        px, balY + 1.8, frontZ + balD - 0.15, panW, 2.6, 0.15, 0.4)
    }

    // Top handrail (front edge)
    p('BalRail', timberColor, timberMat,
      0, balY + 3.7, frontZ + balD - 0.15, balW + 0.2, 0.2, 0.2)

    // Side rails
    p('BalRailL', timberColor, timberMat,
      -balW / 2, balY + 3.7, frontZ + balD / 2, 0.2, 0.2, balD)
    p('BalRailR', timberColor, timberMat,
       balW / 2, balY + 3.7, frontZ + balD / 2, 0.2, 0.2, balD)
  }

  // ── SHED ROOF (mono-pitch — 14 steps, slopes front-HIGH to back-LOW) ─────────
  const roofBase = wallBase + fc * fh

  if (roofType === 'shed') {
    const roofW    = tw + 1.8
    const frontRise = 5.0
    const backDrop  = frontRise - td * 0.30
    const steps     = 14

    for (let s = 0; s < steps; s++) {
      const frac = s / (steps - 1)
      const slabY = roofBase + frontRise - frac * (frontRise - backDrop)
      const slabZ = frontZ + 0.5 - (td + 2.0) * frac
      // +0.25 overlap to remove gaps between steps
      const slabD = (td + 2.0) / steps + 0.18 + 0.25
      p('Roof', rc, 'smoothplastic', 0, slabY, slabZ, roofW, 0.9, slabD)
    }

    // Tall vertical fascia at front edge (2.5h)
    p('RoofFascia', ac, 'smoothplastic', 0, roofBase + frontRise / 2 + 0.5, frontZ + 0.9, roofW + 0.4, 2.8, 0.6)
    // Gutter strip at front eave
    p('RoofGutter', 'Dark grey', 'smoothplastic', 0, roofBase - 0.2, frontZ + 0.3, roofW + 0.2, 0.4, 0.6)

    // Left and right fascia ends — centred on building depth
    p('RoofFasciaL', ac, 'smoothplastic', -roofW / 2, roofBase + frontRise / 2, -td / 2, 0.6, frontRise + 0.5, td + 2.0)
    p('RoofFasciaR', ac, 'smoothplastic',  roofW / 2, roofBase + frontRise / 2, -td / 2, 0.6, frontRise + 0.5, td + 2.0)

    // Corner caps — front and back
    p('RoofCapFL', ac, 'smoothplastic', -roofW / 2, roofBase + frontRise + 0.5, frontZ + 0.5,      1.4, 2.2, 1.4)
    p('RoofCapFR', ac, 'smoothplastic',  roofW / 2, roofBase + frontRise + 0.5, frontZ + 0.5,      1.4, 2.2, 1.4)
    p('RoofCapBL', ac, 'smoothplastic', -roofW / 2, roofBase + backDrop  + 0.5, frontZ - td - 0.5, 1.4, 2.2, 1.4)
    p('RoofCapBR', ac, 'smoothplastic',  roofW / 2, roofBase + backDrop  + 0.5, frontZ - td - 0.5, 1.4, 2.2, 1.4)

    // Soffit under front overhang
    p('RoofSoffit', 'Light grey', 'smoothplastic', 0, roofBase + 0.15, frontZ + 0.8, roofW, 0.3, 1.5)

  } else if (roofType === 'gable') {
    const ridge = 4
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1
      // centre each half on its quarter of the building depth, offset from building centre
      p('Roof', rc, 'smoothplastic', 0, roofBase + ridge / 2, -td / 2 + sign * (td / 4 + 0.5), tw + 1.5, ridge, td / 2 + 1.5)
    }
    p('RoofRidge', ac, 'smoothplastic', 0, roofBase + ridge, -td / 2, tw + 1.5, 0.5, 0.8)

  } else if (roofType === 'hip') {
    p('Roof', rc, 'smoothplastic', 0, roofBase + 2, -td / 2, tw + 1.5, 4, td + 1.5)

  } else {
    // Flat
    p('Roof',    rc, 'smoothplastic', 0, roofBase + 0.3, -td / 2, tw + 0.5, 0.6,  td + 0.5)
    p('Parapet', ec, em,              0, roofBase + 1.2, -td / 2, tw + 0.5, 2.0,  td + 0.5)
  }

  return parts
}
