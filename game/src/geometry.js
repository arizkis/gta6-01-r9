// Shared primitives, batched city geometry and hand-painted signs.
import * as T from '../vendor/three.min.js';
export { T };
export const box = new T.BoxGeometry();
export const drum = new T.CylinderGeometry(.5, .5, 1, 10);
export const cone = new T.ConeGeometry(.5, 1, 7);
export const orb = new T.IcosahedronGeometry(.5, 0);
const materials = new Map();
export function paint(color, glow = false) {
  const key = color + ':' + glow;
  if (!materials.has(key)) materials.set(key, new T.MeshLambertMaterial({
    color, flatShading: true, emissive: glow ? color : 0, emissiveIntensity: glow ? .85 : 0,
  }));
  return materials.get(key);
}
export function part(parent, sx, sy, sz, x, y, z, color, geometry = box, glow = false) {
  const m = new T.Mesh(geometry, paint(color, glow));
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
}
export function joinParts(root) {
  // Bake stationary siblings into vertex-colored meshes; animated child groups stay live.
  const groups = [[],[]];
  for (const mesh of [...root.children]) {
    if (!mesh.isMesh || !mesh.material.isMeshLambertMaterial || mesh.material.map) continue;
    mesh.updateMatrix();
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrix);
    const emissive = mesh.material.emissiveIntensity > 0 && mesh.material.emissive.getHex() !== 0;
    groups[emissive ? 1 : 0].push({ mesh, geo });
  }
  for (let type = 0; type < groups.length; type++) {
    const items = groups[type];
    if (items.length < 2) { items.forEach(({geo})=>geo.dispose()); continue; }
    const count = items.reduce((sum,{geo})=>sum+geo.attributes.position.count,0);
    const positions = new Float32Array(count*3), normals = new Float32Array(count*3), colors = new Float32Array(count*3);
    let offset = 0;
    for (const {mesh,geo} of items) {
      const xyz = geo.attributes.position.array;
      positions.set(xyz,offset); normals.set(geo.attributes.normal.array,offset);
      const col = mesh.material.color;
      for (let i = offset; i < offset+xyz.length; i+=3) { colors[i]=col.r; colors[i+1]=col.g; colors[i+2]=col.b; }
      offset += xyz.length; root.remove(mesh); geo.dispose();
    }
    const result = new T.BufferGeometry();
    result.setAttribute('position',new T.BufferAttribute(positions,3));
    result.setAttribute('normal',new T.BufferAttribute(normals,3));
    result.setAttribute('color',new T.BufferAttribute(colors,3));
    const surface = new T.MeshLambertMaterial({vertexColors:true,flatShading:true});
    if (type) surface.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.85;');
    };
    root.add(new T.Mesh(result,surface));
  }
}
export function makeBatch(scene) {
  const sets = new Map(), pivot = new T.Object3D(), tint = new T.Color();
  return {
    add(x, y, z, sx, sy, sz, color, shape = box, ry = 0, rx = 0, style = 'matte') {
      const key = shape.uuid + style;
      if (!sets.has(key)) sets.set(key, { shape, style, items: [] });
      pivot.position.set(x, y, z); pivot.scale.set(sx, sy, sz); pivot.rotation.set(rx, ry, 0); pivot.updateMatrix();
      sets.get(key).items.push([pivot.matrix.clone(), color]);
    },
    finish() {
      const bands = {};
      for (const { shape, style, items } of sets.values()) {
        const surface = style==='road' || style==='water'
          ? new T.MeshStandardMaterial({roughness:.62,metalness:0})
          : new T.MeshLambertMaterial({flatShading:true});
        if (style === 'glow') {
          surface.userData.glow = { value:.7 };
          surface.onBeforeCompile = shader => {
            shader.uniforms.cityGlow = surface.userData.glow;
            shader.fragmentShader = 'uniform float cityGlow;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
              '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * cityGlow;');
          };
        }
        const mesh = new T.InstancedMesh(shape, surface, items.length);
        items.forEach(([matrix, color], index) => {
          mesh.setMatrixAt(index, matrix); mesh.setColorAt(index, tint.set(color));
        });
        mesh.computeBoundingSphere(); scene.add(mesh); bands[style] = surface;
      }
      return bands;
    },
  };
}
export function label(text, { width = 64, height = 14, color = '#ffe9cf', back = '#16333c', trim = '#ffae6d', sprite = false } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = back; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = trim; ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116); ctx.fillStyle = trim;
  ctx.fillRect(17, 19, 7, 90); ctx.fillRect(488, 19, 7, 90);
  ctx.fillStyle = color; ctx.font = '800 66px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 67, 450);
  const map = new T.CanvasTexture(c); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 4;
  const m = sprite ? new T.Sprite(new T.SpriteMaterial({ map, depthWrite: false })) :
    new T.Mesh(new T.PlaneGeometry(), new T.MeshBasicMaterial({ map, side: T.DoubleSide }));
  m.scale.set(width, height, 1); return m;
}
