// High Water systems: seeded city, storm and surge, vehicles and traffic, pedestrians,
// player and cameras, HUD and job board, wanted evidence, police tactics, cooler cargo,
// six-job execution, dialogue portraits, phone, economy and saving, radio, garage upgrades,
// reactive weather and collision effects, minimap routing, bank drops and causeway access.
import { T } from './geometry.js';
import { DEFAULT_SEED } from './config.js';
import { buildCity } from './city.js';
import { makeWeather } from './weather.js';
import { makeSurge } from './surge.js';
import { parkVehicles } from './vehicles.js';
import { makeTraffic } from './traffic.js';
import { makePedestrians } from './pedestrians.js';
import { makePlayer, tickPlayer, interactable, useInteraction } from './player.js';
import { makeCamera } from './camera.js';
import { makeInput } from './input.js';
import { makeHUD } from './hud.js';
import { makeMinimap } from './minimap.js';
import { makeMissionState, renderBoard, startJob, tickMission } from './mission-director.js';
import { makeEconomy } from './economy.js';
import { makeWanted } from './wanted.js';
import { makePolice } from './police-tactics.js';
import { makeCooler, tickCooler, damageCooler } from './cooler-cargo.js';
import { makeDialogue } from './dialogue.js';
import { drawPortrait } from './portraits.js';
import { makePhone } from './phone.js';
import { makeRadio } from './radio.js';
import { makeGarage } from './garage-upgrades.js';
import { makeEffects } from './effects.js';
import { LOCATIONS } from './config.js';

const $=id=>document.getElementById(id), params=new URLSearchParams(location.search);
const seed=params.has('seed') && Number.isSafeInteger(Number(params.get('seed'))) ? Number(params.get('seed')) : DEFAULT_SEED;
const scene = new T.Scene();
const renderer = new T.WebGLRenderer({ canvas:$('game'), antialias:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(1.25,window.devicePixelRatio)); renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.11;
const city=buildCity(scene,seed), weather=makeWeather(scene,city,seed+8), surge=makeSurge(scene,city.floodZones);
const parked=parkVehicles(scene,city,seed+11), traffic=makeTraffic(scene,seed+19), crowd=makePedestrians(scene,city,seed+3);
const actors=parked.concat(traffic.cars), collisions=actors.concat(crowd.people), player=makePlayer(scene), rig=makeCamera(), input=makeInput(), hud=makeHUD();
const carriedCargo=new T.Mesh(new T.BoxGeometry(1.7,1.5,1.3),new T.MeshLambertMaterial({color:'#d7e4cf',flatShading:true}));carriedCargo.position.set(0,3.05,-.8);carriedCargo.visible=false;player.mesh.add(carriedCargo);
const economy=makeEconomy(), mission=makeMissionState(), wanted=makeWanted(), cooler=makeCooler();
mission.unlocked=economy.data.unlocked;
const dialogue=makeDialogue(),phone=makePhone(),radio=makeRadio(),garage=makeGarage(economy);
const map=makeMinimap($('map'),city,crowd.contacts);
const state={ scene, renderer, rig, city, player, parked, traffic, crowd, actors, weather, surge, mission, wanted,
  economy, cooler, dialogueSystem:dialogue, dialogue:null, phone, radio, garage, seconds:0, mode:'title', police:[], interaction:null };
player.cash=economy.data.cash;player.banked=economy.data.banked;player.respect=economy.data.respect;
const police=makePolice(scene,city,actors,collisions),effects=makeEffects(scene),g=$('garage'),greeted=new Set();state.policeTactics=police;
const marker=new T.Mesh(new T.TorusGeometry(5,.65,5,4),new T.MeshBasicMaterial({color:'#ff9dbd'}));marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
export { state };
let returnTo='title', notice=null, stamp=performance.now(), mapAt=-1;

const resize=()=> {
  renderer.setSize(innerWidth,innerHeight,false); rig.camera.aspect=innerWidth/Math.max(1,innerHeight);
  rig.camera.updateProjectionMatrix();
};
addEventListener('resize',resize); resize();
function menu(next, focus=true) {
  state.mode=next;
  $('menus').hidden=next==='play';
  for (const name of ['title','pause','board']) $(name).hidden=name!==next;
  hud.visible(next==='play'); input.clearActions();
  if (focus && next==='play' && document.activeElement instanceof HTMLElement) document.activeElement.blur();
  if (focus && next==='pause') $('resume').focus({preventScroll:true});
  $('status').textContent=next==='play' ? 'Run active. '+city.districtAt(player.x,player.z) :
    next==='pause' ? 'Run paused.' : next==='board' ? 'Job board open.' : '';
}
function showBoard() {
  returnTo=state.mode;
  renderBoard($('jobs'),mission,job => {
    startJob(mission,job,dialogue,phone,state.seconds);
    menu('play');
  });
  menu('board'); $('jobs').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
$('start').addEventListener('click',()=>menu('play'));
$('resume').addEventListener('click',()=>menu('play'));
$('restart').addEventListener('click',()=>{economy.resetDay();location.reload();});
$('title-board').addEventListener('click',showBoard);
$('pause-board').addEventListener('click',showBoard);
$('back').addEventListener('click',()=>menu(returnTo));
$('phone-button').addEventListener('click',()=>{phone.toggle();$('phone').hidden=!phone.open;if(phone.open)phone.render($('phone'));});
function garageAction(action){if(action==='close'){garage.close();g.hidden=true;return;}const vehicle=player.vehicle||parked.find(v=>v.id==='coldfin');if(action==='repair')garage.repair(vehicle);else if(action==='plate'||action==='paint'){wanted.clear(action==='paint'?'paint':'plate',state.seconds);if(action==='paint')vehicle?.repaint?.('#46777a');}else garage.buy(action);garage.render(g,vehicle,garageAction);}
function worldUse(){
  const p=player,near=(point,r=17)=>Math.hypot(p.x-point.x,p.z-point.z)<r;
  if(garage.open){garage.close();g.hidden=true;return;}
  if(mission.active?.id==='evidence'&&!p.vehicle){
    if(mission.index===0&&near(LOCATIONS.workshop,30)){wanted.clear('plate',state.seconds);mission.index=1;mission.stage=mission.next='CHANGE OUTFIT AT MARIGOLD CLOTHES STALL';mission.destination=LOCATIONS.clothes;mission.route=[{x:p.x,z:p.z},LOCATIONS.clothes];dialogue.say('Niko Vale','Plates swapped. Find Paz for a new look.',state.seconds);return;}
    if(mission.index===1&&near(LOCATIONS.clothes,20)){wanted.clear('outfit',state.seconds);p.outfit.visible=true;mission.index=2;mission.stage=mission.next='REPAINT COLDFIN AT THE WORKSHOP';mission.destination=LOCATIONS.workshop;mission.route=[{x:p.x,z:p.z},LOCATIONS.workshop];dialogue.say('Paz Sol','Fresh threads. Get the van its new coat.',state.seconds);return;}
    if(mission.index===2&&near(LOCATIONS.workshop,30)){wanted.clear('paint',state.seconds);parked.find(v=>v.id==='coldfin')?.repaint('#46777a');tickMission(mission,{player:p,city,economy,cooler,wanted,phone,dialogue,surge,now:state.seconds,vehicle:parked.find(v=>v.id==='coldfin')},true);return;}
  }
  const active=mission.active;
  if(active&&mission.destination&&near(mission.destination,25)){
    tickMission(mission,{player:p,city,economy,cooler,wanted,phone,dialogue,surge,now:state.seconds,vehicle:p.vehicle||parked.find(v=>v.id==='coldfin')},true);
    if(!mission.active)return;
  }
  if(!p.vehicle&&near(LOCATIONS.pierBank,13)||!p.vehicle&&near(LOCATIONS.workshopBank,13)){const amount=economy.bank();player.cash=0;player.banked=economy.data.banked;dialogue.say('Juno',amount?'Cash secured at the bank drop.':'Nothing to bank.',state.seconds);return;}
  if(!p.vehicle&&active&&['cooler','surge'].includes(active.id)&&near(LOCATIONS.van,24)){const van=parked.find(v=>v.id==='coldfin');useInteraction(p,{kind:'enter',target:van},city,actors);wanted.crime('vehicle',state.seconds);return;}
  if(!p.vehicle&&near(LOCATIONS.workshop,30)&&active?.id!=='evidence'){garage.toggle();g.hidden=!garage.open;garage.render(g,p.vehicle||parked.find(v=>v.id==='coldfin'),garageAction);return;}
  if(!p.vehicle&&near(LOCATIONS.workshop,25)&&active?.id!=='evidence'){wanted.clear('plate');wanted.clear('paint');dialogue.say('Niko Vale','Fresh plates and a clean coat. You’re off the cameras.',state.seconds);}
  else if(!p.vehicle&&near(LOCATIONS.clothes,20)){wanted.clear('outfit');p.outfit.visible=true;dialogue.say('Paz Sol','New look. Nobody’s picking you out tonight.',state.seconds);}
  else if(!p.vehicle&&near(LOCATIONS.van,20)){wanted.clear('plate');dialogue.say('Tavi Moss','Yard plate swapped. Keep it quiet.',state.seconds);}
  else {const action=interactable(p,actors,crowd.contacts),theft=action?.kind==='enter'&&!!action.target.parked;const interaction=useInteraction(p,action,city,actors);if(theft)wanted.crime('vehicle',state.seconds);if(interaction?.kind==='contact')dialogue.say(interaction.target.name,'Stay sharp out there.',state.seconds);}
  tickMission(mission,{player:p,city,economy,cooler,wanted,phone,dialogue,surge,now:state.seconds,vehicle:p.vehicle||parked.find(v=>v.id==='coldfin')},true);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt=Math.min(.064,Math.max(.001,(now-stamp)/1000)); stamp=now;
  if (input.take('pause')) {
    if (state.mode==='play') menu('pause');
    else if (state.mode==='pause') menu('play');
    else if (state.mode==='board') menu(returnTo);
  } else if (input.take('accept') && state.mode==='title') menu('play');
  if (state.mode==='play') {
    state.seconds+=dt; surge.tick(dt);
    phone.surge(surge.remaining);
    if(input.take('phone')){phone.toggle();$('phone').hidden=!phone.open;if(phone.open)phone.render($('phone'));}
    if(input.take('radio')&&player.vehicle)radio.next();
    if(input.take('spike')&&economy.data.upgrades.spikes&&player.vehicle)police.dropSpikes(player.vehicle);
    if(input.take('use')){if(dialogue.current)dialogue.advance(state.seconds);else worldUse();}
    if(input.take('accept')&&dialogue.current)dialogue.advance(state.seconds);
    tickPlayer(player,input,city,collisions,dt,surge,economy.data.upgrades);
    if(player.vehicle)player.vehicle.grip=1+(economy.data.upgrades.armour?.16:0);
    if(player.vehicle?.impact){damageCooler(cooler,player.vehicle.impact);wanted.crime('hit',state.seconds);}
    const inImpound=player.x>910&&player.x<1090&&player.z>1730&&player.z<1945;if(inImpound&&!state.wasImpound)wanted.crime('impound',state.seconds);state.wasImpound=inImpound;
    if(player.vehicle&&Math.abs(player.vehicle.speed)>72&&police.units.some(u=>u.active&&u.vehicle&&Math.hypot(u.x-player.x,u.z-player.z)<110)&&state.seconds-(state.lastSpeedCrime||-99)>4){wanted.crime('speed',state.seconds);state.lastSpeedCrime=state.seconds;}
    traffic.tick(dt,player,weather.headlights);
    const conditionBefore=player.vehicle?.condition;
    state.police=police.update(dt,player,wanted,state.seconds);
    if(player.vehicle&&conditionBefore>player.vehicle.condition)damageCooler(cooler,(conditionBefore-player.vehicle.condition)*4);
    wanted.witness(player,police.units,state.seconds,dt,city);
    const blockedNear=state.police.some(u=>u.distance<18);
    state.boxed=player.vehicle&&player.vehicle.speed===0&&blockedNear&&wanted.level>=3?(state.boxed||0)+dt:0;
    if(state.boxed>3){economy.fine(400);wanted.reset();wanted.setDispatch('BUSTED — $400 FINE — RELEASED AT SAFEHOUSE',state.seconds);state.bustedUntil=state.seconds+5;police.clear();player.vehicle.speed=0;player.x=LOCATIONS.safehouse.x;player.z=LOCATIONS.safehouse.z;player.vehicle=null;dialogue.say('Niko Vale','Fine paid. Lay low at the safehouse.',state.seconds);state.boxed=0;}
    const shade=city.blockers.some(b=>b.kind==='building'&&Math.abs(player.x-b.x)<b.w/2&&Math.abs(player.z-b.z)<b.d/2);
    tickCooler(cooler,dt,player.vehicle,surge.depthAt(player.x,player.z),shade,economy.data.upgrades.insulation,weather.rain);
    player.carrying=cooler.active&&cooler.mode==='carried';
    carriedCargo.visible=player.carrying;
    tickMission(mission,{player,city,economy,cooler,wanted,phone,dialogue,surge,now:state.seconds,vehicle:player.vehicle||parked.find(v=>v.id==='coldfin')},false);
    crowd.tick(dt,weather,player,police.units,actors);
    const contact=!mission.active&&crowd.contacts.find(c=>Math.hypot(c.x-player.x,c.z-player.z)<9&&!greeted.has(c.id));
    if(contact){greeted.add(contact.id);const done=contact.id==='tavi'?economy.data.unlocked>1:contact.id==='niko'?economy.data.unlocked>2:economy.data.unlocked>3;dialogue.say(contact.name,done?'You came through last time. I’ve got another lead when you’re ready.':contact.id==='tavi'?'I have work if you’re ready.':contact.id==='niko'?'Bring the van by the shop if it needs work.':'I always know a buyer.',state.seconds);}
    dialogue.tick(state.seconds);
    player.cash=economy.data.cash;player.banked=economy.data.banked;player.respect=economy.data.respect;
    if(dialogue.current)drawPortrait($('portrait').querySelector('canvas')||(()=>{const c=document.createElement('canvas');c.width=c.height=64;$('portrait').replaceChildren(c);return c;})(),dialogue.current.speaker);
    state.radio=player.vehicle?radio.station:null;state.wanted=wanted;state.dialogue=dialogue.current;
    if(player.vehicle){player.vehicle.armour=economy.data.upgrades.armour||0;player.vehicle.grip=1+(player.vehicle.armour?.16:0);}
    const missionPrompt=mission.active&&mission.destination&&Math.hypot(player.x-mission.destination.x,player.z-mission.destination.z)<25;
    const poiPrompt=!player.vehicle&&Math.hypot(player.x-LOCATIONS.pierBank.x,player.z-LOCATIONS.pierBank.z)<16?'Bank cash at the pier drop box':!player.vehicle&&Math.hypot(player.x-LOCATIONS.workshop.x,player.z-LOCATIONS.workshop.z)<30?'Open Niko’s garage':null;
    state.interaction=notice?.until>state.seconds?notice:missionPrompt?{kind:'mission',text:mission.stage}:poiPrompt?{kind:'poi',text:poiPrompt}:interactable(player,actors,crowd.contacts);
    hud.update(state);
    if(state.seconds-mapAt>.08) { map(player,mission,wanted); mapAt=state.seconds; }
  }
  for (const car of parked) car.draw(!!weather.headlights && (car===player.vehicle || !car.parked));
  for (const car of traffic.cars) if (car.parked || state.mode!=='play') car.draw(weather.headlights && (car===player.vehicle || !car.parked));
  for (const unit of police.units) if(unit.vehicle&&unit.active)unit.vehicle.draw(weather.headlights);
  marker.visible=state.mode==='play'&&!!mission.destination;if(marker.visible){marker.position.set(mission.destination.x,.6,mission.destination.z);marker.rotation.z=state.seconds*.65;}
  rig.follow(player,city,dt);
  weather.tick(state.mode==='play' || state.mode==='title' ? dt : 0,rig.camera.position,player);
  effects.tick(dt,{vehicles:[player.vehicle,...traffic.cars,...police.units.filter(u=>u.vehicle).map(u=>u.vehicle)],surge,cooler,weather,renderer});
  renderer.render(scene,rig.camera);
}
tickPlayer(player,input,city,actors,0); crowd.tick(0,weather,player);
menu('title',false); requestAnimationFrame(frame);
