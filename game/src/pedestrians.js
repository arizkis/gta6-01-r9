// People use viable sidewalk loops and switch to umbrellas or awnings in rain.
import { T, box, cone, drum, orb, label, part, joinParts } from './geometry.js';
import { blocked, groundAt } from './city.js';
import { CONTACTS, STREETS_X, STREETS_Z, LOCATIONS } from './config.js';
import { seeded, distance, turnAngle } from './random.js';

export function makePerson(tint = '#ee9776', skin = '#c58f76') {
  const g = new T.Group();
  const legs = [-.61, .61].map(x => {
    const leg = new T.Group(); leg.position.set(x, 2.25, 0); g.add(leg);
    part(leg, .60, 1.88, .62, 0, -.90, 0, '#283b50');
    part(leg, .69, .35, 1.05, 0, -2.04, .18, '#212a37');
    return leg;
  });
  part(g, 2.11, 2.28, 1.02, 0, 3.28, 0, tint);
  part(g, 1.47, 1.48, 1.34, 0, 4.98, .04, skin, orb);
  part(g, 1.53, .73, 1.41, 0, 5.48, -.09, '#303044', orb);
  part(g, .54, 1.68, .6, -1.25, 3.33, .02, tint).rotation.z = -.13;
  part(g, .54, 1.68, .6, 1.25, 3.33, .02, tint).rotation.z = .13;
  part(g, .52, .50, .52, -1.40, 2.37, .02, skin, orb);
  part(g, .52, .50, .52, 1.40, 2.37, .02, skin, orb);
  legs.forEach(joinParts); joinParts(g);
  return { mesh: g, legs };
}
export function makePedestrians(scene, city, seed) {
  const r = seeded(seed), people = [];
  for (let iy = 0; iy < STREETS_Z.length-1; iy++) for (let ix = 0; ix < STREETS_X.length-1; ix++) {
    const x0 = STREETS_X[ix]+63, z0 = STREETS_Z[iy]+63, x1 = STREETS_X[ix+1]-63, z1 = STREETS_Z[iy+1]-63;
    const route = [{ x:x0,z:z0 }, { x:x1,z:z0 }, { x:x1,z:z1 }, { x:x0,z:z1 }];
    for (let i = 0; i < 2; i++) {
      const index = (ix + iy + 2*i) % 4, a = route[index], b = route[(index+1)%4], t = r.range(.12,.85);
      const actor = makePerson(r.pick(['#f1a16e','#c8798f','#63a7a5','#8f96bc','#d6c477']), r.pick(['#c68e73','#b57d62','#a46a55','#edb28d']));
      const umbrella = new T.Group(), color = r.pick(['#e58787','#dabf89','#5fa3a8','#80789c']);
      part(umbrella, .17, 3.8, .17, 1.18, 5.1, .08, '#394456', drum);
      part(umbrella, 6.75, 1.80, 6.75, 1.1, 7.05, .1, color, cone);
      joinParts(umbrella);
      actor.mesh.add(umbrella); scene.add(actor.mesh);
      const x = a.x+(b.x-a.x)*t, z = a.z+(b.z-a.z)*t;
      const near = city.shelters.reduce((prev,s) => distance({x,z},s)<distance({x,z},prev) ? s : prev, {x: -2000,z: -2000});
      const seeksShelter = i === 1 && (ix+iy)%3 === 1 && distance({x,z},near)<130;
      people.push({ ...actor, umbrella, x, z, radius:1.2, next: (index+1)%4, route, speed: r.range(2.3,4.2),
        takesUmbrella: (ix+iy+i)%3 !== 1, shelter: seeksShelter ? near : null, state: 'stroll', heading: 0, phase: r.range(0,7) });
    }
  }
  const shelterSpots = city.shelters.filter(s=>!blocked(city,s.x,s.z,.8))
    .sort((a,b)=>distance(a,LOCATIONS.spawn)-distance(b,LOCATIONS.spawn));
  for (let i=0; i<Math.min(4,shelterSpots.length); i++) {
    const p=people[i], shelter=shelterSpots[i];
    p.x=shelter.x; p.z=shelter.z; p.shelter=shelter; p.state='shelter';
  }
  const contacts = CONTACTS.map(c => {
    const { mesh } = makePerson(c.color);
    mesh.position.set(c.x, groundAt(c.x,c.z), c.z); scene.add(mesh);
    const marker = label(c.name.toUpperCase(), { width: 19, height: 4, sprite: true, trim: c.color });
    marker.position.y = 9.4; mesh.add(marker);
    return { ...c, mesh };
  });
  function tick(dt, weather, player, police=[], vehicles=[]) {
    for (const p of people) {
      const rainy = weather.rain > .26;let sheltering=rainy&&!!p.shelter;
      const threat=police.some(u=>u.active&&u.distance<115)||vehicles.some(v=>Math.abs(v.speed)>55&&distance(p,v)<95);
      if(threat&&p.state!=='panic'){p.state='panic';p.panicFor=5;p.shelter=city.shelters.reduce((best,s)=>distance(p,s)<distance(p,best)?s:best,city.shelters[0]||p);}
      if(p.state==='panic'&&!p.shelter)p.shelter=city.shelters[0]||{x:p.x,z:p.z};
      if(!threat&&p.state==='panic'&&(p.panicFor-=dt)<=0){p.state='stroll';p.shelter=null;}
      sheltering=rainy&&!!p.shelter;
      const alarm = p.state === 'panic';
      let target = (sheltering||alarm) ? p.shelter : p.route[p.next];
      if(!target){p.next=0;target=p.route[0]||{x:p.x,z:p.z};}
      if (!sheltering && distance(p,target) < 1.6) { p.next = (p.next+1)%4; target = p.route[p.next]||{x:p.x,z:p.z}; }
      const dx = target.x-p.x, dz = target.z-p.z, len = Math.hypot(dx,dz);
      const speed = alarm ? p.speed * 2.3 : p.speed;
      let moving = false;
      if (len > 1.1) {
        const x = p.x + dx/len * Math.min(dt*speed,len), z = p.z + dz/len * Math.min(dt*speed,len);
        if (!blocked(city,x,z,.75)) { p.x=x; p.z=z; moving=true; }
        else if (sheltering) p.shelter = null;
        else p.next = (p.next+1)%4;
        if (moving) p.heading += turnAngle(p.heading, Math.atan2(dx,dz)) * (1-Math.exp(-dt*9));
      }
      if (!alarm) p.state = sheltering && !moving ? 'shelter' : 'stroll';
      p.mesh.visible = distance(p,player)<300;
      p.mesh.position.set(p.x, groundAt(p.x,p.z), p.z); p.mesh.rotation.y = p.heading;
      p.umbrella.visible = rainy && p.takesUmbrella && p.state !== 'shelter';
      p.phase += dt * speed * 3; p.legs[0].rotation.x = moving ? Math.sin(p.phase)*.35 : 0;
      p.legs[1].rotation.x = -p.legs[0].rotation.x;
    }
  }
  return { people, contacts, tick };
}
