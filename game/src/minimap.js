// A local street map with terrain, destination, route and search cone overlays.
import { CITY, STREETS_X, STREETS_Z } from './config.js';
export function makeMinimap(canvas, city, contacts) {
  const ctx=canvas.getContext('2d'), size=canvas.width, mid=size/2, scale=.55;
  return function draw(player, mission, wanted) {
    const px=x=>mid+(x-player.x)*scale, pz=z=>mid+(z-player.z)*scale;
    const rect=(x,z,w,h,color)=>{ ctx.fillStyle=color; ctx.fillRect(px(x),pz(z),w*scale,h*scale); };
    const line=(points,color,width) => {
      if (!points.length) return;
      ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath();
      points.forEach(({x,z},i) => i ? ctx.lineTo(px(x),pz(z)) : ctx.moveTo(px(x),pz(z))); ctx.stroke();
    };
    const disc=(x,z,r,color)=>{ ctx.beginPath(); ctx.arc(px(x),pz(z),r,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); };
    ctx.fillStyle='#225264'; ctx.fillRect(0,0,size,size);
    rect(0,0,CITY.shoreX,CITY.shoreZ,'#263d45');
    for (const b of city.blockers) if (b.kind==='building') rect(b.x-b.w/2,b.z-b.d/2,b.w,b.d,'#354e54');
    for (const x of STREETS_X) rect(x-56,0,112,CITY.shoreZ,'#517378');
    for (const z of STREETS_Z) rect(0,z-56,CITY.shoreX,112,'#517378');
    rect(2700,675,90,1405,'#558283'); rect(2550,675,240,90,'#558283');
    rect(2550,1995,240,90,'#558283'); rect(1494,2196,53,125,'#b99d83');
    for (const zone of city.floodZones) rect(zone.x1,zone.z1,zone.x2-zone.x1,zone.z2-zone.z1,'#55aebe55');
    if (wanted.search) disc(wanted.search.x,wanted.search.z,wanted.search.radius*scale,'#ee557c66');
    if (wanted.cone) {
      const {x,z,heading,length=120,spread=.40}=wanted.cone;
      ctx.beginPath(); ctx.moveTo(px(x),pz(z));
      ctx.arc(px(x),pz(z),length*scale,Math.PI/2-heading-spread,Math.PI/2-heading+spread);
      ctx.closePath(); ctx.fillStyle='#ffb88586'; ctx.fill();
    }
    line(mission.route || [],'#f78dba',5);
    for (const c of contacts) { disc(c.x,c.z,7,'#1b2d3b'); disc(c.x,c.z,4,c.color); }
    if (mission.destination) {
      ctx.save(); ctx.translate(px(mission.destination.x),pz(mission.destination.z)); ctx.rotate(Math.PI/4);
      ctx.fillStyle='#ffb9d2'; ctx.fillRect(-7,-7,14,14); ctx.restore();
    }
    ctx.save(); ctx.translate(mid,mid); ctx.rotate(-player.heading+Math.PI); ctx.beginPath();
    ctx.moveTo(0,-13); ctx.lineTo(9,9); ctx.lineTo(0,5); ctx.lineTo(-9,9); ctx.closePath();
    ctx.strokeStyle='#112031'; ctx.lineWidth=3.5; ctx.stroke(); ctx.fillStyle='#e2fff1'; ctx.fill(); ctx.restore();
    ctx.fillStyle='#f0e4cf'; ctx.font='bold 23px sans-serif'; ctx.textAlign='center'; ctx.fillText('N',mid,29);
  };
}
