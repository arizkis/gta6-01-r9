// Key states and single-press actions are kept separate.
const aliases = {
  KeyW:'forward', ArrowUp:'forward', KeyS:'back', ArrowDown:'back',
  KeyA:'left', ArrowLeft:'left', KeyD:'right', ArrowRight:'right',
  ShiftLeft:'sprint', ShiftRight:'sprint', KeyE:'use', KeyF:'radio',
  KeyX:'spike', KeyM:'phone', KeyT:'phone', Escape:'pause', KeyP:'pause', Enter:'accept',
};
export function makeInput() {
  const held = new Set(), pressed = new Set();
  window.addEventListener('keydown', event => {
    const action = aliases[event.code];
    if (!action || (event.code === 'Enter' && event.target instanceof HTMLButtonElement)) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(event.code);
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => { held.clear(); pressed.clear(); });
  const has = action => [...held].some(key => aliases[key]===action);
  return {
    get forward() { return has('forward'); }, get back() { return has('back'); },
    get left() { return has('left'); }, get right() { return has('right'); }, get sprint() { return has('sprint'); },
    take(action) { return pressed.delete(action); },
    clearActions() { pressed.clear(); },
  };
}
