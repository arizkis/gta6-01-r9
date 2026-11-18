const faces={
  'Tavi Moss':['#c88e71','#302734','#db9b61'], 'Niko Vale':['#9b725e','#161f2e','#58ded1'],
  'Paz Sol':['#d9a07e','#332638','#f5a8ce'], 'Juno':['#edaa82','#51483c','#84e7dd'],
};
export function drawPortrait(canvas,speaker) {
  const ctx=canvas.getContext('2d'),[skin,hair,trim]=faces[speaker]||faces.Juno;
  ctx.clearRect(0,0,64,64);ctx.fillStyle='#172538';ctx.fillRect(0,0,64,64);
  ctx.fillStyle=trim;ctx.fillRect(5,7,54,54);ctx.fillStyle=skin;ctx.fillRect(15,17,34,36);
  ctx.fillStyle=hair;ctx.fillRect(13,11,38,14);ctx.fillRect(13,20,7,17);ctx.fillRect(44,19,7,17);
  if(speaker==='Tavi Moss'){ctx.fillRect(11,10,14,4);ctx.fillRect(42,10,12,4);}else if(speaker==='Niko Vale'){ctx.fillRect(12,11,40,6);ctx.fillStyle=trim;ctx.fillRect(45,28,7,9);}else if(speaker==='Paz Sol'){ctx.fillRect(11,12,9,34);ctx.fillRect(44,12,9,34);}else{ctx.fillRect(15,9,34,5);ctx.fillStyle=trim;ctx.fillRect(45,42,5,8);}
  ctx.fillStyle='#273040';ctx.fillRect(22,31,4,3);ctx.fillRect(38,31,4,3);
  ctx.fillStyle='#f3d8bc';ctx.fillRect(27,45,11,2);
}
