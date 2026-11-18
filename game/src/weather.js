// Sky, lighting and rain share a switchable preset and a public weather state.
import { T } from './geometry.js';
import { seeded } from './random.js';

export const PRESETS = {
  stormDusk: { top: '#16253f', rim: '#b16776', fog: '#776779', sun: '#ff9d62', skyLight: '#a9baec', ground: '#76666a', strength: 2.15, rain: 1, wind: 1, hour: 18, direction: [-.8,.12,-.45], mist: .00075 },
  wetMidday: { top: '#517485', rim: '#b9d2c9', fog: '#9caeb0', sun: '#fff0d4', skyLight: '#d2ebf4', ground: '#839d98', strength: 2.05, rain: .48, wind: .46, hour: 14, direction: [-.52,.62,-.3], mist: .00058 },
  neonNight: { top: '#080f26', rim: '#354274', fog: '#343850', sun: '#768ccc', skyLight: '#91a3ff', ground: '#644470', strength: .8, rain: .78, wind: .75, hour: 22, direction: [.45,.5,.3], mist: .00085 },
  dawn: { top: '#54778e', rim: '#f5b6a0', fog: '#d7ada4', sun: '#ffd8aa', skyLight: '#d7e2f3', ground: '#b09e8e', strength: 2.55, rain: .05, wind: .20, hour: 6, direction: [.65,.19,.5], mist: .00049 },
};
const skyShader = {
  vertexShader: `
    varying vec3 vDirection;
    void main() { vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
  `,
  fragmentShader: `
    uniform vec3 top, rim, sunTint, sunDir;
    uniform float windTime, flash;
    varying vec3 vDirection;
    float hash(vec2 p) { return fract(sin(dot(p,vec2(61.7,129.1)))*43758.5453); }
    float noise(vec2 p) {
      vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
    }
    void main() {
      vec3 d=normalize(vDirection);
      float h=max(0.,d.y);
      vec3 base=mix(rim,top,smoothstep(.0,.64,h));
      vec2 p=d.xz/(.18+h)*3.+vec2(windTime,0.);
      float cloud=noise(p)*.58+noise(p*2.7)*.28+noise(p*5.4)*.14;
      float cloudMask=smoothstep(.36,.70,cloud)*smoothstep(.015,.20,h);
      base=mix(base,top*.55,cloudMask*.68);
      float at=max(0.,dot(d,sunDir));
      base+=sunTint*pow(at,18.)*.22*(1.-cloudMask);
      base+=sunTint*smoothstep(.9992,.9998,at)*1.05*(1.-cloudMask);
      gl_FragColor=vec4(base+vec3(.48,.54,.78)*flash,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};
export function makeWeather(scene, city, seed) {
  const r = seeded(seed), key = new T.DirectionalLight(), fill = new T.HemisphereLight();
  const skySurface = new T.ShaderMaterial({ ...skyShader, side: T.BackSide, depthWrite: false,
    uniforms: { top: { value: new T.Color() }, rim: { value: new T.Color() }, sunTint: { value: new T.Color() },
      sunDir: { value: new T.Vector3() }, windTime: { value: 0 }, flash: { value: 0 } },
  });
  const dome = new T.Mesh(new T.SphereGeometry(3550, 32, 20), skySurface);
  dome.frustumCulled = false; dome.renderOrder = -10;
  scene.add(dome, fill, key);
  scene.fog = new T.FogExp2();
  const rainCount = 880, rainPositions = new Float32Array(rainCount * 6);
  const rainGeo = new T.BufferGeometry();
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPositions, 3).setUsage(T.DynamicDrawUsage));
  const rainStroke = new T.LineBasicMaterial({ color: '#9ebcdd', transparent: true, opacity: .26, depthWrite: false });
  const rain = new T.LineSegments(rainGeo, rainStroke);
  rain.frustumCulled = false;
  const drops = Array.from({ length: rainCount }, () => ({ x: r.range(-92, 92), y: r.range(1, 75), z: r.range(-92, 92), v: r.range(43, 73) }));
  const ringMat = new T.MeshBasicMaterial({color: '#accace', opacity: .29, transparent: true, depthWrite: false, side: T.DoubleSide });
  const splash = new T.InstancedMesh(new T.RingGeometry(.7, .83, 8), ringMat, 45);
  splash.frustumCulled = false; scene.add(rain, splash);
  const rings = Array.from({ length: splash.count }, () => ({ x: r.range(-66,66), z: r.range(-66,66), age: r.next() }));
  const marker = new T.Object3D();
  let time = 0, nextBolt = 9, flash = 0, thunderIn = 0;
  const weather = {
    preset: '', rain: 0, wind: 0, hour: 18, headlights: true, flash: 0, thunder: false,
    setPreset(name) {
      if (!Object.hasOwn(PRESETS, name)) return;
      const p = PRESETS[name]; this.preset = name; this.rain = p.rain; this.wind = p.wind; this.hour = p.hour;
      this.headlights = name !== 'dawn'; flash = 0;
      key.position.set(...p.direction).multiplyScalar(1000); key.color.set(p.sun); key.intensity = p.strength;
      fill.color.set(p.skyLight); fill.groundColor.set(p.ground); fill.intensity = 1.55;
      scene.fog.color.set(p.fog); scene.fog.density = p.mist;
      skySurface.uniforms.top.value.set(p.top); skySurface.uniforms.rim.value.set(p.rim);
      skySurface.uniforms.sunTint.value.set(p.sun); skySurface.uniforms.sunDir.value.set(...p.direction).normalize();
      if (city.materials.road) city.materials.road.roughness = this.rain > .2 ? .39 : .82;
      if (city.materials.glow) city.materials.glow.userData.glow.value =
        name==='neonNight' ? 1.35 : name==='stormDusk' ? .80 : .16;
      rain.visible = splash.visible = this.rain > .1;
    },
    tick(dt, eye, focus) {
      time += dt;
      this.thunder = false;
      if (thunderIn > 0 && (thunderIn -= dt) <= 0) this.thunder = true;
      if (this.preset === 'stormDusk' && time >= nextBolt) {
        nextBolt = time + r.range(13, 24); flash = 1; thunderIn = r.range(.55, 1.9);
      }
      flash *= Math.exp(-9 * dt); this.flash = flash;
      key.intensity = PRESETS[this.preset].strength + flash * 2.2;
      dome.position.copy(eye); skySurface.uniforms.flash.value = flash;
      skySurface.uniforms.windTime.value = time * .026;
      for (const { crown, phase } of city.palms) {
        crown.rotation.z = this.wind * (.12 + Math.sin(time * 2.1 + phase) * .12);
        crown.rotation.x = this.wind * Math.cos(time * 1.4 + phase) * .09;
      }
      if (!rain.visible) return;
      const count = Math.floor(rainCount * this.rain), slant = 3.5 * this.wind;
      rainGeo.setDrawRange(0, count * 2);
      for (let i = 0; i < count; i++) {
        const a = drops[i], idx = i * 6;
        a.y -= a.v * dt; a.x += dt * slant * 6;
        if (a.x > 92) a.x -= 184;
        if (a.y < 0) { a.y = r.range(49, 75); a.x = r.range(-92, 92); a.z = r.range(-92, 92); }
        rainPositions[idx] = focus.x + a.x; rainPositions[idx + 1] = a.y; rainPositions[idx + 2] = focus.z + a.z;
        rainPositions[idx + 3] = focus.x + a.x - slant; rainPositions[idx + 4] = a.y + a.v * .075;
        rainPositions[idx + 5] = focus.z + a.z + .65;
      }
      rainGeo.attributes.position.needsUpdate = true;
      marker.rotation.x = -Math.PI / 2;
      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i]; ring.age += dt * 1.7;
        if (ring.age >= 1) { ring.age %= 1; ring.x = r.range(-66,66); ring.z = r.range(-66,66); }
        const scale = .08 + ring.age * .96;
        marker.position.set(focus.x + ring.x, .89, focus.z + ring.z);
        marker.scale.set(scale, scale, 1); marker.updateMatrix(); splash.setMatrixAt(i, marker.matrix);
      }
      splash.instanceMatrix.needsUpdate = true;
    },
  };
  weather.setPreset('stormDusk');
  return weather;
}
