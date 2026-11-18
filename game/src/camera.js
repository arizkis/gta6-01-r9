// A compact shoulder camera opens up into a speed-sensitive chase camera.
import { T } from './geometry.js';
import { blocked, inBounds } from './city.js';
import { damp, turnAngle } from './random.js';
export function makeCamera() {
  const camera = new T.PerspectiveCamera(58, 1, .15, 4300), aim = new T.Vector3();
  let heading = 0, initialized = false;
  function follow(player, city, dt, snap = false) {
    const car = player.vehicle;
    const speed = Math.abs(car?.speed || 0), dist = car ? 17 + speed*.075 : 12;
    snap ||= !initialized;
    heading = snap ? player.heading : heading + turnAngle(heading, player.heading)*(1-Math.exp(-dt*(car ? 4.7 : 2.8)));
    const dx = Math.sin(heading), dz = Math.cos(heading);
    let spacing = dist;
    while (spacing > 4 && inBounds(player.x-dx*spacing,player.z-dz*spacing) &&
      blocked(city, player.x-dx*spacing, player.z-dz*spacing, 1.4)) spacing -= 1.5;
    const shoulder = car ? 0 : 2.7;
    const x = player.x-dx*spacing+dz*shoulder, z = player.z-dz*spacing-dx*shoulder;
    const y = player.y+(car ? 8.8 + speed*.025 : 8.5);
    const target = new T.Vector3(player.x+dx*(car ? 11 : 9),player.y+(car ? 3.6 : 5.6),player.z+dz*(car ? 11 : 9));
    camera.position.set(snap ? x : damp(camera.position.x,x,dt,8.7),
      snap ? y : damp(camera.position.y,y,dt,8.7), snap ? z : damp(camera.position.z,z,dt,8.7));
    aim.lerp(target, snap ? 1 : 1-Math.exp(-dt*9));
    camera.lookAt(aim);
    const fov = damp(camera.fov, 57+speed*.13, dt, 5);
    if (Math.abs(fov-camera.fov) > .015) { camera.fov=fov; camera.updateProjectionMatrix(); }
    initialized = true;
  }
  return { camera, follow };
}
