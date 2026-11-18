// HUD panels read game state; text and meters update only when values change.
const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const time = n => String(n).padStart(2,'0');
export function makeHUD() {
  const $=id=>document.getElementById(id);
  const text=(el,value)=>{ const s=String(value); if (el.textContent!==s) el.textContent=s; };
  const put=(id,value)=>text($(id),value);
  const stars=Array.from({length:5},() => { const el=document.createElement('span'); el.textContent='★'; $('stars').append(el); return el; });
  const evidence=['PLATE','FACE','OUTFIT'].map(name=> {
    const el=document.createElement('span'); el.textContent=name; $('evidence').append(el); return [name.toLowerCase(),el];
  });
  function meter(parent,name,tone) {
    const el=document.createElement('div'); el.className='meter'; el.style.setProperty('--tone',tone);
    const label=document.createElement('span'), track=document.createElement('i'), fill=document.createElement('em'), val=document.createElement('b');
    label.textContent=name; track.append(fill); el.append(label,track,val); $(parent).append(el);
    return value=>{ const n=Math.round(value); fill.style.setProperty('--value',n+'%'); text(val,n); };
  }
  const vitals=[meter('vitals','HEALTH','#85e7ca'),meter('vitals','ARMOUR','#84baff'),meter('vitals','NERVE','#f5b084')];
  const respect=['FIXER','MECHANIC','FENCE'].map((name,i)=>[name,meter('respect',name,['#eea875','#86d7d8','#f59cb9'][i])]);
  const units=Array.from({length:5},()=>{const el=document.createElement('li'); $('units').append(el); return el;});
  return {
    visible(on) { $('hud').hidden=!on; },
    update({ player:p, city, surge:s, weather, wanted:w, mission:m, police=[], interaction, cooler, radio, dialogue, seconds }) {
      const district=city.districtAt(p.x,p.z), depth=Math.floor(s.depthAt(p.x,p.z));
      put('district',district); put('map-district',district);
      put('job',m.active?.name ?? 'NO ACTIVE JOB'); put('stage',m.stage);
      put('objective',m.next || 'Open the job board from the pause menu.');
      put('cash',money.format(p.cash)); put('banked',money.format(p.banked));
      const minute=(weather.hour*60+Math.floor(seconds/4))%1440;
      put('clock',time(Math.floor(minute/60))+':'+time(minute%60));
      const left=Math.ceil(s.remaining);
      put('surge',time(Math.floor(left/60))+':'+time(left%60)); put('bridge',s.causewayOpen ? 'CAUSEWAY CLOSES' : 'CAUSEWAY CLOSED');
      $('surge').parentNode.parentNode.classList.toggle('danger',left<120);
      $('stars').setAttribute('aria-label','Wanted level '+w.level+' of 5');
      stars.forEach((el,i)=>el.classList.toggle('lit',i<w.level));
      for (const [name,el] of evidence) { const status=w.evidence[name]||'cleared';el.className=status;el.setAttribute('aria-label',name.toUpperCase()+' '+status);text(el,name.toUpperCase()+'\n'+status.toUpperCase()); }
      $('dispatch').hidden=!w.dispatch; put('dispatch',w.dispatch || '');
      $('response').hidden=!police.length;
      units.forEach((el,i)=>{ const u=police[i]; el.hidden=!u; if(u) text(el,u.callsign+' / '+Math.round(u.distance)+' M / '+u.status); });
      $('water').hidden=!depth;
      put('depth',depth+' CM'); $('water').style.setProperty('--depth',Math.min(100,depth*1.65)+'%');
      $('vehicle').hidden=!p.vehicle;
      if (p.vehicle) {
        put('car-name',p.vehicle.name); put('speed',Math.round(Math.abs(p.vehicle.speed)*1.65));
        put('condition',Math.round(p.vehicle.condition)+'% CONDITION'); $('radio').hidden=!radio; put('radio',radio || '');
      }
      $('cooler').hidden=!cooler?.active;
      if (cooler?.active) { put('temperature',cooler.mode==='carried'?'CARRIED · '+cooler.temp.toFixed(1)+'°C':cooler.temp.toFixed(1)+'°C'); put('integrity',Math.round(cooler.integrity)+'%'); put('payout',money.format(cooler.payout)); }
      vitals.forEach((set,i)=>set([p.health,p.armour,p.nerve][i]));
      respect.forEach(([name,set])=>set(p.respect[name]??0));
      $('prompt').hidden=!interaction; text($('prompt').lastElementChild,interaction?.text ?? '');
      $('dialogue').hidden=!dialogue;
      if (dialogue) { put('speaker',dialogue.speaker); put('line',dialogue.line); }
    },
  };
}
