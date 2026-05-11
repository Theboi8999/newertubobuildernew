import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'
import { placeRoomsWithBSP, getRoomType } from './room-placer'
import { calculateWindowPositions, buildProportionalWindow } from './window-system'

export interface CompiledBlueprint { buildingType:string; rooms:RbxPart[][]; exterior:RbxPart[]; totalWidth:number; totalDepth:number; roomLayout:Array<{name:string;x:number;z:number;width:number;depth:number;type:string}> }
export type RoomLayoutItem = CompiledBlueprint['roomLayout'][0]

const VC:Record<string,string>={'white':'White','institutional white':'Institutional white','light grey':'Light grey','light gray':'Light grey','medium stone grey':'Medium stone grey','medium stone gray':'Medium stone grey','dark grey':'Dark grey','dark gray':'Dark grey','light stone grey':'Light stone grey','dark stone grey':'Dark stone grey','really black':'Really black','black':'Really black','bright red':'Bright red','dark red':'Dark red','rust':'Rust','reddish brown':'Reddish brown','bright orange':'Bright orange','dark orange':'Dark orange','bright yellow':'Bright yellow','sand yellow':'Sand yellow','brick yellow':'Brick yellow','bright green':'Bright green','dark green':'Dark green','sand green':'Sand green','medium green':'Medium green','bright blue':'Bright blue','navy blue':'Navy blue','sand blue':'Sand blue','light blue':'Light blue','hot pink':'Hot pink','cashmere':'Cashmere','teal':'Bright bluish green','cyan':'Bright bluish green','brown':'Reddish brown','beige':'Sand yellow','cream':'White','grey':'Light grey','gray':'Light grey','green':'Bright green','blue':'Bright blue','red':'Bright red','yellow':'Bright yellow','orange':'Bright orange','pink':'Hot pink'}
const VM:Record<string,string>={smoothplastic:'smoothplastic',plastic:'smoothplastic',wood:'wood',timber:'wood',brick:'brick',concrete:'concrete',stone:'concrete',metal:'metal',steel:'metal',fabric:'fabric',carpet:'fabric',marble:'marble',neon:'neon',glass:'smoothplastic',render:'smoothplastic',grass:'grass'}

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
  const fc = Math.max(4, Math.min(5, r.floorCount || 4))
  const floorHeights = [14, 12, 12, 12, 12]
  const th = floorHeights.slice(0, fc).reduce((s, h) => s + h, 0)
  const base = 1.8
  const ec = r.exteriorColor || 'Sand yellow'
  const bt = (r.buildingType||'').toLowerCase()
  const st = (r.architecturalStyle||'').toLowerCase()
  const isChinese = bt.includes('peranakan')||bt.includes('shophouse')||
    bt.includes('singapore')||st.includes('peranakan')||
    st.includes('colonial')||r.hasColonnade===true

  console.log('[exterior] fc:',fc,'th:',th,'ec:',ec,'chinese:',isChinese)

  // ── TERRAIN ─────────────────────────────────────────────────
  pts.push(p('Ground', tw+20, 0.5, td+20, tw/2, -0.25, td/2, 'Medium stone grey', 'concrete'))

  // ── FOUNDATION ──────────────────────────────────────────────
  pts.push(p('Foundation', tw+1, base, td+1, tw/2, base/2, td/2, ec, 'concrete'))
  pts.push(p('Found_Step', tw+0.4, 0.5, td+0.4, tw/2, base+0.25, td/2, ec, 'smoothplastic'))

  // ── MAIN WALLS ──────────────────────────────────────────────
  const wallBase = base + 0.5
  const floorOffsets: number[] = []
  for (let i = 0; i < fc; i++) {
    floorOffsets.push(i === 0 ? wallBase : floorOffsets[i-1] + floorHeights[i-1])
  }
  pts.push(p('WallBack', tw, th, 0.7, tw/2, wallBase+th/2, td, ec, 'smoothplastic'))
  pts.push(p('WallLeft', 0.7, th, td, 0, wallBase+th/2, td/2, ec, 'smoothplastic'))
  pts.push(p('WallRight', 0.7, th, td, tw, wallBase+th/2, td/2, ec, 'smoothplastic'))
  pts.push(p('WallFront', tw, th, 0.7, tw/2, wallBase+th/2, 0, ec, 'smoothplastic'))

  // ── CORNER PILASTERS ────────────────────────────────────────
  const pilW = 2.8
  const pilH = th + 1
  const pilCorners: [number,number][] = [[0,0],[tw,0],[0,td],[tw,td]]
  for (const [cx, cz] of pilCorners) {
    pts.push(p(`Pil_${cx}_${cz}`, pilW, pilH, pilW, cx, wallBase+pilH/2, cz, ec, 'smoothplastic'))
    pts.push(p(`PilCap_${cx}_${cz}`, pilW+0.8, 1.2, pilW+0.8, cx, wallBase+pilH+0.6, cz, 'White', 'smoothplastic'))
    pts.push(p(`PilBase_${cx}_${cz}`, pilW+1, 2.0, pilW+1, cx, wallBase+1, cz, ec, 'smoothplastic'))
    pts.push(p(`PilGroove_${cx}_${cz}`, 0.3, pilH-1, 0.15, cx, wallBase+pilH/2, cz+(cz===0?-0.35:0.35), 'White', 'smoothplastic'))
  }

  // ── PER-FLOOR DETAILS ────────────────────────────────────────
  for (let f = 0; f < fc; f++) {
    const fy = floorOffsets[f]
    const fh = floorHeights[f] || 12
    const isGround = f === 0
    const isTop = f === fc - 1

    // Floor band - multi layer moulding
    if (f > 0) {
      pts.push(p(`Band_F${f}`, tw+1.5, 2.2, 1.0, tw/2, fy+1.1, -0.5, 'White', 'smoothplastic'))
      pts.push(p(`Band_B${f}`, tw+1.5, 2.2, 1.0, tw/2, fy+1.1, td+0.5, 'White', 'smoothplastic'))
      pts.push(p(`Band_L${f}`, 1.0, 2.2, td+1.5, -0.5, fy+1.1, td/2, 'White', 'smoothplastic'))
      pts.push(p(`Band_R${f}`, 1.0, 2.2, td+1.5, tw+0.5, fy+1.1, td/2, 'White', 'smoothplastic'))
      pts.push(p(`Drip_F${f}`, tw+2.0, 0.35, 0.5, tw/2, fy-0.17, -0.7, 'White', 'smoothplastic'))
      pts.push(p(`Drip_B${f}`, tw+2.0, 0.35, 0.5, tw/2, fy-0.17, td+0.7, 'White', 'smoothplastic'))
      pts.push(p(`Drip_L${f}`, 0.5, 0.35, td+2.0, -0.7, fy-0.17, td/2, 'White', 'smoothplastic'))
      pts.push(p(`Drip_R${f}`, 0.5, 0.35, td+2.0, tw+0.7, fy-0.17, td/2, 'White', 'smoothplastic'))

      // Decorative tiles on band for peranakan
      if (isChinese) {
        const tCount = Math.floor((tw-4)/3)
        const tileColors = ['Bright blue','Bright red','Dark green','Bright yellow']
        for (let t = 0; t < tCount; t++) {
          const tx2 = 2 + t*3 + 1.5
          const tc = tileColors[t % tileColors.length]
          pts.push(p(`Tile_F${f}_${t}`, 2.6, 1.0, 0.15, tx2, fy+1.1, -0.55, tc, 'smoothplastic'))
        }
      }
    }

    // ── WINDOWS ─────────────────────────────────────────────
    if (!isGround || !isChinese) {
      const winCount = isGround ? Math.max(1, Math.floor((tw-12)/10)) : Math.max(2, Math.floor((tw-6)/9))
      const usableW = tw - 5
      const winSpacing = usableW / (winCount + 1)
      const winW = Math.min(6.5, winSpacing * 0.65)
      const winH = fh * 0.58
      const winY = fy + fh * 0.52

      for (let w = 0; w < winCount; w++) {
        const wx = 2.5 + winSpacing * (w + 1)

        // Deep shadow recess
        pts.push(p(`WRec_F${f}_${w}`, winW+0.8, winH+0.8, 0.7, wx, winY, -0.05, 'Really black', 'smoothplastic', 0.3))

        // Outer frame - exterior colour
        pts.push(p(`WOFrT_F${f}_${w}`, winW+0.9, 0.4, 0.5, wx, winY+winH/2+0.2, -0.25, ec, 'smoothplastic'))
        pts.push(p(`WOFrB_F${f}_${w}`, winW+0.9, 0.4, 0.5, wx, winY-winH/2-0.2, -0.25, ec, 'smoothplastic'))
        pts.push(p(`WOFrL_F${f}_${w}`, 0.4, winH+0.8, 0.5, wx-winW/2-0.45, winY, -0.25, ec, 'smoothplastic'))
        pts.push(p(`WOFrR_F${f}_${w}`, 0.4, winH+0.8, 0.5, wx+winW/2+0.45, winY, -0.25, ec, 'smoothplastic'))

        // Inner frame - white
        pts.push(p(`WFrT_F${f}_${w}`, winW+0.3, 0.3, 0.35, wx, winY+winH/2+0.15, -0.4, 'White', 'smoothplastic'))
        pts.push(p(`WFrB_F${f}_${w}`, winW+0.3, 0.3, 0.35, wx, winY-winH/2-0.15, -0.4, 'White', 'smoothplastic'))
        pts.push(p(`WFrL_F${f}_${w}`, 0.3, winH+0.6, 0.35, wx-winW/2-0.15, winY, -0.4, 'White', 'smoothplastic'))
        pts.push(p(`WFrR_F${f}_${w}`, 0.3, winH+0.6, 0.35, wx+winW/2+0.15, winY, -0.4, 'White', 'smoothplastic'))

        // Sill projection
        pts.push(p(`WSill_F${f}_${w}`, winW+1.0, 0.3, 0.65, wx, winY-winH/2-0.42, -0.32, 'White', 'smoothplastic'))

        // Glass pane - reflective institutional white, pushed clear of recess
        pts.push(p(`WGlass_F${f}_${w}`, winW, winH, 0.12, wx, winY, -0.45, 'Institutional white', 'smoothplastic', 0.3))

        // Lattice for peranakan
        if (isChinese) {
          pts.push(p(`WLH1_F${f}_${w}`, winW-0.3, 0.12, 0.08, wx, winY+winH*0.25, -0.44, 'White', 'smoothplastic'))
          pts.push(p(`WLH2_F${f}_${w}`, winW-0.3, 0.12, 0.08, wx, winY-winH*0.25, -0.44, 'White', 'smoothplastic'))
          pts.push(p(`WLV_F${f}_${w}`, 0.12, winH-0.3, 0.08, wx, winY, -0.44, 'White', 'smoothplastic'))
        }

        // Lintel above window
        pts.push(p(`WLin_F${f}_${w}`, winW+1.0, 0.45, 0.45, wx, winY+winH/2+0.52, -0.22, ec, 'smoothplastic'))
      }
    }

    // ── PAGODA ROOFS ────────────────────────────────────────
    if (isChinese) {
      const ry = fy + fh - 0.5
      console.log('[pagoda] floor', f, 'ry:', ry, 'fy:', fy, 'fh:', fh)
      const pw = tw + 2.5
      const pd = td + 2.5

      pts.push(p(`Pag${f}`, pw, 0.9, pd, tw/2, ry+0.45, td/2, 'Dark green', 'smoothplastic'))
      pts.push(p(`PagU${f}`, pw+0.3, 0.4, pd+0.3, tw/2, ry-0.2, td/2, 'Really black', 'smoothplastic', 0.2))
      pts.push(p(`PagOF${f}`, pw+2, 0.55, 1.8, tw/2, ry+0.1, -1.6, 'Dark green', 'smoothplastic'))
      pts.push(p(`PagOB${f}`, pw+2, 0.55, 1.8, tw/2, ry+0.1, td+1.6, 'Dark green', 'smoothplastic'))
      pts.push(p(`PagOL${f}`, 1.8, 0.55, pd+2, -1.6, ry+0.1, td/2, 'Dark green', 'smoothplastic'))
      pts.push(p(`PagOR${f}`, 1.8, 0.55, pd+2, tw+1.6, ry+0.1, td/2, 'Dark green', 'smoothplastic'))
      pts.push(p(`PagRidge${f}`, pw-2, 0.6, 0.8, tw/2, ry+1.05, td/2, 'Dark green', 'smoothplastic'))

      // Corner upticks - raised + tip to simulate pagoda curl
      const pagCorners: [number,number][] = [[-2,-2],[tw+2,-2],[-2,td+2],[tw+2,td+2]]
      for (let ci = 0; ci < pagCorners.length; ci++) {
        const [cx2, cz2] = pagCorners[ci]
        pts.push(p(`PagC${f}_${ci}`, 1.8, 1.0, 1.8, cx2, ry+0.7, cz2, 'Dark green', 'smoothplastic'))
        pts.push(p(`PagTip${f}_${ci}`, 0.9, 0.6, 0.9, cx2, ry+1.3, cz2, 'Dark green', 'smoothplastic'))
      }
    }

    // Top floor roof
    if (isTop) {
      const ry = fy + fh - 0.5
      if (!isChinese) {
        pts.push(p('Roof', tw+1.5, 1.0, td+1.5, tw/2, ry+0.5, td/2, 'Dark grey', 'concrete'))
        pts.push(p('Parapet_F', tw+1.5, 1.8, 0.6, tw/2, ry+1.4, -0.3, ec, 'smoothplastic'))
        pts.push(p('Parapet_B', tw+1.5, 1.8, 0.6, tw/2, ry+1.4, td+0.3, ec, 'smoothplastic'))
        pts.push(p('Parapet_L', 0.6, 1.8, td+1.5, -0.3, ry+1.4, td/2, ec, 'smoothplastic'))
        pts.push(p('Parapet_R', 0.6, 1.8, td+1.5, tw+0.3, ry+1.4, td/2, ec, 'smoothplastic'))
        pts.push(p('RoofTank', 2.5, 3.5, 2.5, tw/2, ry+2.75, td/2, 'Medium stone grey', 'concrete'))
        pts.push(p('RoofAC1', 3.5, 1.8, 3.5, tw/3, ry+1.4, td/3, 'Dark grey', 'metal'))
        pts.push(p('RoofAC2', 3.5, 1.8, 3.5, tw*2/3, ry+1.4, td*2/3, 'Dark grey', 'metal'))
      } else {
        pts.push(p('RoofCap', tw-4, 0.5, td-4, tw/2, ry+1.8, td/2, 'Dark green', 'smoothplastic'))
        pts.push(p('RoofRidge', tw-6, 0.6, 0.6, tw/2, ry+2.1, td/2, 'Dark green', 'smoothplastic'))
        pts.push(p('RoofAC1', 2.5, 1.5, 2.5, tw/3, ry+2.5, td/3, 'Dark grey', 'metal'))
        pts.push(p('RoofAC2', 2.5, 1.5, 2.5, tw*2/3, ry+2.5, td*2/3, 'Dark grey', 'metal'))
      }
    }
  }

  // ── COLONNADE GROUND FLOOR ──────────────────────────────────
  if (isChinese) {
    const gfh = floorHeights[0]
    const colCount = Math.max(4, Math.min(6, Math.floor(tw/7)))
    const cs = tw / (colCount + 1)
    const colZ = 0.5
    const colTop = wallBase + gfh * 0.88

    for (let i = 0; i < colCount; i++) {
      const cx = cs * (i + 1)
      pts.push(p(`ColPl_${i}`, 2.4, 1.0, 2.4, cx, wallBase+0.5, colZ, 'White', 'smoothplastic'))
      pts.push(p(`ColSh_${i}`, 1.8, gfh*0.82, 1.8, cx, wallBase+gfh*0.41, colZ, 'White', 'smoothplastic'))
      pts.push(p(`ColCp_${i}`, 2.6, 0.9, 2.6, cx, colTop+0.45, colZ, 'White', 'smoothplastic'))
      if (i < colCount - 1) {
        pts.push(p(`ColAr_${i}`, cs-1.8, 0.9, 1.0, cx+cs/2, colTop, colZ, 'White', 'smoothplastic'))
        pts.push(p(`ColArS_${i}`, cs-1.8, 0.5, 0.4, cx+cs/2, colTop-0.2, colZ-0.3, 'White', 'smoothplastic'))
      }
    }

    pts.push(p('FFW_Ceil', tw+0.5, 0.5, 5, tw/2, wallBase+gfh*0.9, -2.5, 'White', 'smoothplastic'))
    pts.push(p('FFW_Floor', tw+0.5, 0.4, 5, tw/2, wallBase+0.2, -2.5, 'Light stone grey', 'concrete'))

    const entrW = Math.min(tw*0.32, 9)
    // Per-column dark green shutters — skip centre entrance bay
    const shutH = gfh * 0.68
    const shutW = cs - 2.2
    for (let i = 0; i < colCount; i++) {
      const sx = cs * (i + 1)
      if (sx > tw/2 - 5 && sx < tw/2 + 5) continue
      pts.push(p(`Shut_${i}`, shutW, shutH, 0.2, sx, wallBase+shutH/2, 0.15, 'Dark green', 'smoothplastic'))
    }
    pts.push(p('EnArch', entrW+2, 1.5, 0.8, tw/2, wallBase+gfh*0.82, -0.4, 'White', 'smoothplastic'))
    pts.push(p('EnKey', 1.6, 2.0, 0.6, tw/2, wallBase+gfh*0.88, -0.4, 'White', 'smoothplastic'))
    pts.push(p('DoorL', entrW/2-0.3, gfh*0.76, 0.15, tw/2-entrW/4, wallBase+gfh*0.38, 0.08, 'Dark green', 'smoothplastic'))
    pts.push(p('DoorR', entrW/2-0.3, gfh*0.76, 0.15, tw/2+entrW/4, wallBase+gfh*0.38, 0.08, 'Dark green', 'smoothplastic'))
    pts.push(p('EnShadow', entrW, gfh*0.78, 1.0, tw/2, wallBase+gfh*0.39, 0.5, 'Really black', 'smoothplastic', 0.8))
  }

  // ── DRAIN PIPES ─────────────────────────────────────────────
  for (const [dx,dz] of [[0.4,0.4],[tw-0.4,0.4],[0.4,td-0.4],[tw-0.4,td-0.4]] as [number,number][]) {
    pts.push(p(`Drain_${dx}_${dz}`, 0.35, th+4, 0.35, dx, th/2+2, dz, 'Dark grey', 'metal'))
  }


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
