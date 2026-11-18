// The coast fills in terraces; ramps are the last streets to take water.
import { T } from './geometry.js';
import { clamp } from './random.js';

export function makeSurge(scene, zones) {
  const sheet = new T.MeshStandardMaterial({ color: '#3d7f87', roughness: .28, opacity: .34,
    transparent: true, polygonOffset: true, polygonOffsetFactor: -1, depthWrite: false });
  const pools = zones.map(zone => {
    const mesh = new T.Mesh(new T.PlaneGeometry(zone.x2 - zone.x1, zone.z2 - zone.z1), sheet);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((zone.x1 + zone.x2) / 2, .29, (zone.z1 + zone.z2) / 2);
    // A sloping bridge gets its own render surface; don't draw a flat plane across it.
    if (!zone.ramp) scene.add(mesh);
    return { mesh, zone };
  });
  const state = {
    duration: 720, remaining: 720, level: 0, causewayOpen: true, zones,
    depthAt(x, z) {
      let depth = 0;
      for (const area of this.zones) {
        if (x >= area.x1 && x <= area.x2 && z >= area.z1 && z <= area.z2)
          depth = Math.max(depth, this.level + area.bias);
      }
      return depth;
    },
    set(seconds) {
      this.remaining = clamp(seconds, 0, this.duration);
      this.level = 4 + Math.floor((this.duration - this.remaining) / 45) * 3;
      this.causewayOpen = this.remaining > 0;
      for (const { mesh, zone } of pools) {
        const depth = this.level + zone.bias;
        mesh.visible = depth > 0;
        mesh.position.y = .28 + Math.max(0, depth) * .009;
      }
      sheet.opacity = .28 + this.level * .005;
    },
    tick(dt) { this.set(this.remaining - dt); },
  };
  state.set(state.duration); return state;
}
