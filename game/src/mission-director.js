// Job records and the board stay independent of the scene and gameplay clock.
export const JOBS = [
  { id:'cooler', name:'The Cooler Caper', contact:'Tavi Moss', faction:'FIXER', pay:900,
    summary:'Recover COLDFIN from Sunspur Impound and get the cooler to Tin Cup Pier.', next:'Find the COLDFIN freezer van at Sunspur Impound.' },
  { id:'sandbags', name:'Sandbag Run', contact:'Niko Vale', faction:'MECHANIC', pay:750,
    summary:'Haul repair kits and sandbags from Tideworks to the market barricade before it gives.' },
  { id:'mercy', name:'Market Mercy', contact:'Paz Sol', faction:'FENCE', pay:1200,
    summary:'Pick up three crates at Marigold Market and bring them to the Citrus safehouse.' },
  { id:'evidence', name:'Clear Your Name', contact:'Tavi Moss', faction:'FIXER', pay:1600,
    summary:'Swap COLDFIN’s plates, change your outfit and repaint the van at the workshop.' },
  { id:'districts', name:'Five Districts', contact:'Niko Vale', faction:'MECHANIC', pay:2200,
    summary:'Pass the five district checkpoints against the clock as the rain gets heavier.' },
  { id:'surge', name:'The Surge Run', contact:'Paz Sol', faction:'FENCE', pay:4500,
    summary:'Load the cooler and cross the Sunspur Causeway before the surge cuts it off.' },
];
export function makeMissionState() {
  return { active:null, stage:'', next:'', unlocked:1, destination:null, route:[], completed:[] };
}
const points={ impound:{x:980,z:1770},pier:{x:1520,z:2270},tide:{x:2110,z:1222},market:{x:750,z:1685},safe:{x:330,z:345},workshop:{x:2100,z:1228},clothes:{x:835,z:1688},causeway:{x:2745,z:775},cross:{x:2745,z:1250} };
const nearest=(value,list)=>list.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best,list[0]);
const route=(a,b)=>{const x=nearest(a.x,[240,680,1120,1560,2000,2440]),z=nearest(b.z,[280,720,1160,1600,2040]);return[{...a},{x,z:a.z},{x,z},{x:b.x,z},{...b}];};
const loadCooler=(cargo,pay)=>Object.assign(cargo,{active:true,mode:'van',temp:3,integrity:100,payout:pay,basePay:pay,elapsed:0});
export function startJob(state,job,dialogue,phone,now){state.active={...job};state.index=0;state.started=now;state.completed=state.completed||[];state.checkpoints=0;state.message='';dialogue.say(job.contact,job.id==='cooler'?'COLDFIN is still in the impound. Keep the cooler upright.':job.summary,now);phone.send(job.contact,'Job confirmed: '+job.name+'.');setStage(state,job.id==='cooler'?'COLLECT THE COLDFIN VAN':job.id==='sandbags'?'COLLECT THE REPAIR KITS':job.id==='mercy'?'COLLECT THE MARKET CRATES':job.id==='evidence'?'SWAP COLDFIN PLATES AT THE WORKSHOP':job.id==='districts'?'HIT FIVE DISTRICT CHECKPOINTS': 'LOAD THE COOLER AT THE IMPOUND',points[job.id==='sandbags'?'tide':job.id==='mercy'?'market':job.id==='evidence'?'workshop':job.id==='districts'?'safe':'impound']);}
function setStage(s,text,dest){s.stage=text;s.next=text;s.destination=dest||null;s.route=dest?route({x:s.playerX||1178,z:s.playerZ||2012},dest):[];}
export function tickMission(s,ctx,interact=false){const {player,city,economy,cooler,wanted,phone,dialogue,surge,now}=ctx,j=s.active;if(!j)return;
 s.playerX=player.x;s.playerZ=player.z;
 const near=p=>Math.hypot(player.x-p.x,player.z-p.z)<24;
 const advance=(text,dest)=>{setStage(s,text,dest);s.destination=dest;s.route=dest?route({x:player.x,z:player.z},dest):[];};
 const finish=()=>{const pay=cooler.active&&['cooler','surge'].includes(j.id)?cooler.payout:j.pay;economy.earn(pay,j.faction);economy.unlock(Math.max(economy.data.unlocked,Number(j.id==='cooler'?2:j.id==='sandbags'?3:j.id==='mercy'?4:j.id==='evidence'?5:j.id==='districts'?6:7)));s.unlocked=economy.data.unlocked;s.completed.push(j.id);phone.send(j.contact,`Paid $${pay.toLocaleString()} — good work.`);dialogue.say(j.contact,`Done. $${pay.toLocaleString()} is yours.`,now);if(cooler.active)cooler.mode='delivered';s.active=null;s.stage='JOB COMPLETE';s.next='Open the job board for your next run.';s.destination=null;s.route=[];};
 const fail=msg=>{dialogue.say('Tavi Moss',msg,now);s.active=null;s.stage='JOB FAILED';s.next=msg;s.destination=null;s.route=[];};
 if(j.id==='cooler'){
  if(s.index===0&&player.vehicle?.id==='coldfin'){loadCooler(cooler,j.pay);dialogue.say('Tavi Moss','Cooler’s live. Keep the van steady to the pier.',now);advance('DELIVER THE COOLER TO TIN CUP PIER',points.pier);s.index=1;}
  else if(s.index===0)advance('TAKE COLDFIN FROM SUNSPUR IMPOUND',points.impound);
  else if(s.index===1&&near(points.pier)&&interact)finish();
 } else if(j.id==='sandbags'){
  if(s.index===0&&near(points.tide)&&interact){s.index=1;advance('DELIVER THE SANDBAGS TO MARIGOLD MARKET',points.market);dialogue.say('Niko Vale','Kits loaded. Get them to the barricade.',now);}
  else if(s.index===0)advance('COLLECT THE REPAIR KITS AT TIDEWORKS',points.tide);
  else if(s.index===1&&near(points.market)&&interact)finish();
 } else if(j.id==='mercy'){
  if(s.index===0&&near(points.market)&&interact){s.index=1;advance('DELIVER THREE CRATES TO THE CITRUS SAFEHOUSE',points.safe);}
  else if(s.index===0)advance('COLLECT THREE CRATES AT MARIGOLD MARKET',points.market);
  else if(s.index===1&&near(points.safe)&&interact)finish();
 } else if(j.id==='evidence'){
  if(s.index===0){advance('SWAP PLATES AT THE WORKSHOP',points.workshop);if(near(points.workshop)&&interact){wanted.clear('plate',now);s.index=1;advance('CHANGE OUTFIT AT MARIGOLD CLOTHES STALL',points.clothes);}}
  else if(s.index===1&&near(points.clothes)&&interact){wanted.clear('outfit',now);s.index=2;advance('REPAINT COLDFIN AT THE WORKSHOP',points.workshop);}
  else if(s.index===2&&near(points.workshop)&&interact){wanted.clear('paint',now);ctx.vehicle?.repaint?.('#46777a');finish();}
 } else if(j.id==='districts'){
  const checkpoints=[{x:680,z:720},{x:1120,z:1160},{x:1560,z:1600},{x:2000,z:720},{x:2440,z:1600}];const p=checkpoints[s.checkpoints];
  if(now-s.started>150)fail('The five-district run timed out.');else if(p&&near(p)){s.checkpoints++;if(s.checkpoints>=5)finish();else advance(`CHECKPOINT ${s.checkpoints}/5 — KEEP MOVING`,checkpoints[s.checkpoints]);}else advance(`CHECKPOINT ${s.checkpoints+1}/5 — BEAT THE CLOCK`,p);
 } else if(j.id==='surge'){
  if(!surge.causewayOpen){fail('CAUSEWAY GATE CLOSED — the surge cut off the crossing.');return;}
  if(s.index===0&&player.vehicle?.id==='coldfin'){loadCooler(cooler,j.pay);dialogue.say('Paz Sol','Loaded. Get across before that gate shuts.',now);s.index=1;advance('CROSS THE CAUSEWAY BEFORE THE SURGE',points.cross);}
  else if(s.index===0)advance('LOAD THE COOLER VAN AT SUNSPUR IMPOUND',points.impound);
  else if(s.index===1&&player.x>2700&&player.z<1100)finish();
 }
 s.stage=s.stage||'';s.next=s.next||'';
}
export function renderBoard(list, state, accept) {
  list.replaceChildren();
  JOBS.forEach((job,i) => {
    const node = document.createElement('li'), detail = document.createElement('div'), action = document.createElement('button');
    const key = document.createElement('small'), title = document.createElement('strong'), summary = document.createElement('p');
    key.textContent = '0'+(i+1)+' / '+job.contact+' · '+job.faction+' / $'+job.pay.toLocaleString('en-US');
    title.textContent = job.name; summary.textContent = job.summary;
    detail.append(key,title,summary);
    action.disabled=i>=state.unlocked; action.textContent = action.disabled ? 'LOCKED' : 'TAKE THE JOB';
    action.addEventListener('click',() => accept(job));
    node.append(detail,action); list.append(node);
  });
}
