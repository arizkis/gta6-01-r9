export const UPGRADES=[
 {id:'armour',name:'ARMOUR PLATING',cost:500,description:'Reduce collision damage by 25%.'},
 {id:'insulation',name:'COOLER INSULATION',cost:450,description:'Slow cooler temperature drift.'},
 {id:'spikes',name:'SPIKE STRIP',cost:650,description:'X drops a strip behind your vehicle.'},
];
export function makeGarage(economy){let open=false;return{
 get open(){return open;},toggle(){open=!open;},close(){open=false;},
 repair(vehicle){if(!vehicle)return false;const cost=Math.ceil(100-vehicle.condition)*5;if(!cost)return false;if(!economy.pay(cost))return false;vehicle.condition=100;return true;},
 buy(id){const item=UPGRADES.find(u=>u.id===id);if(!item||economy.data.upgrades[id]||!economy.pay(item.cost))return false;economy.data.upgrades[id]=1;economy.save();return true;},
 render(el,vehicle,action){el.replaceChildren();const h=document.createElement('h3');h.textContent='NIKO’S WORKSHOP / GARAGE';el.append(h);const stats=[['SPEED',Math.min(100,(vehicle?.condition||0))],['GRIP',65+(economy.data.upgrades.armour?15:0)],['COOLING',55+(economy.data.upgrades.insulation?35:0)]];for(const [label,value]of stats){const row=document.createElement('div');row.className='garage-stat';const p=document.createElement('span'),bar=document.createElement('i');p.textContent=label+' '+Math.round(value)+'%';bar.style.setProperty('--value',Math.round(value)+'%');row.append(p,bar);el.append(row);}const repair=document.createElement('button');repair.textContent='REPAIR · $5 / CONDITION';repair.onclick=()=>action('repair');el.append(repair);const plates=document.createElement('button');plates.textContent='SWAP PLATES';plates.onclick=()=>action('plate');el.append(plates);const paint=document.createElement('button');paint.textContent='REPAINT VEHICLE';paint.onclick=()=>action('paint');el.append(paint);for(const u of UPGRADES){const b=document.createElement('button');b.textContent=economy.data.upgrades[u.id]?u.name+' · INSTALLED':u.name+' · $'+u.cost;b.disabled=!!economy.data.upgrades[u.id];b.onclick=()=>action(u.id);el.append(b);}const close=document.createElement('button');close.textContent='CLOSE · E';close.onclick=()=>action('close');el.append(close);},
 };}
