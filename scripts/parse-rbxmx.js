const fs = require('fs');
const xml = fs.readFileSync('C:/Users/zack/OneDrive/Documents/Building.rbxmx', 'utf8');

const MAT = {
  256:'smoothplastic', 512:'wood', 528:'woodplanks', 800:'slate',
  816:'concrete', 832:'granite', 848:'pebble', 1040:'brick',
  1088:'sand', 1168:'cobblestone', 1184:'fabric', 1344:'metal',
  1568:'glass', 1632:'neon', 1952:'corrodedmetal', 784:'marble',
};

// RGB values (0-255) matching COLOR3_VALUES in rbxmx.ts
const COLORS = {
  'White':               [255,255,255],
  'Institutional white': [248,248,248],
  'Light stone grey':    [200,200,200],
  'Light grey':          [163,162,165],
  'Medium stone grey':   [163,162,165],
  'Dark stone grey':     [99,95,98],
  'Dark grey':           [99,95,98],
  'Really black':        [17,17,17],
  'Tan':                 [230,217,179],
  'Cashmere':            [217,197,154],
  'Brick yellow':        [215,197,154],
  'Sand yellow':         [180,163,125],
  'Bright orange':       [218,133,65],
  'Dark orange':         [160,95,53],
  'Rust':                [143,76,42],
  'Bright red':          [196,40,28],
  'Dark red':            [116,0,0],
  'Reddish brown':       [123,58,31],
  'Brown':               [124,92,70],
  'Bright yellow':       [245,205,48],
  'Dark green':          [40,127,71],
  'Bright green':        [75,151,75],
  'Sand green':          [119,144,130],
  'Bright blue':         [13,105,172],
  'Navy blue':           [0,32,96],
  'Light blue':          [180,210,228],
  'Bright bluish green': [0,143,156],
  'Hot pink':            [255,0,143],
};

function colorFromUint8(val) {
  const r = (val >> 16) & 0xFF;
  const g = (val >> 8) & 0xFF;
  const b = val & 0xFF;
  let best = 'Light grey', bestD = 999999;
  for (const [name, [cr,cg,cb]] of Object.entries(COLORS)) {
    const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

function getTagVal(block, tag) {
  const re = new RegExp('<' + tag + '>([^<]+)</' + tag + '>');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function getCFrame(block) {
  const cf = block.match(/<CoordinateFrame name="CFrame">([\s\S]*?)<\/CoordinateFrame>/);
  if (!cf) return null;
  const t = cf[1];
  const g = tag => parseFloat(getTagVal(t, tag) || '0');
  return {
    x:g('X'), y:g('Y'), z:g('Z'),
    r00:parseFloat(getTagVal(t,'R00')||'1'), r01:parseFloat(getTagVal(t,'R01')||'0'), r02:parseFloat(getTagVal(t,'R02')||'0'),
    r10:parseFloat(getTagVal(t,'R10')||'0'), r11:parseFloat(getTagVal(t,'R11')||'1'), r12:parseFloat(getTagVal(t,'R12')||'0'),
    r20:parseFloat(getTagVal(t,'R20')||'0'), r21:parseFloat(getTagVal(t,'R21')||'0'), r22:parseFloat(getTagVal(t,'R22')||'1'),
  };
}

function getSize(block) {
  const sv = block.match(/<Vector3 name="size">([\s\S]*?)<\/Vector3>/);
  if (!sv) return {x:1,y:1,z:1};
  const t = sv[1];
  const g = tag => parseFloat(getTagVal(t, tag) || '1');
  return {x:g('X'), y:g('Y'), z:g('Z')};
}

// Parse all Part/WedgePart items using a position-based scan
const parts = [];
const classRe = /<Item class="(Part|WedgePart|CornerWedgePart)" referent="(\w+)">/g;
let cm;
while ((cm = classRe.exec(xml)) !== null) {
  const partType = cm[1];
  const startPos = cm.index;
  // Find matching </Item> by counting depth
  let depth = 1, pos = cm.index + cm[0].length;
  while (pos < xml.length && depth > 0) {
    const nextOpen = xml.indexOf('<Item ', pos);
    const nextClose = xml.indexOf('</Item>', pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++; pos = nextOpen + 5;
    } else {
      depth--; pos = nextClose + 7;
    }
  }
  const body = xml.substring(startPos, pos);
  const cf = getCFrame(body);
  if (!cf) continue;
  const sz = getSize(body);
  const nameM = body.match(/<string name="Name">([^<]*)<\/string>/);
  const name = nameM ? nameM[1] : 'Part';
  const matM = body.match(/<token name="Material">(\d+)<\/token>/);
  const matToken = matM ? parseInt(matM[1]) : 256;
  const colorM = body.match(/<Color3uint8 name="Color3uint8">(\d+)<\/Color3uint8>/);
  const colorVal = colorM ? parseInt(colorM[1]) : 16777215;
  const transM = body.match(/<float name="Transparency">([^<]+)<\/float>/);
  const transparency = transM ? parseFloat(transM[1]) : 0;
  parts.push({
    name, partType: partType === 'Part' ? undefined : partType,
    x:cf.x, y:cf.y, z:cf.z,
    r00:cf.r00, r01:cf.r01, r02:cf.r02,
    r10:cf.r10, r11:cf.r11, r12:cf.r12,
    r20:cf.r20, r21:cf.r21, r22:cf.r22,
    sx:sz.x, sy:sz.y, sz:sz.z,
    material: MAT[matToken] || 'smoothplastic',
    color: colorFromUint8(colorVal),
    transparency,
  });
}

// Compute normalization offsets
const xs = parts.map(p=>p.x), ys = parts.map(p=>p.y), zs = parts.map(p=>p.z);
const minY = Math.min(...ys);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;

console.error(`Parts: ${parts.length}, centerX: ${cx.toFixed(3)}, minY: ${minY.toFixed(3)}, centerZ: ${cz.toFixed(3)}`);

function r6(n) { return Math.round(n * 1000000) / 1000000; }

// Emit TypeScript
let out = `import type { RbxPart } from '../rbxmx'\n\n`;
out += `export function buildOttomanHouse(wallBase: number): RbxPart[] {\n`;
out += `  return [\n`;

parts.forEach((p, i) => {
  const nx = r6(p.x - cx);
  const ny = r6(p.y - minY);  // relative to ground
  const nz = r6(p.z - cz);
  const sx = r6(p.sx), sy = r6(p.sy), sz = r6(p.sz);

  // Rotation: only include if non-identity
  const isIdentity = p.r00===1 && p.r01===0 && p.r02===0 &&
                     p.r10===0 && p.r11===1 && p.r12===0 &&
                     p.r20===0 && p.r21===0 && p.r22===1;

  const safeName = `OTT_${String(i).padStart(3,'0')}_${p.name.replace(/[^A-Za-z0-9_]/g,'_').substring(0,20)}`;
  const partTypeProp = p.partType ? `, partType: '${p.partType}' as const` : '';
  const transProp = p.transparency > 0 ? `, transparency: ${p.transparency}` : '';
  const rotProp = isIdentity ? '' :
    `, r00:${r6(p.r00)}, r01:${r6(p.r01)}, r02:${r6(p.r02)}, r10:${r6(p.r10)}, r11:${r6(p.r11)}, r12:${r6(p.r12)}, r20:${r6(p.r20)}, r21:${r6(p.r21)}, r22:${r6(p.r22)}`;

  out += `    { name:'${safeName}', position:{x:${nx},y:wallBase+${ny},z:${nz}}, size:{x:${sx},y:${sy},z:${sz}}, color:'${p.color}', material:'${p.material}', anchored:true${transProp}${rotProp}${partTypeProp} },\n`;
});

out += `  ]\n`;
out += `}\n`;

process.stdout.write(out);
