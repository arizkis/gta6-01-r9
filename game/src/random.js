// Seeded random stream for repeatable streets, traffic and weather.
export function seeded(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let v = Math.imul(state ^ state >>> 15, state | 1);
    v ^= v + Math.imul(v ^ v >>> 7, v | 61);
    return ((v ^ v >>> 14) >>> 0) / 4294967296;
  };
  return { next, range: (a, b) => a + (b - a) * next(), pick: a => a[Math.floor(next() * a.length)] };
}
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const damp = (from, to, dt, rate) => from + (to - from) * (1 - Math.exp(-rate * dt));
export const turnAngle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
