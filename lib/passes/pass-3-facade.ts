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

    if (!isGround || !isColonnade) {
      const winCount = Math.max(2, Math.floor((tw - 6) / 9))
      const winSpacing = (tw - 4) / (winCount + 1)
      const winW = Math.min(6.5, winSpacing * 0.68)
      const winH = floorHeight * 0.58
      const winY = fy + floorHeight * 0.52

      for (let w = 0; w < winCount; w++) {
        const wx = 2.5 + winSpacing * (w + 1)

        parts.push(p(`WRec_F${f}_${w}`, winW + 0.8, winH + 0.8, 1.2, wx, winY, -0.05, 'Really black', 'smoothplastic', 0.4))

        parts.push(p(`WOFrT_F${f}_${w}`, winW + 0.8, 0.45, 0.5, wx, winY + winH / 2 + 0.22, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrB_F${f}_${w}`, winW + 0.8, 0.45, 0.5, wx, winY - winH / 2 - 0.22, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrL_F${f}_${w}`, 0.45, winH + 0.8, 0.5, wx - winW / 2 - 0.42, winY, -0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`WOFrR_F${f}_${w}`, 0.45, winH + 0.8, 0.5, wx + winW / 2 + 0.42, winY, -0.25, dna.primaryColor, 'smoothplastic'))

        parts.push(p(`WFrT_F${f}_${w}`, winW + 0.3, 0.3, 0.35, wx, winY + winH / 2 + 0.15, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrB_F${f}_${w}`, winW + 0.3, 0.3, 0.35, wx, winY - winH / 2 - 0.15, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrL_F${f}_${w}`, 0.3, winH + 0.6, 0.35, wx - winW / 2 - 0.15, winY, -0.55, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WFrR_F${f}_${w}`, 0.3, winH + 0.6, 0.35, wx + winW / 2 + 0.15, winY, -0.55, dna.trimColor, 'smoothplastic'))

        parts.push(p(`WSill_F${f}_${w}`, winW + 1.0, 0.3, 0.7, wx, winY - winH / 2 - 0.42, -0.35, dna.trimColor, 'smoothplastic'))
        parts.push(p(`WGlass_F${f}_${w}`, winW, winH, 0.1, wx, winY, -0.85, 'Light blue', 'smoothplastic', 0.25))

        if (dna.family === 'asian') {
          parts.push(p(`WLH1_F${f}_${w}`, winW - 0.2, 0.1, 0.08, wx, winY + winH * 0.25, -0.85, dna.trimColor, 'smoothplastic'))
          parts.push(p(`WLH2_F${f}_${w}`, winW - 0.2, 0.1, 0.08, wx, winY - winH * 0.25, -0.85, dna.trimColor, 'smoothplastic'))
          parts.push(p(`WLV_F${f}_${w}`, 0.1, winH - 0.2, 0.08, wx, winY, -0.85, dna.trimColor, 'smoothplastic'))
        }

        if (dna.shutterColor && !isGround) {
          const shutW = winW * 0.42
          parts.push(p(`ShutL_F${f}_${w}`, shutW, winH * 0.95, 0.15, wx - winW / 2 - shutW / 2 - 0.1, winY, -0.55, dna.shutterColor, 'smoothplastic'))
          parts.push(p(`ShutR_F${f}_${w}`, shutW, winH * 0.95, 0.15, wx + winW / 2 + shutW / 2 + 0.1, winY, -0.55, dna.shutterColor, 'smoothplastic'))
        }

        parts.push(p(`WLin_F${f}_${w}`, winW + 1.0, 0.4, 0.45, wx, winY + winH / 2 + 0.5, -0.25, dna.primaryColor, 'smoothplastic'))
      }
    }

    if (f > 0) {
      const swH = floorHeight * 0.58
      const swY = fy + floorHeight * 0.52
      const frontCount = Math.max(2, Math.floor((tw - 6) / 9))

      const sideCount = Math.max(1, Math.floor(frontCount * 0.7))
      const sideSpacing = (td - 4) / (sideCount + 1)
      const sideWinW = Math.min(6.5, sideSpacing * 0.68)

      for (let w = 0; w < sideCount; w++) {
        const wz = 2 + sideSpacing * (w + 1)

        parts.push(p(`SWLRec_F${f}_${w}`, 1.2, swH + 0.8, sideWinW + 0.8, -0.05, swY, wz, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`SWLFrT_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, -0.25, swY + swH / 2 + 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWLFrB_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, -0.25, swY - swH / 2 - 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWLGlass_F${f}_${w}`, 0.1, swH, sideWinW, -0.85, swY, wz, 'Light blue', 'smoothplastic', 0.25))
        parts.push(p(`SWLTrim_F${f}_${w}`, 0.35, swH + 0.6, sideWinW + 0.3, -0.55, swY, wz, dna.trimColor, 'smoothplastic'))

        parts.push(p(`SWRRec_F${f}_${w}`, 1.2, swH + 0.8, sideWinW + 0.8, tw + 0.05, swY, wz, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`SWRFrT_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, tw + 0.25, swY + swH / 2 + 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWRFrB_F${f}_${w}`, 0.5, 0.45, sideWinW + 0.8, tw + 0.25, swY - swH / 2 - 0.22, wz, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`SWRGlass_F${f}_${w}`, 0.1, swH, sideWinW, tw + 0.85, swY, wz, 'Light blue', 'smoothplastic', 0.25))
        parts.push(p(`SWRTrim_F${f}_${w}`, 0.35, swH + 0.6, sideWinW + 0.3, tw + 0.55, swY, wz, dna.trimColor, 'smoothplastic'))
      }

      const backCount = Math.max(1, Math.floor(frontCount * 0.5))
      const backSpacing = (tw - 4) / (backCount + 1)
      const backWinW = Math.min(6.5, backSpacing * 0.68)

      for (let w = 0; w < backCount; w++) {
        const wx = 2.5 + backSpacing * (w + 1)

        parts.push(p(`BWRec_F${f}_${w}`, backWinW + 0.8, swH + 0.8, 1.2, wx, swY, td + 0.05, 'Really black', 'smoothplastic', 0.4))
        parts.push(p(`BWFrT_F${f}_${w}`, backWinW + 0.8, 0.45, 0.5, wx, swY + swH / 2 + 0.22, td + 0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`BWFrB_F${f}_${w}`, backWinW + 0.8, 0.45, 0.5, wx, swY - swH / 2 - 0.22, td + 0.25, dna.primaryColor, 'smoothplastic'))
        parts.push(p(`BWGlass_F${f}_${w}`, backWinW, swH, 0.1, wx, swY, td + 0.85, 'Light blue', 'smoothplastic', 0.25))
        parts.push(p(`BWTrim_F${f}_${w}`, backWinW + 0.3, swH + 0.6, 0.35, wx, swY, td + 0.55, dna.trimColor, 'smoothplastic'))
      }
    }

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

      if (i < colCount - 1) {
        parts.push(p(`ColAr_${i}`, cs - 1.8, 0.8, 0.9, cx + cs / 2, colTop + 0.1, colZ, dna.columnColor, 'smoothplastic'))
      }
    }

    parts.push(p('FFW_Ceil', tw + 0.5, 0.5, dna.colonnadeDepth, tw / 2, wallBase + floorHeight * 0.9, -dna.colonnadeDepth / 2, 'Medium stone grey', 'smoothplastic'))
    parts.push(p('FFW_Floor', tw + 0.5, 0.4, dna.colonnadeDepth, tw / 2, wallBase + 0.2, -dna.colonnadeDepth / 2, 'Light stone grey', 'concrete'))

    const shutH = floorHeight * 0.74
    const shutW = cs - 1.8
    for (let i = 0; i < colCount; i++) {
      const sx = cs * (i + 1)
      if (sx > tw / 2 - 5 && sx < tw / 2 + 5) continue
      parts.push(p(`Shut_${i}`, shutW, shutH, 0.2, sx, wallBase + shutH / 2, -0.5, dna.shutterColor, 'smoothplastic'))
    }

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
  }

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
