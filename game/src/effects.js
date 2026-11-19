import { T } from './geometry.js';

const mistCanvas=document.createElement('canvas');
mistCanvas.width=mistCanvas.height=64;
const ctx=mistCanvas.getContext('2d');
const fog=ctx.createRadialGradient(32,32,1,32,32,31);
fog.addColorStop(0,'#fff'); fog.addColorStop(.45,'#ffffff68'); fog.addColorStop(1,'#ffffff00');
ctx.fillStyle=fog; ctx.fillRect(0,0,64,64);
const mistMap=new T.CanvasTexture(mistCanvas);

export function makeEffects(scene) {
  const particles=[];
  const spray=[];
  const plane=new T.PlaneGeometry(1,1);
  for(let i=0;i<64;i++) {
    const mat=new T.MeshBasicMaterial({color:'#c8d0cc',map:mistMap,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(plane,mat); mesh.visible=false; scene.add(mesh);
    particles.push({mesh,life:0});
  }
  const sprayGeo=new T.BufferGeometry(), capacity=760;
  const xyz=new T.BufferAttribute(new Float32Array(capacity*6),3).setUsage(T.DynamicDrawUsage);
  const rgb=new T.BufferAttribute(new Float32Array(capacity*6),3).setUsage(T.DynamicDrawUsage);
  sprayGeo.setAttribute('position',xyz); sprayGeo.setAttribute('color',rgb);
  const sprayMesh=new T.LineSegments(sprayGeo,new T.LineBasicMaterial({
    vertexColors:true,transparent:true,opacity:.84,depthWrite:false,blending:T.AdditiveBlending,
  }));
  sprayMesh.frustumCulled=false; scene.add(sprayMesh);
  const tint=new T.Color('#a3e9f2');
  const rings=[];
  for(let i=0;i<18;i++) {
    const mat=new T.MeshBasicMaterial({color:'#ace6e5',transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(new T.RingGeometry(.55,.8,12),mat); mesh.rotation.x=-Math.PI/2; mesh.visible=false; scene.add(mesh);
    rings.push({mesh,life:0});
  }
  let cursor=0,ringCursor=0,ringClock=0,waterClock=0,sequence=0;
  const puff=(x,y,z,size,color,life=.65)=>{
    const p=particles[cursor++%particles.length]; p.life=life; p.mesh.visible=true;
    p.mesh.material.color.set(color); p.mesh.material.opacity=.55; p.mesh.position.set(x,y,z); p.mesh.scale.set(size,size,1);
  };
  return { tick(dt,{vehicles=[],surge,cooler,weather,renderer,camera}) {
    ringClock-=dt;
    for(const r of rings) if(r.life>0) {
      r.life-=dt; r.mesh.material.opacity=Math.max(0,r.life/.65)*.45;
      r.mesh.scale.setScalar(1+(1-r.life/.65)*2.5); if(r.life<=0) r.mesh.visible=false;
    }
    for(const p of particles) if(p.life>0) {
      p.life-=dt; p.mesh.material.opacity=Math.max(0,p.life)*.52; p.mesh.scale.multiplyScalar(1+dt*1.2);
      if(camera)p.mesh.lookAt(camera.position);
      if(p.life<=0) p.mesh.visible=false;
    }
    waterClock-=dt;
    for(const v of vehicles) {
      if(!v||v.speed===undefined) continue;
      const depth=surge.depthAt(v.x,v.z),speed=Math.abs(v.speed);
      if(depth>2&&speed>5&&waterClock<=0) {
        const forwardX=Math.sin(v.heading),forwardZ=Math.cos(v.heading);
        const strength=Math.min(1,speed/77)*Math.min(1,depth/36);
        for(const side of [-1,1]){
          const lateralX=forwardZ*side,lateralZ=-forwardX*side;
          const x=v.x+lateralX*v.radius+forwardX*v.length*.38;
          const z=v.z+lateralZ*v.radius+forwardZ*v.length*.38;
          for(let i=0;i<8+strength*14&&spray.length<capacity;i++) {
            const s=(++sequence*.61803399)%1, r=(sequence*.41421356)%1;
            const outward=8+s*(12+strength*14), trail=1+r*strength*6;
            spray.push({x:x+lateralX*r-forwardX*s*5,y:.46+s*.46,z:z+lateralZ*r-forwardZ*s*5,
              dx:lateralX*outward-forwardX*trail,dy:3+strength*(8+Math.sin(s*Math.PI)*8)+r*3,
              dz:lateralZ*outward-forwardZ*trail,life:.55+s*.39,shine:.42+r*.55});
          }
          if(strength>.55){
            puff(x+lateralX*1.6-forwardX*4,.92,z+lateralZ*1.6-forwardZ*4,2.7,'#d8f8f5',.5);
            puff(x+lateralX*3,1.35,z+lateralZ*3,1.3,'#dbf4f4',.36);
          }
        }
        if(weather.rain>.2&&ringClock<=0) {
          const r=rings[ringCursor++%rings.length]; r.life=.65; r.mesh.visible=true; r.mesh.position.set(v.x,.33,v.z); ringClock=.16;
        }
      }
      if(v.steering&&speed>25&&waterClock<=0) {
        puff(v.x-Math.sin(v.heading)*6,1.24,v.z-Math.cos(v.heading)*6,4,'#9aafc2',.52);
      }
      if(v.throttle&&speed<9) puff(v.x+Math.cos(v.heading)*v.radius*.65,.42,v.z-Math.sin(v.heading)*v.radius*.65,1.25,'#b9c2bf');
      if(v.impact>0) puff(v.x,.8,v.z,2,'#f4bd82');
    }
    if(cooler?.active&&cooler.mode==='van'&&cooler.temp>3&&vehicles[0]&&waterClock<=0) {
      const v=vehicles[0], wake=Math.sin(sequence*.34);
      puff(v.x-Math.sin(v.heading)*(3+wake*4),5.9+wake*.8,
        v.z-Math.cos(v.heading)*(3+wake*4),2.2+wake,'#b9e8f2',.57);
    }
    if(waterClock<=0)waterClock=.046;
    let count=0;
    for(let i=spray.length-1;i>=0;i--) {
      const p=spray[i]; p.life-=dt; p.dy-=dt*24; p.x+=p.dx*dt; p.y+=p.dy*dt; p.z+=p.dz*dt;
      if(p.life<=0||p.y<.44){spray.splice(i,1);continue;}
      const j=count++*2, fade=Math.min(1,p.life*3)*p.shine;
      xyz.setXYZ(j,p.x,p.y,p.z);
      xyz.setXYZ(j+1,p.x-p.dx*.019,p.y-p.dy*.025,p.z-p.dz*.019);
      rgb.setXYZ(j,tint.r*fade,tint.g*fade,tint.b*fade);
      rgb.setXYZ(j+1,tint.r*fade*.15,tint.g*fade*.15,tint.b*fade*.15);
    }
    sprayGeo.setDrawRange(0,count*2); xyz.needsUpdate=rgb.needsUpdate=true;
    renderer.toneMappingExposure=1.11+(weather.flash||0)*.7;
  }};
}
