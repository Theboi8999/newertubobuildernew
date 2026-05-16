import { RbxPart } from '../rbxmx'
import { p } from '../rbxmx'
import { StyleDNA } from '../style/style-dna'
import { BuildPlan } from '../blueprint-compiler'

export function generateFacade(plan: BuildPlan, dna: StyleDNA): RbxPart[] {
  const parts: RbxPart[] = []
  const { tw, td, wallBase, floorCount, floorHeight } = plan
  const isColonnade = dna.hasColonnade

  for (let f = 0; f < floorCount; f++) {
    const fy = wallBase + f * floorHeight
    const isGround = f === 0

    // ── Front face windows ────────────────────────────────────────────────────
    if (!isGround || !isColonnade) {
      const winCount = Math.max(2, Math.floor((tw - 6) / 9))
      const winSpacing = (tw - 4) / (winCount + 1)
      const winW = Math.min(6.5, winSpacing * 0.68)
      const winH = floorHeight * 0.58
      const winY = fy + floorHeight * 0.52

      for (let w = 0; w < winCount; w++) {
        const wx = 2.5 + winSpacing * (w + 1)

        // Shadow box recess — dark backing behind glass
        parts.push(p(`WRec_F${f}_${w}`, winW + 0.8, winH + 0.8, 1.2, wx, winY, -0.05, 'Really black', 'smoothplastic', 0.4))

        // Outer frame
        parts.push(p(`WOFrT_F${f}_${w}`, winW + 0.8, 0.45, 0.5, wx, winY + winH / 2 + 0.22, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrB_F${f}_${w}`, winW + 0.8, 0.45, 0.5, wx, winY - winH / 2 - 0.22, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrL_F${f}_${w}`, 0.45, winH + 0.8, 0.5, wx - winW / 2 - 0.42, winY, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrR_F${f}_${w}`, 0.45, winH + 0.8, 0.5, wx + winW / 2 + 0.42, winY, -0.25, dna.primaryColor, 'smoothplastic'))

        // Trim frame
        parts.push(p(`WFrT_F${f}_${w}`, winW + 0.3, 0.3, 0.35, wx, winY + winH / 2 + 0.15, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrB_F${f}_${w}`, winW + 0.3, 0.3, 0.35, wx, winY - winH / 2 - 0.15, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrL_F${f}_${w}`, 0.3, winH + 0.6, 0.35, wx - winW / 2 - 0.15, winY, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrR_F${f}_${w}`, 0.3, winH + 0.6, 0.35, wx + winW / 2 + 0.15, winY, -0.55, dna.trimColor, 'smoothplastic'))

        // Stone sill — White, protrudes 0.4 beyond wall face
        parts.push(p(`WSill_F${f}_${w}`, winW + 0.8, 0.4, 0.8, wx, winY - winH / 2 - 0.2, -0.4, 'White', 'smoothplastic'))

        // Glass — Bright blue, 0.3 transparency, 0.8 into wall
        parts.push(p(`WGlass_F${f}_${w}`, winW, winH, 0.1, wx, winY, -0.8, 'Bright blue', 'smoothplastic', 0.3))

        // Stone lintel — White, protrudes 0.3 beyond wall face
        parts.push(p(`WLintel_F${f}_${w}`, winW + 1.2, 0.5, 0.6, wx, winY + winH / 2 + 0.25, -0.4, 'White', 'smoothplastic'))

        // Arch moulding above lintel (3-part arch: keystone + 2 haunches)
        const archBaseY = winY + winH / 2 + 0.6
        parts.push(p(`WArcKey_F${f}_${w}`, 0.9, 0.8, 0.5, wx, archBaseY + 0.4, -0.35, 'White', 'smoothplastic'))
        parts.push(p(`WArcL_F${f}_${w}`, (winW + 1.2) / 2 - 0.5, 0.45, 0.5, wx - (winW + 1.2) / 4, archBaseY, -0.35, 'White', 'smoothplastic'))
        parts.push(p(`WArcR_F${f}_${w}`, (winW + 1.2) / 2 - 0.5, 0.45, 0.5, wx + (winW + 1.2) / 4, archBaseY, -0.35, 'White', 'smoothplastic'))

        // Side reveals (jambs)
        parts.push(p(`WRevL_F${f}_${w}`, 0.5, winH + 0.1, 0.9, wx - winW / 2 - 0.25, winY, -0.45, 'White', 'smoothplastic'))
        parts.push(p(`WRevR_F${f}_${w}`, 0.5, winH + 0.1, 0.9, wx + winW / 2 + 0.25, winY, -0.45, 'White', 'smoothplastic'))

        if (dna.family === 'asian') {
          parts.push(p(`WLH1_F${f}_${w}`, winW - 0.2, 0.1, 0.08, wx, winY + winH * 0.25, -0.8, dna.trimColor, 'smoothplastic'))
          parts.push(p(`WLH2_F${f}_${w}`, winW - 0.2, 0.1, 0.08, wx, winY - winH * 0.25, -0.8, dna.trimColor, 'smoothplastic'))
          parts.push(p(`WLV_F${f}_${w}`, 0.1, winH - 0.2, 0.08, wx, winY, -0.8, dna.trimColor, 'smoothplastic'))
        }

        if (dna.shutterColor && !isGround) {
          const shutW = winW * 0.42
          parts.push(p(`ShutL_F${f}_${w}`, shutW, winH * 0.95, 0.15, wx - winW / 2 - shutW / 2 - 0.1, winY, -0.55, dna.shutterColor, 'smoothplastic'))
          parts.push(p(`ShutR_F${f}_${w}`, shutW, winH * 0.95, 0.15, wx + winW / 2 + shutW / 2 + 0.1, winY, -0.55, dna.shutterColor, 'smoothplastic'))
        }
      }

      // Inter-window vertical pilaster strips between adjacent windows on front face
      if (!isGround) {
        for (let wp = 0; wp < winCount - 1; wp++) {
          const px = 2.5 + winSpacing * (wp + 1) + winSpacing / 2
          parts.push(p(`WPilF${f}_${wp}`, 1.0, floorHeight * 0.7, 0.3, px, fy + floorHeight * 0.5, -0.15, dna.primaryColor, 'smoothplastic'))
        }
      }
    }

    // ── Side and back windows (upper floors only) ─────────────────────────────
    if (f > 0) {
      const swH = floorHeight * 0.58
      const swY = fy + floorHeight * 0.52
      const frontCount = Math.max(2, Math.floor((tw - 6) / 9))

      const sideCount = Math.max(1, Math.floor(frontCount * 0.7))
      const sideSpacing = (td - 4) / (sideCount + 1)
      const sideWinW = Math.min(6.5, sideSpacing * 0.68)

      for (let w = 0; w < sideCount; w++) {
        const wz = 2 + sideSpacing * (w + 1)

        // Left wall windows
        parts.push(p(`SWLRec_F${f}_${w}`, 1.2, swH + 0.8, sideWinW + 0.8, -0.05, swY, wz, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`SWLFrT_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, -0.25, swY + swH / 2 + 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWLFrB_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, -0.25, swY - swH / 2 - 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWLGlass_F${f}_${w}`, 0.1, swH, sideWinW, -0.8, swY, wz, 'Bright blue', 'smoothplastic', 0.3))
        parts.push(p(`SWLTrim_F${f}_${w}`, 0.35, swH + 0.6, sideWinW + 0.3, -0.55, swY, wz, dna.trimColor, 'smoothplastic'))
        parts.push(p(`SWLLintel_F${f}_${w}`, 0.6, 0.5, sideWinW + 1.2, -0.4, swY + swH / 2 + 0.25, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWLSill_F${f}_${w}`, 0.8, 0.4, sideWinW + 0.8, -0.4, swY - swH / 2 - 0.2, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWLRevF_F${f}_${w}`, 0.9, swH + 0.1, 0.5, -0.45, swY, wz - sideWinW / 2 - 0.25, 'White', 'smoothplastic'))
        parts.push(p(`SWLRevB_F${f}_${w}`, 0.9, swH + 0.1, 0.5, -0.45, swY, wz + sideWinW / 2 + 0.25, 'White', 'smoothplastic'))
        // Arch moulding above left-side lintel
        const swlArchY = swY + swH / 2 + 0.6
        parts.push(p(`SWLArcKey_F${f}_${w}`, 0.5, 0.8, 0.9, -0.35, swlArchY + 0.4, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWLArcF_F${f}_${w}`, 0.5, 0.45, (sideWinW + 1.2) / 2 - 0.5, -0.35, swlArchY, wz - (sideWinW + 1.2) / 4, 'White', 'smoothplastic'))
        parts.push(p(`SWLArcB_F${f}_${w}`, 0.5, 0.45, (sideWinW + 1.2) / 2 - 0.5, -0.35, swlArchY, wz + (sideWinW + 1.2) / 4, 'White', 'smoothplastic'))

        // Right wall windows
        parts.push(p(`SWRRec_F${f}_${w}`, 1.2, swH + 0.8, sideWinW + 0.8, tw + 0.05, swY, wz, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`SWRFrT_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, tw + 0.25, swY + swH / 2 + 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWRFrB_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, tw + 0.25, swY - swH / 2 - 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWRGlass_F${f}_${w}`, 0.1, swH, sideWinW, tw + 0.8, swY, wz, 'Bright blue', 'smoothplastic', 0.3))
        parts.push(p(`SWRTrim_F${f}_${w}`, 0.35, swH + 0.6, sideWinW + 0.3, tw + 0.55, swY, wz, dna.trimColor, 'smoothplastic'))
        parts.push(p(`SWRLintel_F${f}_${w}`, 0.6, 0.5, sideWinW + 1.2, tw + 0.4, swY + swH / 2 + 0.25, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWRSill_F${f}_${w}`, 0.8, 0.4, sideWinW + 0.8, tw + 0.4, swY - swH / 2 - 0.2, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWRRevF_F${f}_${w}`, 0.9, swH + 0.1, 0.5, tw + 0.45, swY, wz - sideWinW / 2 - 0.25, 'White', 'smoothplastic'))
        parts.push(p(`SWRRevB_F${f}_${w}`, 0.9, swH + 0.1, 0.5, tw + 0.45, swY, wz + sideWinW / 2 + 0.25, 'White', 'smoothplastic'))
        // Arch moulding above right-side lintel
        const swrArchY = swY + swH / 2 + 0.6
        parts.push(p(`SWRArcKey_F${f}_${w}`, 0.5, 0.8, 0.9, tw + 0.35, swrArchY + 0.4, wz, 'White', 'smoothplastic'))
        parts.push(p(`SWRArcF_F${f}_${w}`, 0.5, 0.45, (sideWinW + 1.2) / 2 - 0.5, tw + 0.35, swrArchY, wz - (sideWinW + 1.2) / 4, 'White', 'smoothplastic'))
        parts.push(p(`SWRArcB_F${f}_${w}`, 0.5, 0.45, (sideWinW + 1.2) / 2 - 0.5, tw + 0.35, swrArchY, wz + (sideWinW + 1.2) / 4, 'White', 'smoothplastic'))
      }

      const backCount = Math.max(1, Math.floor(frontCount * 0.5))
      const backSpacing = (tw - 4) / (backCount + 1)
      const backWinW = Math.min(6.5, backSpacing * 0.68)

      for (let w = 0; w < backCount; w++) {
        const wx = 2.5 + backSpacing * (w + 1)

        parts.push(p(`BWRec_F${f}_${w}`, backWinW + 0.8, swH + 0.8, 1.2, wx, swY, td + 0.05, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`BWFrT_F${f}_${w}`, backWinW + 0.8, 0.45, 0.5, wx, swY + swH / 2 + 0.22, td + 0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`BWFrB_F${f}_${w}`, backWinW + 0.8, 0.45, 0.5, wx, swY - swH / 2 - 0.22, td + 0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`BWGlass_F${f}_${w}`, backWinW, swH, 0.1, wx, swY, td + 0.8, 'Bright blue', 'smoothplastic', 0.3))
        parts.push(p(`BWTrim_F${f}_${w}`, backWinW + 0.3, swH + 0.6, 0.35, wx, swY, td + 0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`BWLintel_F${f}_${w}`, backWinW + 1.2, 0.5, 0.6, wx, swY + swH / 2 + 0.25, td + 0.4, 'White', 'smoothplastic'))
        parts.push(p(`BWSill_F${f}_${w}`, backWinW + 0.8, 0.4, 0.8, wx, swY - swH / 2 - 0.2, td + 0.4, 'White', 'smoothplastic'))
        parts.push(p(`BWRevL_F${f}_${w}`, 0.5, swH + 0.1, 0.9, wx - backWinW / 2 - 0.25, swY, td + 0.45, 'White', 'smoothplastic'))
        parts.push(p(`BWRevR_F${f}_${w}`, 0.5, swH + 0.1, 0.9, wx + backWinW / 2 + 0.25, swY, td + 0.45, 'White', 'smoothplastic'))
        // Arch moulding above back window lintel
        const bwArchBaseY = swY + swH / 2 + 0.6
        parts.push(p(`BWArcKey_F${f}_${w}`, 0.9, 0.8, 0.5, wx, bwArchBaseY + 0.4, td + 0.35, 'White', 'smoothplastic'))
        parts.push(p(`BWArcL_F${f}_${w}`, (backWinW + 1.2) / 2 - 0.5, 0.45, 0.5, wx - (backWinW + 1.2) / 4, bwArchBaseY, td + 0.35, 'White', 'smoothplastic'))
        parts.push(p(`BWArcR_F${f}_${w}`, (backWinW + 1.2) / 2 - 0.5, 0.45, 0.5, wx + (backWinW + 1.2) / 4, bwArchBaseY, td + 0.35, 'White', 'smoothplastic'))
      }
    }

    // ── Balcony ───────────────────────────────────────────────────────────────
    if (!isGround && dna.hasBalcony) {
      const railY = fy - 0.3
      const railH = 2.6
      const railZ = -1.0
      const railLen = tw - 6

      parts.push(p(`RailBot_F${f}`, railLen, 0.2, 0.2, tw / 2, railY + 0.1, railZ, dna.trimColor, 'smoothplastic'))
      parts.push(p(`RailTop_F${f}`, railLen, 0.25, 0.25, tw / 2, railY + railH, railZ, dna.trimColor, 'smoothplastic'))
      parts.push(p(`BalcFloor_F${f}`, railLen, 0.4, 1.8, tw / 2, railY, railZ + 0.7, dna.trimColor, 'smoothplastic'))

      const postCount = Math.floor(railLen / 3)
      const postSpacing = railLen / postCount
      for (let rp = 0; rp <= postCount; rp++) {
        const rpx = 3 + rp * postSpacing
        parts.push(p(`RailPost_F${f}_${rp}`, 0.25, railH, 0.25, rpx, railY + railH / 2, railZ, dna.trimColor, 'smoothplastic'))
      }
    }
  }

  // ── Colonnade / five-foot-way ─────────────────────────────────────────────
  if (isColonnade) {
    const colCount = Math.max(4, Math.min(6, Math.floor(tw / 7)))
    const cs = tw / (colCount + 1)
    const colZ = 0.5
    const colShaftH = floorHeight * 0.86
    const colTop = wallBase + colShaftH

    for (let i = 0; i < colCount; i++) {
      const cx = cs * (i + 1)
      parts.push(p(`ColPl_${i}`, 2.2, 1.0, 2.2, cx, wallBase + 0.5, colZ, dna.columnColor, 'smoothplastic'))
      parts.push(p(`ColSh_${i}`, 1.8, colShaftH, 1.8, cx, wallBase + colShaftH / 2, colZ, dna.columnColor, 'smoothplastic'))
      parts.push(p(`ColCp_${i}`, 2.4, 0.8, 2.4, cx, colTop + 0.4, colZ, dna.columnColor, 'smoothplastic'))
      // Column shaft detail rings — entasis torus rings at base and near capital
      parts.push(p(`ColRingB_${i}`, 2.2, 0.35, 2.2, cx, wallBase + 1.3, colZ, dna.columnColor, 'smoothplastic'))
      parts.push(p(`ColRingT_${i}`, 2.2, 0.35, 2.2, cx, colTop - 0.25, colZ, dna.columnColor, 'smoothplastic'))
      // Arch keystone in each span
      if (i < colCount - 1) {
        parts.push(p(`ColArcKey_${i}`, 1.0, 0.6, 0.8, cx + cs / 2, colTop + 0.9, colZ, dna.trimColor, 'smoothplastic'))
      }

      if (i < colCount - 1) {
        parts.push(p(`ColAr_${i}`, cs - 1.8, 0.8, 0.9, cx + cs / 2, colTop + 0.1, colZ, dna.columnColor, 'smoothplastic'))
      }
    }

    // Five-foot-way ceiling — Institutional white
    parts.push(p('FFW_Ceil', tw + 0.5, 0.5, dna.colonnadeDepth, tw / 2, wallBase + floorHeight * 0.9, -dna.colonnadeDepth / 2, 'Institutional white', 'smoothplastic'))
    // Five-foot-way floor — White marble
    parts.push(p('FFW_Floor', tw + 0.5, 0.4, dna.colonnadeDepth, tw / 2, wallBase + 0.2, -dna.colonnadeDepth / 2, 'White', 'marble'))

    const shutH = floorHeight * 0.74
    const shutW = cs - 1.8

    // Transom panels above shutters per bay
    for (let i = 0; i < colCount; i++) {
      const sx = cs * (i + 1)
      const transomH = floorHeight * 0.25
      const transomY = wallBase + shutH + transomH / 2
      parts.push(p(`Transom_${i}`, shutW, transomH, 0.1, sx, transomY, -0.5, 'Institutional white', 'smoothplastic', 0.5))

      if (sx > tw / 2 - 5 && sx < tw / 2 + 5) continue
      parts.push(p(`Shut_${i}`, shutW, shutH, 0.2, sx, wallBase + shutH / 2, -0.5, dna.shutterColor, 'smoothplastic'))

      // Hanging shop sign per bay
      const signY = wallBase + floorHeight * 0.6
      const signZ = -(dna.colonnadeDepth * 0.3)
      parts.push(p(`ShopSign_${i}`, shutW - 0.8, 1.2, 0.1, sx, signY, signZ, dna.accentColor, 'smoothplastic'))
    }

    // Entrance door
    const entrW = 8
    const entrH = floorHeight * 0.82
    const doorY = wallBase + entrH / 2
    parts.push(p('EnSurround', entrW + 3, entrH + 2, 0.8, tw / 2, wallBase + entrH / 2 + 0.5, -0.5, dna.trimColor, 'smoothplastic'))
    parts.push(p('EnArch', entrW + 1.5, 1.2, 0.6, tw / 2, wallBase + entrH + 0.6, -0.55, dna.trimColor, 'smoothplastic'))
    parts.push(p('DoorL', entrW / 2 - 0.3, entrH - 0.4, 0.2, tw / 2 - entrW / 4, doorY, -0.55, dna.shutterColor, 'smoothplastic'))
    parts.push(p('DoorR', entrW / 2 - 0.3, entrH - 0.4, 0.2, tw / 2 + entrW / 4, doorY, -0.55, dna.shutterColor, 'smoothplastic'))
    parts.push(p('DoorFrL', 0.3, entrH, 0.3, tw / 2 - entrW / 2 - 0.15, doorY, -0.55, dna.trimColor, 'smoothplastic'))
    parts.push(p('DoorFrR', 0.3, entrH, 0.3, tw / 2 + entrW / 2 + 0.15, doorY, -0.55, dna.trimColor, 'smoothplastic'))
    parts.push(p('DoorFrT', entrW + 0.6, 0.3, 0.3, tw / 2, wallBase + entrH + 0.15, -0.55, dna.trimColor, 'smoothplastic'))
    parts.push(p('HandleL', 0.2, 0.2, 0.25, tw / 2 - 0.7, doorY, -0.75, 'Bright yellow', 'smoothplastic'))
    parts.push(p('HandleR', 0.2, 0.2, 0.25, tw / 2 + 0.7, doorY, -0.75, 'Bright yellow', 'smoothplastic'))

    // ── Entrance canopy hood ──────────────────────────────────────────────────
    const canopyW = entrW + 2
    const canopyTopY = wallBase + entrH + 0.5   // 0.5 above door top
    const canopySlabY = canopyTopY + 0.2         // center of 0.4-height slab
    const bracketColor = dna.accentColor || 'Dark grey'

    // Canopy top — 0.4 thick, protrudes 1.5 studs forward
    parts.push(p('CanopyTop', canopyW, 0.4, 1.5, tw / 2, canopySlabY, -0.75, 'White', 'smoothplastic'))

    // Canopy brackets — under canopy at door jamb positions
    parts.push(p('CanopyBracketL', 0.3, 1.2, 1.5, tw / 2 - entrW / 2, canopyTopY - 0.4, -0.75, bracketColor, 'smoothplastic'))
    parts.push(p('CanopyBracketR', 0.3, 1.2, 1.5, tw / 2 + entrW / 2, canopyTopY - 0.4, -0.75, bracketColor, 'smoothplastic'))

    // Canopy fascia — front vertical edge of canopy
    parts.push(p('CanopyFascia', canopyW, 0.5, 0.2, tw / 2, canopyTopY + 0.05, -1.45, dna.accentColor, 'smoothplastic'))

    // Decorative arch above canopy for asian/peranakan family
    if (dna.family === 'asian') {
      const archY = canopyTopY + 0.5
      parts.push(p('ArchKey', 1.2, 1.5, 0.5, tw / 2, archY + 0.75, -0.25, 'White', 'smoothplastic'))
      parts.push(p('ArchL', 2.0, 0.8, 0.5, tw / 2 - entrW / 2, archY + 0.1, -0.25, 'White', 'smoothplastic'))
      parts.push(p('ArchR', 2.0, 0.8, 0.5, tw / 2 + entrW / 2, archY + 0.1, -0.25, 'White', 'smoothplastic'))
    }
  }

  // ── AC units and drainpipes ───────────────────────────────────────────────
  for (let f = 1; f < floorCount; f++) {
    const fy2 = wallBase + f * floorHeight
    parts.push(p(`AC_F${f}_L`, 3.5, 2.0, 0.8, tw * 0.3, fy2 + floorHeight * 0.6, td + 0.4, 'Dark grey', 'smoothplastic'))
    parts.push(p(`AC_F${f}_R`, 3.5, 2.0, 0.8, tw * 0.7, fy2 + floorHeight * 0.6, td + 0.4, 'Dark grey', 'smoothplastic'))
    parts.push(p(`ACVent_F${f}_L`, 3.3, 0.15, 0.3, tw * 0.3, fy2 + floorHeight * 0.5, td + 0.45, 'Dark stone grey', 'smoothplastic'))
    parts.push(p(`ACVent_F${f}_R`, 3.3, 0.15, 0.3, tw * 0.7, fy2 + floorHeight * 0.5, td + 0.45, 'Dark stone grey', 'smoothplastic'))
  }

  const sdH = floorHeight * 0.75
  parts.push(p('ServiceDoor', 4, sdH, 0.2, tw * 0.75, wallBase + sdH / 2, td + 0.1, 'Dark grey', 'smoothplastic'))

  for (const [dx, dz] of [[0.5, 0.5], [tw - 0.5, 0.5], [0.5, td - 0.5], [tw - 0.5, td - 0.5]] as [number, number][]) {
    parts.push(p(`Drain_${dx}`, 0.35, (floorCount * floorHeight) + 4, 0.35, dx, (floorCount * floorHeight) / 2 + 2, dz, 'Dark grey', 'smoothplastic'))
  }

  return parts
}
