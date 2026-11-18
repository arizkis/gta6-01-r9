// Local traffic circulates block loops and leaves space for a vehicle ahead.
import { STREETS_X, STREETS_Z } from './config.js';
import { createVehicle } from './vehicles.js';
import { seeded, damp, turnAngle } from './random.js';

export function makeTraffic(scene, seed) {
  const rand = seeded(seed), cars = [];
  for (let ix = 0; ix < STREETS_X.length - 1; ix++) for (let iz = 0; iz < STREETS_Z.length - 1; iz++) {
    if ((ix + iz) % 4 === 1 && iz !== 3) continue;
    const left = STREETS_X[ix] + 18, right = STREETS_X[ix+1] - 18;
    const top = STREETS_Z[iz] + 18, bottom = STREETS_Z[iz+1] - 18;
    const path = [{ x: left, z: top }, { x: right, z: top }, { x: right, z: bottom }, { x: left, z: bottom }];
    for (let j = 0; j < (iz === 3 ? 2 : 1); j++) {
      const i = (ix + iz + j * 2) % 4, a = path[i], b = path[(i+1)%4], t = rand.range(.18, .85);
      const special = ix === 2 && iz === 3 && j === 0;
      const v = createVehicle(scene, rand.pick(['solace','brisa','cutter']), special ? 1230 : a.x + (b.x-a.x)*t,
        special ? bottom : a.z + (b.z-a.z)*t, special ? -Math.PI/2 : Math.atan2(b.x-a.x,b.z-a.z),
        { id: 'traffic-' + cars.length, parked: false, tint: rand.pick(['#d5687f','#57a6a4','#d19756','#99abca','#bcbaaa']) });
      cars.push(Object.assign(v, { path, next: special ? 3 : (i+1)%4, cruise: rand.range(22,42) }));
    }
  }
  function tick(dt, player, headlights) {
    for (const v of cars) {
      if (v === player.vehicle || v.parked) continue;
      let target = v.path[v.next], dx = target.x - v.x, dz = target.z - v.z;
      if (Math.hypot(dx,dz) < 1.6) { v.x = target.x; v.z = target.z; v.next = (v.next + 1) % 4;
        target = v.path[v.next]; dx = target.x - v.x; dz = target.z - v.z; }
      const length = Math.hypot(dx,dz) || 1, ux = dx/length, uz = dz/length;
      const clear = o => {
        const rx = o.x-v.x, rz = o.z-v.z, ahead = rx*ux+rz*uz;
        return ahead < 0 || ahead > 18 || Math.abs(rx*uz-rz*ux) > 4.3;
      };
      const speed = clear(player) && cars.every(o => o === v || clear(o)) ? v.cruise : 0;
      v.speed = damp(v.speed, speed, dt, speed ? 2.7 : 10);
      const advance = Math.min(v.speed * dt, length);
      v.x += ux*advance; v.z += uz*advance;
      v.heading += turnAngle(v.heading, Math.atan2(dx,dz)) * (1-Math.exp(-dt*7));
      v.draw(headlights);
    }
  }
  return { cars, tick };
}
