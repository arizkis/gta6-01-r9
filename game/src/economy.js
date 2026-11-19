import { SAVE_KEY } from './config.js';

const fresh = () => ({ cash:140, banked:0, respect:{ FIXER:0, MECHANIC:0, FENCE:0 }, unlocked:1,
  upgrades:{ armour:0, insulation:0, spikes:0 } });
export function makeEconomy(persistent=true) {
  let saved={};
  try { if(persistent)saved=JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch {}
  const data={ ...fresh(), ...saved, respect:{ ...fresh().respect, ...saved.respect }, upgrades:{ ...fresh().upgrades, ...saved.upgrades } };
  const save=()=>{ try { if(persistent)localStorage.setItem(SAVE_KEY,JSON.stringify(data)); } catch {} };
  return {
    data, save,
    pay(amount) { if (data.cash < amount) return false; data.cash-=amount; save(); return true; },
    earn(amount,faction,respect=5) { const paid=Math.max(0,Math.round(amount)); data.cash+=paid; if(faction) data.respect[faction]=(data.respect[faction]||0)+respect; save(); return paid; },
    bank() { data.banked+=data.cash; const amount=data.cash; data.cash=0; save(); return amount; },
    fine(amount) { const taken=Math.min(data.cash,amount); data.cash-=taken; save(); return taken; },
    unlock(n) { data.unlocked=Math.max(data.unlocked,n); save(); },
    resetDay() { const banked=data.banked; Object.assign(data,fresh(),{banked}); save(); },
  };
}
