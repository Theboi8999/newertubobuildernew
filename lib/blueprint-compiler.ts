import { RbxPart } from './rbxmx'
import { ResearchResult } from './research-agent'

export interface CompiledBlueprint { buildingType:string; rooms:RbxPart[][]; exterior:RbxPart[]; totalWidth:number; totalDepth:number; roomLayout:Array<{name:string;x:number;z:number;width:number;depth:number;type:string}> }
export type RoomLayoutItem = CompiledBlueprint['roomLayout'][0]

const VC:Record<string,string>={'white':'White','institutional white':'Institutional white','light grey':'Light grey','light gray':'Light grey','medium stone grey':'Medium stone grey','medium stone gray':'Medium stone grey','dark grey':'Dark grey','dark gray':'Dark grey','light stone grey':'Light stone grey','dark stone grey':'Dark stone grey','really black':'Really black','black':'Really black','bright red':'Bright red','dark red':'Dark red','rust':'Rust','reddish brown':'Reddish brown','bright orange':'Bright orange','dark orange':'Dark orange','bright yellow':'Bright yellow','sand yellow':'Sand yellow','brick yellow':'Brick yellow','bright green':'Bright green','dark green':'Dark green','sand green':'Sand green','medium green':'Medium green','bright blue':'Bright blue','navy blue':'Navy blue','sand blue':'Sand blue','light blue':'Light blue','hot pink':'Hot pink','cashmere':'Cashmere','teal':'Bright bluish green','cyan':'Bright bluish green','brown':'Reddish brown','beige':'Sand yellow','cream':'White','grey':'Light grey','gray':'Light grey','green':'Bright green','blue':'Bright blue','red':'Bright red','yellow':'Bright yellow','orange':'Bright orange','pink':'Hot pink'}
const VM:Record<string,string>={smoothplastic:'smoothplastic',plastic:'smoothplastic',wood:'wood',timber:'wood',brick:'brick',concrete:'concrete',stone:'concrete',metal:'metal',steel:'metal',fabric:'fabric',carpet:'fabric',marble:'marble',neon:'neon',glass:'smoothplastic',render:'smoothplastic'}

function vc(c:string):string { if(!c)return 'Light grey'; const k=c.toLowerCase().trim(); if(VC[k])return VC[k]; for(const [key,val] of Object.entries(VC)){if(k.includes(key)||key.includes(k))return val} console.log('[color] no match:',c); return 'Light grey' }
function vm(m:string):string { return VM[(m||'').toLowerCase().trim()]||'smoothplastic' }
function p(name:string,sx:number,sy:number,sz:number,px:number,py:number,pz:number,color:string,material:string,transparency=0,emissive=false):RbxPart { return {name,size:{x:Math.max(0.1,sx),y:Math.max(0.1,sy),z:Math.max(0.1,sz)},position:{x:px,y:py,z:pz},color:vc(color),material:vm(material),anchored:true,transparency:Math.max(0,Math.min(1,transparency)),emissive} }

export function getRoomType(n:string):string { const l=n.toLowerCase(); if(l.includes('reception')||l.includes('lobby')||l.includes('entrance'))return 'reception'; if(l.includes('office')||l.includes('admin')||l.includes('bullpen'))return 'office'; if(l.includes('cell')||l.includes('holding'))return 'cell'; if(l.includes('toilet')||l.includes('bathroom')||l.includes('wc'))return 'toilet'; if(l.includes('shop')||l.includes('retail')||l.includes('sales'))return 'shopping'; if(l.includes('storage')||l.includes('stock'))return 'storage'; if(l.includes('kitchen')||l.includes('break')||l.includes('canteen'))return 'kitchen'; if(l.includes('meeting')||l.includes('conference'))return 'meeting'; return 'default' }

function wins(prefix:string,wx:number,wy:number,wz:number,wallW:number,floorH:number,isNS:boolean,style:string,wc:string,fi:number):RbxPart[] {
  const pts:RbxPart[]=[]; const wc2=isNS?Math.max(2,Math.floor(wallW/7)):Math.max(1,Math.floor(wallW/12)); const sp=wallW/(wc2+1); const winW=Math.min(3.5,sp*0.55); const winH=floorH*0.42; const winY=wy+floorH*0.52
  for(let i=0;i<wc2;i++){
    const off=sp*(i+1)-wallW/2; const x=isNS?wx+off:wx; const z=isNS?wz:wz+off; const n=`${prefix}_F${fi}_W${i}`
    pts.push(p(`${n}_FT`,isNS?winW+0.4:0.3,0.25,isNS?0.3:winW+0.4,x,winY+winH/2+0.12,z,wc,'smoothplastic'))
    pts.push(p(`${n}_FB`,isNS?winW+0.4:0.3,0.25,isNS?0.3:winW+0.4,x,winY-winH/2-0.12,z,wc,'smoothplastic'))
    pts.push(p(`${n}_FL`,isNS?0.25:0.3,winH+0.5,isNS?0.3:0.25,isNS?x-winW/2-0.12:x,winY,isNS?z:z-winW/2-0.12,wc,'smoothplastic'))
    pts.push(p(`${n}_FR`,isNS?0.25:0.3,winH+0.5,isNS?0.3:0.25,isNS?x+winW/2+0.12:x,winY,isNS?z:z+winW/2+0.12,wc,'smoothplastic'))
    pts.push(p(`${n}_Sill`,isNS?winW+0.6:0.4,0.2,isNS?0.4:winW+0.6,x,winY-winH/2-0.28,z,wc,'smoothplastic'))
    pts.push(p(`${n}_Glass`,isNS?winW:0.1,winH,isNS?0.1:winW,x,winY,z,'Institutional white','smoothplastic',0.4))
    if(style.includes('chinese')||style.includes('peranakan')||style.includes('colonial')){
      pts.push(p(`${n}_LH1`,isNS?winW:0.08,0.08,isNS?0.08:winW,x,winY+winH*0.25,z,'White','smoothplastic'))
      pts.push(p(`${n}_LH2`,isNS?winW:0.08,0.08,isNS?0.08:winW,x,winY-winH*0.25,z,'White','smoothplastic'))
      pts.push(p(`${n}_LV`,isNS?0.08:0.08,winH,isNS?0.08:0.08,x,winY,z,'White','smoothplastic'))
    } else if(style.includes('victorian')||style.includes('georgian')||style.includes('classical')){
      pts.push(p(`${n}_Lin`,isNS?winW+0.6:0.4,0.4,isNS?0.4:winW+0.6,x,winY+winH/2+0.4,z,wc,'smoothplastic'))
      pts.push(p(`${n}_MB`,isNS?winW:0.08,0.08,isNS?0.08:winW,x,winY,z,'White','smoothplastic'))
    }
  }
  return pts
}

function compileRoom(room:ResearchResult['rooms'][0],ox:number,oz:number,style:string):RbxPart[] {
  const pts:RbxPart[]=[]; const w=Math.max(8,Number(room.width)||12); const d=Math.max(8,Number(room.depth)||10); const h=Math.max(8,Number(room.height)||10)
  const wc=vc(room.wallColor||'Light grey'); const fc=vc(room.floorColor||'Medium stone grey'); const fm=vm(room.floorMaterial||'concrete'); const n=room.name.replace(/\s+/g,'_')
  pts.push(p(`${n}_Floor`,w,0.5,d,ox,0.25,oz,fc,fm))
  const bc=fc==='White'?'Light grey':'White'; pts.push(p(`${n}_BN`,w,0.52,0.35,ox,0.26,oz-d/2+0.175,bc,fm)); pts.push(p(`${n}_BS`,w,0.52,0.35,ox,0.26,oz+d/2-0.175,bc,fm))
  pts.push(p(`${n}_Ceil`,w,0.4,d,ox,h-0.2,oz,'White','smoothplastic'))
  const lc=Math.max(1,Math.floor(w/16)); for(let l=0;l<lc;l++){const lx=ox-w/2+(w/(lc+1))*(l+1); pts.push(p(`${n}_Light${l}`,3,0.2,1,lx,h-0.35,oz,'Institutional white','neon',0.6,true)); pts.push(p(`${n}_LightS${l}`,3.4,0.1,1.4,lx,h-0.25,oz,'White','smoothplastic'))}
  pts.push(p(`${n}_WN`,w,h,0.3,ox,h/2,oz-d/2,wc,'smoothplastic')); pts.push(p(`${n}_WS`,w,h,0.3,ox,h/2,oz+d/2,wc,'smoothplastic')); pts.push(p(`${n}_WW`,0.3,h,d,ox-w/2,h/2,oz,wc,'smoothplastic')); pts.push(p(`${n}_WE`,0.3,h,d,ox+w/2,h/2,oz,wc,'smoothplastic'))
  pts.push(p(`${n}_SKN`,w+0.1,0.6,0.15,ox,0.8,oz-d/2+0.075,'White','smoothplastic')); pts.push(p(`${n}_SKS`,w+0.1,0.6,0.15,ox,0.8,oz+d/2-0.075,'White','smoothplastic')); pts.push(p(`${n}_SKW`,0.15,0.6,d+0.1,ox-w/2+0.075,0.8,oz,'White','smoothplastic')); pts.push(p(`${n}_SKE`,0.15,0.6,d+0.1,ox+w/2-0.075,0.8,oz,'White','smoothplastic'))
  pts.push(p(`${n}_DFL`,0.2,7.2,0.4,ox-1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFR`,0.2,7.2,0.4,ox+1.5,3.6,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_DFT`,3.4,0.2,0.4,ox,7.1,oz-d/2-0.05,'White','smoothplastic')); pts.push(p(`${n}_Door`,3,7,0.15,ox,3.5,oz-d/2-0.08,'Reddish brown','wood')); pts.push(p(`${n}_Hndl`,0.15,0.15,0.35,ox+1.1,3.5,oz-d/2-0.17,'Medium stone grey','metal'))
  const fur=room.furniture||[]; const walls:Record<string,typeof fur>={north_wall:[],south_wall:[],east_wall:[],west_wall:[],row:[],center:[]}
  for(const f of fur){const k=f.placement||'center'; if(walls[k])walls[k].push(f); else walls.center.push(f)}
  const place=(items:typeof fur,wall:string)=>{let cur=0; for(const item of items){const fw=Math.max(0.5,Number(item.size?.x)||2); const fh=Math.max(0.5,Number(item.size?.y)||1); const fd=Math.max(0.5,Number(item.size?.z)||2); const qty=Math.min(Number(item.quantity)||1,8); const step=(wall==='east_wall'||wall==='west_wall')?fd+0.5:fw+0.5; for(let q=0;q<qty;q++){let fx=ox,fz=oz; switch(wall){case 'north_wall':fx=ox-w/2+2+cur+fw/2;fz=oz-d/2+1+fd/2;break; case 'south_wall':fx=ox-w/2+2+cur+fw/2;fz=oz+d/2-1-fd/2;break; case 'east_wall':fx=ox+w/2-1-fw/2;fz=oz-d/2+2+cur+fd/2;break; case 'west_wall':fx=ox-w/2+1+fw/2;fz=oz-d/2+2+cur+fd/2;break; default:fx=ox+((q%3)-1)*(fw+1);fz=oz+Math.floor(q/3)*(fd+1)} fx=Math.max(ox-w/2+1,Math.min(ox+w/2-1,fx)); fz=Math.max(oz-d/2+1,Math.min(oz+d/2-1,fz)); pts.push(p(`${n}_${item.name.replace(/\s+/g,'_')}_${q}`,fw,fh,fd,fx,1+fh/2,fz,vc(item.color||'Reddish brown'),vm(item.material||'wood'))); cur+=step}}}
  place(walls.north_wall,'north_wall'); place(walls.south_wall,'south_wall'); place(walls.east_wall,'east_wall'); place(walls.west_wall,'west_wall'); place([...walls.row,...walls.center],'center')
  return pts
}

function buildExterior(tw:number,td:number,r:ResearchResult):RbxPart[] {
  const pts:RbxPart[]=[]; const fc=Math.max(1,parseInt(String(r.floorCount||1),10)||1); const fh=Math.max(8,parseInt(String(r.floorHeight||10),10)||10); const th=fc*fh
  const ec=vc(r.exteriorColor||'Light grey'); const rc=vc(r.roofColor||'Dark grey'); const style=(r.architecturalStyle||'modern').toLowerCase(); const em=vm(r.exteriorMaterial||'smoothplastic')
  const isChinese=style.includes('chinese')||style.includes('peranakan')||style.includes('asian')||style.includes('japan')||style.includes('pagoda')||style.includes('singapor')
  const isColonial=style.includes('colonial')||style.includes('victorian')||style.includes('georgian')||style.includes('classical')||style.includes('heritage')||style.includes('art-deco')||style.includes('baroque')||style.includes('mediterranean')
  const hasArches=r.hasColonnade||isChinese||isColonial; const hasGlass=r.hasGlassFront&&!isChinese&&!isColonial
  console.log('[exterior] fc:',fc,'th:',th,'ec:',ec,'rc:',rc,'style:',style); console.log('[exterior] chinese:',isChinese,'colonial:',isColonial,'arches:',hasArches,'glass:',hasGlass)
  pts.push(p('Ground',tw+30,0.5,td+30,tw/2,0.25,td/2,'Medium stone grey','concrete')); pts.push(p('Pavement',tw+8,0.6,10,tw/2,0.6,-5,'Light stone grey','concrete')); pts.push(p('Road',tw+40,0.4,14,tw/2,0.45,-16,'Dark stone grey','smoothplastic')); pts.push(p('RoadLine',tw+40,0.46,0.2,tw/2,0.46,-16,'White','smoothplastic')); pts.push(p('Kerb',tw+10,0.8,0.5,tw/2,0.9,-0.25,'Light stone grey','concrete'))
  for(let l=0;l<2;l++){const lx=l===0?-4:tw+4; pts.push(p(`Lamp_P${l}`,0.4,14,0.4,lx,7,-5,'Dark grey','metal')); pts.push(p(`Lamp_A${l}`,0.2,0.2,2,lx,13.5,-4,'Dark grey','metal')); pts.push(p(`Lamp_H${l}`,0.8,0.5,0.8,lx,13.5,-3.2,'Bright yellow','smoothplastic',0,false))}
  console.log('[exterior] WALL COLOR:', ec, 'from research.exteriorColor:', r.exteriorColor)
  pts.push(p('WallBack',tw,th,0.8,tw/2,th/2,td,ec,em)); pts.push(p('WallLeft',0.8,th,td,0,th/2,td/2,ec,em)); pts.push(p('WallRight',0.8,th,td,tw,th/2,td/2,ec,em))
  if(hasGlass){const gh=th-3; pts.push(p('FPilL',2,th,0.8,1,th/2,0,ec,em)); pts.push(p('FPilR',2,th,0.8,tw-1,th/2,0,ec,em)); pts.push(p('FGlass',tw-4,gh,0.3,tw/2,gh/2+0.5,0,'Institutional white','smoothplastic',0.3)); pts.push(p('FTransom',tw,th-gh,0.8,tw/2,gh+(th-gh)/2,0,ec,em))} else {pts.push(p('WallFront',tw,th,0.8,tw/2,th/2,0,ec,em))}
  if(isChinese||isColonial){for(const[cx,cz] of[[0,0],[tw,0],[0,td],[tw,td]] as[number,number][]){pts.push(p(`CP_${cx}_${cz}`,2,th,2,cx,th/2,cz,ec,em)); pts.push(p(`CB_${cx}_${cz}`,2.4,1.5,2.4,cx,0.75,cz,ec,em)); pts.push(p(`CC_${cx}_${cz}`,2.4,1,2.4,cx,th+0.5,cz,ec,em))}}
  const ew=Math.min(tw*0.35,10); const eh=fh*0.85
  if(hasArches){
    pts.push(p('EnWL',(tw-ew)/2-0.5,eh+1,1.2,(tw-ew)/4+0.25,(eh+1)/2,-0.6,ec,em)); pts.push(p('EnWR',(tw-ew)/2-0.5,eh+1,1.2,tw-(tw-ew)/4-0.25,(eh+1)/2,-0.6,ec,em)); pts.push(p('EnArch',ew+1,1.5,1.2,tw/2,eh+0.75,-0.6,'White','smoothplastic')); pts.push(p('EnKey',1.2,1.8,0.8,tw/2,eh+1,-0.4,'White','smoothplastic')); pts.push(p('EnDark',ew-1,eh-0.5,3,tw/2,(eh-0.5)/2,0.5,'Really black','smoothplastic',0.8))
    const cc=Math.max(4,Math.floor(tw/5)); const cs=tw/(cc+1); const colC=isChinese?'Reddish brown':ec; const colM=isChinese?'brick':em
    for(let i=0;i<cc;i++){const cx=cs*(i+1); pts.push(p(`ColB${i}`,1.2,1.2,1.2,cx,0.6,-0.6,colC,colM)); pts.push(p(`ColS${i}`,0.9,fh*0.8,0.9,cx,fh*0.4,-0.6,colC,colM)); pts.push(p(`ColC${i}`,1.4,0.8,1.4,cx,fh*0.8+0.4,-0.6,colC,colM)); if(i<cc-1)pts.push(p(`ColA${i}`,cs-0.9,0.7,0.8,cx+cs/2,fh*0.8,-0.6,colC,colM))}
    if(isChinese){pts.push(p('ShopL',(tw-ew)/2-1.5,fh*0.72,0.3,(tw-ew)/4+0.5,fh*0.36,-0.15,'Dark green','smoothplastic')); pts.push(p('ShopR',(tw-ew)/2-1.5,fh*0.72,0.3,tw-(tw-ew)/4-0.5,fh*0.36,-0.15,'Dark green','smoothplastic'))}
  } else {
    pts.push(p('EnFL',0.4,eh,0.5,tw/2-ew/2-0.2,eh/2,-0.25,ec,'smoothplastic')); pts.push(p('EnFR',0.4,eh,0.5,tw/2+ew/2+0.2,eh/2,-0.25,ec,'smoothplastic')); pts.push(p('EnFT',ew+1,0.4,0.5,tw/2,eh+0.2,-0.25,ec,'smoothplastic')); pts.push(p('EnDoor',ew,eh,0.3,tw/2,eh/2,-0.15,'Institutional white','smoothplastic',0.3))
  }
  for(let f=0;f<fc;f++){
    const fy=f*fh; const isTop=f===fc-1
    if(f>0){const bc=isChinese||isColonial?'White':ec; pts.push(p(`BandF${f}`,tw+0.4,1.2,0.5,tw/2,fy+0.6,-0.25,bc,'smoothplastic')); pts.push(p(`BandB${f}`,tw+0.4,1.2,0.5,tw/2,fy+0.6,td+0.25,bc,'smoothplastic')); if(isColonial||isChinese){const bn=Math.floor(tw/4); for(let b=0;b<bn;b++)pts.push(p(`BB_F${f}_${b}`,2,1,0.6,tw/(bn+1)*(b+1),fy+0.6,-0.3,ec,em))}}
    if(!(f===0&&hasArches)) pts.push(...wins('FW',tw/2,fy,0,tw,fh,true,style,ec,f))
    pts.push(...wins('LWin',0,fy,td/2,td,fh,false,style,ec,f)); pts.push(...wins('RWin',tw,fy,td/2,td,fh,false,style,ec,f))
    if(isChinese){const tw2=tw+4,td2=td+4,ry=fy+fh-0.5; pts.push(p(`Pag${f}`,tw2,1.2,td2,tw/2,ry,td/2,rc,'smoothplastic')); pts.push(p(`PagU${f}`,tw2-0.5,0.5,td2-0.5,tw/2,ry-0.5,td/2,'Dark green','smoothplastic')); pts.push(p(`PagF${f}`,tw2+1,0.6,0.8,tw/2,ry-0.8,-1.5,rc,'smoothplastic')); pts.push(p(`PagB${f}`,tw2+1,0.6,0.8,tw/2,ry-0.8,td+1.5,rc,'smoothplastic')); pts.push(p(`PagL${f}`,0.8,0.6,td2+1,-1.5,ry-0.8,td/2,rc,'smoothplastic')); pts.push(p(`PagR${f}`,0.8,0.6,td2+1,tw+1.5,ry-0.8,td/2,rc,'smoothplastic')); pts.push(p(`PagRidge${f}`,tw2,0.5,0.5,tw/2,ry+0.7,td/2,rc,'smoothplastic'))}
    else if(isTop){pts.push(p('RoofSlab',tw+2,1,td+2,tw/2,th+0.5,td/2,rc,'smoothplastic')); const parC=isColonial||isChinese?ec:ec; const parH=isColonial?2:1.5; pts.push(p('ParF',tw+2,parH,0.6,tw/2,th+parH/2,-0.3,parC,em)); pts.push(p('ParB',tw+2,parH,0.6,tw/2,th+parH/2,td+0.3,parC,em)); pts.push(p('ParL',0.6,parH,td+2,-0.3,th+parH/2,td/2,parC,em)); pts.push(p('ParR',0.6,parH,td+2,tw+0.3,th+parH/2,td/2,parC,em))}
  }
  for(const[cx,cz] of[[0.5,0.5],[tw-0.5,0.5],[0.5,td-0.5],[tw-0.5,td-0.5]] as[number,number][])pts.push(p(`Dr_${cx}_${cz}`,0.4,th+2,0.4,cx,th/2+1,cz,'Dark grey','metal'))
  pts.push(p('AC1',3,2,3,tw/3,th+2,td/3,'Dark grey','metal')); pts.push(p('AC2',3,2,3,tw*2/3,th+2,td*2/3,'Dark grey','metal'))
  pts.push(p('Fascia',tw-4,2.5,0.5,tw/2,fh+1.5,-0.25,ec,em)); pts.push(p('FasciaL',tw-4,0.2,0.2,tw/2,fh+0.15,-0.4,'Institutional white','smoothplastic',0,false))
  pts.push(p('WLL',0.5,0.3,0.8,tw/2-ew/2-1.5,eh+1.5,-0.9,'Dark grey','smoothplastic',0,false)); pts.push(p('WLR',0.5,0.3,0.8,tw/2+ew/2+1.5,eh+1.5,-0.9,'Dark grey','smoothplastic',0,false))
  return pts
}

export function compileBlueprint(r:ResearchResult):CompiledBlueprint {
  console.log('[blueprint] START:',r.buildingType,'fc:',r.floorCount,'style:',r.architecturalStyle,'ec:',r.exteriorColor)
  const style=(r.architecturalStyle||'modern').toLowerCase(); const COLS=2; let cx=3,cz=3,rmd=0
  const rooms:RbxPart[][]=[], layout:CompiledBlueprint['roomLayout']=[]
  for(let i=0;i<r.rooms.length;i++){
    const room=r.rooms[i]; const w=Math.max(8,Number(room.width)||12); const d=Math.max(8,Number(room.depth)||10); const col=i%COLS
    if(col===0&&i>0){cz+=rmd;cx=3;rmd=0}
    const ox=cx+w/2,oz=cz+d/2
    rooms.push(compileRoom(room,ox,oz,style)); layout.push({name:room.name,x:ox,z:oz,width:w,depth:d,type:getRoomType(room.name)})
    cx+=w; rmd=Math.max(rmd,d)
  }
  const tw=Math.max(r.totalWidth||40,cx+6); const td=Math.max(r.totalDepth||30,cz+rmd+6)
  const exterior=buildExterior(tw,td,r)
  console.log('[blueprint] rooms:',rooms.length,'ext:',exterior.length,'total:',rooms.reduce((s,r2)=>s+r2.length,0)+exterior.length)
  return {buildingType:r.buildingType,rooms,exterior,totalWidth:tw,totalDepth:td,roomLayout:layout}
}
