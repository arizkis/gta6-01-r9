export function makePhone() {
  let open=false;const threads={ 'Tavi Moss':[], 'Niko Vale':[], 'Paz Sol':[] }, keys=new Set();
  const add=(who,text)=>{if(!threads[who].some(m=>m.text===text))threads[who].push({who,text});};
  add('Tavi Moss','Rain’s moving in. Keep the freezer van upright.');
  return {threads,get open(){return open;},toggle(){open=!open;},close(){open=false;},
    send(who,text){add(who,text);},
    surge(remaining){for(const [mark,msg] of [[540,'Water’s at the pier steps. Move NOW.'],[360,'The lower road is going under.'],[120,'Final warning: the causeway is almost shut.']])if(remaining<=mark)add('Tavi Moss',msg);},
    render(el){el.replaceChildren();const title=document.createElement('strong');title.textContent='FIELD MESSAGES · T';el.append(title);for(const [name,list]of Object.entries(threads)){const h=document.createElement('b');h.textContent=name;el.append(h);for(const m of list.slice(-4)){const p=document.createElement('p');p.textContent=m.text;el.append(p);}}},
  };
}
