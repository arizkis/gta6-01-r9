// Acceleration, braking and solid-world contact for the car Juno drives.
import { SPEED } from './config.js';
import { blocked } from './city.js';
import { clamp, damp } from './random.js';

export function drive(car, controls, city, actors, dt) {
  const throttle = Number(controls.forward) - Number(controls.back);
  const steer = Number(controls.left) - Number(controls.right);
  car.throttle = throttle;
  car.steering = damp(car.steering, steer, dt, 10);
  if (throttle) {
    const braking = Math.sign(car.speed) !== throttle && Math.abs(car.speed) > 1;
    car.speed += throttle * (braking ? 83 : throttle > 0 ? 37 : 27) * dt;
    car.speed = clamp(car.speed, -SPEED.reverse, SPEED.drive);
  } else car.speed = damp(car.speed, 0, dt, controls.sprint ? 3.3 : .76);
  if (Math.abs(car.speed) < .09) car.speed = 0;
  const moving = Math.min(1, Math.abs(car.speed) / 14);
  car.heading += car.steering * moving * (1.72 - .85 * Math.abs(car.speed) / SPEED.drive) * Math.sign(car.speed) * dt;
  car.heading = Math.atan2(Math.sin(car.heading), Math.cos(car.heading));
  const dx = Math.sin(car.heading), dz = Math.cos(car.heading);
  car.impact = 0;
  const hit = (x,z) => {
    const overhang = Math.max(0, car.length / 2 - car.radius);
    return [0, -overhang, overhang].some(k => {
      const xx = x + dx*k, zz = z + dz*k;
      return blocked(city, xx, zz, car.radius) || actors.some(other => other !== car &&
        Math.hypot(other.x-xx, other.z-zz) < other.radius + car.radius);
    });
  };
  const mx = dx * car.speed * dt, mz = dz * car.speed * dt;
  if (!hit(car.x+mx, car.z+mz)) { car.x += mx; car.z += mz; }
  else {
    if (mx && !hit(car.x+mx, car.z)) car.x += mx;
    else if (mz && !hit(car.x, car.z+mz)) car.z += mz;
    if (Math.abs(car.speed) > 6) {
      car.impact = Math.abs(car.speed);
      car.condition = Math.max(0, car.condition - Math.ceil(car.impact * .13));
    }
    car.speed *= .20;
  }
}
