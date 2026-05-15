import { createAdminClient } from './supabase'
import { groqJSON, groqGenerate } from './groq'

export interface RoomFurniture { name:string; size:{x:number;y:number;z:number}; color:string; material:string; quantity?:number; placement?:'north_wall'|'south_wall'|'east_wall'|'west_wall'|'center'|'row' }
export interface ResearchRoom { name:string; width:number; depth:number; height:number; wallColor:string; floorColor:string; floorMaterial:string; furniture:RoomFurniture[] }
export interface ResearchResult { buildingType:string; floorCount:number; floorHeight:number; architecturalStyle:string; hasGlassFront:boolean; hasColonnade:boolean; exteriorMaterial:string; rooms:ResearchRoom[]; totalWidth:number; totalDepth:number; exteriorColor:string; roofColor:string; culturalNotes:string; confidence:number; wallMaterial?:string; roofMaterial?:string; groundMaterial?:string; columnMaterial?:string; floorBandMaterial?:string; accentColor?:string; columnColor?:string; windowCount?:number; windowStyle?:string; colonnadeStyle?:string; shutterColor?:string; floorBandColor?:string; hasPagodaRoof?:boolean; hasBalcony?:boolean; roofType?:string; scenery?:string; mode?:string; furniture?:string; hasStaircases?:boolean }

function sint(v:unknown,min:number,max:number,def:number):number { const n=parseInt(String(v??def),10); return isNaN(n)?def:Math.max(min,Math.min(max,n)) }

function fallback(bt:string):ResearchResult { return {buildingType:bt,floorCount:1,floorHeight:10,architecturalStyle:'modern',hasGlassFront:false,hasColonnade:false,exteriorMaterial:'smoothplastic',rooms:[{name:'Main Hall',width:20,depth:16,height:10,furniture:[],wallColor:'Light grey',floorColor:'Medium stone grey',floorMaterial:'Concrete'},{name:'Office',width:14,depth:12,height:10,furniture:[],wallColor:'Light grey',floorColor:'Medium stone grey',floorMaterial:'Concrete'},{name:'Reception',width:14,depth:10,height:10,furniture:[],wallColor:'Light grey',floorColor:'Medium stone grey',floorMaterial:'Concrete'},{name:'Staff Room',width:10,depth:8,height:10,furniture:[],wallColor:'Light grey',floorColor:'Medium stone grey',floorMaterial:'Concrete'},{name:'Toilet',width:6,depth:6,height:10,furniture:[],wallColor:'White',floorColor:'White',floorMaterial:'Marble'}],totalWidth:40,totalDepth:28,exteriorColor:'Light grey',roofColor:'Dark grey',culturalNotes:bt,confidence:0} }

async function wiki(name:string):Promise<string> { try { const shortName=name.split(' ').slice(0,3).join(' '); const slug=encodeURIComponent(shortName.replace(/\s+/g,'_')); const r=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,{signal:AbortSignal.timeout(5000)}); if(!r.ok)return ''; const d=await r.json(); return String(d.extract||'').substring(0,400) } catch{return ''} }
async function tavily(name:string):Promise<string> { try { if(!process.env.TAVILY_API_KEY)return ''; const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:process.env.TAVILY_API_KEY,query:`${name} architecture interior layout`,search_depth:'basic',max_results:3,include_answer:true}),signal:AbortSignal.timeout(8000)}); if(!r.ok)return ''; const d=await r.json(); return String((d.answer||'')+' '+(d.results||[]).map((r2:any)=>r2.content||'').join(' ')).substring(0,500) } catch{return ''} }
async function serper(name:string):Promise<string> { try { if(!process.env.SERPER_API_KEY)return ''; const r=await fetch('https://google.serper.dev/search',{method:'POST',headers:{'x-api-key':process.env.SERPER_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({q:`${name} architecture interior layout`,num:5}),signal:AbortSignal.timeout(8000)}); if(!r.ok)return ''; const d=await r.json(); return (d.organic||[]).map((r2:any)=>`${r2.title}:${r2.snippet}`).join(' ').substring(0,500) } catch{return ''} }
async function knowledge():Promise<string> { try { const sb=createAdminClient(); const {data,error}=await sb.from('ai_knowledge').select('content').eq('is_active',true).limit(2); if(error){console.log('[knowledge] query error:',error.message);return ''} return data?.map((k:any)=>k.content).join('\n').substring(0,400)||'' } catch(e){console.log('[knowledge] failed:',e);return ''} }
async function getCache(bt:string):Promise<ResearchResult|null> { try { const sb=createAdminClient(); const {data}=await sb.from('research_cache').select('*').eq('building_type',bt).maybeSingle(); if(!data)return null; const age=Date.now()-new Date(data.last_researched_at).getTime(); if(age>7*86400000)return null; if(data.structured_knowledge&&data.confidence_score>=50){console.log('[research] cache hit:',bt);return data.structured_knowledge as ResearchResult} return null } catch{return null} }
async function setCache(bt:string,r:ResearchResult):Promise<void> { try { const sb=createAdminClient(); await sb.from('research_cache').upsert({building_type:bt,structured_knowledge:r,confidence_score:r.confidence,last_researched_at:new Date().toISOString()},{onConflict:'building_type'}) } catch(e){console.error('[research] cache save failed:',e)} }

const SYS=`Expert architect. Return Roblox building spec as JSON only. No markdown.
Rules: floorCount=integer storeys, architecturalStyle=specific e.g. "peranakan chinese colonial" "victorian brick" "modern glass curtain", hasColonnade=true if columns/arches, hasGlassFront=true if glazed facade, exteriorColor=Roblox BrickColor e.g. Sand yellow/Brick yellow/Reddish brown/Medium stone grey/White/Navy blue/Dark green, exteriorMaterial=brick/concrete/smoothplastic/metal/wood, min 6 rooms max 12, furniture placement=north_wall/south_wall/east_wall/west_wall/center/row.
wallMaterial rules: peranakan/colonial=limestone, victorian/georgian=brick, modern=smoothplastic, gothic/castle=limestone, mediterranean=sandstone, brutalist=concrete, japanese=smoothplastic. roofMaterial rules: peranakan/asian/colonial=slate, modern=concrete, victorian=slate, industrial=metal. groundMaterial rules: peranakan/colonial=pavement, victorian=cobblestone, modern=concrete, neoclassical=marble. columnMaterial rules: peranakan=concrete, victorian/georgian=brick, neoclassical/baroque=marble, modern=smoothplastic, japanese=wood.
Schema: {"buildingType":string,"floorCount":number,"floorHeight":number,"architecturalStyle":string,"hasGlassFront":boolean,"hasColonnade":boolean,"exteriorMaterial":string,"wallMaterial":"one of: smoothplastic, limestone, brick, concrete, sandstone, slate, marble, wood","roofMaterial":"one of: slate, smoothplastic, concrete, metal","groundMaterial":"one of: pavement, concrete, cobblestone, marble, sandstone","columnMaterial":"one of: concrete, marble, limestone, brick, wood, smoothplastic","floorBandMaterial":"one of: smoothplastic, marble, limestone, concrete","rooms":[{"name":string,"width":number,"depth":number,"height":number,"wallColor":string,"floorColor":string,"floorMaterial":string,"furniture":[{"name":string,"size":{"x":number,"y":number,"z":number},"color":string,"material":string,"quantity":number,"placement":string}]}],"totalWidth":number,"totalDepth":number,"exteriorColor":string,"roofColor":string,"culturalNotes":string,"confidence":number}`

const VALID_WALL_MATS = ['smoothplastic','limestone','brick','concrete','sandstone','slate','marble','wood','cobblestone','pavement']
const VALID_ROOF_MATS = ['slate','smoothplastic','concrete','metal','wood']
const VALID_GROUND_MATS = ['pavement','concrete','cobblestone','marble','sandstone','slate']
const VALID_COL_MATS = ['concrete','marble','limestone','brick','wood','smoothplastic']
function validateMat(val: unknown, valid: string[], def: string): string { const s = String(val||'').toLowerCase().trim(); return valid.includes(s) ? s : def }

export async function researchBuildingType(bt:string, opts:{forceRefresh?:boolean;teachingContext?:string}={}):Promise<ResearchResult> {
  const name=bt.replace(/_/g,' ')
  console.log('[research] START:',name)
  if(!opts.forceRefresh){const c=await getCache(bt);if(c)return c}
  const [w,t,s,k]=await Promise.all([wiki(name),tavily(name),serper(name),knowledge()])
  console.log('[research] wiki:',w.length,'tavily:',t.length,'serper:',s.length,'knowledge:',k.length)
  const combined=[w&&`Wiki:${w}`,t&&`Web:${t}`,s&&`Search:${s}`,opts.teachingContext&&`Prev:${opts.teachingContext}`].filter(Boolean).join('\n\n').substring(0,1800)
  const user=`Building:${name}\n\nResearch:\n${combined}\n\n${k?`Quality:\n${k}\n\n`:''}Return JSON now.`
  const fb=fallback(bt)

  // ── 3-step reasoning chain ──────────────────────────────────────────────
  function parseStep<T>(raw: string, def: T): T {
    try {
      const c = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
      const s = c.indexOf('{'); const e = c.lastIndexOf('}')
      if (s === -1 || e === -1) return def
      return JSON.parse(c.substring(s, e+1)) as T
    } catch { return def }
  }

  // Step 1 — architectural description
  let desc: any = {}
  try {
    const s1sys = `You are an expert architect. Return JSON only describing this building type. Schema: {"buildingType":string,"architecturalStyle":string,"description":string,"keyFeatures":string[],"typicalMaterials":string[],"typicalColors":string[],"floorCount":number,"floorHeight":number,"hasColonnade":boolean,"hasPagodaRoof":boolean,"hasBalcony":boolean,"roofType":string}`
    const s1usr = `Building: ${name}\nRegion: ${name.includes('peranakan')||name.includes('shophouse')||name.includes('singapore')?'Singapore':name.includes('japanese')||name.includes('japan')?'Japan':name.includes('victorian')||name.includes('uk')||name.includes('british')?'United Kingdom':'Unknown'}\nResearch: ${combined.substring(0,800)}`
    const r1 = await groqGenerate(s1sys, s1usr, 700)
    desc = parseStep<any>(r1, {})
    console.log('[research] step1 description:', desc.description?.substring(0,80))
    console.log('[research] step1 features:', (desc.keyFeatures||[]).join(', ').substring(0,80))
  } catch(e) { console.error('[research] step1 failed:', e) }

  // Step 2 — precise visual specification
  let spec: any = {}
  try {
    const s2sys = `You are a Roblox building designer. Return JSON only with exact visual specs. BrickColor options: Sand yellow, Brick yellow, Reddish brown, White, Light grey, Dark green, Really black, Dark grey, Medium stone grey, Cashmere, Tan, Hot pink, Bright red. Schema: {"exteriorColor":string,"roofColor":string,"accentColor":string,"columnColor":string,"wallMaterial":"smoothplastic|concrete","windowStyle":"lattice|casement|colonial|modern","colonnadeStyle":"square|round|none","shutterColor":string,"floorBandColor":string,"rooms":[{"name":string,"type":string}]}`
    const desc_fc = desc.floorCount||3
    const s2usr = `Building: ${desc.buildingType||name}\nDescription: ${(desc.description||'').substring(0,300)}\nFeatures: ${(desc.keyFeatures||[]).join(', ')}\nMaterials: ${(desc.typicalMaterials||[]).join(', ')}\nColors: ${(desc.typicalColors||[]).join(', ')}\nFloors: ${desc_fc}\nRules: peranakan/colonial→exteriorColor:Sand yellow,roofColor:Dark green; victorian→exteriorColor:Reddish brown,roofColor:Really black; modern→exteriorColor:White,roofColor:Dark grey; japanese→exteriorColor:White,roofColor:Really black`
    const r2 = await groqGenerate(s2sys, s2usr, 600)
    spec = parseStep<any>(r2, {})
    console.log('[research] step2 spec:', spec.exteriorColor, spec.roofColor, spec.windowStyle)
  } catch(e) { console.error('[research] step2 failed:', e) }

  // Step 3 — quality check / correction
  let finalSpec: any = spec
  try {
    if (spec.exteriorColor) {
      const s3sys = `Review these building specs for authenticity. Return corrected JSON with same structure.`
      const s3usr = `Building: ${desc.buildingType||name}\nSpecs: ${JSON.stringify(spec).substring(0,800)}\nDescription: ${(desc.description||'').substring(0,200)}\nAre colors and materials authentic? Correct if not.`
      const r3 = await groqGenerate(s3sys, s3usr, 400)
      finalSpec = parseStep<any>(r3, spec)
      console.log('[research] step3 qa passed:', finalSpec.exteriorColor)
    }
  } catch(e) { console.error('[research] step3 failed:', e); finalSpec = spec }

  // Build rooms — convert simplified chain rooms or use fallback
  let chainRooms: ResearchRoom[] = []
  if (Array.isArray(finalSpec.rooms) && finalSpec.rooms.length >= 3) {
    chainRooms = finalSpec.rooms.map((r2: any) => ({
      name: String(r2.name || 'Room'),
      width: 14, depth: 12, height: 10,
      wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete',
      furniture: []
    }))
  }

  // Fall back to single call if chain didn't produce valid visual spec
  let raw: ResearchResult = fb
  if (!finalSpec.exteriorColor || !desc.buildingType) {
    console.log('[research] chain incomplete, falling back to single groq call')
    raw = await groqJSON<ResearchResult>(SYS, user, fb)
  }

  const rooms = chainRooms.length >= 3 ? chainRooms : (Array.isArray(raw.rooms) && raw.rooms.length >= 3 ? raw.rooms : fb.rooms)

  const result:ResearchResult={
    buildingType: String(desc.buildingType||raw.buildingType||bt),
    floorCount: sint(desc.floorCount||raw.floorCount,1,10,1),
    floorHeight: sint(desc.floorHeight||raw.floorHeight,8,16,10),
    architecturalStyle: String(desc.architecturalStyle||raw.architecturalStyle||'modern').toLowerCase(),
    hasGlassFront: Boolean(raw.hasGlassFront),
    hasColonnade: Boolean(desc.hasColonnade!==undefined ? desc.hasColonnade : raw.hasColonnade),
    hasPagodaRoof: Boolean(desc.hasPagodaRoof),
    hasBalcony: Boolean(desc.hasBalcony),
    roofType: String(desc.roofType||''),
    exteriorMaterial: String(raw.exteriorMaterial||'smoothplastic').toLowerCase(),
    rooms,
    totalWidth: sint(raw.totalWidth,20,120,40),
    totalDepth: sint(raw.totalDepth,16,80,28),
    exteriorColor: String(finalSpec.exteriorColor||raw.exteriorColor||'Light grey'),
    roofColor: String(finalSpec.roofColor||raw.roofColor||'Dark grey'),
    accentColor: finalSpec.accentColor,
    columnColor: finalSpec.columnColor,
    windowStyle: finalSpec.windowStyle,
    colonnadeStyle: finalSpec.colonnadeStyle,
    shutterColor: finalSpec.shutterColor||'Dark green',
    floorBandColor: finalSpec.floorBandColor||'White',
    wallMaterial: validateMat(finalSpec.wallMaterial||raw.wallMaterial,VALID_WALL_MATS,'smoothplastic'),
    roofMaterial: validateMat(raw.roofMaterial,VALID_ROOF_MATS,'slate'),
    groundMaterial: validateMat(raw.groundMaterial,VALID_GROUND_MATS,'concrete'),
    columnMaterial: validateMat(raw.columnMaterial,VALID_COL_MATS,'concrete'),
    floorBandMaterial: validateMat(raw.floorBandMaterial,VALID_WALL_MATS,'smoothplastic'),
    culturalNotes: String(raw.culturalNotes||''),
    confidence: finalSpec.exteriorColor ? 1 : sint(raw.confidence,0,100,0),
  }
  console.log('[research] RESULT:',{floorCount:result.floorCount,style:result.architecturalStyle,ec:result.exteriorColor,rc:result.roofColor,colonnade:result.hasColonnade,rooms:result.rooms.length,conf:result.confidence})
  if(result.confidence>30) await setCache(bt,result)
  return result
}
