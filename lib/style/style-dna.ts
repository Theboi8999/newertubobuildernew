export interface StyleDNA {
  family: 'asian' | 'european' | 'modern' | 'industrial' | 'fantasy' | 'tropical'
  era: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  groundColor: string
  roofColor: string
  trimColor: string
  columnColor: string
  shutterColor: string
  floorBandColor: string
  forbiddenColors: string[]
  wallMaterial: string
  roofMaterial: string
  groundMaterial: string
  forbiddenMaterials: string[]
  windowShape: 'rectangular' | 'arched' | 'circular' | 'floor-to-ceiling'
  columnStyle: 'none' | 'square' | 'round' | 'ornate'
  roofType: 'flat' | 'gable' | 'hip' | 'pagoda' | 'shed' | 'mansard'
  roofPitch: number
  roofOverhang: number
  hasBalcony: boolean
  hasColonnade: boolean
  colonnadeDepth: number
  symmetry: 'strict' | 'loose' | 'none'
  ornamentLevel: 'none' | 'minimal' | 'moderate' | 'heavy'
  windowAsset: string
  doorAsset: string
  columnAsset: string
  forbidden: string[]
}

export const STYLE_DNA_LIBRARY: Record<string, Partial<StyleDNA>> = {
  'peranakan': {
    family: 'asian',
    primaryColor: 'Sand yellow',
    roofColor: 'Dark green',
    trimColor: 'White',
    accentColor: 'Bright blue',
    columnColor: 'White',
    shutterColor: 'Dark green',
    floorBandColor: 'White',
    roofType: 'pagoda',
    columnStyle: 'square',
    hasColonnade: true,
    colonnadeDepth: 5,
    windowShape: 'rectangular',
    ornamentLevel: 'moderate',
    wallMaterial: 'smoothplastic',
    groundMaterial: 'concrete',
    forbidden: ['flat_modern_roof', 'glass_curtain_wall'],
  },
  'victorian': {
    family: 'european',
    primaryColor: 'Reddish brown',
    roofColor: 'Really black',
    trimColor: 'White',
    accentColor: 'Dark green',
    shutterColor: 'Dark green',
    floorBandColor: 'White',
    roofType: 'hip',
    columnStyle: 'ornate',
    windowShape: 'arched',
    ornamentLevel: 'heavy',
    wallMaterial: 'smoothplastic',
    forbidden: ['flat_roof', 'modern_glass'],
  },
  'modernist': {
    family: 'modern',
    primaryColor: 'White',
    roofColor: 'Dark grey',
    trimColor: 'Really black',
    accentColor: 'Light blue',
    floorBandColor: 'Really black',
    roofType: 'flat',
    columnStyle: 'none',
    windowShape: 'floor-to-ceiling',
    ornamentLevel: 'none',
    wallMaterial: 'smoothplastic',
    forbidden: ['ornate_columns', 'pagoda_roof'],
  },
  'japanese': {
    family: 'asian',
    primaryColor: 'White',
    roofColor: 'Really black',
    trimColor: 'Reddish brown',
    accentColor: 'Dark green',
    shutterColor: 'Reddish brown',
    roofType: 'hip',
    roofPitch: 40,
    roofOverhang: 3,
    columnStyle: 'square',
    windowShape: 'rectangular',
    ornamentLevel: 'minimal',
    wallMaterial: 'smoothplastic',
  },
  'brutalist': {
    family: 'modern',
    primaryColor: 'Medium stone grey',
    roofColor: 'Dark stone grey',
    trimColor: 'Dark grey',
    roofType: 'flat',
    columnStyle: 'none',
    ornamentLevel: 'none',
    wallMaterial: 'concrete',
    groundMaterial: 'concrete',
    forbidden: ['ornate', 'timber', 'pagoda'],
  },
  'mediterranean': {
    family: 'european',
    primaryColor: 'Cashmere',
    roofColor: 'Rust',
    trimColor: 'White',
    accentColor: 'Bright blue',
    roofType: 'hip',
    roofPitch: 30,
    columnStyle: 'round',
    windowShape: 'arched',
    ornamentLevel: 'moderate',
    wallMaterial: 'smoothplastic',
  },
  'cyberpunk': {
    family: 'modern',
    primaryColor: 'Really black',
    roofColor: 'Really black',
    trimColor: 'Hot pink',
    accentColor: 'Bright blue',
    roofType: 'flat',
    ornamentLevel: 'moderate',
    wallMaterial: 'smoothplastic',
    forbidden: ['timber', 'colonial', 'pagoda'],
  },
  'industrial': {
    family: 'industrial',
    primaryColor: 'Dark grey',
    roofColor: 'Dark stone grey',
    trimColor: 'Really black',
    accentColor: 'Rust',
    roofType: 'shed',
    columnStyle: 'square',
    ornamentLevel: 'none',
    wallMaterial: 'concrete',
    groundMaterial: 'concrete',
  },
  'georgian': {
    family: 'european',
    primaryColor: 'Brick yellow',
    roofColor: 'Really black',
    trimColor: 'White',
    accentColor: 'Dark green',
    roofType: 'hip',
    columnStyle: 'round',
    windowShape: 'rectangular',
    ornamentLevel: 'moderate',
    symmetry: 'strict',
    wallMaterial: 'smoothplastic',
  },
  'colonial': {
    family: 'european',
    primaryColor: 'White',
    roofColor: 'Dark red',
    trimColor: 'White',
    accentColor: 'Dark green',
    shutterColor: 'Dark green',
    roofType: 'gable',
    columnStyle: 'round',
    windowShape: 'rectangular',
    hasColonnade: true,
    ornamentLevel: 'moderate',
    wallMaterial: 'smoothplastic',
  },
}

export function getStyleDNA(
  architecturalStyle: string,
  buildingType: string,
  researchColors?: { exteriorColor?: string; roofColor?: string }
): StyleDNA {
  const search = (architecturalStyle + ' ' + buildingType).toLowerCase()

  const defaults: StyleDNA = {
    family: 'modern',
    era: '',
    primaryColor: researchColors?.exteriorColor || 'Light grey',
    secondaryColor: 'White',
    accentColor: 'Dark grey',
    groundColor: 'Medium stone grey',
    roofColor: researchColors?.roofColor || 'Dark grey',
    trimColor: 'White',
    columnColor: 'White',
    shutterColor: 'Dark green',
    floorBandColor: 'White',
    forbiddenColors: [],
    wallMaterial: 'smoothplastic',
    roofMaterial: 'smoothplastic',
    groundMaterial: 'concrete',
    forbiddenMaterials: [],
    windowShape: 'rectangular',
    columnStyle: 'none',
    roofType: 'flat',
    roofPitch: 30,
    roofOverhang: 1.5,
    hasBalcony: false,
    hasColonnade: false,
    colonnadeDepth: 4,
    symmetry: 'loose',
    ornamentLevel: 'minimal',
    windowAsset: 'default',
    doorAsset: 'default',
    columnAsset: 'default',
    forbidden: [],
  }

  const keys = Object.keys(STYLE_DNA_LIBRARY).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (search.includes(key)) {
      console.log('[StyleDNA] matched:', key)
      const matched = { ...defaults, ...STYLE_DNA_LIBRARY[key] } as StyleDNA
      if (researchColors?.exteriorColor) matched.primaryColor = researchColors.exteriorColor
      if (researchColors?.roofColor) matched.roofColor = researchColors.roofColor
      return matched
    }
  }

  return defaults
}
