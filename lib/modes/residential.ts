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

  let seq = 1
  function p(name: string, color: string, material: string, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
    parts.push({ name: `RES_${name}_${seq++}`, color, material, x, y, z, sx, sy, sz })
  }

  const timberColor = 'Sand yellow'
  const timberMat = 'Wood'
  const garageDoorColor = 'Medium stone grey'
  const frontZ = td / 2

  // ── Foundation ───────────────────────────────────────────────────────────────
  p('Foundation', ec, em, 0, wallBase / 2, 0, tw, wallBase, td)

  // ── Walls + windows per floor ─────────────────────────────────────────────────
  for (let f = 0; f < fc; f++) {
    const floorBot = wallBase + f * fh
    const floorMid = floorBot + fh / 2

    // Solid brick shell (all 4 faces)
    p('WallFront', ec, em, 0, floorMid, frontZ, tw, fh, 0.8)
    p('WallBack',  ec, em, 0, floorMid, -frontZ, tw, fh, 0.8)
    p('WallLeft',  ec, em, -tw / 2, floorMid, 0, 0.8, fh, td)
    p('WallRight', ec, em,  tw / 2, floorMid, 0, 0.8, fh, td)

    // Concrete floor slab
    p('FloorSlab', 'Medium stone grey', 'Concrete', 0, floorBot, 0, tw, 0.4, td)

    if (f === 0) {
      // ── GROUND FLOOR ─────────────────────────────────────────────────────────
      if (hasGarage) {
        // Two large garage doors — each 17 studs wide, together cover ~67% of front
        const garW = 17
        const garH = fh * 0.85          // e.g. 10.2 studs tall for fh=12
        const garGap = 0.8              // thin gap between doors (filled by frames)
        const garLeftEdge = -tw / 2 + 0.5

        const g1x = garLeftEdge + garW / 2              // door 1 centre
        const g2x = garLeftEdge + garW + garGap + garW / 2  // door 2 centre

        for (const gx of [g1x, g2x]) {
          // Outer frame
          p('GarFrame', ac, 'SmoothPlastic', gx, wallBase + garH / 2, frontZ + 0.12, garW + 0.5, garH + 0.4, 0.35)
          // 4 horizontal panels per door
          const panH = garH / 4
          for (let gp = 0; gp < 4; gp++) {
            p('GarPanel', garageDoorColor, 'SmoothPlastic',
              gx, wallBase + panH * (gp + 0.5), frontZ + 0.22, garW - 0.5, panH - 0.3, 0.22)
          }
          // Horizontal dividers between panels
          for (let gp = 1; gp < 4; gp++) {
            p('GarBar', ac, 'SmoothPlastic',
              gx, wallBase + panH * gp, frontZ + 0.25, garW - 0.5, 0.22, 0.18)
          }
          // Vertical centre rail
          p('GarCRail', ac, 'SmoothPlastic', gx, wallBase + garH / 2, frontZ + 0.25, 0.28, garH, 0.18)
        }

        // Shared drive apron (concrete pad in front of both doors)
        const garTotalW = garW * 2 + garGap
        const garCentreX = (g1x + g2x) / 2
        p('GarDrive', 'Light stone grey', 'Concrete', garCentreX, wallBase - 0.1, frontZ + 2.5, garTotalW + 1, 0.3, 5)

        // ONE small window to the right of garage doors
        const rightEdge = tw / 2 - 0.5
        const g2RightEdge = g2x + garW / 2
        const rightSpace = rightEdge - g2RightEdge  // available width right of doors
        if (rightSpace >= 4) {
          const swW = Math.min(rightSpace - 2, 5)
          const swH = fh * 0.38
          const swX = g2RightEdge + rightSpace / 2
          const swY = wallBase + fh * 0.52
          p('Win',      'Light blue',    'SmoothPlastic', swX, swY, frontZ + 0.1,  swW,       swH,       0.18)
          p('WinFrame', ac,              'SmoothPlastic', swX, swY, frontZ + 0.15, swW + 0.4, swH + 0.4, 0.22)
          // H-bar + V-bar to split into 4 panes even on small window
          p('WinHBar', ac, 'SmoothPlastic', swX, swY, frontZ + 0.18, swW, 0.22, 0.16)
          p('WinVBar', ac, 'SmoothPlastic', swX, swY, frontZ + 0.18, 0.22, swH, 0.16)
        }

        // Front door (right half of building)
        const doorX = g2x + garW / 2 + 1 + 1.5   // just right of small window zone, but within building
        // Only add if there's room
        if (doorX + 1.5 < tw / 2 - 0.5) {
          const doorH = fh * 0.72
          p('Door',      'Reddish brown', 'Wood',         doorX, wallBase + doorH / 2, frontZ + 0.1,  2.5,       doorH,       0.18)
          p('DoorFrame', ac,              'SmoothPlastic', doorX, wallBase + doorH / 2, frontZ + 0.15, 3.0, doorH + 0.4, 0.22)
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
          p('Win',      'Light blue', 'SmoothPlastic', wx, winY, frontZ + 0.1,  winW,       winH,       0.18)
          p('WinFrame', ac,           'SmoothPlastic', wx, winY, frontZ + 0.15, winW + 0.4, winH + 0.4, 0.22)
        }
      }

    } else {
      // ── UPPER FLOOR: exactly 3 large portrait windows with 4-pane grid ───────
      const winCount = 3
      const winSpacing = tw / winCount           // ≈ 17.3 for tw=52
      const winW = 7.0                           // large portrait window
      const winH = fh * 0.65                    // tall, portrait proportion
      const winY = floorBot + fh * 0.5          // vertically centred in floor

      for (let w = 0; w < winCount; w++) {
        const wx = -tw / 2 + winSpacing * (w + 0.5)

        // Recessed shadow behind frame (depth illusion)
        p('WRec',     ac,           'SmoothPlastic', wx, winY, frontZ + 0.06, winW + 1.0, winH + 1.0, 0.25)
        // Glass pane
        p('Win',      'Light blue', 'SmoothPlastic', wx, winY, frontZ + 0.12, winW,       winH,       0.18)
        // Outer frame
        p('WinFrame', ac,           'SmoothPlastic', wx, winY, frontZ + 0.17, winW + 0.4, winH + 0.4, 0.22)
        // Horizontal mid-bar (divides into top / bottom pane)
        p('WinHBar',  ac,           'SmoothPlastic', wx, winY, frontZ + 0.20, winW,       0.28,       0.18)
        // Vertical mid-bar (divides into left / right pane)
        p('WinVBar',  ac,           'SmoothPlastic', wx, winY, frontZ + 0.20, 0.28,       winH,       0.18)
        // Window sill
        p('WinSill',  ec,           em,              wx, winY - winH / 2 - 0.2, frontZ + 0.22, winW + 1.0, 0.35, 0.5)
      }
    }
  }

  // ── BALCONY (timber, runs between ground and upper floor) ────────────────────
  if (hasBalcony) {
    const balW   = tw * 0.70            // 70% of building width → 36.4 studs
    const balD   = 3.5                  // depth projecting forward from wall
    const balY   = wallBase + fh        // top of ground floor
    const balTopY = balY + 3.0          // top rail height
    const postSp = 3.0                  // post every 3 studs
    const postCount = Math.floor(balW / postSp) + 1
    const actualW = (postCount - 1) * postSp  // snap to post grid

    // Timber deck slab
    p('BalSlab', timberColor, timberMat, 0, balY + 0.25, frontZ + balD / 2, actualW, 0.5, balD)

    // Posts every 3 studs — vertical timber posts
    for (let pp = 0; pp < postCount; pp++) {
      const px = -actualW / 2 + postSp * pp
      p('BalPost', timberColor, timberMat, px, balY + 1.5, frontZ + balD - 0.3, 0.38, 3.0, 0.38)
    }

    // Vertical panel infill between posts (solid timber panels)
    for (let pp = 0; pp < postCount - 1; pp++) {
      const px1 = -actualW / 2 + postSp * pp
      const px2 = px1 + postSp
      const pxMid = (px1 + px2) / 2
      const panW = postSp - 0.5
      p('BalPanel', timberColor, timberMat, pxMid, balY + 1.5, frontZ + balD - 0.3, panW, 2.8, 0.2)
    }

    // Top rail
    p('BalRail',     timberColor, timberMat, 0, balTopY,      frontZ + balD - 0.25, actualW, 0.32, 0.38)
    // Toe board (bottom rail)
    p('BalToeBoard', timberColor, timberMat, 0, balY + 0.55,  frontZ + balD - 0.3,  actualW, 0.45, 0.25)
  }

  // ── SHED ROOF (mono-pitch — slopes front-HIGH to back-LOW) ───────────────────
  const roofBase = wallBase + fc * fh

  if (roofType === 'shed') {
    const roofW    = tw + 1.5
    const frontRise = 5.0     // height of front fascia above roofBase
    const backDrop  = 2.0     // how much lower the back edge is vs front
    const steps     = 8       // stepping planks to represent slope

    // Roof planks — each step is a horizontal slab, stepping down from front to back
    for (let s = 0; s < steps; s++) {
      const frac = s / (steps - 1)
      const slabY   = roofBase + frontRise - frac * (frontRise - backDrop)
      const slabZ   = frontZ + 0.5 - (td + 2.5) * frac   // front (+) to back (-)
      const slabD   = (td + 2.5) / steps + 0.15
      p('Roof', rc, 'SmoothPlastic', 0, slabY, slabZ, roofW, 0.9, slabD)
    }

    // Tall vertical fascia board at front edge (highly visible from street)
    p('RoofFascia', ac, 'SmoothPlastic', 0, roofBase + frontRise / 2 + 0.5, frontZ + 1.1, roofW, frontRise + 1.2, 0.6)

    // Dark corner caps (left and right ends)
    p('RoofCapL', ac, 'SmoothPlastic', -roofW / 2 + 0.3, roofBase + frontRise / 2 + 0.5, frontZ + 0.5, 0.65, frontRise + 1.2, 2.0)
    p('RoofCapR', ac, 'SmoothPlastic',  roofW / 2 - 0.3, roofBase + frontRise / 2 + 0.5, frontZ + 0.5, 0.65, frontRise + 1.2, 2.0)

    // Soffit under front overhang
    p('RoofSoffit', 'Light grey', 'SmoothPlastic', 0, roofBase + 0.15, frontZ + 0.8, roofW, 0.3, 1.5)

  } else if (roofType === 'gable') {
    const ridge = 4
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1
      p('Roof', rc, 'SmoothPlastic', 0, roofBase + ridge / 2, sign * (td / 4 + 0.5), tw + 1.5, ridge, td / 2 + 1.5)
    }
    p('RoofRidge', ac, 'SmoothPlastic', 0, roofBase + ridge, 0, tw + 1.5, 0.5, 0.8)

  } else if (roofType === 'hip') {
    p('Roof', rc, 'SmoothPlastic', 0, roofBase + 2, 0, tw + 1.5, 4, td + 1.5)

  } else {
    // Flat
    p('Roof',    rc, 'SmoothPlastic', 0, roofBase + 0.3,  0, tw + 0.5, 0.6,  td + 0.5)
    p('Parapet', ec, em,              0, roofBase + 1.2,  0, tw + 0.5, 2.0,  td + 0.5)
  }

  // ── Plinth band at base ───────────────────────────────────────────────────────
  p('Plinth', ac, em, 0, wallBase, 0, tw + 0.4, 0.6, td + 0.4)

  return parts
}
