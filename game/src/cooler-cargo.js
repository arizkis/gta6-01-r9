export function makeCooler() {
  return { active:false,temp:3,integrity:100,payout:0,mode:'stored',elapsed:0,basePay:0 };
}
export function startCooler(cargo,pay) { Object.assign(cargo,{active:true,temp:3,integrity:100,payout:pay,basePay:pay,mode:'van',elapsed:0}); }
export function tickCooler(cargo,dt,vehicle,depth,shade,insulation=0,rain=0) {
  if(!cargo.active||cargo.mode==='delivered') return;
  cargo.elapsed+=dt;
  cargo.temp+=dt*(vehicle&&Math.abs(vehicle.speed)>10?.012:.006)*(1-insulation*.2);
  cargo.temp-=dt*((rain>.2?.004*rain:0)+(depth>2?.002:0)+(shade?.004:0));
  cargo.payout=Math.round(cargo.basePay*cargo.integrity/100);
  if(vehicle) cargo.mode='van';
  else if(cargo.mode==='van') cargo.mode='carried';
}
export function damageCooler(cargo,impact) { if(cargo.active) cargo.integrity=Math.max(0,cargo.integrity-impact*.35); }
