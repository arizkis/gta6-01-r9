// City coordinates use x east, z south and y for elevation.
export const CITY = { width: 2860, length: 2360, shoreX: 2610, shoreZ: 2215, road: 112 };
export const STREETS_X = [240, 680, 1120, 1560, 2000, 2440];
export const STREETS_Z = [280, 720, 1160, 1600, 2040];
export const DISTRICTS = ['CITRUS COMMONS', 'OLD SALT QUARTER', 'MARIGOLD MARKET', 'SUNSPUR STRAND', 'TIDEWORKS', 'SUNSPUR CAUSEWAY'];
export const LOCATIONS = {
  spawn: { x: 1178, z: 2012 }, van: { x: 980, z: 1770 },
  pier: { x: 1520, z: 2270 }, workshop: { x: 2100, z: 1228 },
  market: { x: 730, z: 1674 }, safehouse: { x: 330, z: 345 },
  food: { x: 752, z: 1688 }, clothes: { x: 835, z: 1688 },
  pierBank: { x: 1540, z: 2250 }, workshopBank: { x: 2135, z: 1220 },
  causeway: { x: 2745, z: 775 }, overlook: { x: 2780, z: 845 },
};
export const CONTACTS = [
  { id: 'tavi', name: 'Tavi Moss', faction: 'FIXER', color: '#ffa662', x: 1535, z: 2240 },
  { id: 'niko', name: 'Niko Vale', faction: 'MECHANIC', color: '#58ded1', x: 2100, z: 1222 },
  { id: 'paz', name: 'Paz Sol', faction: 'FENCE', color: '#f5a8ce', x: 737, z: 1689 },
];
export const SPEED = { walk: 7.5, sprint: 12, drive: 104, reverse: 23 };
export const DEFAULT_SEED = 17;
export const SAVE_KEY = 'high-water-sunspur-v1';
export const PALETTE = ['#e6b390', '#ebd4a3', '#d88777', '#8eae9f', '#bcb1c5', '#a6bfbe', '#db9964'];
