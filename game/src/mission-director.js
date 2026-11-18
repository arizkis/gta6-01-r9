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
  return { active:null, stage:'', next:'', unlocked:1, destination:null, route:[] };
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
