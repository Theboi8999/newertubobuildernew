import { createAdminClient } from './supabase'
import { groqJSON } from './groq'

export interface RoomFurniture { name:string; size:{x:number;y:number;z:number}; color:string; material:string; quantity?:number; placement?:'north_wall'|'south_wall'|'east_wall'|'west_wall'|'center'|'row' }
export interface ResearchRoom { name:string; width:number; depth:number; height:number; wallColor:string; floorColor:string; floorMaterial:string; furniture:RoomFurniture[] }
export interface ResearchResult { buildingType:string; floorCount:number; floorHeight:number; architecturalStyle:string; hasGlassFront:boolean; hasColonnade:boolean; exteriorMaterial:string; rooms:ResearchRoom[]; totalWidth:number; totalDepth:number; exteriorColor:string; roofColor:string; culturalNotes:string; confidence:number }

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
Schema: {"buildingType":string,"floorCount":number,"floorHeight":number,"architecturalStyle":string,"hasGlassFront":boolean,"hasColonnade":boolean,"exteriorMaterial":string,"rooms":[{"name":string,"width":number,"depth":number,"height":number,"wallColor":string,"floorColor":string,"floorMaterial":string,"furniture":[{"name":string,"size":{"x":number,"y":number,"z":number},"color":string,"material":string,"quantity":number,"placement":string}]}],"totalWidth":number,"totalDepth":number,"exteriorColor":string,"roofColor":string,"culturalNotes":string,"confidence":number}`

export async function researchBuildingType(bt:string, opts:{forceRefresh?:boolean;teachingContext?:string}={}):Promise<ResearchResult> {
  const name=bt.replace(/_/g,' ')
  console.log('[research] START:',name)
  if(!opts.forceRefresh){const c=await getCache(bt);if(c)return c}
  const [w,t,s,k]=await Promise.all([wiki(name),tavily(name),serper(name),knowledge()])
  console.log('[research] wiki:',w.length,'tavily:',t.length,'serper:',s.length,'knowledge:',k.length)
  const combined=[w&&`Wiki:${w}`,t&&`Web:${t}`,s&&`Search:${s}`,opts.teachingContext&&`Prev:${opts.teachingContext}`].filter(Boolean).join('\n\n').substring(0,1800)
  const user=`Building:${name}\n\nResearch:\n${combined}\n\n${k?`Quality:\n${k}\n\n`:''}Return JSON now.`
  console.log('[research] waiting 4s...')
  await new Promise(r=>setTimeout(r,4000))
  const fb=fallback(bt)
  const raw=await groqJSON<ResearchResult>(SYS,user,fb)
  const result:ResearchResult={buildingType:String(raw.buildingType||bt),floorCount:sint(raw.floorCount,1,10,1),floorHeight:sint(raw.floorHeight,8,16,10),architecturalStyle:String(raw.architecturalStyle||'modern').toLowerCase(),hasGlassFront:Boolean(raw.hasGlassFront),hasColonnade:Boolean(raw.hasColonnade),exteriorMaterial:String(raw.exteriorMaterial||'smoothplastic').toLowerCase(),rooms:Array.isArray(raw.rooms)&&raw.rooms.length>=3?raw.rooms:fb.rooms,totalWidth:sint(raw.totalWidth,20,120,40),totalDepth:sint(raw.totalDepth,16,80,28),exteriorColor:String(raw.exteriorColor||'Light grey'),roofColor:String(raw.roofColor||'Dark grey'),culturalNotes:String(raw.culturalNotes||''),confidence:sint(raw.confidence,0,100,0)}
  console.log('[research] RESULT:',{floorCount:result.floorCount,style:result.architecturalStyle,ec:result.exteriorColor,rc:result.roofColor,colonnade:result.hasColonnade,rooms:result.rooms.length,conf:result.confidence})
  if(result.confidence>30) await setCache(bt,result)
  return result
}
