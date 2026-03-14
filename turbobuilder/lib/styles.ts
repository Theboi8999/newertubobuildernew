export type StyleType = 'modern' | 'victorian' | 'industrial' | 'brutalist' | 'colonial' | 'derelict' | 'coastal' | 'scandinavian'
export type ScaleType = 'small' | 'medium' | 'large' | 'massive'

export const STYLES: Record<StyleType, { label: string; description: string; materials: string; colors: string }> = {
  modern:       { label: 'Modern',       description: 'Clean lines, glass facades, minimal ornamentation', materials: 'glass, concrete, steel', colors: 'white, grey, black, blue accents' },
  victorian:    { label: 'Victorian',    description: 'Ornate details, bay windows, decorative cornices', materials: 'brick, stone, cast iron, timber', colors: 'red brick, cream, dark green, gold' },
  industrial:   { label: 'Industrial',   description: 'Exposed structure, warehouse aesthetic, functional', materials: 'steel, concrete, corrugated iron', colors: 'grey, rust, black, yellow' },
  brutalist:    { label: 'Brutalist',    description: 'Raw concrete, bold geometric forms, heavy', materials: 'raw concrete, metal', colors: 'grey, brown, dark' },
  colonial:     { label: 'Colonial',     description: 'Symmetrical facades, columns, verandahs', materials: 'timber, brick, corrugated iron', colors: 'white, cream, heritage green' },
  derelict:     { label: 'Derelict',     description: 'Abandoned, weathered, broken windows, overgrown', materials: 'crumbling concrete, rusted metal', colors: 'grey, rust, dark, faded' },
  coastal:      { label: 'Coastal',      description: 'Beach town, weatherboards, pastel, relaxed', materials: 'timber weatherboard, fibro, tin roofs', colors: 'pastel blue, white, sandy yellow' },
  scandinavian: { label: 'Scandinavian', description: 'Minimal, functional, natural materials, cosy', materials: 'timber, stone, white render', colors: 'white, light grey, natural wood, black' },
}

export const SCALES: Record<ScaleType, { label: string; description: string; multiplier: number }> = {
  small:   { label: 'Small',   description: 'Studio, kiosk, booth',         multiplier: 0.6 },
  medium:  { label: 'Medium',  description: 'House, standard car',           multiplier: 1.0 },
  large:   { label: 'Large',   description: 'Block, fire truck, warehouse',  multiplier: 1.6 },
  massive: { label: 'Massive', description: 'Stadium, aircraft carrier, map', multiplier: 2.5 },
}
