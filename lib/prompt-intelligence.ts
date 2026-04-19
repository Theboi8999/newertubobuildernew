export interface PromptIntent { buildingType:string; region:string; era:string; styleHints:string[]; floorCountHint:number|null }

const REGIONS: Record<string,string> = {'singapore':'singapore','uk':'united kingdom','british':'united kingdom','england':'united kingdom','london':'united kingdom','american':'united states','usa':'united states','japanese':'japan','japan':'japan','chinese':'china','china':'china','french':'france','paris':'france','italian':'italy','german':'germany','peranakan':'singapore','victorian':'united kingdom','georgian':'united kingdom'}
const FLOOR_HINTS: Record<string,number> = {'single storey':1,'one storey':1,'bungalow':1,'two storey':2,'double storey':2,'2 storey':2,'three storey':3,'3 storey':3,'four storey':4,'4 storey':4,'five storey':5,'5 storey':5,'six storey':6,'6 storey':6,'skyscraper':20,'tower':10,'high rise':12}
const STYLE_WORDS = ['colonial','victorian','georgian','modern','contemporary','glass','brick','concrete','art deco','brutalist','industrial','minimalist','baroque','gothic','peranakan','chinese','japanese','mediterranean','classical','heritage','traditional','pagoda','art-deco']

export function analysePrompt(prompt: string): PromptIntent {
  const lower = prompt.toLowerCase()
  let region=''; for(const [k,v] of Object.entries(REGIONS)){if(lower.includes(k)){region=v;break}}
  let floorCountHint:number|null=null; for(const [p2,c] of Object.entries(FLOOR_HINTS)){if(lower.includes(p2)){floorCountHint=c;break}}
  const numMatch=lower.match(/(\d+)\s*(?:storey|story|floor|level)/); if(numMatch) floorCountHint=Math.min(20,parseInt(numMatch[1]))
  const styleHints=STYLE_WORDS.filter(s=>lower.includes(s))
  const stop=new Set(['a','an','the','with','full','interior','exterior','build','me','make','create','generate','and','or','of','for','in','at','to','from','storey','story','floor'])
  const buildingType=lower.replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stop.has(w)).slice(0,5).join('_')
  const intent:PromptIntent={buildingType,region,era:'',styleHints,floorCountHint}
  console.log('[intent]',JSON.stringify(intent))
  return intent
}
