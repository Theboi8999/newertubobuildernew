import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'
import { placeRoomsWithBSP, getRoomType } from './room-placer'
import { calculateWindowPositions, buildProportionalWindow } from './window-system'
import { generateStructure } from './passes/pass-1-structure'
import { generateRoof } from './passes/pass-2-roof'
import { generateFacade } from './passes/pass-3-facade'
import { generateTerrain, SceneryLevel } from './passes/pass-6-terrain'
import { getStyleDNA } from './style/style-dna'

export interface BuildPlan {
  tw: number
  td: number
  th: number
  wallBase: number
  floorCount: number
  floorHeight: number
  buildingType: string
  architecturalStyle: string
}

export interface CompiledBlueprint { buildingType:string; rooms:RbxPart[][]; exterior:RbxPart[]; totalWidth:number; totalDepth:number; roomLayout:Array<{name:string;x:number;z:number;width:number;depth:number;type:string}> }
export type RoomLayoutItem = CompiledBlueprint['roomLayout'][0]

const VC:Record<string,string>={'white':'White','institutional white':'Institutional white','light grey':'Light grey','light gray':'Light grey','medium stone grey':'Medium stone grey','medium stone gray':'Medium stone grey','dark grey':'Dark grey','dark gray':'Dark grey','light stone grey':'Light stone grey','dark stone grey':'Dark stone grey','really black':'Really black','black':'Really black','bright red':'Bright red','dark red':'Dark red','rust':'Rust','reddish brown':'Reddish brown','bright orange':'Bright orange','dark orange':'Dark orange','bright yellow':'Bright yellow','sand yellow':'Sand yellow','brick yellow':'Brick yellow','bright green':'Bright green','dark green':'Dark green','sand green':'Sand green','medium green':'Medium green','bright blue':'Bright blue','navy blue':'Navy blue','sand blue':'Sand blue','light blue':'Light blue','hot pink':'Hot pink','cashmere':'Cashmere','teal':'Bright bluish green','cyan':'Bright bluish green','brown':'Reddish brown','beige':'Sand yellow','cream':'White','grey':'Light grey','gray':'Light grey','green':'Bright green','blue':'Bright blue','red':'Bright red','yellow':'Bright yellow','orange':'Bright orange','pink':'Hot pink'}
const VM:Record<string,string>={smoothplastic:'smoothplastic',plastic:'smoothplastic',wood:'wood',timber:'wood',brick:'brick',concrete:'concrete',stone:'concrete',metal:'metal',steel:'metal',fabric:'fabric',carpet:'fabric',marble:'marble',neon:'neon',glass:'smoothplastic',render:'smoothplastic',grass:'concrete',limestone:'smoothplastic',pavement:'concrete',cobblestone:'concrete',sandstone:'smoothplastic',slate:'smoothplastic'}

function vc(c:string):string { if(!c)return 'Light grey'; const k=c.toLowerCase().trim(); if(VC[k])return VC[k]; for(const [key,val] of Object.entries(VC)){if(k.includes(key)||key.includes(k))return val} console.log('[color] no match:',c); return 'Light grey' }
function vm(m:string):string { return VM[(m||'').toLowerCase().trim()]||'smoothplastic' }
function p(name:string,sx:number,sy:number,sz:number,px:number,py:number,pz:number,color:string,material:string,transparency=0,emissive=false):RbxPart { return {name,size:{x:Math.max(0.1,sx),y:Math.max(0.1,sy),z:Math.max(0.1,sz)},position:{x:px,y:py,z:pz},color:vc(color),material:vm(material),anchored:true,transparency:Math.max(0,Math.min(1,transparency)),emissive} }

export { getRoomType }

// ── FloorConfig system ─────────────────────────────────────────────────────────
interface FloorConfig {
  floorIndex: number
  ceilingHeight: number
  wallColor: string
  floorColor: string
  floorMaterial: string
  windowStyle: string
  isGroundFloor: boolean
  isTopFloor: boolean
}

function getFloorConfig(floorIndex: number, totalFloors: number, research: ResearchResult, style: string): FloorConfig {
  const isGround = floorIndex === 0
  const isTop = floorIndex === totalFloors - 1
  const isChinese = style.includes('chinese') || style.includes('peranakan')
  return {
    floorIndex,
    ceilingHeight: isGround ? (isChinese ? 10 : 12) : (isTop ? 9 : 10),
    wallColor: isGround ? (isChinese ? 'Dark green' : vc(research.exteriorColor)) : 'Light grey',
    floorColor: isGround ? 'Medium stone grey' : 'Sand yellow',
    floorMaterial: isGround ? 'concrete' : 'wood',
    windowStyle: isChinese ? 'chinese' : style.includes('victorian') ? 'victorian' : style.includes('colonial') ? 'colonial' : 'modern',
    isGroundFloor: isGround,
    isTopFloor: isTop,
  }
}

// ── Pitched roof for colonial/victorian/georgian ───────────────────────────────
function buildPitchedRoof(name: string, tw: number, td: number, baseY: number, color: string, material: string): RbxPart[] {
  const parts: RbxPart[] = []
  const roofH = Math.max(1, tw * 0.15)
  parts.push({name:`${name}_RoofFront`,size:{x:Math.max(0.1,tw+2),y:Math.max(0.1,roofH),z:Math.max(0.1,td/2+1)},position:{x:tw/2,y:baseY+roofH/2,z:td/4},color:vc(color),material:vm(material),anchored:true,transparency:0,emissive:false,partType:'WedgePart'})
  parts.push({name:`${name}_RoofBack`,size:{x:Math.max(0.1,tw+2),y:Math.max(0.1,roofH),z:Math.max(0.1,td/2+1)},position:{x:tw/2,y:baseY+roofH/2,z:td*3/4},color:vc(color),material:vm(material),anchored:true,transparency:0,emissive:false,partType:'WedgePart'})
  parts.push(p(`${name}_RoofRidge`,tw+2,0.5,0.8,tw/2,baseY+roofH,td/2,color,material))
  return parts
}

// ── Terrain ───────────────────────────────────────────────────────────────────
function buildTerrain(_tw: number, _td: number, _style: string, _isChinese: boolean): RbxPart[] {
  return []
}

function compileRoom(room:ResearchResult['rooms'][0],ox:number,oz:number,style:string):RbxPart[] {
  if (!room || !room.name) { console.log('[compileRoom] skipping invalid room:', room); return [] }
  const pts:RbxPart[]=[]; const w=Math.max(8,Number(room.width)||12); const d=Math.max(8,Number(room.depth)||10); const h=Math.max(8,Number(room.height)||10)
  const wc=vc(room.wallColor||'Light grey'); const fc=vc(room.floorColor||'Medium stone grey'); const fm=vm(room.floorMaterial||'concrete'); const n=(room.name||'Room').replace(/\s+/g,'_')
  pts.push(p(`${n}_Floor`,w,0.5,d,ox,0.25,oz,fc,fm))
  const bc=fc==='White'?'Light grey':'White'; pts.push(p(`${n}_BN`,w,0.52,0.35,ox,0.26,oz-d/2+0.175,bc,fm)); pts.push(p(`${n}_BS`,w,0.52,0.35,ox,0.26,oz+d/2-0.175,bc,fm))
  pts.push(p(`${n}_Ceil`,w,0.4,d,ox,h-0.2,oz,'White','smoothplastic'))
  const lc=Math.max(1,Math.floor(w/16)); for(let l=0;l<lc;l++){const lx=ox-w/2+(w/(lc+1))*(l+1); pts.push(p(`${n}_Light${l}`,3,0.2,1,lx,h-0.35,oz,'Institutional white','neon',0,true)); pts.push(p(`${n}_LightS${l}`,3.4,0.1,1.4,lx,h-0.25,oz,'White','smoothplastic'))}
  pts.push(p(`${n}_WN`,w,h,0.3,ox,h/2,oz-d/2,wc,'smoothplastic')); pts.push(p(`${n}_WS`,w,h,0.3,ox,h/2,oz+d/2,wc,'smoothplastic')); pts.push(p(`${n}_WW`,0.3,h,d,ox-w/2,h/2,oz,wc,'smoothplastic')); pts.push(p(`${n}_WE`,0.3,h,d,ox+w/2,h/2,oz,wc,'smoothplastic'))
  pts.push(p(`${n}_SKN`,w+0.1,0.6,0.15,ox,0.8,oz-d/2+0.075,'White','smoothplastic')); pts.push(p(`${n}_SKS`,w+0.1,0.6,0.15,ox,0.8,oz+d/2-0.075,'White','smoothplastic')); pts.push(p(`${n}_SKW`,0.15,0.6,d+0.1,ox-w/2+0.075,0.8,oz,'White','smoothplastic')); pts.push(p(`${n}_SKE`,0.15,0.6,d+0.1,ox+w/2-0.075,0.8,oz,'White','smoothplastic'))
  pts.push(p(`${n}_DFL`,0.2,7.2,0.4,ox-1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFR`,0.2,7.2,0.4,ox+1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFT`,3.4,0.2,0.4,ox,7.1,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_Door`,3,7,0.15,ox,3.5,oz-d/2-0.08,'Reddish brown','wood')); pts.push(p(`${n}_Hndl`,0.15,0.15,0.35,ox+1.1,3.5,oz-d/2-0.17,'Medium stone grey','metal'))
  const fur=room.furniture||[]; const walls:Record<string,typeof fur>={north_wall:[],south_wall:[],east_wall:[],west_wall:[],row:[],center:[]}
  for(const f of fur){if(!f||!f.name)continue; const k=f.placement||'center'; if(walls[k])walls[k].push(f); else walls.center.push(f)}
  const place=(items:typeof fur,wall:string)=>{let cur=0; for(const item of items){if(!item||!item.name)continue; const fw=Math.max(0.5,Number(item.size?.x)||2); const fh=Math.max(0.5,Number(item.size?.y)||1); const fd=Math.max(0.5,Number(item.size?.z)||2); const qty=Math.min(Number(item.quantity)||1,8); const step=(wall==='east_wall'||wall==='west_wall')?fd+0.5:fw+0.5; const iName=(item.name||'Item').replace(/\s+/g,'_'); for(let q=0;q<qty;q++){let fx=ox,fz=oz; switch(wall){case 'north_wall':fx=ox-w/2+2+cur+fw/2;fz=oz-d/2+1+fd/2;break; case 'south_wall':fx=ox-w/2+2+cur+fw/2;fz=oz+d/2-1-fd/2;break; case 'east_wall':fx=ox+w/2-1-fw/2;fz=oz-d/2+2+cur+fd/2;break; case 'west_wall':fx=ox-w/2+1+fw/2;fz=oz-d/2+2+cur+fd/2;break; default:fx=ox+((q%3)-1)*(fw+1);fz=oz+Math.floor(q/3)*(fd+1)} fx=Math.max(ox-w/2+1,Math.min(ox+w/2-1,fx)); fz=Math.max(oz-d/2+1,Math.min(oz+d/2-1,fz)); pts.push(p(`${n}_${iName}_${q}`,fw,fh,fd,fx,1+fh/2,fz,vc(item.color||'Reddish brown'),vm(item.material||'wood'))); cur+=step}}}
  place(walls.north_wall,'north_wall'); place(walls.south_wall,'south_wall'); place(walls.east_wall,'east_wall'); place(walls.west_wall,'west_wall'); place([...walls.row,...walls.center],'center')
  return pts
}

function buildExterior(tw: number, td: number, r: ResearchResult): RbxPart[] {
  try {
    const fh = 12
    const wallBase = 2.3
    const fc = Math.max(3, Math.min(10, r.floorCount || 4))
    const th = fc * fh

    console.log('[buildExterior] ec:', r.exteriorColor, 'rc:', r.roofColor, 'fc:', fc)

    const plan: BuildPlan = {
      tw, td, th, wallBase,
      floorCount: fc,
      floorHeight: fh,
      buildingType: r.buildingType || '',
      architecturalStyle: r.architecturalStyle || '',
    }

    const dna = getStyleDNA(
      r.architecturalStyle || '',
      r.buildingType || '',
      { exteriorColor: r.exteriorColor, roofColor: r.roofColor }
    )

    if (r.hasColonnade) dna.hasColonnade = true

    console.log('[buildExterior] StyleDNA:', dna.family, 'primary:', dna.primaryColor, 'roof:', dna.roofColor)

    const structure = generateStructure(plan, dna)
    const roof = generateRoof(plan, dna)
    const facade = generateFacade(plan, dna)
    const scenery = (r.scenery as SceneryLevel) || 'minimal'
    const terrain = generateTerrain(plan, dna, scenery)

    const all = [...structure, ...roof, ...facade, ...terrain]

    for (const part of all) {
      const n = part.name.toLowerCase()
      const isGround = n.includes('ground') || n.includes('road') || n.includes('pavement') ||
        n.includes('kerb') || n.includes('driveway') || n.includes('carpark') || n.includes('lawn') ||
        n.includes('slab')
      if (isGround) {
        part.material = 'concrete'
      }
    }

    console.log('[buildExterior] total parts:', all.length)
    return all
  } catch (e) {
    console.error('[buildExterior] CRASH:', e)
    return []
  }
}

export function compileBlueprint(r:ResearchResult, seed?: number):CompiledBlueprint {
  try {
  console.log('[blueprint] START:',r.buildingType,'fc:',r.floorCount,'style:',r.architecturalStyle,'ec:',r.exteriorColor)
  const style=(r.architecturalStyle||'modern').toLowerCase()
  const rooms:RbxPart[][]=[], layout:CompiledBlueprint['roomLayout']=[]

  const tw = Math.min(
    Math.max(r.totalWidth || 40, 30),
    55
  )
  const td = Math.min(
    Math.max(r.totalDepth || 28, 20),
    40
  )

  console.log('[blueprint] footprint:', tw, 'x', td)

  const roomSpecs = r.rooms.map(room => ({
    name: room.name,
    width: Math.max(8, Number(room.width) || 12),
    depth: Math.max(8, Number(room.depth) || 10),
    type: getRoomType(room.name)
  }))

  const placedRooms = placeRoomsWithBSP(tw, td, roomSpecs, seed || 42)

  for (const room of placedRooms) {
    const hw = room.width / 2
    const hd = room.depth / 2
    room.x = Math.max(hw + 2, Math.min(tw - hw - 2, room.x))
    room.z = Math.max(hd + 2, Math.min(td - hd - 2, room.z))
  }

  console.log('[blueprint] rooms clamped, count:', placedRooms.length)

  // Section 5: Align entrance room to front of building
  const entranceRoom = placedRooms.find(pr =>
    pr.type === 'reception' ||
    pr.name.toLowerCase().includes('entrance') ||
    pr.name.toLowerCase().includes('lobby') ||
    pr.name.toLowerCase().includes('reception') ||
    pr.name.toLowerCase().includes('main')
  )
  if (entranceRoom) {
    entranceRoom.x = tw / 2
    entranceRoom.z = entranceRoom.depth / 2 + 3
    console.log('[blueprint] entrance room aligned to front:', entranceRoom.name)
  }

  let fallbackZ = td + 2
  for (let i = 0; i < r.rooms.length; i++) {
    const room = r.rooms[i]
    const placed = placedRooms[i]
    if (placed) {
      rooms.push(compileRoom(room, placed.x, placed.z, style))
      layout.push({ name: room.name, x: placed.x, z: placed.z, width: placed.width, depth: placed.depth, type: placed.type })
    } else {
      const w = Math.max(8, Number(room.width) || 12)
      const d = Math.max(8, Number(room.depth) || 10)
      rooms.push(compileRoom(room, tw / 2, fallbackZ + d / 2, style))
      layout.push({ name: room.name, x: tw / 2, z: fallbackZ + d / 2, width: w, depth: d, type: getRoomType(room.name) })
      fallbackZ += d + 2
    }
  }

  // Section 10: Terrain + street furniture
  const isChinese = style.includes('chinese') || style.includes('peranakan') ||
    (r.buildingType||'').toLowerCase().includes('shophouse') || (r.buildingType||'').toLowerCase().includes('singapore')
  const terrain = buildTerrain(tw, td, style, isChinese)

  const exterior = [...buildExterior(tw, td, r), ...terrain]
  console.log('[blueprint] rooms:',rooms.length,'ext:',exterior.length,'total:',rooms.reduce((s,r2)=>s+r2.length,0)+exterior.length)
  return { buildingType:r.buildingType, rooms, exterior, totalWidth:tw, totalDepth:td, roomLayout:layout }
  } catch (e) {
    console.error('[blueprint] CRASH:', e)
    throw e
  }
}
