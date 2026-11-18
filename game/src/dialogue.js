export function makeDialogue() {
  const queue=[]; let current=null, until=0;
  return {
    get current(){return current;},
    say(speaker,line,now=0){queue.push({speaker,line}); if(!current) this.advance(now);},
    advance(now=0){current=queue.shift()||null; until=now+(current?6:0); return current;},
    tick(now){if(current&&now>until&&!queue.length) current=null;},
    close(){current=null;queue.length=0;},
  };
}
