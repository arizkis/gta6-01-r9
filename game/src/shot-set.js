import { T, box, cone, drum, label, makeBatch, part } from './geometry.js';
import { seeded } from './random.js';

// The puddle is a world-space surface. Its reflections break into ripples at grazing angles.
export function wetSurface(scene, x, y, z, width, depth, sources, wind = .55) {
  const material=new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    uniforms:{
      lamps:{value:sources.map(([x,z,w,d])=>new T.Vector4(x,z,w,d))},
      tints:{value:sources.map(([, , , ,color])=>new T.Color(color))},
      time:{value:0}, wind:{value:wind},
    },
    defines:{LAMPS:sources.length},
    vertexShader:`
      varying vec3 street;
      varying vec2 surface;
      void main() {
        surface=uv;
        vec4 world=modelMatrix*vec4(position,1.);
        street=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform vec4 lamps[LAMPS];
      uniform vec3 tints[LAMPS];
      uniform float time, wind;
      varying vec3 street;
      varying vec2 surface;
      float noise(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main() {
        vec2 p=street.xz;
        vec2 view=normalize(cameraPosition.xz-p);
        vec2 crossView=vec2(view.y,-view.x);
        float pulse=sin(dot(p,view)*8.+sin(dot(p,crossView)*1.5)+time*5.);
        float ripple=pow(.5+pulse*.5,4.)*.52+.34;
        vec3 color=vec3(.016,.037,.062)*ripple;
        for(int i=0;i<LAMPS;i++) {
          vec2 offset=p-lamps[i].xy;
          float along=dot(offset,view);
          float across=dot(offset,crossView)+pulse*wind;
          vec2 stretch=vec2(across/lamps[i].z,along/lamps[i].w);
          float reflectance=exp(-dot(stretch,stretch)*2.8)*smoothstep(-5.,3.,along);
          color+=tints[i]*reflectance*ripple;
        }
        float grain=noise(floor(p*9.));
        float edge=min(min(surface.x,1.-surface.x),min(surface.y,1.-surface.y));
        gl_FragColor=vec4(color,smoothstep(0.,.09,edge)*(.25+grain*.15));
        #include <colorspace_fragment>
      }`,
  });
  const patch=new T.Mesh(new T.PlaneGeometry(width,depth),material);
  patch.rotation.x=-Math.PI/2; patch.position.set(x,y,z); patch.renderOrder=2; scene.add(patch);
  return material.uniforms;
}

export function strandSet(state) {
  const {scene,city}=state, batch=makeBatch(scene), add=batch.add, rnd=seeded(17);
  const faces=['#374660','#66536b','#53617b','#395464','#55425d','#526c73'];
  const stores=['SURGE SUPPLY','NIGHT FERRY','STRAND SOCIAL','TIDE SIGNAL','AFTER RAIN','COAST RADIO'];
  [2007,2072].forEach((z,row)=>{
    const side=row?-1:1;
    for(let i=0;i<5;i++){
      const x=1270+i*44, height=24+Math.floor(rnd.range(0,15)), face=z+side*10;
      const tint=faces[(row*3+i)%faces.length], glow=row?'#e37eaf':'#6ce5df';
      add(x,height/2,z,40,height,20,tint);
      add(x,height-.6,z,41,1.2,21,'#242e47');
      add(x,9.8,z,41,.7,21,'#8796a2');
      add(x,.22,z+side*13,43,.44,7,'#545c65');
      for(let level=13;level<height-3;level+=6)for(let bay=-16;bay<=16;bay+=8){
        const lit=rnd.next()>.47;
        add(x+bay,level,face+side*.08,4.7,3.7,.2,lit?'#edba91':'#1b2e48',box,0,0,lit?'glow':'matte');
        add(x+bay,level-1.9,face+side*.54,5.5,.33,1,'#738090');
      }
      for(let bay=-16;bay<=16;bay+=8){
        add(x+bay,3.5,face+side*.16,6.4,5.4,.32,'#233849');
        add(x+bay,4,face+side*.36,4.9,3.75,.14,bay%3?'#b57a80':'#dca880',box,0,0,'glow');
        add(x+bay,7.3,face+side*2.4,7.8,.56,4.7,bay%3?tint:'#ba9b99',box,0,side*.11);
      }
      add(x,7.4,face+side*4.7,39,.19,.25,glow,box,0,0,'glow');
      const sign=label(stores[(i+row*2)%stores.length],{width:16,height:3.5,back:tint,trim:glow});
      sign.position.set(x+5,9.5,face+side*.5); sign.rotation.y=row?Math.PI:0; scene.add(sign);
    }
    for(let i=0;i<4;i++){
      const x=1280+i*31, palmZ=z+side*16, crown=new T.Group();
      const trunk=part(scene,.7,12,.7,x,6,palmZ,'#72594e',drum);
      trunk.rotation.z=-.18;
      crown.position.set(x+1.05,11.9,palmZ);
      for(let j=0;j<7;j++){
        const a=j*Math.PI*2/7;
        const frond=part(crown,1.7,.38,7,Math.sin(a)*2.8,-.65,Math.cos(a)*2.8,j%2?'#376b65':'#244649');
        frond.rotation.set(.19,a,0,'YXZ');
      }
      scene.add(crown); city.palms.push({crown,phase:i});
      add(x+5,6.75,palmZ,.35,13.5,.35,'#37435a');
      add(x+5,13.5,palmZ+side*1.8,.4,.3,4,'#49536b');
      add(x+5,13.3,palmZ+side*3.45,1,.34,.77,'#f7b785',box,0,0,'glow');
    }
  });
  batch.finish();
}

export function stormBolt(scene) {
  const forks=[
    [0,76,0, 2,67,2, -2,61,4, 4,56,5, 1,49,8, 7,42,9, 4,35,14, 9,29,15],
    [-2,61,4, -6,56,1, -9,49,-3, -7,42,-4],
    [4,56,5, 10,53,10, 13,46,13, 12,41,18],
    [1,49,8, 0,44,1, -4,39,-1],
  ];
  const material=new T.LineBasicMaterial({color:'#f6b7fc',transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  for(const fork of forks) {
    const points=[];
    for(let i=0;i<fork.length;i+=3)points.push(new T.Vector3(1415+fork[i],fork[i+1],2046+fork[i+2]));
    scene.add(new T.Line(new T.BufferGeometry().setFromPoints(points),material));
  }
  return material;
}

export function fitPoliceGlare(car) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=64;
  const context=canvas.getContext('2d'), halo=context.createRadialGradient(32,32,0,32,32,31);
  halo.addColorStop(0,'#ffffffeb'); halo.addColorStop(.12,'#ffffffa0');
  halo.addColorStop(.32,'#ffffff30'); halo.addColorStop(1,'#ffffff00');
  context.fillStyle=halo; context.fillRect(0,0,64,64);
  const map=new T.CanvasTexture(canvas);
  const flares=[[-1,'#ff4770'],[1,'#67b9ff']].map(([side,color])=>{
    const material=new T.SpriteMaterial({color,map,blending:T.AdditiveBlending,depthWrite:false,transparent:true});
    const flare=new T.Sprite(material);
    flare.position.set(side*1.05,5.16,-.34); flare.scale.set(6.1,3.8,1);
    car.mesh.add(flare); return material;
  });
  return (time,phase)=>flares.forEach((m,i)=>{
    m.opacity=.55+.41*Math.pow(.5+.5*Math.cos(time*17+phase+i*Math.PI),2);
  });
}

export function marketSet(state) {
  const {scene}=state, batch=makeBatch(scene), add=batch.add;
  const stalls=[[827,1729,'CITRUS','#bc6457'],[863,1733,'DAY CATCH','#377d85'],
    [831,1706,'MANGO','#ab7550'],[864,1707,'FLOWERS','#8d5d83']];
  for(const [x,z,name,color] of stalls){
    for(const s of [-1,1])for(const row of [-1,1])add(x+s*5,4,z+row*2.7,.28,8,.28,'#65585a');
    for(let i=0;i<9;i++)add(x-5+i*1.25,8.1,z,1.26,.38,7,i%2?color:'#ead6b4',box,0,.15);
    add(x,1.6,z,10,3.2,3.5,'#926d58'); add(x,3.3,z,10.7,.32,4.4,'#d9ab78');
    for(let i=0;i<7;i++){
      const u=x-4.4+i*1.45;
      add(u,3.57,z+.32,1.13,.33,1.6,'#665a50');
      for(let j=0;j<3;j++)add(u,3.94,z-.2+j*.46,.58,.55,.51,
        ['#f39743','#c6cf69','#d56363'][(i+j)%3],cone,0,Math.PI*.5);
    }
    for(let i=0;i<4;i++){
      add(x-4+i*2.6,.9,z+3.1,2.2,1.7,1.7,'#ab896b');
      for(let j=0;j<3;j++)add(x-4+i*2.6,.35+j*.45,z+4,2.24,.11,.07,'#765a48');
    }
    const plate=label(name,{width:9.8,height:2,back:color});
    plate.position.set(x,8.7,z+3.1); scene.add(plate);
  }
  for(let i=0;i<14;i++){
    const x=817+i*3.35, z=1711+Math.sin(i*Math.PI/13)*1.6;
    add(x,11-Math.sin(i*Math.PI/13)*2,z,.1,.1,3.35,'#584e5c',box,Math.PI*.5);
    add(x,10.25-Math.sin(i*Math.PI/13)*2,z,.9,1.5,.9,i%2?'#efae72':'#d78295',drum,0,0,'glow');
  }
  batch.finish();
}
