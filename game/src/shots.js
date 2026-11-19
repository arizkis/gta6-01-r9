// Deterministic, short-lived composition routes for the four review frames.
import { T, box, drum, part, label } from './geometry.js';
import { makePerson } from './pedestrians.js';
import { JOBS, startJob, tickMission } from './mission-director.js';
import { LOCATIONS } from './config.js';
import { drawPortrait } from './portraits.js';
import { trackingLight } from './police-tactics.js';
import { fitPoliceGlare, marketSet, strandSet, stormBolt, wetSurface } from './shot-set.js';

const $=id=>document.getElementById(id);
const tone=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});
const marketSpots=[
  [835,1719],[853,1723],[857,1718],[832,1715],[848,1707],[842,1708],
  [835,1700],[854,1701],[865,1717],[839,1713],[856,1711],[823,1717],
  [849,1715],[829,1704],[861,1696],[842,1728],
];
function boxMesh(scene,position,size,color,rotation=0) {
  const mesh=new T.Mesh(new T.BoxGeometry(...size),new T.MeshStandardMaterial({color,roughness:.68}));
  mesh.position.set(...position); mesh.rotation.y=rotation; scene.add(mesh); return mesh;
}
function reframeHUD(name) {
  document.body.classList.add('shot','shot-'+name);
  const alert=$('alert-panel');
  alert.append($('money'),document.querySelector('.panel.surge'),$('response'));
  $('phone-button').hidden=true;
  $('keys').hidden=true;
  $('mark').hidden=name!=='causeway';
}
function setCash(state,cash,banked) {
  Object.assign(state.economy.data,{cash,banked,unlocked:6,
    respect:{FIXER:0,MECHANIC:0,FENCE:0},upgrades:{armour:0,insulation:0,spikes:0}});
  state.player.cash=cash; state.player.banked=banked;
}
function setRun(state,id,stage,objective,now=0) {
  const job=JOBS.find(item=>item.id===id);
  startJob(state.mission,job,state.dialogueSystem,state.phone,now);
  state.mission.active={...job,name:id==='surge'?'THE SURGE RUN':job.name};
  state.mission.index=1;
  state.mission.stage=stage; state.mission.next=objective;
  state.mission.destination={...LOCATIONS.cross};
  state.mission.route=[{x:state.player.x,z:state.player.z},{x:2440,z:state.player.z},{x:2745,z:1160},{...LOCATIONS.cross}];
}
function stableWanted(state,level,plate,face,outfit) {
  const w=state.wanted;
  w.level=level;
  w.evidence.plate=plate; w.evidence.face=face; w.evidence.outfit=outfit;
  if(w.search){w.search.x=state.player.x;w.search.z=state.player.z;w.search.radius=165;}
  w.cone={x:state.player.x-34,z:state.player.z-5,heading:Math.PI/2,length:124,spread:.48};
}
function pointCamera(state,eye,target,fov=47) {
  const camera=state.rig.camera;
  camera.fov=fov; camera.updateProjectionMatrix();
  camera.position.set(...eye); camera.lookAt(...target);
}
function lightsAndDialog(state,speaker,line) {
  if(state.dialogueSystem.current?.speaker!==speaker||state.dialogueSystem.current?.line!==line){
    state.dialogueSystem.close(); state.dialogueSystem.say(speaker,line,state.seconds);
  }
  state.dialogue=state.dialogueSystem.current;
  if(state.dialogue) drawPortrait($('portrait').querySelector('canvas')||(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;$('portrait').replaceChildren(canvas);return canvas;
  })(),state.dialogue.speaker);
}

function addGarageSet(state) {
  const scene=state.scene, rainMat=tone('#badcec',.64), splashMat=tone('#bcf3ee',.56);
  const drops=new T.Group();
  for(let i=0;i<480;i++){
    const x=2081+i*17.37%57, y=.4+i*3.47%20, z=1216+i*1.17%5;
    const streak=new T.Mesh(new T.BoxGeometry(.045,1.1+(i%5)*.31,.035),rainMat);
    streak.position.set(x,y,z); streak.rotation.z=-.18; drops.add(streak);
  }
  scene.add(drops);
  const splashes=[];
  for(let i=0;i<70;i++){
    const ring=new T.Mesh(new T.RingGeometry(.55,.65,14),splashMat);
    ring.rotation.x=-Math.PI/2;ring.position.set(2081+i*23.77%57,.39,1216+i*1.89%5);scene.add(ring);
    splashes.push(ring);
  }
  const lift=new T.Group();
  for(const x of [-5.2,5.2]){
    part(lift,.54,7.4,.63,x,3.7,0,'#496d7b');
    part(lift,.18,6.7,.2,x,3.64,.35,'#81dfe0',box,true);
    part(lift,1.6,.28,2.4,x,.25,0,'#3b4b56');
    part(lift,1.4,.44,16,x*.6,1.25,0,'#61818f');
    for(const z of [-7.5,7.5])part(lift,1.39,.12,.5,x*.6,1.51,z,'#e2a872',box,true);
  }
  lift.position.set(2107,0,1238); lift.rotation.y=1.15; scene.add(lift);
  for(const [x,z,color] of [[2109,1249,'#ff73d6'],[2087,1230,'#7ffaf5'],[2129,1227,'#77dcfc']]){
    part(scene,12,.28,.65,x,12,z,color,box,true);
    const light=new T.PointLight(color,430,74);
    light.position.set(x,8,z);scene.add(light);
  }
  part(scene,56,.32,1.25,2109,13.6,1221,'#78dbed',box,true);
  for(const x of [2082,2136]){
    part(scene,.7,14,.64,x,7,1221,'#47849c');
    part(scene,.28,13,.17,x,7,1221.4,'#97efe7',box,true);
  }
  const sign=label('TIDEWORKS',{width:13,height:3.7,back:'#303352',trim:'#fb8dc5'});
  sign.position.set(2100,10,1222);scene.add(sign);
  for(const [x,z,color] of [[2088,1249,'#ad4f7a'],[2089,1259,'#527984'],[2131,1247,'#56667c']]){
    part(scene,4,3.6,3.4,x,1.8,z,color);
    for(let i=0;i<4;i++)part(scene,3.4,.09,.16,x,.65+i*.75,z+1.75,'#9bafb2');
  }
  const wet=wetSurface(scene,2109,.38,1233,57,45,[
    [2109,1248,3.7,22,'#ff53ca'],[2090,1230,3.2,23,'#49cfef'],
    [2127,1227,3.8,28,'#6585f3'],[2109,1220,18,10,'#386477']
  ]);
  const van=state.parked.find(car=>car.id==='coldfin');
  van.mesh.position.y=1.45;
  const niko=state.crowd.contacts.find(person=>person.id==='niko');
  niko.x=2116;niko.z=1244;niko.mesh.position.set(niko.x,0,niko.z);niko.mesh.rotation.y=-.96;
  part(niko.mesh,.23,1.8,.23,-1.48,2.1,.1,'#b7c5cc',drum).rotation.z=-.3;
  part(niko.mesh,.68,.3,.24,-1.68,1.3,.1,'#b7c5cc');
  niko.mesh.traverse(node=>{if(node.isSprite)node.visible=false;});
  const radio=$('radio');radio.hidden=false;radio.textContent=state.radio;
  state.garage.open||state.garage.toggle();
  state.garage.render($('garage'),van,()=>{});
  return (dt,time)=>{
    drops.children.forEach((drop,i)=>{
      drop.position.y-=dt*(14+i%7);
      if(drop.position.y<.22)drop.position.y+=20;
    });
    splashes.forEach((ring,i)=>{const scale=.21+((time*2.4+i*.37)%1)*1.25;ring.scale.set(scale,scale,1);});
    wet.time.value=time;
  };
}

function addCausewayLifters(state) {
  const scene=state.scene,people=[];
  for(const [i,x]of [2795,2808,2705].entries()){
    const actor=makePerson(i?'#83a9a2':'#d7a172',i?'#aa775d':'#bd886e');
    actor.mesh.position.set(x,5.52,819+i*8);actor.mesh.rotation.y=Math.PI/2;scene.add(actor.mesh);
    part(actor.mesh,.12,6,.12,1.3,5.2,3.2,'#715c4c',drum).rotation.x=.75;
    part(actor.mesh,.035,5,.035,1.3,5.1,5.25,'#b4a58d',drum);
    people.push(actor);
    part(scene,1.45,1.25,1.45,x-1.6,6.15,822+i*8,'#659198',drum);
    part(scene,1.35,.15,1.35,x-1.6,6.84,822+i*8,'#bed0c7',drum);
  }
  for(let i=0;i<8;i++){
    part(scene,.35,2.7,.35,2790+i*6,6.9,813,'#737f7e');
    part(scene,5.9,.25,.34,2793+i*6,7.7,813,'#aeb9ad');
  }
  // Low foam ribbons below the overlook mark the water falling away from the deck.
  const foam=tone('#b7d9d5',.38);
  const tide=[];
  for(let i=0;i<55;i++){
    const ribbon=new T.Mesh(new T.PlaneGeometry(5+(i%7)*1.5,.26+(i%4)*.18),foam);
    ribbon.rotation.x=-Math.PI/2; ribbon.rotation.z=(i%3-1)*.12;
    ribbon.position.set(2788+i*17.82%139,-2.21,701+i*11.81%99);
    scene.add(ribbon);tide.push(ribbon);
  }
  state.shotTide=(dt,time)=>tide.forEach((r,i)=>{
    r.position.z+=dt*(.36+(i%6)*.32);
    if(r.position.z>800)r.position.z-=99;
    r.scale.x=.76+.24*Math.sin(time*1.3+i);
  });
  for(let i=0;i<34;i++){
    const z=824+(i*47%45),x=2792+(i*13%32);
    boxMesh(scene,[x,5.59+(i%3)*.11,z],[1.2+(i%5)*.62,.16,.42+(i%4)*.2],i%3?'#8c7057':'#bd9c70',i*.37);
  }
  for(let i=0;i<14;i++){
    const x=i%2?2710+(i*7%12):2766+(i*5%14),z=892+Math.floor(i/2)*18;
    boxMesh(scene,[x,5.61+(i%3)*.12,z],[1.5+(i%4)*.5,.18,.55+(i%3)*.18],i%2?'#936f51':'#c4a477',i*.39);
  }
  wetSurface(scene,2797,5.58,851,68,73,[[2816,821,8,60,'#8ab5b8'],[2797,826,8,55,'#8cb0b9'],[2825,839,5,32,'#d4b492']],.42);
  return people;
}

function addMarketScooters(state) {
  for(const [i,[x,z]] of [[840,1713],[858,1716]].entries()){
    const scooter=new T.Group(),wheelMat=new T.MeshStandardMaterial({color:'#1e2931',roughness:.95});
    for(const wheelX of [-2.1,2.1]){
      const wheel=new T.Mesh(new T.CylinderGeometry(.88,.88,.64,12),wheelMat);
      wheel.rotation.x=Math.PI/2;wheel.position.set(wheelX,.9,0);scooter.add(wheel);
    }
    const fairing=new T.Mesh(new T.BoxGeometry(2.1,1.9,1.2),new T.MeshStandardMaterial({color:i?'#4e9fa3':'#dc778c',roughness:.42}));
    fairing.position.set(-.2,2.05,0);scooter.add(fairing);
    part(scooter,.22,2.1,.22,1.85,2,0,'#65747c',drum);
    part(scooter,2.8,.18,.18,2.2,3.05,0,'#b6bbb5',box);
    scooter.position.set(x,0,z);scooter.rotation.y=i?.3:-.18;state.scene.add(scooter);
  }
}

function addMarketBags(state) {
  for(const [center,z] of [[834,1711],[856,1710]]){
    for(let i=0;i<5;i++)for(let row=0;row<2;row++){
      const bag=new T.Mesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:row?'#c5b18c':'#aa9a75',roughness:.95}));
      bag.scale.set(1.35,.56,1.12);bag.position.set(center+(i-2)*2.25,.57+row*.69,z);state.scene.add(bag);
    }
  }
}

export function setupShot(name,state,{hud,map}) {
  if(!['cover','market','garage','causeway'].includes(name))return null;
  window.__shotReady=false;
  reframeHUD(name);
  $('menus').hidden=true;
  $('hud').hidden=false;
  $('mark').hidden=name!=='causeway';
  const van=state.parked.find(car=>car.id==='coldfin');
  const shot={name,time:.7,van,traffic:[],pedestrians:[]};

  if(name==='cover'){
    state.weather.setPreset('stormDusk');
    setCash(state,620,2840);
    setRun(state,'surge','THE SURGE RUN','NEXT: Cross the causeway before it closes.');
    Object.assign(state.mission,{stage:'STAGE 2 · THE CROSSING',next:'NEXT: Cross the causeway before it closes.',index:1,
      destination:{x:1410,z:2050},route:[{x:1268,z:2040},{x:1360,z:2040},{x:1377,z:2050},{x:1410,z:2050}]});
    state.player.vehicle=van;state.player.x=1268;state.player.z=2040;state.player.heading=Math.PI/2;
    state.parked.find(car=>car.id==='strand-solace').mesh.visible=false;
    van.parked=false;van.speed=84;van.steering=.75;van.throttle=1;van.heading=1.45;
    Object.assign(state.cooler,{active:true,mode:'van',temp:5.8,integrity:87,payout:3915,basePay:4500,elapsed:0});
    state.surge.set(252);
    state.wanted.level=4;state.wanted.witness(state.player,[],0,.01,state.city);
    state.police=state.policeTactics.update(0,state.player,state.wanted,0);
    for(const unit of state.policeTactics.units)if(unit.vehicle)unit.glare=fitPoliceGlare(unit.vehicle);
    state.player.health=100;state.player.armour=76;state.player.nerve=88;
    lightsAndDialog(state,'Tavi Moss','That water won’t wait. Put it down.');
    strandSet(state);
    shot.bolt=stormBolt(state.scene);
    shot.pursuitLight=trackingLight(state.scene,'#a8d9ff',16,42);
    shot.water=wetSurface(state.scene,1324,.705,2040,205,43,[
      [1291,2031,3,38,'#ef466f'],[1293,2033,3,32,'#536eff'],
      [1288,2022,4,59,'#4be1db'],[1312,2054,5,67,'#f45abe'],
      [1303,2049,4,53,'#ecab72'],[1257,2046,3,26,'#50a6fc'],
      [1264,2037,2.5,18,'#fc5869'],[1295,2041,5,37,'#d9c3a7']
    ],.82);
    const barrier=new T.Group();
    for(let i=0;i<11;i++)for(let row=0;row<2;row++){
      const sack=new T.Mesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:row?'#c8b58e':'#aa9a75',roughness:.94}));
      sack.scale.set(1.9,.85,1.45);sack.position.set(0,.78+row*1.15,-19+i*3.8);barrier.add(sack);
    }
    barrier.position.set(1309,0,2038);state.scene.add(barrier);
    shot.scatter=state.crowd.people.slice(0,12);
    shot.traffic=state.traffic.cars.slice(0,4);
    state.traffic.cars.slice(4).forEach(car=>{car.mesh.visible=false;});
  }
  if(name==='market'){
    state.weather.setPreset('wetMidday');
    setCash(state,140,0);
    setRun(state,'mercy','MARIGOLD SUPPLY RUN','Collect the Marigold Market crates.');
    state.mission.active.name='MARKET MERCY';state.mission.index=0;
    state.player.vehicle=null;state.player.x=846;state.player.z=1719;state.player.heading=2.52;
    state.player.health=91;state.player.armour=34;state.player.nerve=78;
    for(const sign of state.city.signs)if(Math.abs(sign.position.x-849)<3&&Math.abs(sign.position.z-1692)<3)sign.visible=false;
    shot.marketPeople=state.crowd.people.slice(0,marketSpots.length);
    shot.marketPeople.forEach((person,i)=>{
      [person.x,person.z]=marketSpots[i];person.mesh.visible=true;person.mesh.position.set(person.x,0,person.z);
      person.state='panic';person.panicFor=60;person.shelter=null;person.takesUmbrella=true;
      person.umbrella.visible=i%4!==0;
    });
    addMarketScooters(state);
    addMarketBags(state);
    marketSet(state);
    part(state.player.mesh,.28,2.43,.13,.25,3.28,-.57,'#f6ba7a').rotation.z=.56;
    part(state.player.mesh,1.1,.75,.32,-.65,2.68,-.61,'#3e6a72');
    shot.water=wetSurface(state.scene,847,.39,1718,64,54,[
      [840,1700,3,19,'#7799b5'],[853,1704,5,22,'#bf98ac'],[862,1720,4,15,'#5a9fa8'],
      [833,1714,3,23,'#dfb274'],[847,1707,6,34,'#a0bcc2']
    ],.27);
    state.surge.set(520);state.wanted.reset();
    state.phone.threads['Tavi Moss'].length=0;
    delete state.phone.threads['Niko Vale'];delete state.phone.threads['Paz Sol'];
    state.phone.send('Tavi Moss','Water’s at the pier steps. Move NOW.');
    state.phone.open||state.phone.toggle();state.phone.render($('phone'));$('phone').hidden=false;
    state.dialogueSystem.close();state.dialogue=null;
  }
  if(name==='garage'){
    state.weather.setPreset('neonNight');
    setCash(state,1840,5420);
    setRun(state,'cooler','TIDEWORKS TUNE-UP','Upgrade COLDFIN before the next crossing.');
    state.player.vehicle=van;state.player.x=2107;state.player.z=1238;state.player.heading=Math.PI;
    van.x=2107;van.z=1238;van.heading=Math.PI;van.parked=true;van.speed=0;
    state.cooler.active=true;state.cooler.mode='van';state.cooler.temp=4.2;state.cooler.integrity=94;state.cooler.payout=846;state.cooler.basePay=900;
    state.surge.set(460);state.wanted.level=1;state.wanted.witness(state.player,[],0,.01,state.city);
    for(const sign of state.city.signs)if(Math.abs(sign.position.x-2109)<3&&Math.abs(sign.position.z-1220)<3)sign.visible=false;
    for(const sign of state.city.signs)if(Math.abs(sign.position.x-2135)<3&&Math.abs(sign.position.z-1221.7)<3)sign.visible=false;
    const outpost=state.crowd.contacts.find(contact=>contact.id==='niko');
    outpost.mesh.traverse(node=>{if(node.isSprite)node.visible=false;});
    shot.traffic=state.traffic.cars.slice(0,2);
    shot.traffic.forEach((car,i)=>{car.x=2005+i*70;car.z=1160;car.heading=i?Math.PI/2:-Math.PI/2;car.parked=false;car.speed=32;car.draw(false);});
    lightsAndDialog(state,'Niko Vale','Lift’s yours. I’ve got the cooling upgrade ready.');
    state.radio='WAVE 88.1 · NEON DRIVE';
    shot.animateGarage=addGarageSet(state);
    $('mission').hidden=true;
    $('dispatch').hidden=false;$('dispatch').textContent='SEARCH AREA FADING';
    $('garage').append($('dispatch'));$('garage').hidden=false;
    $('top-right').hidden=true;
  }
  if(name==='causeway'){
    state.weather.setPreset('dawn');
    setCash(state,0,6000);
    setRun(state,'surge','THE CROSSING','Cross the causeway.');
    state.player.vehicle=van;state.player.x=2745;state.player.z=842;state.player.heading=0;
    van.x=2745;van.z=842;van.heading=0;van.speed=0;van.parked=true;
    Object.assign(state.cooler,{active:true,mode:'van',temp:4.1,integrity:100,payout:4500,basePay:4500});
    state.surge.set(719);state.wanted.reset();
    state.mission.index=1;
    tickMission(state.mission,{player:state.player,city:state.city,economy:state.economy,cooler:state.cooler,
      wanted:state.wanted,phone:state.phone,dialogue:state.dialogueSystem,surge:state.surge,now:state.seconds,vehicle:van});
    state.economy.bank();state.player.cash=state.economy.data.cash;state.player.banked=state.economy.data.banked;
    state.mission.stage='MISSION COMPLETE';state.mission.resultName='SURGE RUN COMPLETE';
    const {pay,respect}=state.mission.reward;
    state.mission.next=`PAYOUT +$${pay.toLocaleString('en-US')}\nRESPECT +${respect}\nBANKED $${state.economy.data.banked.toLocaleString('en-US')}`;
    state.mission.route=[{x:2745,z:842},{x:2745,z:910},{x:2745,z:1020}];
    state.mission.destination={x:2745,z:1020};
    state.mission.active=null;state.cooler.mode='delivered';state.wanted.reset();
    state.dialogueSystem.close();state.dialogue=null;state.police=[];
    $('alert-panel').querySelector('.row').hidden=true;
    $('alert-panel').querySelector('.evidence').hidden=true;
    document.querySelector('.panel.surge').hidden=true;
    $('mark').querySelector('.label').textContent='DISTRICT / FIRST LIGHT';
    $('mark').querySelector('strong').textContent='SUNSPUR CAUSEWAY';
    $('mark').querySelector('#district').hidden=true;
    shot.traffic=state.traffic.cars.slice(0,3);
    shot.pedestrians=addCausewayLifters(state);
  }

  shot.frame=(dt)=>{
    shot.time+=dt;
    if(name==='cover'){
      const t=shot.time,x=1268+Math.sin(t*1.7)*1.8,z=2040+Math.sin(t*2.4)*.8;
      van.x=x;van.z=z;van.heading=1.60+Math.sin(t*2.2)*.065;van.speed=83.6;van.condition=96;
      van.body.rotation.z=-.095;van.body.rotation.x=.035;
      van.steering=.72+Math.sin(t*2.4)*.2;van.throttle=1;state.player.x=x;state.player.z=z;state.player.heading=van.heading;
      const units=state.policeTactics.units.filter(unit=>unit.active);
      const poses=[[-8,8,1.81,'RAMMING'],[25,-7,.13,'ROADBLOCK'],[34,8,-1.18,'PURSUIT'],[71,-9,-1.41,'SEARCHING']];
      units.filter(unit=>unit.vehicle).slice(0,4).forEach((unit,i)=>{
        const [dx,dz,heading,status]=poses[i];unit.vehicle.x=x+dx;unit.vehicle.z=z+dz;unit.vehicle.heading=heading;
        unit.vehicle.speed=i===1?0:38;unit.vehicle.steering=i===1?0:.24;unit.x=unit.vehicle.x;unit.z=unit.vehicle.z;
        unit.distance=Math.hypot(dx,dz);unit.status=status;
        unit.glare(t,i);
      });
      const air=units.find(unit=>!unit.vehicle);
      if(air){
        air.x=x+21; air.z=z+6; air.distance=22;
        air.group.position.set(air.x,19,air.z); air.group.lookAt(x,16,z+12);
        air.group.rotateZ(-.18); air.rotor.rotation.y+=dt*16;
        // End the air unit's real light on the flood beneath COLDFIN.
        air.aim(x+1,.72,z+Math.sin(t*2)*1.2);
      }
      shot.pursuitLight.aim(new T.Vector3(x-8,4.85,z+9),new T.Vector3(x,2,z+1),3.5);
      shot.water.time.value=t;
      shot.bolt.opacity=.37+.35*Math.pow(Math.max(0,Math.sin(t*4)),2);
      state.weather.residualFlash=shot.bolt.opacity*.28;
      shot.traffic.forEach((car,i)=>{
        car.x=x+[18,43,61,9][i]+Math.sin(t*.9+i)*2;
        car.z=z+[-18,18,-13,19][i]; car.heading=[1.08,-1.12,1.7,1.48][i];
        car.speed=i===1?9:22; car.draw(true);
      });
      state.police=units.map(unit=>({...unit,callsign:unit.callsign,distance:unit.distance,status:unit.status}));
      state.surge.set(252);stableWanted(state,4,'known','cleared','known');
      state.wanted.witness(state.player,[],state.seconds,.01,state.city);
      state.wanted.evidence.plate='known';state.wanted.evidence.face='cleared';state.wanted.evidence.outfit='known';
      state.wanted.setDispatch('SEARCHING — SEARCH AREA: SUNSPUR STRAND',state.seconds);
      state.cooler.temp=5.8;state.cooler.integrity=87;state.cooler.payout=3915;
      state.player.cash=state.economy.data.cash;state.player.banked=state.economy.data.banked;
      pointCamera(state,[x-20,6.2,z-9.8],[x+7,6.1,z+2.9],57);
      shot.scatter.forEach((person,i)=>{
        const side=i%2?1:-1,forward=7+Math.floor(i/2)*9,run=i%3!==0;
        person.x=x+forward+(run?Math.sin(t*2+i)*1.1:0);
        person.z=z+side*(run?15+Math.floor(i/2)%3:19);
        person.state=run?'panic':'shelter'; person.mesh.visible=true; person.umbrella.visible=run;
        person.mesh.position.set(person.x,.47,person.z); person.mesh.rotation.y=1.6+side*.95;
        person.legs[0].rotation.x=run?Math.sin(t*15+i)*.56:0;
        person.legs[1].rotation.x=-person.legs[0].rotation.x;
      });
      state.radio='WAVE 88.1 · NEON DRIVE';
      van.draw(true);
      units.filter(unit=>unit.vehicle).forEach(unit=>unit.vehicle.draw(true));
      lightsAndDialog(state,'Tavi Moss','That water won’t wait. Put it down.');
    }
    if(name==='market'){
      state.surge.set(520);
      const player=state.player;
      player.x=846+Math.sin(shot.time*.7)*.28;player.z=1719;player.heading=2.52;
      shot.marketPeople.forEach((person,i)=>{
        const moving=i%3!==0, stride=Math.sin(shot.time*4+i);
        person.x=marketSpots[i][0]+(moving?Math.sin(shot.time*.8+i)*.85:0);
        person.z=marketSpots[i][1]+(moving?Math.cos(shot.time*.8+i)*.38:0);
        person.mesh.visible=true;
        person.mesh.position.set(person.x,0,person.z);person.mesh.rotation.y=.4+i*.52;
        person.umbrella.visible=i%4!==0&&i!==1&&i!==12&&i!==15;
        person.legs[0].rotation.x=moving?stride*.24:0;person.legs[1].rotation.x=-person.legs[0].rotation.x;
      });
      shot.water.time.value=shot.time;
      pointCamera(state,[player.x+3,7.2,player.z+14],[player.x-1.4,4.4,player.z-11],57);
      state.player.mesh.position.set(player.x,0,player.z);state.player.mesh.rotation.y=player.heading;state.player.mesh.visible=true;
      state.player.cash=state.economy.data.cash;state.player.banked=state.economy.data.banked;
    }
    if(name==='garage'){
      state.surge.set(460);van.x=2107;van.z=1238;van.heading=1.15;van.speed=0;van.parked=true;
      state.player.x=van.x;state.player.z=van.z;state.player.heading=van.heading;
      van.mesh.position.y=1.45;
      shot.traffic.forEach((car,i)=>{car.x=2084+((shot.time*8+i*23)%67);car.z=1195-i*9;car.heading=Math.PI/2;car.speed=24;car.draw(true);});
      pointCamera(state,[2089,6.7,1256],[2109,6.3,1233],59);
      shot.animateGarage(dt,shot.time);
      state.radio='WAVE 88.1 · NEON DRIVE';
      state.wanted.setDispatch('SEARCH AREA FADING',state.seconds);
      van.draw(false);van.mesh.position.y=1.45;
      lightsAndDialog(state,'Niko Vale','Lift’s yours. I’ve got the cooling upgrade ready.');
    }
    if(name==='causeway'){
      state.surge.set(719);state.player.x=2745;state.player.z=842;state.player.heading=0;
      van.x=2792;van.z=844;van.heading=.32;van.speed=0;van.parked=true;
      shot.traffic.forEach((car,i)=>{
        car.x=[2755,2737,2755][i];car.z=[847,816,777][i]+Math.sin(shot.time*.4+i)*5;
        car.heading=i===1?0:Math.PI;car.speed=22;car.draw(false);
      });
      shot.pedestrians.forEach((person,i)=>{person.mesh.rotation.y=Math.PI/2+Math.sin(shot.time*.3+i)*.04;});
      state.shotTide(dt,shot.time);
      van.draw(false);
      pointCamera(state,[2810,13.2,869],[2784,10,828],58);
      state.player.cash=state.economy.data.cash;state.player.banked=state.economy.data.banked;
    }
    if(name==='garage'){
      const niko=state.crowd.contacts.find(contact=>contact.id==='niko');
      niko.mesh.position.set(niko.x,0,niko.z);
    }
    hud.update(state);
    map(state.player,state.mission,state.wanted);
  };
  state.shot=shot;
  return shot;
}
