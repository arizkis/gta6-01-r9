// High Water: seeded coastal city, weather and flood clock, traffic and people,
// on-foot and vehicle handling, chase camera, minimap, HUD and six-job board.
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
import { makeMissionState, renderBoard } from './mission-director.js';

const $=id=>document.getElementById(id), params=new URLSearchParams(location.search);
const seed=params.has('seed') && Number.isSafeInteger(Number(params.get('seed'))) ? Number(params.get('seed')) : DEFAULT_SEED;
const scene = new T.Scene();
const renderer = new T.WebGLRenderer({ canvas:$('game'), antialias:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(1.25,window.devicePixelRatio)); renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.11;
const city=buildCity(scene,seed), weather=makeWeather(scene,city,seed+8), surge=makeSurge(scene,city.floodZones);
const parked=parkVehicles(scene,city,seed+11), traffic=makeTraffic(scene,seed+19), crowd=makePedestrians(scene,city,seed+3);
const actors=parked.concat(traffic.cars), player=makePlayer(scene), rig=makeCamera(), input=makeInput(), hud=makeHUD();
const mission=makeMissionState(), wanted={level:0,evidence:{},dispatch:'',cone:null,search:null};
const map=makeMinimap($('map'),city,crowd.contacts);
const state={ scene, renderer, rig, city, player, parked, traffic, crowd, actors, weather, surge, mission, wanted,
  seconds:0, mode:'title', police:[], cooler:null, radio:null, dialogue:null, interaction:null };
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
    mission.active=job; mission.stage='01 / PICKUP'; mission.next=job.next || job.summary;
    menu('play');
  });
  menu('board'); $('jobs').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
$('start').addEventListener('click',()=>menu('play'));
$('resume').addEventListener('click',()=>menu('play'));
$('restart').addEventListener('click',()=>location.reload());
$('title-board').addEventListener('click',showBoard);
$('pause-board').addEventListener('click',showBoard);
$('back').addEventListener('click',()=>menu(returnTo));

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
    if (input.take('use')) {
      const result=useInteraction(player,interactable(player,actors,crowd.contacts),city,actors);
      if (result?.kind==='notice') notice={ ...result, until:state.seconds+1.8 };
    }
    tickPlayer(player,input,city,actors,dt);
    traffic.tick(dt,player,weather.headlights);
    crowd.tick(dt,weather,player);
    state.interaction=notice?.until>state.seconds ? notice : interactable(player,actors,crowd.contacts);
    hud.update(state);
    if(state.seconds-mapAt>.08) { map(player,mission,wanted); mapAt=state.seconds; }
  }
  for (const car of parked) car.draw(!!weather.headlights && (car===player.vehicle || !car.parked));
  for (const car of traffic.cars) if (car.parked || state.mode!=='play') car.draw(weather.headlights && (car===player.vehicle || !car.parked));
  rig.follow(player,city,dt);
  weather.tick(state.mode==='play' || state.mode==='title' ? dt : 0,rig.camera.position,player);
  renderer.render(scene,rig.camera);
}
tickPlayer(player,input,city,actors,0); crowd.tick(0,weather,player);
menu('title',false); requestAnimationFrame(frame);
