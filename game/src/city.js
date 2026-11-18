// Street grid, landmarks, vegetation, collision bounds and walkable coast.
import { CITY, STREETS_X, STREETS_Z, LOCATIONS as L, DISTRICTS, PALETTE } from './config.js';
import { seeded } from './random.js';
import { T, box, cone, drum, orb, makeBatch, part, label, joinParts } from './geometry.js';

export const FLOOD_ZONES = [
  { x1: 709, x2: 2603, z1: 1990, z2: 2094, bias: 10, name: 'Strand boulevard' },
  { x1: 624, x2: 736, z1: 1520, z2: 2170, bias: 3, name: 'Market drain' },
  { x1: 1420, x2: 1660, z1: 2070, z2: 2215, bias: 7, name: 'Pier steps' },
  { x1: 2540, x2: 2779, z1: 1995, z2: 2085, bias: -19, name: 'Causeway ramp', ramp: true },
  { x1: 2386, x2: 2494, z1: 1660, z2: 2008, bias: 0, name: 'East spillway' },
];
export function districtAt(x, z) {
  if (x > 2630) return DISTRICTS[5];
  if (x > 1870 && z < 1960) return DISTRICTS[4];
  if (z >= 2000 || (x >= 1500 && z >= 1590)) return DISTRICTS[3];
  if (z >= 1320) return DISTRICTS[2];
  return z < 975 && x < 1190 ? DISTRICTS[0] : DISTRICTS[1];
}
const range = (n, a, b) => n >= a && n <= b;
export function groundAt(x, z) {
  if (x < 2610 || z > 2085 || z < 668) return 0;
  const east = Math.min(1, (x - 2610) / 85);
  return 5 * (range(z, 660, 780) || range(z, 1980, 2100) ? east : 1);
}
export function inBounds(x, z, r = 0) {
  return (range(x, r, CITY.shoreX - r) && range(z, r, CITY.shoreZ - r)) ||
    (range(x, 1494 + r, 1547 - r) && range(z, 2196, 2320 - r)) ||
    (range(x, 2700 + r, 2790 - r) && range(z, 675 + r, 2080 - r)) ||
    (range(x, 2560, 2788 - r) && (range(z, 675 + r, 765 - r) || range(z, 1995 + r, 2085 - r))) ||
    (range(x, 2755, 2835 - r) && range(z, 809 + r, 885 - r));
}

export function buildCity(scene, seed) {
  const rand = seeded(seed), batch = makeBatch(scene), add = batch.add, blockers = [], palms = [], shelters = [], signs = [];
  const solid = (x, z, w, d, kind) => blockers.push({ x, z, w, d, kind });
  const slab = (x, z, w, d, color, y = .12, h = .35, style = 'matte') => add(x, y, z, w, h, d, color, box, 0, 0, style);
  const sign = (text, x, y, z, w, h, theme = {}) => {
    const mesh = label(text, { width: w, height: h, ...theme }); mesh.position.set(x, y, z); scene.add(mesh); signs.push(mesh); return mesh;
  };
  const palm = (x, z, size = 1) => {
    const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(size);
    part(g, 2, 15, 2, -.8, 7.5, 0, '#8c655b', drum).rotation.z = .1;
    part(g, 1.5, 8, 1.5, -2, 18, 0, '#9a7763', drum).rotation.z = .22;
    const crown = new T.Group(); crown.position.set(-3, 21.8, 0); g.add(crown);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, l = rand.range(6, 9);
      part(crown, 2.8, 1.1, l + 2, Math.sin(a) * (l / 2), .25, Math.cos(a) * (l / 2),
        i % 3 ? '#397e64' : '#599875', orb).rotation.set(.15, a, 0);
      const frond = part(crown, 2.2, 1.2, l, Math.sin(a) * (l + 1), -1.7, Math.cos(a) * (l + 1), '#226657', orb);
      frond.rotation.order = 'YXZ'; frond.rotation.set(.35, a, 0);
    }
    joinParts(crown); joinParts(g);
    scene.add(g); palms.push({ mesh: g, crown, phase: rand.range(0, 6) }); solid(x, z, 2.5, 2.5, 'tree');
  };
  const tree = (x, z) => {
    add(x, 4, z, 2.1, 8, 2.1, '#765550', drum);
    add(x, 10, z, 14, 11, 13, '#478374', orb);
    add(x + 3, 12, z - 2, 10, 9, 10, '#619179', orb);
    solid(x, z, 2.5, 2.5, 'tree');
  };
  const lamp = (x, z, flipped = false) => {
    const dx = flipped ? -1 : 1;
    add(x, 7, z, .8, 14, .8, '#30464b', drum);
    add(x + dx * 2, 13.6, z, 4.8, .55, .55, '#314851');
    add(x + dx * 4, 13.2, z, 1.8, .45, 1.2, '#ffd59a', box, 0, 0, 'glow');
  };
  const bench = (x, z) => {
    add(x, 2.1, z, 8, .8, 2, '#995e52'); add(x, 3.4, z + 1.1, 8, 1.5, .5, '#a86d5a');
    for (const d of [-2.8, 2.8]) add(x + d, 1, z, .5, 2, 1.5, '#253c40');
    solid(x, z, 8, 2.6, 'bench');
  };
  const crate = (x, z, stack = 1, tint = '#93775b') => {
    for (let i = 0; i < stack; i++) {
      add(x, 1.7 + i * 3.4, z, 4.6, 3.4, 4.4, tint);
      for (const dx of [-1.65, 1.65]) add(x + dx, 1.7 + i * 3.4, z + 2.25, .48, 3.45, .22, '#d9aa79');
    }
    solid(x, z, 4.7, 4.7, 'crate');
  };
  const house = (x, z, w, d, h, tint, trim = '#e8c8a4') => {
    add(x, h / 2, z, w, h, d, tint); solid(x, z, w, d, 'building');
    add(x, h + 1.2, z, w + 3, 2.4, d + 3, trim);
    add(x, 2, z, w + 1, 4, d + 1, '#5d6060');
    if (h > 32) {
      add(x - 6, h + 4, z + 3, w * .26, 3.5, d * .3, '#68797a');
      add(x + 9, h + 3, z - 4, 4, 3, 4, '#a18b7c', drum);
    }
    for (let y = 10; y < h - 4; y += 9) {
      if (y > 12 && h > 32) add(x, y - 3.6, z, w + .42, .42, d + .42, trim);
      for (let u = -w / 2 + 7; u < w / 2 - 3; u += 9.5) {
        const lit = rand.next() < .26;
        for (const q of [-1, 1]) {
          add(x + u, y, z + q * (d / 2 + .07), 5.1, 4.4, .17, lit ? '#f6c783' : '#37545e', box, 0, 0, lit ? 'glow' : 'matte');
          add(x + u, y - 2.2, z + q * (d / 2 + .45), 6, .36, 1, trim);
        }
      }
      for (let u = -d / 2 + 8; u < d / 2 - 3; u += 11) {
        const lit = rand.next() < .19;
        for (const q of [-1, 1]) add(x + q * (w / 2 + .08), y, z + u, .2, 4.5, 5.3,
          lit ? '#ffd5a5' : '#38545b', box, 0, 0, lit ? 'glow' : 'matte');
      }
    }
    add(x, 3.75, z + d / 2 + .11, 5, 7.5, .24, '#283943');
  };
  const awning = (x, z, w, col, y = 8) => {
    for (let i = 0; i < 8; i++) add(x - w / 2 + w * (i + .5) / 8, y, z, w / 8, .55, 7, i % 2 ? col : '#efcb96', box, 0, .16);
    shelters.push({ x, z: z + 1 });
  };
  const stall = (x, z, name, tint) => {
    for (const dx of [-7, 7]) for (const dz of [-5, 4]) add(x + dx, 5, z + dz, .65, 10, .65, '#594d52');
    add(x, 2, z + 2.2, 13, 4, 3.5, '#b77458'); add(x, 4.2, z + 2.2, 15, .55, 4.4, '#f0b97e');
    awning(x, z + 1, 17, tint, 10.1); slab(x, z, 20, 16, '#a68f7e');
    sign(name, x, 12.5, z + 4.5, 17, 3.2, { back: tint });
    solid(x, z + 2.2, 13, 3.5, 'stall');
  };
  const sandbags = (x, z, count, rotate = false) => {
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 3.35, xx = x + (rotate ? 0 : offset), zz = z + (rotate ? offset : 0);
      add(xx, .8, zz, 5, 1.7, 3.55, '#b7a57d', orb, rotate ? Math.PI / 2 : 0);
      if (i + 1 < count) add(xx + (rotate ? 0 : 1.6), 1.85, zz + (rotate ? 1.6 : 0), 4.8, 1.45, 3.3, '#cabc95', orb, rotate ? Math.PI / 2 : 0);
    }
    solid(x, z, rotate ? 3 : count * 3.35, rotate ? count * 3.35 : 3, 'sandbag');
  };

  slab(CITY.shoreX / 2, CITY.shoreZ / 2, CITY.shoreX, CITY.shoreZ, '#8d8e7f', -1.2, 2.3);
  slab(1420, 1240, 11600, 10000, '#29596c', -2.5, .4, 'water');
  slab(1300, 2178, 2600, 74, '#b9a181', -.12);
  slab(2581, 1100, 58, 2200, '#aa947b', -.12);
  for (const x of STREETS_X) {
    slab(x, 1100, CITY.road, 2200, '#37454e', .03, .3, 'road');
    for (const k of [-1, 1]) {
      slab(x + k * 63, 1100, 14, 2200, '#b3a395', .23, .6);
      slab(x + k * 49, 1100, .5, 2200, '#bdac97', .23);
    }
    for (let z = 21; z < 2200; z += 16) if (STREETS_Z.every(v => Math.abs(z - v) > 68)) slab(x, z, .7, 8, '#c49557', .23);
  }
  for (const z of STREETS_Z) {
    slab(1305, z, 2610, CITY.road, '#37454e', .07, .3, 'road');
    for (const k of [-1, 1]) {
      for (let i = 0; i <= STREETS_X.length; i++) {
        const lo = i ? STREETS_X[i - 1] + 69 : 0, hi = i < STREETS_X.length ? STREETS_X[i] - 69 : CITY.shoreX;
        slab((lo + hi) / 2, z + k * 63, hi - lo, 14, '#b3a395', .27, .6);
      }
      slab(1305, z + k * 49, 2610, .46, '#bdac97', .25);
    }
    for (let x = 10; x < 2600; x += 16) if (STREETS_X.every(v => Math.abs(x - v) > 68)) slab(x, z, 8, .7, '#c49557', .26);
    for (const x of STREETS_X) {
      // Asphalt patches cover the vertical curb through each intersection.
      slab(x, z, 141, 112, '#39464d', .44, .29, 'road');
      for (const k of [-1, 1]) for (let j = -5; j <= 5; j++) {
        slab(x + j * 7, z + k * 49, 3.3, 9, '#bfb9a5', .61, .08);
        slab(x + k * 51, z + j * 7, 9, 3.3, '#bfb9a5', .61, .08);
      }
      for (const k of [-1, 1]) lamp(x + k * 73, z - k * 69, k === 1);
    }
  }

  const special = new Set(['1:1', '2:2', '2:4', '2:5', '3:5', '5:3']);
  for (let iz = 0; iz <= STREETS_Z.length; iz++) for (let ix = 0; ix <= STREETS_X.length; ix++) {
    const left = ix ? STREETS_X[ix - 1] + 77 : 10, right = ix < STREETS_X.length ? STREETS_X[ix] - 77 : 2560;
    const top = iz ? STREETS_Z[iz - 1] + 76 : 12, bottom = iz < STREETS_Z.length ? STREETS_Z[iz] - 76 : 2140;
    const w = right - left, d = bottom - top;
    if (special.has(ix + ':' + iz)) continue;
    const nx = w > 180 ? 2 : 1, nz = d > 180 ? 2 : 1;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = left + (i + .5) * w / nx, z = top + (j + .5) * d / nz;
      const tint = rand.pick(PALETTE), bw = w / nx * rand.range(.58, .82), bd = d / nz * rand.range(.56, .78);
      house(x, z, bw, bd, rand.range(15, iz > 3 ? 51 : 71), tint);
      if (j === nz - 1) awning(x, z + bd / 2 + 3, Math.min(32, bw), rand.pick(['#844e5c', '#3a797c', '#ba624c']));
    }
    if (iz) tree(left + 7, top + 8);
  }

  // The strand has a palm-lined seawall, paths and glowing beachfront kiosks.
  for (let x = 105; x < 2570; x += 95) {
    if (Math.abs(x - 1520) < 45) continue;
    palm(x, 2128, rand.range(.82, 1.17));
    slab(x, 2169, 91, 4, '#b6b0a0', 1.1, 2.5);
    if (x % 3 === 1) bench(x + 12, 2150);
    if (x % 4 === 1) lamp(x - 19, 2112);
  }
  for (const x of [105, 405, 808, 1060, 1360, 1790, 2235, 2520]) {
    for (const z of [360, 800, 1237, 1692]) if (rand.next() > .3) palm(x, z, rand.range(.7, 1.05));
  }
  slab(450, 540, 215, 178, '#72917b');
  sign('CITRUS GREEN', 475, 9, 552, 64, 11);
  for (let i = 0; i < 5; i++) { tree(372 + i * 34, 585); bench(372 + i * 34, 568); }
  house(330, 316, 24, 36, 24, '#a1b5a1'); sign('JUNO / 06', 330, 10, 334.3, 18, 4);
  slab(858, 946, 144, 130, '#9a877d');
  sign('LANTERN FEST', 860, 16, 996, 81, 12, { back: '#633d59', trim: '#ffad79' });
  for (let i = 0; i < 12; i++) {
    const x = 797 + i * 11;
    add(x, 13 - Math.sin(i * Math.PI / 11) * 3, 967, 3, 4, 3, i % 2 ? '#ffb381' : '#f789a0', drum, 0, 0, 'glow');
  }
  for (const [x, name, tint] of [[752, 'MANGO / HOT FOOD', '#85535b'], [785, 'FISH CO-OP', '#326961'], [835, 'SALT THREADS', '#623f69'], [877, 'FRESH ICE', '#365886']]) stall(x, 1685, name, tint);
  for (let i = 0; i < 5; i++) stall(755 + i * 30, 1758, ['CITRUS', 'FLOWERS', 'SUNDRIES', 'LANTERNS', 'MERCADO'][i], i % 2 ? '#326f6a' : '#975855');
  sign('MARIGOLD MARKET', 849, 19, 1692, 97, 14, { back: '#2e4a50', trim: '#ff9a93' });
  sandbags(743, 1654, 8); sandbags(903, 1698, 8, true); crate(771, 1710, 2); crate(829, 1728);

  slab(999, 1849, 166, 196, '#696f6c');
  for (const [x,z,w,d] of [[922,1833,2,171],[1078,1833,2,171],[1000,1939,157,2],[939,1750,33,2],[1040,1750,76,2]]) {
    add(x, 3.5, z, w, .7, d, '#97a2a0'); add(x, 6.6, z, w, .45, d, '#758888');
    const length = Math.max(w, d);
    for (let p = -length / 2; p <= length / 2; p += 4.3)
      add(x + (w > d ? p : 0), 3.4, z + (d > w ? p : 0), .27, 6.8, .27, '#85989c');
    solid(x,z,w,d,'fence');
  }
  sign('SUNSPUR IMPOUND', 1000, 14, 1750, 65, 9);
  crate(1049, 1786, 2); crate(1059, 1786); lamp(1059, 1775);
  house(1043, 1892, 36, 36, 17, '#aeb19d');

  slab(2127, 1260, 104, 56, '#545e62');
  for (const x of [2073, 2148]) house(x, 1266, 24, 64, 25, '#63817e');
  house(2109, 1292, 51, 17, 25, '#648381');
  add(2109, 23, 1256, 64, 5, 70, '#374953');
  add(2109, 17, 1222, 65, 5, 2.5, '#9ca7a1');
  sign("NIKO'S / TIDEWORKS", 2109, 22, 1220, 60, 9, { color: '#b7fff1', back: '#172d43', trim: '#74cfd7' });
  shelters.push({ x: 2109, z: 1240 });
  crate(2140, 1280, 2); crate(2088, 1276); sandbags(2161, 1226, 6, true);
  const drop = ({x,z}) => {
    add(x, 2.4, z, 3.6, 4.8, 3.5, '#5f9885');
    sign('BANK DROP', x, 6.5, z + 1.7, 13, 2.6);
    solid(x,z,3.6,3.5,'bank');
  };
  drop(L.workshopBank); drop(L.pierBank);

  slab(1520, 2268, 56, 107, '#887866', -.35, 1);
  for (let z = 2214; z < 2324; z += 3.5) slab(1520, z, 57, 3.33, z % 2 ? '#ab8d72' : '#93806f', .2, .4);
  for (const side of [-1, 1]) for (let z = 2211; z < 2325; z += 11) {
    add(1520 + side * 29, 1.6, z, 1, 3.2, 1, '#5f615d');
    add(1520 + side * 29, 2.4, z + 4, .55, .55, 11, '#5f615d');
  }
  sign('TIN CUP PIER', 1520, 12, 2203, 56, 9, { back: '#3f5962' });
  sandbags(1475, 2187, 9); sandbags(1563, 2187, 8); stall(1509, 2291, 'TIN CUP', '#5d5572');

  slab(2745, 1377, 90, 1410, '#43525b', 4.65, 1.7, 'road');
  for (const z of [720, 2040]) {
    const ramp = new T.Mesh(new T.BoxGeometry(90, 1.8, 90), new T.MeshStandardMaterial({ color: '#43525b', roughness: .65 }));
    ramp.position.set(2655, 2.15, z); ramp.rotation.z = Math.atan2(5, 90); scene.add(ramp);
    slab(2715, z, 42, 91, '#43525b', 4.6, 1.8, 'road');
    sandbags(2568, z - 40, 8); sandbags(2568, z + 41, 8);
  }
  slab(2798, 846, 74, 78, '#5e6865', 4.65, 1.7, 'road');
  sign('SUNSPUR CAUSEWAY', 2745, 19, 763, 73, 11, { back: '#295663', trim: '#ffe2a7' });
  for (let z = 681; z < 2086; z += 13) {
    slab(2745, z, .95, 7.5, '#d3a55d', 5.55, .08);
    for (const k of [-1, 1]) {
      if ((k === -1 && (z < 768 || z > 1987)) || (k === 1 && range(z, 802, 892))) continue;
      add(2745 + k * 44, 6.6, z, 1.15, .63, 13, '#a8b5ad');
      add(2745 + k * 44, 5.8, z, 1, 2, 1, '#a8b5ad');
    }
    if (z % 6 === 1) { lamp(2790, z, true); add(2745, -.3, z, 13, 10, 9, '#5a696d'); }
  }
  return { blockers, palms, shelters, signs, floodZones: FLOOD_ZONES, materials: batch.finish(), districtAt };
}

export function blocked(city, x, z, radius = 1.3) {
  return !inBounds(x,z,radius) || city.blockers.some(b =>
    Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius);
}
