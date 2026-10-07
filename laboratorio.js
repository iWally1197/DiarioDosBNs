(() => {
  const canvas = document.querySelector('#motion-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const velocity = document.querySelector('#velocity-control');
  const acceleration = document.querySelector('#acceleration-control');
  const velocityOut = document.querySelector('#velocity-output');
  const accelerationOut = document.querySelector('#acceleration-output');
  const timeOut = document.querySelector('#time-readout');
  const positionOut = document.querySelector('#position-readout');
  const playButton = document.querySelector('#motion-play');
  let time = 0; let running = false; let lastFrame = 0; let raf = 0;
  const position = (t) => 1 + Number(velocity.value) * t + .5 * Number(acceleration.value) * t * t;
  const format = (value) => Number(value).toLocaleString('pt-BR', {minimumFractionDigits:1, maximumFractionDigits:1});
  const updateLabels = () => {
    velocityOut.value = `${format(velocity.value)} m/s`; velocityOut.textContent = velocityOut.value;
    accelerationOut.value = `${format(acceleration.value)} m/s²`; accelerationOut.textContent = accelerationOut.value;
    timeOut.textContent = `t = ${format(time)} s`; positionOut.textContent = `x = ${format(position(time))} m`;
  };
  const draw = () => {
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(300, rect.width); const height = Math.max(190, rect.height);
    if (canvas.width !== Math.round(width*dpr) || canvas.height !== Math.round(height*dpr)) { canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); }
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
    const styles = getComputedStyle(document.documentElement); const muted = styles.getPropertyValue('--muted').trim() || '#aeb8cc'; const gold = styles.getPropertyValue('--gold').trim() || '#d0ad69'; const line = styles.getPropertyValue('--line').trim() || '#34415a';
    const y = height*.63, left=38, right=width-30;
    ctx.strokeStyle=line; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    ctx.fillStyle=muted;ctx.font='12px system-ui';ctx.fillText('posição x',left,22);ctx.fillText('tempo →',right-58,y+28);
    for(let i=0;i<=6;i++){const x=left+(right-left)*i/6;ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();ctx.fillText(String(i*2),x-4,y+21);}
    const path=[];for(let t=0;t<=12;t+=.1) path.push([left+(right-left)*t/12,y-Math.max(-7,Math.min(20,position(t)))*(height*.022)]);
    ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();path.forEach(([x,py],i)=>i?ctx.lineTo(x,py):ctx.moveTo(x,py));ctx.stroke();
    const px=left+(right-left)*Math.min(time,12)/12, py=y-Math.max(-7,Math.min(20,position(time)))*(height*.022);
    ctx.fillStyle=gold;ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=gold;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,y);ctx.stroke();ctx.setLineDash([]);
    updateLabels();
  };
  const tick = (now) => { if(!running) return; if(lastFrame) time += Math.min(.05,(now-lastFrame)/1000); lastFrame=now; if(time>=12){time=12;running=false;playButton.textContent='Iniciar';lastFrame=0;} draw(); if(running) raf=requestAnimationFrame(tick); };
  playButton.addEventListener('click',()=>{running=!running;playButton.textContent=running?'Pausar':'Continuar';if(running){lastFrame=0;raf=requestAnimationFrame(tick);}});
  document.querySelector('#motion-reset').addEventListener('click',()=>{running=false;cancelAnimationFrame(raf);time=0;lastFrame=0;playButton.textContent='Iniciar';draw();});
  velocity.addEventListener('input',draw);acceleration.addEventListener('input',draw);window.addEventListener('resize',draw);draw();
  const cube=document.querySelector('#demo-cube');const views={front:['0deg','0deg','0deg'],side:['0deg','-90deg','0deg'],top:['90deg','0deg','0deg'],orbit:['-25deg','-35deg','0deg']};
  document.querySelectorAll('[data-view]').forEach((button)=>button.addEventListener('click',()=>{const [x,y,z]=views[button.dataset.view];cube.style.transform=`rotateX(${x}) rotateY(${y}) rotateZ(${z})`;document.querySelectorAll('[data-view]').forEach((other)=>other.setAttribute('aria-pressed',String(other===button)));document.querySelector('#view-status').textContent=`Vista ${button.textContent.toLowerCase()} selecionada.`;}));
})();
