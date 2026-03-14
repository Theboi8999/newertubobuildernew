interface Part { name: string; size: number[]; position: number[]; color: number[]; material: string; anchored: boolean; transparency: number }
interface Script { name: string; type: string; source: string }

const VALID_MATERIALS = new Set(['SmoothPlastic','Brick','Concrete','Metal','Wood','Neon','Glass','Fabric','DiamondPlate','Foil','Granite','Marble','Pebble','Sand','Slate','WoodPlanks','Cobblestone','CorrodedMetal'])

function n(v: unknown, fb = 0) { const x = Number(v); return isNaN(x) ? fb : x }

export function generateRbxmx(input: { name: string; parts: Part[]; scripts: Script[] }): string {
  const parts = (input.parts || []).map(p => {
    const mat = VALID_MATERIALS.has(p.material) ? p.material : 'SmoothPlastic'
    const r = (n(p.color?.[0], 200) / 255).toFixed(3)
    const g = (n(p.color?.[1], 200) / 255).toFixed(3)
    const b = (n(p.color?.[2], 200) / 255).toFixed(3)
    const trans = Math.min(1, Math.max(0, n(p.transparency, 0)))
    return `    <Item class="Part">
      <Properties>
        <string name="Name">${(p.name || 'Part').replace(/[<>&"]/g, '')}</string>
        <Vector3 name="Size"><X>${n(p.size?.[0], 4)}</X><Y>${n(p.size?.[1], 4)}</Y><Z>${n(p.size?.[2], 4)}</Z></Vector3>
        <CoordinateFrame name="CFrame"><X>${n(p.position?.[0])}</X><Y>${n(p.position?.[1])}</Y><Z>${n(p.position?.[2])}</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>
        <Color3 name="Color"><R>${r}</R><G>${g}</G><B>${b}</B></Color3>
        <token name="Material">256</token>
        <bool name="Anchored">${p.anchored !== false}</bool>
        <float name="Transparency">${trans}</float>
        <bool name="CanCollide">true</bool>
      </Properties>
    </Item>`
  }).join('\n')

  const scripts = (input.scripts || []).map(s => {
    const cls = s.type === 'LocalScript' ? 'LocalScript' : 'Script'
    return `    <Item class="${cls}">
      <Properties>
        <string name="Name">${(s.name || 'Script').replace(/[<>&"]/g, '')}</string>
        <ProtectedString name="Source"><![CDATA[${s.source || '-- empty'}]]></ProtectedString>
        <bool name="Disabled">false</bool>
      </Properties>
    </Item>`
  }).join('\n')

  return `<roblox xmlns:xmime="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="Model">
    <Properties>
      <string name="Name">${(input.name || 'TurboBuilderAsset').replace(/[<>&"]/g, '')}</string>
    </Properties>
${parts}
${scripts}
  </Item>
</roblox>`
}
