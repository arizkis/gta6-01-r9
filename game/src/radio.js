const stations=['WAVE 88.1 · NEON DRIVE','RADIO SOL 101.9','HARBOR STATIC'];
export function makeRadio(){let index=0;return{get station(){return stations[index];},next(){index=(index+1)%stations.length;return stations[index];}};}
