import { ResearchResult } from './research-agent'
export interface GateResult { passed:boolean; issues:string[]; warnings:string[] }

export function preGate(r: ResearchResult): GateResult {
  const issues:string[]=[], warnings:string[]=[]
  if(!r.buildingType) issues.push('missing buildingType')
  if(!r.rooms||r.rooms.length<3) issues.push(`too few rooms:${r.rooms?.length??0}`)
  if(r.floorCount<1||isNaN(r.floorCount)) issues.push(`bad floorCount:${r.floorCount}`)
  if(r.floorHeight<4||isNaN(r.floorHeight)) issues.push(`bad floorHeight:${r.floorHeight}`)
  if(!r.exteriorColor) issues.push('missing exteriorColor')
  if(r.confidence<30) warnings.push(`low confidence:${r.confidence}`)
  if(r.exteriorColor==='Light grey'&&r.architecturalStyle!=='modern') warnings.push('color defaulted')
  const passed=issues.length===0
  if(!passed) console.error('[gate] FAILED:',issues)
  else console.log('[gate] passed, warnings:',warnings)
  return {passed,issues,warnings}
}

export function postGate(partCount:number, rbxmx:string, r:ResearchResult): GateResult {
  const issues:string[]=[], warnings:string[]=[]
  if(partCount<10) issues.push(`critically low parts:${partCount}`)
  if(partCount<30) warnings.push(`low parts:${partCount}`)
  if(r.exteriorColor&&r.exteriorColor!=='Light grey'&&!rbxmx.includes(r.exteriorColor)) warnings.push(`color ${r.exteriorColor} missing from output`)
  const yVals=(rbxmx.match(/<Y>([\d.]+)<\/Y>/g)||[]).map(m=>parseFloat(m.replace(/<\/?Y>/g,'')))
  const maxY=Math.max(...yVals.filter(n=>!isNaN(n)),0)
  const expectedH=r.floorCount*r.floorHeight
  if(maxY<expectedH*0.5) warnings.push(`height ${maxY.toFixed(0)} low for ${r.floorCount} floors`)
  const passed=issues.length===0
  if(!passed) console.error('[gate-post] FAILED:',issues)
  return {passed,issues,warnings}
}
