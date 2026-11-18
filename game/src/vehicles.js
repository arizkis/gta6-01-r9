// The vehicle factory covers civilian cars, COLDFIN and the two police bodies.
import { T, box, drum, part, label, joinParts } from './geometry.js';
import { groundAt, blocked } from './city.js';
import { LOCATIONS, STREETS_X, STREETS_Z } from './config.js';
import { seeded } from './random.js';

export const MODELS = {
  solace: { name: 'SOLACE GT', tint: '#d75c7d', width: 5.5, length: 11.4, height: 3.4 },
  brisa: { name: 'BRISA 4D', tint: '#58a3a5', width: 5.4, length: 11.7, height: 3.7 },
  cutter: { name: 'CUTTER UTILITY', tint: '#b29c68', width: 6.2, length: 12.7, height: 4.3 },
  coldfin: { name: 'COLDFIN FREEZER VAN', tint: '#e1c495', width: 7.1, length: 14.4, height: 6.6, van: true },
  patrol: { name: 'SUNSPUR PATROL', tint: '#233752', width: 6, length: 12.3, height: 4.3, police: true },
  interceptor: { name: 'SURGE INTERCEPTOR', tint: '#273e4a', width: 6.9, length: 13.2, height: 5.3, police: true },
};
let beamMaterial;
function lampPool(parent, x, z) {
  if (!beamMaterial) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d'), g = ctx.createRadialGradient(32,32,0,32,32,31);
    g.addColorStop(0, 'rgba(255,229,172,0.42)'); g.addColorStop(.34, 'rgba(253,222,174,0.17)'); g.addColorStop(1, 'rgba(255,223,164,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
    const map = new T.CanvasTexture(c); map.colorSpace = T.SRGBColorSpace;
    beamMaterial = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  }
  const mesh = new T.Mesh(new T.PlaneGeometry(5.2, 21), beamMaterial);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .42, z); parent.add(mesh);
}
export function createVehicle(scene, type, x, z, heading = 0, options = {}) {
  const model = MODELS[type], { width: w, length: l, height: h } = model;
  const group = new T.Group(), body = new T.Group(), lamps = new T.Group(), tires = [];
  const tint = options.tint || model.tint, bumper = '#2a303d', glass = '#283d50', chrome = '#a7a8a0';
  group.add(body, lamps); scene.add(group);
  const slab = (a,b,c,x,y,z,color,glow = false) => part(body,a,b,c,x,y,z,color,box,glow);
  slab(w * .97, .75, l * .92, 0, 1.42, 0, bumper);
  slab(w, h * .42, l * .98, 0, 2.06, 0, tint);
  slab(w * .94, .16, l * .95, 0, 2.79, 0, '#e0d2bf');
  for (const k of [-1, 1]) {
    slab(w * .99, .55, .40, 0, 1.37, k * (l / 2 + .1), bumper);
    slab(w * .73, .25, .45, 0, 1.57, k * (l / 2 + .24), chrome);
    slab(w * .32, .67, .12, 0, 2.09, k * (l / 2 + .1), '#3b4345');
  }
  if (model.van) {
    slab(w * .90, 2.1, 3.9, 0, 3.58, 4.15, tint);
    slab(w * .83, 1.20, .11, 0, 3.87, 6.12, glass);
    slab(w * .96, 4.8, 10.25, 0, 3.87, -1.58, '#edddbd');
    slab(w * .99, .18, 10.25, 0, 5.88, -1.60, '#aeb7ae');
    slab(w * .70, .90, 3.1, 0, 6.61, .15, '#a9b0a8');
    for (let i = -3; i <= 3; i++) slab(.24, .5, .18, i * .51, 6.65, 1.75, '#334b50');
    for (const k of [-1, 1]) {
      slab(w * .43, 4.2, .08, k * w * .238, 3.90, -6.74, '#d6c5a2');
      slab(.12, 1, .15, k * .37, 3.37, -6.81, bumper);
      const art = label('COLDFIN', { width: 6, height: 2.2, back: '#426e75', trim: '#85c9c2' });
      art.position.set(k * (w * .48 + .025), 4.22, -1.75); art.rotation.y = k * Math.PI / 2; body.add(art);
    }
    const art = label('COLDFIN', { width: 4.4, height: 1.04, back: '#426e75', trim: '#85c9c2' });
    art.position.set(0, 4.93, -6.81); art.rotation.y = Math.PI; body.add(art);
  } else {
    slab(w * .78, .96, l * .50, 0, h - .31, -.45, glass);
    slab(w * .77, .23, l * .44, 0, h + .26, -.62, model.police ? '#edf0e8' : tint);
    for (const k of [-1, 1]) {
      slab(.12, 1.06, .29, k * w * .395, h - .28, -.42, bumper);
      slab(.13, .16, .73, k * w * .506, 2.65, -.76, chrome);
      slab(.35, .34, .60, k * w * .52, h - .59, 1.94, tint);
    }
  }
  if (model.police) {
    slab(w * .65, .35, 1.22, 0, h + .52, -.25, bumper);
    slab(w * .30, .41, 1.14, -w * .17, h + .79, -.25, '#e94665', true);
    slab(w * .30, .41, 1.14, w * .17, h + .79, -.25, '#4ab9ff', true);
    for (const k of [-1, 1]) slab(.08, 1.19, l * .48, k * (w * .5 + .02), 2.05, -.35, '#d7e0d9');
  }
  for (const k of [-1, 1]) {
    for (const s of [-1, 1]) {
      const wheel = new T.Group();
      wheel.position.set(k * w * .455, 1.10, s * l * .331); body.add(wheel);
      part(wheel, 2.26, .98, 2.26, 0, 0, 0, '#23252d', drum).rotation.z = Math.PI / 2;
      part(wheel, 1.12, .16, 1.12, k * .49, 0, 0, '#9ea7a9', drum).rotation.z = Math.PI / 2;
      tires.push({ wheel, front: s === 1 });
    }
    part(lamps, w * .20, .48, .15, k * w * .33, 2.39, l / 2 + .12, '#fff0bd', box, true);
    lampPool(lamps, k * w * .32, l / 2 + 9);
    slab(w * .16, .53, .20, k * w * .39, 2.27, -l / 2 - .08, '#ff5267', true);
  }
  const plate = label(model.van ? 'CFN 017' : 'SUN 06', { width: 1.76, height: .48, back: '#dedbcc', color: '#2e4051', trim: '#446471' });
  plate.position.set(0, 1.99, -l / 2 - .22); plate.rotation.y = Math.PI; body.add(plate);
  const shadow = new T.Mesh(new T.CircleGeometry(1, 16), new T.MeshBasicMaterial({ color: '#111928', opacity: .24, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .35; shadow.scale.set(w * .62, l * .52, 1); group.add(shadow);
  tires.forEach(({wheel})=>joinParts(wheel)); joinParts(body); joinParts(lamps);
  return {
    id: options.id || type, model: type, name: model.name, condition: 100, speed: 0, throttle: 0, steering: 0,
    x, z, heading, radius: w * .5 + .5, length: l, mesh: group, body, tires, lamps, parked: options.parked ?? true,
    draw(lights) {
      group.position.set(this.x, groundAt(this.x, this.z), this.z); group.rotation.y = this.heading;
      lamps.visible = lights;
      for (const { wheel, front } of tires) wheel.rotation.y = front ? this.steering * .31 : 0;
    },
  };
}
export function parkVehicles(scene, city, seed) {
  const rand = seeded(seed);
  const vans = [
    createVehicle(scene, 'solace', 1186, 2013, Math.PI / 2, { id: 'strand-solace' }),
    createVehicle(scene, 'coldfin', LOCATIONS.van.x, LOCATIONS.van.z, Math.PI, { id: 'coldfin' }),
  ];
  for (let i = 0; i < 27; i++) {
    const x = rand.pick(STREETS_X) + rand.pick([-1, 1]) * 46;
    const z = rand.pick(STREETS_Z) + rand.range(79, 272);
    if (z > 2185 || blocked(city, x, z, 6) || vans.some(v => Math.hypot(v.x - x, v.z - z) < 20)) continue;
    vans.push(createVehicle(scene, rand.pick(['solace','brisa','cutter']), x, z, x % 2 ? 0 : Math.PI,
      { id: 'parked-' + i, tint: rand.pick(['#a25f76','#dca464','#579294','#b7c1a3','#b87b72','#a3a8c1']) }));
  }
  return vans;
}
