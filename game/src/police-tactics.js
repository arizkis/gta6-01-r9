import { T, box, cone, part } from './geometry.js';
import { createVehicle } from './vehicles.js';
import { STREETS_X, STREETS_Z } from './config.js';
import { lineOfSight } from './wanted.js';

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
      const group=new T.Group();
      part(group,5,2,11,0,0,0,'#374554',box);
      const rotor=part(group,24,.28,.7,0,2,0,'#bbc2bd',box);
      const beam=new T.Mesh(cone,new T.MeshBasicMaterial({color:'#ffe2a1',transparent:true,opacity:.16,depthWrite:false}));
      beam.position.y=-20; beam.rotation.x=Math.PI; beam.scale.set(13,40,13); group.add(beam);
      const light=new T.SpotLight('#ffd99d',3,200,Math.PI/5,.5,1); light.position.set(0,-1,0); group.add(light);
      scene.add(group);
      air={group,rotor,callsign:'AIR-1',status:'SPOTLIGHT',distance:0,active:true,x:player.x,z:player.z};
      units.push(air); wanted.setDispatch('AIR-1 SPOTLIGHT ON YOU',now);
    }

    stripTime=Math.max(0,stripTime-dt); if(!stripTime) strip.visible=false;
    for(const unit of units) {
      if(!unit.active) continue;
      if(unit===air) {
        unit.x=player.x+35; unit.z=player.z-28; unit.distance=Math.hypot(unit.x-player.x,unit.z-player.z);
        unit.group.position.set(unit.x,74,unit.z); unit.group.lookAt(player.x,0,player.z); unit.rotor.rotation.y+=dt*17;
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
    for(const unit of units) { unit.active=false; if(unit.vehicle) unit.vehicle.mesh.visible=false; else unit.group.visible=false; }
    air=null; strip.visible=false; stripTime=0;
  }
  return {units,update,dropSpikes,clear,disableNearest(player) {
    const unit=units.filter(u=>u.vehicle&&u.active).sort((a,b)=>a.distance-b.distance)[0];
    if(unit) { unit.disabled=8; return true; } return false;
  }};
}
