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

  // Foundation
  p('Foundation', ec, em, 0, wallBase / 2, 0, tw, wallBase, td)

  // Walls per floor
  for (let f = 0; f < fc; f++) {
    const floorY = wallBase + f * fh + fh / 2

    // Front wall
    p('WallFront', ec, em, 0, floorY, td / 2, tw, fh, 0.8)
    // Back wall
    p('WallBack', ec, em, 0, floorY, -td / 2, tw, fh, 0.8)
    // Left wall
    p('WallLeft', ec, em, -tw / 2, floorY, 0, 0.8, fh, td)
    // Right wall
    p('WallRight', ec, em, tw / 2, floorY, 0, 0.8, fh, td)

    // Floor slab
    p('FloorSlab', ac, 'SmoothPlastic', 0, wallBase + f * fh, 0, tw, 0.4, td)

    // Windows — front face, evenly spaced
    const winW = 4
    const winH = fh * 0.45
    const winY = floorY + fh * 0.05
    const winCount = Math.max(1, Math.floor(tw / 9))
    const winSpacing = tw / winCount
    for (let w = 0; w < winCount; w++) {
      const wx = -tw / 2 + winSpacing * (w + 0.5)
      // Skip garage bay on ground floor left
      if (f === 0 && hasGarage && w === 0) continue
      p('Win', 'Light blue', 'Glass', wx, winY, td / 2 + 0.1, winW, winH, 0.2)
      p('WinFrame', ac, 'SmoothPlastic', wx, winY, td / 2 + 0.15, winW + 0.4, winH + 0.4, 0.2)
    }

    // Balcony — upper floors front
    if (hasBalcony && f > 0) {
      const balY = wallBase + f * fh
      const balW = tw * 0.55
      const balD = 3
      p('BalSlab', ec, em, 0, balY, td / 2 + balD / 2, balW, 0.5, balD)
      // Railing posts
      const postCount = Math.max(2, Math.floor(balW / 4))
      for (let pp = 0; pp < postCount; pp++) {
        const px = -balW / 2 + (balW / (postCount - 1)) * pp
        p('BalPost', ac, 'SmoothPlastic', px, balY + 1.5, td / 2 + balD - 0.2, 0.3, 3, 0.3)
      }
      // Railing top rail
      p('BalRail', ac, 'SmoothPlastic', 0, balY + 3, td / 2 + balD - 0.2, balW, 0.3, 0.3)
    }
  }

  // Garage door — ground floor, left bay
  if (hasGarage) {
    const garW = 6
    const garH = fh * 0.75
    const garX = -tw / 2 + garW / 2 + 0.5
    const garY = wallBase + garH / 2
    // Frame
    p('GarFrame', ac, 'SmoothPlastic', garX, garY, td / 2 + 0.1, garW + 0.5, garH + 0.3, 0.3)
    // Panel sections (3 horizontal panels)
    const panH = garH / 3
    for (let gp = 0; gp < 3; gp++) {
      p('GarPanel', '#888888', 'SmoothPlastic', garX, wallBase + panH * (gp + 0.5), td / 2 + 0.15, garW, panH - 0.2, 0.2)
    }
    // Drive apron
    p('GarDrive', '#999999', 'Concrete', garX, wallBase - 0.1, td / 2 + 2, garW + 1, 0.3, 4)
  }

  // Roof
  const roofY = wallBase + fc * fh
  if (roofType === 'shed') {
    // Shed roof: single slope, slightly wider than building
    const roofW = tw + 1.5
    const roofD = td + 1.5
    const steps = 4
    const stepD = roofD / steps
    for (let s = 0; s < steps; s++) {
      const sy2 = roofY + s * 1.2
      p('Roof', rc, 'SmoothPlastic', 0, sy2, -td / 2 + stepD * (s + 0.5), roofW, 1.0, stepD)
    }
    // Fascia
    p('RoofFascia', ac, 'SmoothPlastic', 0, roofY, td / 2 + 0.7, roofW, 1.0, 0.4)
  } else if (roofType === 'gable') {
    // Gable: two sloped sides
    const roofW = tw + 1.5
    const ridge = 4
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1
      p('Roof', rc, 'SmoothPlastic', 0, roofY + ridge / 2, sign * (td / 4 + 0.5), roofW, ridge, td / 2 + 1.5)
    }
    // Ridge cap
    p('RoofRidge', ac, 'SmoothPlastic', 0, roofY + ridge, 0, roofW, 0.5, 0.8)
  } else if (roofType === 'hip') {
    // Hip: four sloped sides
    p('Roof', rc, 'SmoothPlastic', 0, roofY + 2, 0, tw + 1.5, 4, td + 1.5)
  } else {
    // Flat roof with parapet
    p('Roof', rc, 'SmoothPlastic', 0, roofY + 0.3, 0, tw + 0.5, 0.6, td + 0.5)
    p('Parapet', ec, em, 0, roofY + 1.2, 0, tw + 0.5, 2, td + 0.5)
  }

  // Front door (ground floor center or offset from garage)
  const doorX = hasGarage ? tw / 4 : 0
  const doorW = 2.5
  const doorH = fh * 0.7
  p('Door', ac, 'SmoothPlastic', doorX, wallBase + doorH / 2, td / 2 + 0.1, doorW, doorH, 0.2)
  p('DoorFrame', ac, 'SmoothPlastic', doorX, wallBase + doorH / 2, td / 2 + 0.15, doorW + 0.4, doorH + 0.3, 0.2)

  // Plinth band at base
  p('Plinth', ac, em, 0, wallBase, 0, tw + 0.4, 0.6, td + 0.4)

  return parts
}
