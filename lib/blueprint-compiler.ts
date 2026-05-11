import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'
import { placeRoomsWithBSP, getRoomType } from './room-placer'
import { calculateWindowPositions, buildProportionalWindow } from './window-system'

export interface CompiledBlueprint { buildingType:string; rooms:RbxPart[][]; exterior:RbxPart[]; totalWidth:number; totalDepth:number; roomLayout:Array<{name:string;x:number;z:number;width:number;depth:number;type:string}> }
export type RoomLayoutItem = CompiledBlueprint['roomLayout'][0]

const VC:Record<string,string>={'white':'White','institutional white':'Institutional white','light grey':'Light grey','light gray':'Light grey','medium stone grey':'Medium stone grey','medium stone gray':'Medium stone grey','dark grey':'Dark grey','dark gray':'Dark grey','light stone grey':'Light stone grey','dark stone grey':'Dark stone grey','really black':'Really black','black':'Really black','bright red':'Bright red','dark red':'Dark red','rust':'Rust','reddish brown':'Reddish brown','bright orange':'Bright orange','dark orange':'Dark orange','bright yellow':'Bright yellow','sand yellow':'Sand yellow','brick yellow':'Brick yellow','bright green':'Bright green','dark green':'Dark green','sand green':'Sand green','medium green':'Medium green','bright blue':'Bright blue','navy blue':'Navy blue','sand blue':'Sand blue','light blue':'Light blue','hot pink':'Hot pink','cashmere':'Cashmere','teal':'Bright bluish green','cyan':'Bright bluish green','brown':'Reddish brown','beige':'Sand yellow','cream':'White','grey':'Light grey','gray':'Light grey','green':'Bright green','blue':'Bright blue','red':'Bright red','yellow':'Bright yellow','orange':'Bright orange','pink':'Hot pink'}
const VM:Record<string,string>={smoothplastic:'smoothplastic',plastic:'smoothplastic',wood:'wood',timber:'wood',brick:'brick',concrete:'concrete',stone:'concrete',metal:'metal',steel:'metal',fabric:'fabric',carpet:'fabric',marble:'marble',neon:'neon',glass:'smoothplastic',render:'smoothplastic'}

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

// ── Terrain and street furniture ──────────────────────────────────────────────
function buildTerrain(tw: number, td: number, _style: string, isChinese: boolean): RbxPart[] {
  const parts: RbxPart[] = []
  parts.push(p('Terrain_Ground',tw+80,0.5,td+80,tw/2,0.25,td/2,'Medium stone grey','concrete'))
  if (isChinese) {
    parts.push(p('Terrain_FiveFoot',tw+2,0.5,5,tw/2,0.55,-2.5,'Light stone grey','concrete'))
    const colCount = Math.floor(tw/4)
    for (let i=0;i<colCount;i++) {
      const cx=(tw/(colCount+1))*(i+1)
      parts.push(p(`FiveFootCol${i}`,0.6,3.5,0.6,cx,2.25,-4.5,'Sand yellow','concrete'))
    }
    parts.push(p('FiveFootRoof',tw+2,0.3,5,tw/2,4,-2.5,'Sand yellow','concrete'))
  }
  parts.push(p('Terrain_Road',tw+80,0.4,18,tw/2,0.4,-18,'Dark stone grey','concrete'))
  const lineCount=Math.floor((tw+60)/8)
  for (let i=0;i<lineCount;i++) {
    if(i%2===0){const lx=-30+i*8+4; parts.push(p(`Road_Line${i}`,4,0.32,0.2,lx,0.32,-16,'White','smoothplastic'))}
  }
  parts.push(p('Terrain_Pavement',tw+10,0.6,12,tw/2,0.6,-6,'Medium stone grey','concrete'))
  parts.push(p('Terrain_Kerb',tw+10,0.8,0.4,tw/2,0.65,-4.2,'Light stone grey','concrete'))
  const treePositions=[{x:-5,z:-6},{x:tw+5,z:-6},{x:-8,z:td+8},{x:tw+8,z:td+8}]
  for (let ti = 0; ti < treePositions.length; ti++) {
    const tp = treePositions[ti]
    parts.push(p(`Tree_Trunk${ti}`,0.8,8,0.8,tp.x,4,tp.z,'Reddish brown','wood'))
    parts.push(p(`Tree_Can1_${ti}`,5,5,5,tp.x,10,tp.z,'Bright green','smoothplastic'))
    parts.push(p(`Tree_Can2_${ti}`,4,4,4,tp.x+1,11,tp.z+0.5,'Medium green','smoothplastic'))
    parts.push(p(`Tree_Can3_${ti}`,3.5,3.5,3.5,tp.x-0.8,9.5,tp.z-0.5,'Dark green','smoothplastic'))
  }
  for (let b=0;b<4;b++) {
    const bx=tw/2-6+b*4
    parts.push(p(`Bollard${b}`,0.5,1.5,0.5,bx,1.25,-3.5,'Really black','smoothplastic'))
    parts.push(p(`BollardCap${b}`,0.7,0.3,0.7,bx,2.15,-3.5,'Dark grey','smoothplastic'))
  }
  parts.push(p('Bench_Seat',3,0.2,0.8,tw/2+8,1.3,-6,'Reddish brown','wood'))
  parts.push(p('Bench_LegL',0.15,1.2,0.8,tw/2+6.6,0.7,-6,'Dark grey','metal'))
  parts.push(p('Bench_LegR',0.15,1.2,0.8,tw/2+9.4,0.7,-6,'Dark grey','metal'))
  parts.push(p('Bench_Back',3,0.8,0.1,tw/2+8,2,-6.3,'Reddish brown','wood'))
  parts.push(p('Bin_Body',0.8,1.2,0.8,tw/2-8,0.9,-6,'Dark grey','smoothplastic'))
  parts.push(p('Bin_Lid',1,0.2,1,tw/2-8,1.6,-6,'Really black','smoothplastic'))
  parts.push(p('Sign_Post',0.2,3,0.2,tw+6,2,-5,'Dark grey','metal'))
  parts.push(p('Sign_Board',2.5,0.8,0.1,tw+6,3.8,-5,'Bright green','smoothplastic'))
  return parts
}

function compileRoom(room:ResearchResult['rooms'][0],ox:number,oz:number,style:string):RbxPart[] {
  const pts:RbxPart[]=[]; const w=Math.max(8,Number(room.width)||12); const d=Math.max(8,Number(room.depth)||10); const h=Math.max(8,Number(room.height)||10)
  const wc=vc(room.wallColor||'Light grey'); const fc=vc(room.floorColor||'Medium stone grey'); const fm=vm(room.floorMaterial||'concrete'); const n=room.name.replace(/\s+/g,'_')
  pts.push(p(`${n}_Floor`,w,0.5,d,ox,0.25,oz,fc,fm))
  const bc=fc==='White'?'Light grey':'White'; pts.push(p(`${n}_BN`,w,0.52,0.35,ox,0.26,oz-d/2+0.175,bc,fm)); pts.push(p(`${n}_BS`,w,0.52,0.35,ox,0.26,oz+d/2-0.175,bc,fm))
  pts.push(p(`${n}_Ceil`,w,0.4,d,ox,h-0.2,oz,'White','smoothplastic'))
  const lc=Math.max(1,Math.floor(w/16)); for(let l=0;l<lc;l++){const lx=ox-w/2+(w/(lc+1))*(l+1); pts.push(p(`${n}_Light${l}`,3,0.2,1,lx,h-0.35,oz,'Institutional white','neon',0,true)); pts.push(p(`${n}_LightS${l}`,3.4,0.1,1.4,lx,h-0.25,oz,'White','smoothplastic'))}
  pts.push(p(`${n}_WN`,w,h,0.3,ox,h/2,oz-d/2,wc,'smoothplastic')); pts.push(p(`${n}_WS`,w,h,0.3,ox,h/2,oz+d/2,wc,'smoothplastic')); pts.push(p(`${n}_WW`,0.3,h,d,ox-w/2,h/2,oz,wc,'smoothplastic')); pts.push(p(`${n}_WE`,0.3,h,d,ox+w/2,h/2,oz,wc,'smoothplastic'))
  pts.push(p(`${n}_SKN`,w+0.1,0.6,0.15,ox,0.8,oz-d/2+0.075,'White','smoothplastic')); pts.push(p(`${n}_SKS`,w+0.1,0.6,0.15,ox,0.8,oz+d/2-0.075,'White','smoothplastic')); pts.push(p(`${n}_SKW`,0.15,0.6,d+0.1,ox-w/2+0.075,0.8,oz,'White','smoothplastic')); pts.push(p(`${n}_SKE`,0.15,0.6,d+0.1,ox+w/2-0.075,0.8,oz,'White','smoothplastic'))
  pts.push(p(`${n}_DFL`,0.2,7.2,0.4,ox-1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFR`,0.2,7.2,0.4,ox+1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFT`,3.4,0.2,0.4,ox,7.1,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_Door`,3,7,0.15,ox,3.5,oz-d/2-0.08,'Reddish brown','wood')); pts.push(p(`${n}_Hndl`,0.15,0.15,0.35,ox+1.1,3.5,oz-d/2-0.17,'Medium stone grey','metal'))
  const fur=room.furniture||[]; const walls:Record<string,typeof fur>={north_wall:[],south_wall:[],east_wall:[],west_wall:[],row:[],center:[]}
  for(const f of fur){const k=f.placement||'center'; if(walls[k])walls[k].push(f); else walls.center.push(f)}
  const place=(items:typeof fur,wall:string)=>{let cur=0; for(const item of items){const fw=Math.max(0.5,Number(item.size?.x)||2); const fh=Math.max(0.5,Number(item.size?.y)||1); const fd=Math.max(0.5,Number(item.size?.z)||2); const qty=Math.min(Number(item.quantity)||1,8); const step=(wall==='east_wall'||wall==='west_wall')?fd+0.5:fw+0.5; for(let q=0;q<qty;q++){let fx=ox,fz=oz; switch(wall){case 'north_wall':fx=ox-w/2+2+cur+fw/2;fz=oz-d/2+1+fd/2;break; case 'south_wall':fx=ox-w/2+2+cur+fw/2;fz=oz+d/2-1-fd/2;break; case 'east_wall':fx=ox+w/2-1-fw/2;fz=oz-d/2+2+cur+fd/2;break; case 'west_wall':fx=ox-w/2+1+fw/2;fz=oz-d/2+2+cur+fd/2;break; default:fx=ox+((q%3)-1)*(fw+1);fz=oz+Math.floor(q/3)*(fd+1)} fx=Math.max(ox-w/2+1,Math.min(ox+w/2-1,fx)); fz=Math.max(oz-d/2+1,Math.min(oz+d/2-1,fz)); pts.push(p(`${n}_${item.name.replace(/\s+/g,'_')}_${q}`,fw,fh,fd,fx,1+fh/2,fz,vc(item.color||'Reddish brown'),vm(item.material||'wood'))); cur+=step}}}
  place(walls.north_wall,'north_wall'); place(walls.south_wall,'south_wall'); place(walls.east_wall,'east_wall'); place(walls.west_wall,'west_wall'); place([...walls.row,...walls.center],'center')
  return pts
}

function buildExterior(tw: number, td: number, r: ResearchResult): RbxPart[] {
  const pts: RbxPart[] = []
  const fc = Math.max(1, parseInt(String(r.floorCount||3),10)||3)
  const fh = Math.max(10, parseInt(String(r.floorHeight||12),10)||12)
  const th = fc * fh
  const ec = r.exteriorColor || 'Sand yellow'
  const rc = r.roofColor || 'Dark green'
  const st = (r.architecturalStyle||'').toLowerCase()
  const bt = (r.buildingType||'').toLowerCase()

  const isChinese = bt.includes('peranakan')||bt.includes('shophouse')||
    bt.includes('singapore')||st.includes('peranakan')||st.includes('colonial')||
    r.hasColonnade===true

  console.log('[exterior] fc:',fc,'fh:',fh,'ec:',ec,'rc:',rc,'chinese:',isChinese)

  // ── GROUND PLANE ─────────────────────────────────────────────
  pts.push(p('Ground', tw+80, 0.5, td+80, tw/2, 0.25, td/2, 'Medium stone grey', 'concrete'))
  pts.push(p('Pavement', tw+12, 0.6, 12, tw/2, 0.55, -6, 'Light stone grey', 'concrete'))
  pts.push(p('Road', tw+80, 0.4, 20, tw/2, 0.4, -20, 'Dark stone grey', 'concrete'))
  pts.push(p('RoadLine', tw+80, 0.42, 0.3, tw/2, 0.42, -20, 'White', 'smoothplastic'))
  pts.push(p('Kerb', tw+12, 1.0, 0.5, tw/2, 0.8, -0.25, 'Medium stone grey', 'concrete'))

  // ── BUILDING BASE PLINTH ──────────────────────────────────────
  // A projecting base gives the building weight and anchors it to ground
  pts.push(p('Plinth_Front', tw+0.6, 1.2, 0.8, tw/2, 0.6, -0.4, ec, 'smoothplastic'))
  pts.push(p('Plinth_Back', tw+0.6, 1.2, 0.8, tw/2, 0.6, td+0.4, ec, 'smoothplastic'))
  pts.push(p('Plinth_Left', 0.8, 1.2, td+0.6, -0.4, 0.6, td/2, ec, 'smoothplastic'))
  pts.push(p('Plinth_Right', 0.8, 1.2, td+0.6, tw+0.4, 0.6, td/2, ec, 'smoothplastic'))

  // ── MAIN WALLS ────────────────────────────────────────────────
  pts.push(p('Wall_Back', tw, th, 0.6, tw/2, th/2, td, ec, 'smoothplastic'))
  pts.push(p('Wall_Left', 0.6, th, td, 0, th/2, td/2, ec, 'smoothplastic'))
  pts.push(p('Wall_Right', 0.6, th, td, tw, th/2, td/2, ec, 'smoothplastic'))
  pts.push(p('Wall_Front', tw, th, 0.6, tw/2, th/2, 0, ec, 'smoothplastic'))

  // ── CORNER PILASTERS ─────────────────────────────────────────
  // Projecting corner elements add depth and frame the facade
  const pilW = 2.5
  const pilCorners: [number,number][] = [[0,0],[tw,0],[0,td],[tw,td]]
  for (const [cx, cz] of pilCorners) {
    pts.push(p(`Pil_${cx}_${cz}`, pilW, th, pilW, cx, th/2, cz, ec, 'smoothplastic'))
    pts.push(p(`PilCap_${cx}_${cz}`, pilW+0.4, 0.8, pilW+0.4, cx, th+0.4, cz, ec, 'smoothplastic'))
    pts.push(p(`PilBase_${cx}_${cz}`, pilW+0.6, 1.5, pilW+0.6, cx, 0.75, cz, ec, 'smoothplastic'))
  }

  // ── PER-FLOOR DETAILS ─────────────────────────────────────────
  for (let f = 0; f < fc; f++) {
    const fy = f * fh
    const isTop = f === fc-1
    const isGround = f === 0

    // Floor band - multi-layer moulding between floors
    if (f > 0) {
      // Main band
      pts.push(p(`Band_F${f}`, tw+1.2, 1.8, 0.8, tw/2, fy+0.9, -0.4, 'White', 'smoothplastic'))
      pts.push(p(`Band_B${f}`, tw+1.2, 1.8, 0.8, tw/2, fy+0.9, td+0.4, 'White', 'smoothplastic'))
      pts.push(p(`Band_L${f}`, 0.8, 1.8, td+1.2, -0.4, fy+0.9, td/2, 'White', 'smoothplastic'))
      pts.push(p(`Band_R${f}`, 0.8, 1.8, td+1.2, tw+0.4, fy+0.9, td/2, 'White', 'smoothplastic'))
      // Drip edge below band
      pts.push(p(`Drip_F${f}`, tw+1.6, 0.3, 0.4, tw/2, fy-0.15, -0.6, 'White', 'smoothplastic'))
      pts.push(p(`Drip_B${f}`, tw+1.6, 0.3, 0.4, tw/2, fy-0.15, td+0.6, 'White', 'smoothplastic'))
      // Peranakan decorative tile inserts along front band
      if (isChinese) {
        const tileCount = Math.floor(tw/3)
        for (let t = 0; t < tileCount; t++) {
          const tx2 = t*3 + 1.5
          const tileColor = t%3===0 ? 'Bright blue' : t%3===1 ? 'Bright red' : 'Bright green'
          pts.push(p(`Tile_F${f}_${t}`, 2.5, 0.8, 0.12, tx2, fy+0.9, -0.45, tileColor, 'smoothplastic'))
        }
      }
    }

    // ── WINDOWS per floor ─────────────────────────────────────
    if (!isGround || !isChinese) {
      // Front windows - recessed into wall for depth
      const winCount = Math.max(2, Math.floor((tw-6)/8))
      const winSpacing = (tw-4) / (winCount+1)
      const winW = Math.min(5, winSpacing * 0.6)
      const winH = fh * 0.52
      const winY = fy + fh * 0.5 + 0.5

      for (let w = 0; w < winCount; w++) {
        const wx = 2 + winSpacing*(w+1)

        // Window recess - creates depth shadow
        pts.push(p(`WRec_F${f}_${w}`, winW+0.6, winH+0.6, 0.6, wx, winY, -0.05, 'Dark grey', 'smoothplastic'))

        // Frame - white surround
        pts.push(p(`WFrT_F${f}_${w}`, winW+0.5, 0.35, 0.3, wx, winY+winH/2+0.17, -0.2, 'White', 'smoothplastic'))
        pts.push(p(`WFrB_F${f}_${w}`, winW+0.5, 0.35, 0.3, wx, winY-winH/2-0.17, -0.2, 'White', 'smoothplastic'))
        pts.push(p(`WFrL_F${f}_${w}`, 0.35, winH+0.7, 0.3, wx-winW/2-0.17, winY, -0.2, 'White', 'smoothplastic'))
        pts.push(p(`WFrR_F${f}_${w}`, 0.35, winH+0.7, 0.3, wx+winW/2+0.17, winY, -0.2, 'White', 'smoothplastic'))

        // Sill with projection
        pts.push(p(`WSill_F${f}_${w}`, winW+0.8, 0.25, 0.5, wx, winY-winH/2-0.38, -0.2, 'White', 'smoothplastic'))

        // Glass - light blue tint, pushed forward of wall to avoid z-fighting
        pts.push(p(`WGlass_F${f}_${w}`, winW-0.1, winH-0.1, 0.1, wx, winY, -0.15, 'Light blue', 'smoothplastic', 0.2))

        // Lattice for peranakan
        if (isChinese) {
          pts.push(p(`WLatH1_F${f}_${w}`, winW-0.1, 0.08, 0.06, wx, winY+winH*0.2, -0.04, 'White', 'smoothplastic'))
          pts.push(p(`WLatH2_F${f}_${w}`, winW-0.1, 0.08, 0.06, wx, winY-winH*0.2, -0.04, 'White', 'smoothplastic'))
          pts.push(p(`WLatV_F${f}_${w}`, 0.08, winH-0.2, 0.06, wx, winY, -0.04, 'White', 'smoothplastic'))
        }

        // Lintel above window
        pts.push(p(`WLin_F${f}_${w}`, winW+0.6, 0.4, 0.35, wx, winY+winH/2+0.5, -0.2, ec, 'smoothplastic'))
      }
    }

    // ── PAGODA ROOF per floor ─────────────────────────────────
    if (isChinese) {
      const ry = fy + fh
      // Main slab - thin and wide
      pts.push(p(`Pag${f}`, tw+2, 0.7, td+2, tw/2, ry+0.35, td/2, rc, 'smoothplastic'))
      // Fascia underside - darker
      pts.push(p(`PagFas${f}`, tw+2.2, 0.25, td+2.2, tw/2, ry-0.12, td/2, 'Dark green', 'smoothplastic'))
      // Front overhang with uptick
      pts.push(p(`PagOF${f}`, tw+3, 0.5, 1.5, tw/2, ry+0.1, -1.2, rc, 'smoothplastic'))
      pts.push(p(`PagOB${f}`, tw+3, 0.5, 1.5, tw/2, ry+0.1, td+1.2, rc, 'smoothplastic'))
      pts.push(p(`PagOL${f}`, 1.5, 0.5, td+3, -1.2, ry+0.1, td/2, rc, 'smoothplastic'))
      pts.push(p(`PagOR${f}`, 1.5, 0.5, td+3, tw+1.2, ry+0.1, td/2, rc, 'smoothplastic'))
      // Corner upticks - raised corner piece + higher tip to simulate pagoda curl
      const pagCornPos: [number,number][] = [[-1.8,-1.8],[tw+1.8,-1.8],[-1.8,td+1.8],[tw+1.8,td+1.8]]
      for (let ci = 0; ci < pagCornPos.length; ci++) {
        pts.push(p(`PagC${f}_${ci}`, 2.5, 1.0, 2.5, pagCornPos[ci][0], ry+0.8, pagCornPos[ci][1], rc, 'smoothplastic'))
        pts.push(p(`PagTip${f}_${ci}`, 1.2, 0.6, 1.2, pagCornPos[ci][0], ry+1.4, pagCornPos[ci][1], rc, 'smoothplastic'))
      }
      // Ridge
      pts.push(p(`PagRid${f}`, tw+1, 0.5, 0.7, tw/2, ry+0.85, td/2, rc, 'smoothplastic'))
    }

    // Top floor flat roof
    if (isTop && !isChinese) {
      pts.push(p('Roof', tw+1, 0.8, td+1, tw/2, th+0.4, td/2, rc, 'smoothplastic'))
      pts.push(p('Parapet_F', tw+1, 1.5, 0.5, tw/2, th+1.25, -0.25, ec, 'smoothplastic'))
      pts.push(p('Parapet_B', tw+1, 1.5, 0.5, tw/2, th+1.25, td+0.25, ec, 'smoothplastic'))
      pts.push(p('Parapet_L', 0.5, 1.5, td+1, -0.25, th+1.25, td/2, ec, 'smoothplastic'))
      pts.push(p('Parapet_R', 0.5, 1.5, td+1, tw+0.25, th+1.25, td/2, ec, 'smoothplastic'))
    }
  }

  // ── COLONNADE GROUND FLOOR ─────────────────────────────────
  if (isChinese) {
    const colCount = Math.max(4, Math.floor(tw/6))
    const cs = tw / (colCount+1)
    const colZ = 0.4

    for (let i = 0; i < colCount; i++) {
      const cx = cs*(i+1)
      // Square column - peranakan style
      pts.push(p(`ColPl_${i}`, 2.0, 1.0, 2.0, cx, 0.5, colZ, 'White', 'smoothplastic'))
      pts.push(p(`ColSh_${i}`, 1.6, fh*0.85, 1.6, cx, fh*0.425, colZ, 'White', 'smoothplastic'))
      pts.push(p(`ColCp_${i}`, 2.2, 0.7, 2.2, cx, fh*0.76+0.35, colZ, 'White', 'smoothplastic'))
      // Arch between columns
      if (i < colCount-1) {
        pts.push(p(`ColAr_${i}`, cs-1.6, 0.7, 0.9, cx+cs/2, fh*0.8, colZ, 'White', 'smoothplastic'))
        // Arch face plate
        pts.push(p(`ColArF_${i}`, cs-1.6, 0.5, 0.3, cx+cs/2, fh*0.8+0.1, colZ-0.3, 'White', 'smoothplastic'))
      }
    }

    // Five-foot-way ceiling
    pts.push(p('FFW_Ceil', tw+1, 0.4, 4, tw/2, fh*0.82, -2, 'White', 'smoothplastic'))
    pts.push(p('FFW_Floor', tw+1, 0.4, 4, tw/2, 0.5, -2, 'Light stone grey', 'concrete'))

    // Entrance arch with keystone and doors
    const entrW = 8
    const entrH = fh * 0.85
    pts.push(p('ArchSurround', entrW+2, entrH+1.5, 0.8, tw/2, entrH/2, -0.4, 'White', 'smoothplastic'))
    pts.push(p('ArchOpening', entrW, entrH, 0.6, tw/2, entrH/2, -0.3, 'Really black', 'smoothplastic', 0.9))
    pts.push(p('Keystone', 1.5, 2.0, 0.6, tw/2, entrH+0.5, -0.4, 'White', 'smoothplastic'))
    pts.push(p('DoorL', entrW/2-0.2, entrH-0.5, 0.15, tw/2-entrW/4, (entrH-0.5)/2, -0.15, 'Dark green', 'smoothplastic'))
    pts.push(p('DoorR', entrW/2-0.2, entrH-0.5, 0.15, tw/2+entrW/4, (entrH-0.5)/2, -0.15, 'Dark green', 'smoothplastic'))
  }

  // ── LAMP POSTS ───────────────────────────────────────────────
  for (const lx of [-5, tw+5]) {
    pts.push(p(`LPost_${lx}`, 0.5, 16, 0.5, lx, 8, -7, 'Dark grey', 'metal'))
    pts.push(p(`LArm_${lx}`, 0.2, 0.2, 3, lx, 15.5, -5.5, 'Dark grey', 'metal'))
    pts.push(p(`LHead_${lx}`, 1.0, 0.6, 1.0, lx, 15.5, -4, 'Bright yellow', 'smoothplastic'))
  }

  // ── DRAIN PIPES ──────────────────────────────────────────────
  for (const [dx,dz] of [[0.5,0.5],[tw-0.5,0.5],[0.5,td-0.5],[tw-0.5,td-0.5]] as [number,number][]) {
    pts.push(p(`Drain_${dx}_${dz}`, 0.3, th+1, 0.3, dx, th/2, dz, 'Dark grey', 'metal'))
  }

  // ── ROOF DETAIL ───────────────────────────────────────────────
  pts.push(p('RoofAC1', 3, 1.5, 3, tw/3, th+1.5, td/3, 'Dark grey', 'metal'))
  pts.push(p('RoofAC2', 3, 1.5, 3, tw*2/3, th+1.5, td*2/3, 'Dark grey', 'metal'))
  pts.push(p('RoofTank', 2.5, 3, 2.5, tw/2, th+2.5, td/2, 'Medium stone grey', 'concrete'))

  // ── STREET FURNITURE ─────────────────────────────────────────
  // Trees
  for (const [tx,tz] of [[-6,-8],[tw+6,-8],[-8,td+8],[tw+8,td+8]] as [number,number][]) {
    pts.push(p(`Trunk_${tx}`, 0.8, 10, 0.8, tx, 5, tz, 'Reddish brown', 'wood'))
    pts.push(p(`Can1_${tx}`, 6, 5, 6, tx, 12, tz, 'Bright green', 'smoothplastic'))
    pts.push(p(`Can2_${tx}`, 4.5, 4, 4.5, tx+1, 13.5, tz+0.5, 'Medium green', 'smoothplastic'))
    pts.push(p(`Can3_${tx}`, 3.5, 3.5, 3.5, tx-0.8, 11, tz-0.5, 'Dark green', 'smoothplastic'))
  }

  // Bollards
  for (let b = 0; b < 5; b++) {
    const bx = tw/2 - 8 + b*4
    pts.push(p(`Bol_${b}`, 0.6, 1.8, 0.6, bx, 1.1, -3.5, 'Really black', 'smoothplastic'))
    pts.push(p(`BolC_${b}`, 0.8, 0.3, 0.8, bx, 2.15, -3.5, 'Dark grey', 'smoothplastic'))
  }

  // Bench
  pts.push(p('Bench_S', 3.5, 0.2, 0.9, tw/2+10, 1.5, -7, 'Reddish brown', 'wood'))
  pts.push(p('Bench_LL', 0.15, 1.3, 0.9, tw/2+8.4, 0.75, -7, 'Dark grey', 'metal'))
  pts.push(p('Bench_LR', 0.15, 1.3, 0.9, tw/2+11.6, 0.75, -7, 'Dark grey', 'metal'))
  pts.push(p('Bench_B', 3.5, 0.8, 0.12, tw/2+10, 2.1, -7.35, 'Reddish brown', 'wood'))

  return pts
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
