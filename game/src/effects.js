import { T } from './geometry.js';

export function makeEffects(scene) {
  const particles=[];
  const plane=new T.PlaneGeometry(1,1);
  for(let i=0;i<64;i++) {
    const mat=new T.MeshBasicMaterial({color:'#c8d0cc',transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(plane,mat); mesh.rotation.x=-Math.PI/2; mesh.visible=false; scene.add(mesh);
    particles.push({mesh,life:0});
  }
  const rings=[];
  for(let i=0;i<18;i++) {
    const mat=new T.MeshBasicMaterial({color:'#ace6e5',transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(new T.RingGeometry(.55,.8,12),mat); mesh.rotation.x=-Math.PI/2; mesh.visible=false; scene.add(mesh);
    rings.push({mesh,life:0});
  }
  let cursor=0,ringCursor=0,ringClock=0;
  const puff=(x,y,z,size,color,life=.65)=>{
    const p=particles[cursor++%particles.length]; p.life=life; p.mesh.visible=true;
    p.mesh.material.color.set(color); p.mesh.material.opacity=.55; p.mesh.position.set(x,y,z); p.mesh.scale.set(size,size,1);
  };
  return { tick(dt,{vehicles=[],surge,cooler,weather,renderer}) {
    ringClock-=dt;
    for(const r of rings) if(r.life>0) {
      r.life-=dt; r.mesh.material.opacity=Math.max(0,r.life/.65)*.45;
      r.mesh.scale.setScalar(1+(1-r.life/.65)*2.5); if(r.life<=0) r.mesh.visible=false;
    }
    for(const p of particles) if(p.life>0) {
      p.life-=dt; p.mesh.material.opacity=Math.max(0,p.life/7); p.mesh.scale.multiplyScalar(1+dt*.5);
      if(p.life<=0) p.mesh.visible=false;
    }
    for(const v of vehicles) {
      if(!v||v.speed===undefined) continue;
      const depth=surge.depthAt(v.x,v.z),speed=Math.abs(v.speed);
      if(depth>2&&speed>5) {
        for(const side of [-1,1]) puff(v.x+Math.cos(v.heading)*side*v.radius,.55,v.z-Math.sin(v.heading)*side*v.radius,Math.min(5,depth*speed*.008),'#a7d8d4');
        if(weather.rain>.2&&ringClock<=0) {
          const r=rings[ringCursor++%rings.length]; r.life=.65; r.mesh.visible=true; r.mesh.position.set(v.x,.33,v.z); ringClock=.16;
        }
      }
      if(v.steering&&speed>25) {
        puff(v.x-Math.sin(v.heading)*4,.45,v.z-Math.cos(v.heading)*4,1.8,'#b9c2bf');
        if(speed>50) puff(v.x,.31,v.z,2,'#27313c',7);
      }
      if(v.throttle&&speed<9) puff(v.x+Math.cos(v.heading)*v.radius*.65,.42,v.z-Math.sin(v.heading)*v.radius*.65,1.25,'#b9c2bf');
      if(v.impact>0) puff(v.x,.8,v.z,2,'#f4bd82');
    }
    if(cooler?.active&&cooler.mode==='van'&&cooler.temp>3&&vehicles[0])
      puff(vehicles[0].x,.75,vehicles[0].z-5,Math.min(3,cooler.temp*.13),'#e5fcff');
    renderer.toneMappingExposure=1.11+(weather.flash||0)*.7;
  }};
}
