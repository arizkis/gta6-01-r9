import { T, box, drum, part } from './geometry.js';
import { createVehicle } from './vehicles.js';
import { STREETS_X, STREETS_Z } from './config.js';
import { lineOfSight } from './wanted.js';

export function trackingLight(scene, color, intensity, reach) {
  const material = new T.ShaderMaterial({
    transparent:true, depthWrite:false, side:T.DoubleSide, blending:T.AdditiveBlending,
    uniforms:{ tint:{value:new T.Color(color)}, strength:{value:.30} },
    vertexShader:`
      varying vec2 surface;
      varying vec3 normalView, eye;
      void main() {
        surface=uv;
        vec4 positionView=modelViewMatrix*vec4(position,1.);
        eye=-positionView.xyz;
        normalView=normalMatrix*normal;
        gl_Position=projectionMatrix*positionView;
      }`,
    fragmentShader:`
      uniform vec3 tint;
      uniform float strength;
      varying vec2 surface;
      varying vec3 normalView, eye;
      void main() {
        float soft=smoothstep(.01,.48,abs(dot(normalize(eye),normalize(normalView))));
        float falloff=smoothstep(0.,.12,surface.y)*(.56+.44*surface.y);
        float rain=.86+.14*sin(surface.y*156.+sin(surface.x*74.)*3.);
        gl_FragColor=vec4(tint,strength*soft*falloff*rain);
        #include <colorspace_fragment>
      }`,
  });
  const volume = new T.Mesh(new T.CylinderGeometry(.008,1,1,32,1,true), material);
  volume.frustumCulled=false;
  const light = new T.SpotLight(color,intensity,reach,.29,.7,2);
  const axis = new T.Vector3(0,1,0), direction = new T.Vector3();
  scene.add(volume,light,light.target);
  return {
    aim(origin,target,radius,strength=.30) {
      direction.subVectors(origin,target);
      const length=direction.length();
      volume.position.copy(origin).lerp(target,.5);
      volume.quaternion.setFromUnitVectors(axis,direction.normalize());
      volume.scale.set(radius,length,radius);
      material.uniforms.strength.value=strength;
      light.position.copy(origin); light.target.position.copy(target);
    },
    hide() { volume.visible=false; light.visible=false; },
  };
}

function airframe(group) {
  // Cross sections from the tail to the nose, with a separate cockpit and belly.
  const profile=[[-12.8,.68,0,0],[-11.8,.65,.36,.49],[-5.2,.46,.76,.66],
    [-3.1,.1,2.55,1.63],[2.6,.1,3.16,2.03],[5.45,-.18,2.43,1.36],
    [6.42,-.62,1.17,.63],[6.63,-.66,0,0]];
  const geometry=new T.BufferGeometry(), vertices=[];
  const panels=[[],[],[],[]];
  for(const [z,y,width,height] of profile)for(let i=0;i<8;i++){
    const angle=(i+.5)*Math.PI/4;
    vertices.push(Math.cos(angle)*width,y+Math.sin(angle)*height,z);
  }
  for(let ring=0;ring<profile.length-1;ring++)for(let side=0;side<8;side++){
    const a=ring*8+side,b=ring*8+(side+1)%8;
    const belly=side>=4&&side<=6, windshield=(ring===4||ring===5)&&!belly;
    const trim=side===3||side===7;
    const surface=belly?2:windshield?3:trim?1:0;
    panels[surface].push(a,b,a+8,b,b+8,a+8);
  }
  const indices=[];
  panels.forEach((panel,surface)=>{
    geometry.addGroup(indices.length,panel.length,surface);
    indices.push(...panel);
  });
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const materials=['#9fbecb','#498fa4','#344d68','#37647b'].map(color=>
    new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.36,roughness:.63,flatShading:true}));
  group.add(new T.Mesh(geometry,materials));
}

function makeAirUnit(scene) {
  const group=new T.Group(), rotor=new T.Group(), tailRotor=new T.Group();
  airframe(group);
  part(group,.48,3.65,2.8,0,1.43,-11.4,'#5e7a91').rotation.x=.31;
  part(group,5.5,.24,1.42,0,.72,-9.1,'#87a7b5');
  tailRotor.position.set(.41,1.77,-11.5);
  part(tailRotor,.14,4.1,.26,0,0,0,'#b2cad3');
  part(tailRotor,.14,.26,4.1,0,0,0,'#89a9b6');
  group.add(tailRotor);
  for(const side of [-1,1]) {
    part(group,.3,.3,8.8,side*3.27,-2.75,1,'#adcad3');
    part(group,.3,.3,1.85,side*3.27,-2.37,5.99,'#adcad3').rotation.x=-.54;
    for(const z of [-2.3,3]) part(group,.28,1.8,.31,side*2.95,-1.97,z,'#8aa3b3').rotation.z=side*.28;
    part(group,.16,.16,4.45,side*2.76,-.38,.3,'#b3e3ea',box,true).rotation.y=side*.07;
    part(group,.34,.28,.48,side*3.01,-.2,2,side<0?'#fb5067':'#79f8cc',box,true);
  }
  part(group,1.65,.7,1.65,0,-1.9,2,'#385269',drum);
  part(group,1.45,.2,1.45,0,-2.25,2,'#fff0ca',drum,true);
  part(group,.46,1.17,.46,0,2.13,.26,'#7898ab',drum);
  rotor.position.set(0,2.72,.26);
  for(let i=0;i<4;i++){
    const blade=new T.Group(); blade.rotation.y=i*Math.PI/2;
    part(blade,.68,.14,12.9,0,0,6.9,'#627b8b');
    part(blade,.69,.15,1.34,0,0,12.84,'#c6dbe1');
    rotor.add(blade);
  }
  group.add(rotor); scene.add(group);
  const spotlight=trackingLight(scene,'#ffe6b0',1150,155);
  return {group,rotor,spotlight,aim(x,y,z,strength) {
    group.updateWorldMatrix(true,false);
    tailRotor.rotation.x=rotor.rotation.y*2.8;
    const origin=group.localToWorld(new T.Vector3(0,-2.35,2));
    spotlight.aim(origin,new T.Vector3(x,y,z),origin.y*.27,strength);
  }};
}

export function makePolice(scene, city, actors, collisionSet=actors) {
  const units=[];
  let serial=0, air=null, blockClock=0, stripTime=0;
  const strip=new T.Group();
  for(let i=0;i<7;i++) part(strip,.38,.16,2.7,-8+i*2.6,.22,0,'#bac0a8',box);
  strip.visible=false; scene.add(strip);

  function spawn(player, model='patrol') {
    const spots=STREETS_X.map((x,i)=>({x,z:STREETS_Z[(i+serial)%STREETS_Z.length]}))
      .filter(p=>Math.hypot(p.x-player.x,p.z-player.z)>180);
    const at=spots[serial++%spots.length]||{x:680,z:720};
    const vehicle=createVehicle(scene,model,at.x,at.z,0,{id:'police-'+serial,parked:false});
    actors.push(vehicle); collisionSet.push(vehicle);
    const unit={vehicle,callsign:`UNIT ${serial}-BRAVO`,x:at.x,z:at.z,active:true,
      status:'PATROL',distance:0,last:{x:player.x,z:player.z},disabled:0,roadblock:0,lastRam:-99};
    units.push(unit); return unit;
  }

  const home={x:1178,z:2012};
  for(let i=0;i<2;i++) {
    const unit=spawn(home,'patrol');
    unit.callsign=i?'UNIT 5-BRAVO':'UNIT 2-ALPHA';
    unit.vehicle.x=[680,2000][i]; unit.vehicle.z=[720,1600][i];
    unit.x=unit.vehicle.x; unit.z=unit.vehicle.z;
  }

  function update(dt,player,wanted,now) {
    while(units.filter(u=>u.vehicle&&u.active).length<Math.min(4,wanted.level+2)&&wanted.level>0)
      spawn(player,units.filter(u=>u.vehicle&&u.active).length%2?'interceptor':'patrol');
    if(wanted.level>=4&&!air) {
      air={...makeAirUnit(scene),callsign:'AIR-1',status:'SPOTLIGHT',distance:0,active:true,x:player.x,z:player.z};
      units.push(air); wanted.setDispatch('AIR-1 SPOTLIGHT ON YOU',now);
    }

    stripTime=Math.max(0,stripTime-dt); if(!stripTime) strip.visible=false;
    for(const unit of units) {
      if(!unit.active) continue;
      if(unit===air) {
        unit.x=player.x+35; unit.z=player.z-28; unit.distance=Math.hypot(unit.x-player.x,unit.z-player.z);
        unit.group.position.set(unit.x,74,unit.z); unit.group.lookAt(player.x,71,player.z);
        unit.aim(player.x,1,player.z); unit.rotor.rotation.y+=dt*17;
        continue;
      }
      const car=unit.vehicle; unit.x=car.x; unit.z=car.z; unit.distance=Math.hypot(car.x-player.x,car.z-player.z);
      if(unit.roadblock>0) { unit.roadblock=Math.max(0,unit.roadblock-dt); unit.status='ROADBLOCK'; continue; }
      if(unit.disabled>0) { unit.disabled=Math.max(0,unit.disabled-dt); unit.status='SEARCHING'; continue; }
      if(stripTime&&Math.hypot(car.x-strip.position.x,car.z-strip.position.z)<10) { unit.disabled=8; unit.status='SEARCHING'; continue; }
      if(!wanted.level) {
        unit.status='PATROL'; car.speed=Math.min(18,car.speed+dt*4);
        car.heading+=Math.sin(now*.12+serial)*dt*.04;
        car.x+=Math.sin(car.heading)*car.speed*dt; car.z+=Math.cos(car.heading)*car.speed*dt; continue;
      }
      if(lineOfSight(car,player,city)) {
        unit.last={x:player.x,z:player.z};
        const next=unit.distance<22?'RAMMING':'PURSUIT';
        if(next==='RAMMING'&&unit.status!=='RAMMING') wanted.setDispatch(unit.callsign+' — RAM',now);
        unit.status=next;
        const angle=Math.atan2(player.x-car.x,player.z-car.z);
        const delta=Math.atan2(Math.sin(angle-car.heading),Math.cos(angle-car.heading));
        car.heading+=delta*Math.min(1,dt*2.8); car.speed=Math.min(68,car.speed+dt*19);
        car.x+=Math.sin(car.heading)*car.speed*dt; car.z+=Math.cos(car.heading)*car.speed*dt;
        if(unit.distance<12&&player.vehicle&&now-unit.lastRam>2) {
          player.vehicle.condition=Math.max(0,player.vehicle.condition-5*(1-(player.vehicle.armour||0)*.25));
          player.vehicle.speed*=.75; unit.lastRam=now;
        }
      } else {
        unit.status='SEARCHING';
        const dx=unit.last.x-car.x,dz=unit.last.z-car.z,dist=Math.hypot(dx,dz);
        car.speed=Math.min(18,dist);
        if(dist>1) { car.heading=Math.atan2(dx,dz); car.x+=Math.sin(car.heading)*car.speed*dt; car.z+=Math.cos(car.heading)*car.speed*dt; }
      }
    }

    blockClock+=dt;
    const strand=Math.hypot(player.x-1520,player.z-2187)<175;
    const ramp=Math.abs(player.x-2745)<200&&player.z>1850&&player.z<2160;
    if(wanted.level>=2&&blockClock>9) {
      if(strand||ramp) {
        for(const [i,unit] of units.filter(u=>u.active&&u.vehicle).slice(0,2).entries()) {
          unit.status='ROADBLOCK'; unit.roadblock=5; unit.vehicle.heading=Math.PI/2;
          unit.vehicle.x=player.x+(i?12:-12); unit.vehicle.z=player.z+38; unit.vehicle.speed=0;
        }
        wanted.setDispatch('ROADBLOCK FORMING — SUNSPUR STRAND',now);
      }
      blockClock=0;
    }
    units.sort((a,b)=>a.distance-b.distance);
    return units.filter(u=>u.active).slice(0,5).map(u=>({...u,callsign:u.callsign,distance:u.distance,status:u.status}));
  }

  function dropSpikes(car) {
    strip.position.set(car.x-Math.sin(car.heading)*9,.3,car.z-Math.cos(car.heading)*9);
    strip.rotation.y=car.heading; strip.visible=true; stripTime=8;
  }
  function clear() {
    for(const unit of units) {
      unit.active=false;
      if(unit.vehicle) unit.vehicle.mesh.visible=false;
      else { unit.group.visible=false; unit.spotlight.hide(); }
    }
    air=null; strip.visible=false; stripTime=0;
  }
  return {units,update,dropSpikes,clear,disableNearest(player) {
    const unit=units.filter(u=>u.vehicle&&u.active).sort((a,b)=>a.distance-b.distance)[0];
    if(unit) { unit.disabled=8; return true; } return false;
  }};
}
