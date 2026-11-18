export function makeWanted() {
  const evidence={ plate:'cleared', face:'cleared', outfit:'cleared' };
  let search=null, seen=false, dispatch='', dispatchUntil=0, held=0;const clearedUntil={plate:0,face:0,outfit:0};
  const say=(line,now)=>{ dispatch=line; dispatchUntil=now+5; };
  return {
    level:0,evidence,get search(){return search;},get dispatch(){return dispatch;},get seen(){return seen;},
    setDispatch(line,now=0){say(line,now);},
    crime(kind,now=0) {
      this.level=Math.min(5,this.level+(kind==='hit' ? 1 : 1));
      if(kind==='vehicle'||kind==='hit') evidence.plate='known';
      say(kind==='vehicle'?'STOLEN VEHICLE REPORTED':kind==='hit'?'COLLISION REPORTED':'CRIME REPORTED',now);
    },
    witness(player,police,now,dt=.016,city=null) {
      const v=player.vehicle;
      const visible=police.some(u=>u.active&&lineOfSight(u,player,city));
      seen=visible;
      if(visible&&this.level) {
        if(v&&this.level>0&&now>=clearedUntil.plate) evidence.plate='known';
        if(!v&&police.some(u=>Math.hypot(u.x-player.x,u.z-player.z)<85)&&now>=clearedUntil.face) evidence.face='known';
        if(this.level>=2&&now>=clearedUntil.outfit) evidence.outfit='known';
        search=null; held=0;
      } else if(this.level) {
        if(!search) { search={x:player.x,z:player.z,radius:130}; say('SEARCHING — SEARCH AREA: '+(city?.districtAt?.(player.x,player.z)||'LAST SEEN'),now); }
        search.x+=(player.x-search.x)*.025; search.z+=(player.z-search.z)*.025; search.radius=Math.min(340,search.radius+4);
        held+=dt;
        if(held>18) { this.level=Math.max(0,this.level-1); if(evidence.face==='known') evidence.face='cleared'; held=0; if(!this.level) search=null; }
      }
      if(now>dispatchUntil) dispatch='';
      if(this.level===0) search=null;
    },
    clear(item,now=0) { const key=item==='paint'?'plate':item;evidence[key]='cleared';clearedUntil[key]=now+12; },
    reset() { this.level=0; for(const key of Object.keys(evidence)) evidence[key]='cleared'; search=null; seen=false; dispatch=''; held=0; },
  };
}
export function lineOfSight(a,b,city) {
  if(!city) return Math.hypot(a.x-b.x,a.z-b.z)<380;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  if(len>440) return false;
  for(let d=12;d<len-12;d+=12) {
    const x=a.x+dx*d/len,z=a.z+dz*d/len;
    if(city.blockers.some(o=>o.kind==='building'&&Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2)) return false;
  }
  return true;
}
