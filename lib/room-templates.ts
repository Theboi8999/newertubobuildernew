export function detectBuildingType(prompt: string): string {
  const stop = new Set(['a','an','the','with','full','interior','exterior','build','me','make','create','generate','and','or','of','for','in','on','at','to','from'])
  return prompt.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stop.has(w)).slice(0,5).join('_')
}
