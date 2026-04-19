import { ResearchResult } from './research-agent'

interface StyleDef { floorCount:number; floorHeight:number; hasColonnade:boolean; hasGlassFront:boolean; exteriorColor:string; roofColor:string; exteriorMaterial:string; architecturalStyle:string }

export const STYLE_LIBRARY: Record<string,StyleDef> = {
  'peranakan':{floorCount:3,floorHeight:10,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark green',exteriorMaterial:'smoothplastic',architecturalStyle:'peranakan chinese colonial'},
  'shophouse':{floorCount:3,floorHeight:10,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark green',exteriorMaterial:'smoothplastic',architecturalStyle:'peranakan chinese colonial'},
  'chinese colonial':{floorCount:3,floorHeight:10,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark green',exteriorMaterial:'smoothplastic',architecturalStyle:'peranakan chinese colonial'},
  'pagoda':{floorCount:4,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Reddish brown',roofColor:'Dark green',exteriorMaterial:'brick',architecturalStyle:'japanese pagoda'},
  'victorian':{floorCount:3,floorHeight:11,hasColonnade:false,hasGlassFront:false,exteriorColor:'Reddish brown',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'victorian brick classical'},
  'georgian':{floorCount:3,floorHeight:11,hasColonnade:false,hasGlassFront:false,exteriorColor:'Reddish brown',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'georgian brick classical'},
  'gothic':{floorCount:4,floorHeight:14,hasColonnade:true,hasGlassFront:false,exteriorColor:'Medium stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'gothic medieval'},
  'tudor':{floorCount:2,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Cashmere',roofColor:'Really black',exteriorMaterial:'wood',architecturalStyle:'tudor timber frame'},
  'art deco':{floorCount:4,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Really black',exteriorMaterial:'smoothplastic',architecturalStyle:'art-deco geometric'},
  'art-deco':{floorCount:4,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Really black',exteriorMaterial:'smoothplastic',architecturalStyle:'art-deco geometric'},
  'brutalist':{floorCount:4,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Dark stone grey',roofColor:'Dark stone grey',exteriorMaterial:'concrete',architecturalStyle:'brutalist concrete'},
  'industrial':{floorCount:2,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Dark grey',roofColor:'Dark grey',exteriorMaterial:'metal',architecturalStyle:'industrial warehouse'},
  'mediterranean':{floorCount:2,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'White',roofColor:'Rust',exteriorMaterial:'smoothplastic',architecturalStyle:'mediterranean whitewashed'},
  'baroque':{floorCount:3,floorHeight:12,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark grey',exteriorMaterial:'smoothplastic',architecturalStyle:'baroque classical'},
  'glass':{floorCount:3,floorHeight:12,hasColonnade:false,hasGlassFront:true,exteriorColor:'Light grey',roofColor:'Dark grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern glass curtain'},
  'skyscraper':{floorCount:8,floorHeight:12,hasColonnade:false,hasGlassFront:true,exteriorColor:'Light grey',roofColor:'Dark grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern glass skyscraper'},
  'castle':{floorCount:4,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Medium stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'medieval castle'},
  'mosque':{floorCount:1,floorHeight:14,hasColonnade:true,hasGlassFront:false,exteriorColor:'White',roofColor:'Dark green',exteriorMaterial:'smoothplastic',architecturalStyle:'islamic mosque'},
  'church':{floorCount:1,floorHeight:16,hasColonnade:true,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'gothic ecclesiastical'},
  'parliament':{floorCount:3,floorHeight:14,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'neoclassical government'},
  'courthouse':{floorCount:3,floorHeight:13,hasColonnade:true,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'neoclassical courthouse'},
  'museum':{floorCount:2,floorHeight:14,hasColonnade:true,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'neoclassical museum'},
  'library':{floorCount:2,floorHeight:12,hasColonnade:true,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'neoclassical civic'},
  'hospital':{floorCount:4,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'White',roofColor:'Light grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern clinical'},
  'hotel':{floorCount:6,floorHeight:11,hasColonnade:false,hasGlassFront:false,exteriorColor:'Sand yellow',roofColor:'Dark grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern hotel'},
  'school':{floorCount:2,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Brick yellow',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'victorian educational'},
  'police':{floorCount:2,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Medium stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'victorian government'},
  'stadium':{floorCount:3,floorHeight:14,hasColonnade:false,hasGlassFront:false,exteriorColor:'Light grey',roofColor:'Light grey',exteriorMaterial:'concrete',architecturalStyle:'modern sports stadium'},
  'airport':{floorCount:2,floorHeight:16,hasColonnade:false,hasGlassFront:true,exteriorColor:'White',roofColor:'Light grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern airport'},
  'temple':{floorCount:2,floorHeight:12,hasColonnade:true,hasGlassFront:false,exteriorColor:'Reddish brown',roofColor:'Dark green',exteriorMaterial:'wood',architecturalStyle:'asian temple'},
  'japanese':{floorCount:2,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Reddish brown',roofColor:'Dark grey',exteriorMaterial:'wood',architecturalStyle:'japanese traditional'},
  'bank':{floorCount:3,floorHeight:12,hasColonnade:true,hasGlassFront:false,exteriorColor:'Light stone grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'neoclassical banking'},
  'fire':{floorCount:2,floorHeight:12,hasColonnade:false,hasGlassFront:false,exteriorColor:'Bright red',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'modern fire station'},
  'warehouse':{floorCount:1,floorHeight:14,hasColonnade:false,hasGlassFront:false,exteriorColor:'Dark grey',roofColor:'Dark grey',exteriorMaterial:'metal',architecturalStyle:'industrial warehouse'},
  'apartment':{floorCount:6,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Light grey',roofColor:'Dark grey',exteriorMaterial:'brick',architecturalStyle:'modern residential'},
  'modern':{floorCount:1,floorHeight:10,hasColonnade:false,hasGlassFront:false,exteriorColor:'Light grey',roofColor:'Dark grey',exteriorMaterial:'smoothplastic',architecturalStyle:'modern contemporary'},
}

export function matchStyleLibrary(buildingType: string, styleHint?: string): StyleDef | null {
  const text = (buildingType + ' ' + (styleHint || '')).toLowerCase()
  const keys = Object.keys(STYLE_LIBRARY).sort((a, b) => b.length - a.length)
  const match = keys.find(k => text.includes(k))
  return match ? STYLE_LIBRARY[match] : null
}

export function applyStyleDefaults(r: ResearchResult): ResearchResult {
  const text = (r.buildingType + ' ' + r.architecturalStyle).toLowerCase()
  const keys = Object.keys(STYLE_LIBRARY).sort((a, b) => b.length - a.length)
  const match = keys.find(k => text.includes(k))
  if (!match) { console.log('[style] no match for:', r.buildingType); return r }
  const def = STYLE_LIBRARY[match]
  console.log('[style] matched:', match)
  return {
    ...r,
    floorCount: r.floorCount > 1 ? r.floorCount : def.floorCount,
    floorHeight: r.floorHeight !== 10 ? r.floorHeight : def.floorHeight,
    hasColonnade: r.hasColonnade || def.hasColonnade,
    hasGlassFront: r.hasGlassFront || def.hasGlassFront,
    exteriorColor: r.exteriorColor !== 'Light grey' ? r.exteriorColor : def.exteriorColor,
    roofColor: r.roofColor !== 'Dark grey' ? r.roofColor : def.roofColor,
    exteriorMaterial: r.exteriorMaterial !== 'smoothplastic' ? r.exteriorMaterial : def.exteriorMaterial,
    architecturalStyle: r.architecturalStyle !== 'modern' ? r.architecturalStyle : def.architecturalStyle,
  }
}
