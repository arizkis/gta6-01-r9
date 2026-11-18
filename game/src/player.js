// Juno can travel on foot, talk at a contact marker or take the driver's seat.
import { LOCATIONS } from './config.js';
import { blocked, groundAt } from './city.js';
import { SPEED } from './config.js';
import { makePerson } from './pedestrians.js';
import { drive } from './driving.js';
import { distance, turnAngle } from './random.js';

export function makePlayer(scene) {
  const shape = makePerson('#ed9569', '#b97e5f'); scene.add(shape.mesh);
  return {
    ...shape, x: LOCATIONS.spawn.x, z: LOCATIONS.spawn.z, y: 0, heading: Math.PI / 2, vehicle: null,
    health: 100, armour: 0, nerve: 100, cash: 140, banked: 0,
    respect: { FIXER: 0, MECHANIC: 0, FENCE: 0 }, pace: 0, step: 0,
  };
}
export function interactable(player, vehicles, contacts) {
  if (player.vehicle) return { kind: 'exit', text: 'Exit ' + player.vehicle.name };
  const contact = contacts.find(c => distance(c,player) < 8);
  if (contact) return { kind: 'contact', target: contact, text: 'Talk to ' + contact.name };
  let nearest = null, best = 10.2;
  for (const car of vehicles) {
    const current = distance(car,player);
    if (current < best && Math.abs(car.speed) < 12) { nearest = car; best = current; }
  }
  return nearest ? { kind: 'enter', target: nearest, text: 'Enter ' + nearest.name } : null;
}
const free = (city, cars, x, z, radius = 1.05) => !blocked(city,x,z,radius) && cars.every(car => {
  const vx = x-car.x, vz = z-car.z, sin = Math.sin(car.heading), cos = Math.cos(car.heading);
  return Math.abs(vx*cos-vz*sin)>car.radius+radius || Math.abs(vx*sin+vz*cos)>car.length*.5+radius;
});
export function useInteraction(player, action, city, cars) {
  if (action?.kind === 'enter') {
    player.vehicle = action.target; action.target.parked = true; action.target.speed = 0;
    player.x = action.target.x; player.z = action.target.z; player.heading = action.target.heading;
  } else if (action?.kind === 'exit') {
    const v = player.vehicle;
    if (Math.abs(v.speed) > 26) return { kind: 'notice', text: 'Slow down to get out' };
    for (const side of [1,-1,2,-2]) {
      const x = v.x+Math.cos(v.heading)*side*(v.radius+2), z = v.z-Math.sin(v.heading)*side*(v.radius+2);
      if (!free(city,cars,x,z)) continue;
      v.speed = 0; player.vehicle = null; player.x = x; player.z = z; break;
    }
    if (player.vehicle) return { kind: 'notice', text: 'No room to get out' };
  }
  return action;
}
export function tickPlayer(p, keys, city, cars, dt) {
  if (p.vehicle) {
    drive(p.vehicle, keys, city, cars, dt);
    p.x=p.vehicle.x; p.z=p.vehicle.z; p.heading=p.vehicle.heading;
  } else {
    const x = Number(keys.right)-Number(keys.left), z = Number(keys.back)-Number(keys.forward);
    const length = Math.hypot(x,z);
    const stride = keys.sprint ? SPEED.sprint : SPEED.walk;
    p.pace = 0;
    if (length) {
      const dx = x/length*stride*dt, dz = z/length*stride*dt;
      p.heading += turnAngle(p.heading,Math.atan2(x,z))*(1-Math.exp(-dt*11));
      if (free(city,cars,p.x+dx,p.z)) { p.x+=dx; p.pace = stride; }
      if (free(city,cars,p.x,p.z+dz)) { p.z+=dz; p.pace = stride; }
    }
    p.step += dt*p.pace*2;
    p.legs[0].rotation.x = p.pace ? Math.sin(p.step)*.49 : 0;
    p.legs[1].rotation.x = -p.legs[0].rotation.x;
  }
  p.y=groundAt(p.x,p.z);
  p.mesh.visible=!p.vehicle;
  p.mesh.position.set(p.x,p.y,p.z); p.mesh.rotation.y=p.heading;
}
