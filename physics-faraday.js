import { faradayState, normalizeFaradayParameters } from "./physics-faraday-model.js";

const shell=document.querySelector("#faraday-lab");
const scene=document.querySelector("#faraday-scene");
const chart=document.querySelector("#faraday-chart");
if(shell&&scene&&chart){
  const ctx=scene.getContext("2d");
  const chartCtx=chart.getContext("2d");
  const controls=[...shell.querySelectorAll("[data-param]")];
  const defaults={turns:20,magneticField:.3,area:.25,frequency:.5,phaseDegrees:0,speed:.25};
  const parameters={...defaults};
  let time=0,playing=false,raf=0,lastFrame=0,mode="2d";
  let yaw=-.42,pitch=-.16,drag=null;
  const format=(value,digits=2)=>Number(value).toLocaleString("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const numberText=(value,digits=3)=>`${format(value,digits)}`;
  function setControlOutputs(){
    const labels={turns:String(parameters.turns),magneticField:`${format(parameters.magneticField)} T`,area:`${format(parameters.area,2)} m²`,frequency:`${format(parameters.frequency,2)} Hz`,phaseDegrees:`${Math.round(parameters.phaseDegrees)}°`,speed:`${format(parameters.speed,2)}×`};
    for(const [key,value] of Object.entries(labels)){const output=shell.querySelector(`[data-out="${key}"]`);if(output)output.value=value;}
  }
  function sizeCanvas(canvas,context){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    if(rect.width<=0||rect.height<=0)return null;
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    context.setTransform(dpr,0,0,dpr,0,0);
    return {width:rect.width,height:rect.height};
  }
  const css=(name,fallback)=>getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;
  function arrow(context,x1,y1,x2,y2,color,width=2){
    const angle=Math.atan2(y2-y1,x2-x1),head=8;
    context.strokeStyle=color;context.fillStyle=color;context.lineWidth=width;
    context.beginPath();context.moveTo(x1,y1);context.lineTo(x2,y2);context.stroke();
    context.beginPath();context.moveTo(x2,y2);context.lineTo(x2-head*Math.cos(angle-.45),y2-head*Math.sin(angle-.45));context.lineTo(x2-head*Math.cos(angle+.45),y2-head*Math.sin(angle+.45));context.closePath();context.fill();
  }
  function project(point,width,height){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const x=cy*point[0]+sy*point[2],z=-sy*point[0]+cy*point[2];
    const y=cp*point[1]-sp*z,z2=sp*point[1]+cp*z;
    const scale=Math.min(width,height)*.34/(3.8+z2);
    return [width*.5+x*scale,height*.54-y*scale];
  }
  function drawScene(){
    const size=sizeCanvas(scene,ctx);if(!size)return;
    const {width:w,height:h}=size;
    ctx.clearRect(0,0,w,h);
    const grid=css("--line","rgba(140,160,190,.25)"),text=css("--text","#e8edf5"),muted=css("--muted","#9eb0c8"),gold=css("--gold","#d6b87a"),blue=css("--blue","#73b9ff");
    const state=faradayState(parameters,time),theta=state.angle;
    ctx.fillStyle=css("--bg-soft","#101a2c");ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=grid;ctx.lineWidth=1;
    for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    if(mode==="2d") draw2d(w,h,theta,{grid,text,muted,gold,blue});
    else draw3d(w,h,theta,{grid,text,muted,gold,blue});
    const readouts={
      "#faraday-time":`${format(time)} s`,
      "#faraday-angle":`${format(((state.angleDegrees%360)+360)%360,0)}°`,
      "#faraday-flux":`${numberText(state.fluxPerTurn)} Wb`,
      "#faraday-linkage":`${numberText(state.fluxLinkage)} Wb·espira`,
      "#faraday-emf":`${numberText(state.emf)} V`
    };
    for(const [selector,value] of Object.entries(readouts)){const node=shell.querySelector(selector);if(node)node.textContent=value;}
    drawChart();
  }
  function draw2d(w,h,theta,colors){
    const {text,muted,gold,blue}=colors,cx=w*.52,cy=h*.53,r=Math.min(w,h)*.25;
    ctx.fillStyle=text;ctx.font="600 14px system-ui";ctx.fillText("Campo magnético uniforme B →",24,30);
    for(let y=cy-r;y<=cy+r;y+=Math.max(24,r/4)){arrow(ctx,26,y,w-35,y,blue,1.5);}
    ctx.fillStyle="#28456a";ctx.fillRect(5,cy-r*.7,36,r*1.4);ctx.fillRect(w-41,cy-r*.7,36,r*1.4);
    ctx.fillStyle="#fff";ctx.font="700 16px system-ui";ctx.fillText("N",15,cy+6);ctx.fillText("S",w-31,cy+6);
    const projectedWidth=Math.max(3,Math.abs(Math.cos(theta))*r*1.45);
    ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=gold;ctx.lineWidth=5;
    ctx.beginPath();ctx.ellipse(0,0,projectedWidth,r*.74,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    const nx=cx+Math.cos(theta)*r*.9,ny=cy-Math.sin(theta)*r*.9;
    arrow(ctx,cx,cy,nx,ny,gold,3);
    ctx.fillStyle=text;ctx.font="600 13px system-ui";ctx.fillText("normal n̂",nx+8,ny-7);
    ctx.fillStyle=muted;ctx.font="12px system-ui";ctx.fillText(`θ = ${format(theta*180/Math.PI,0)}° · área projetada A cos θ`,24,h-20);
    ctx.fillText("Vista lateral esquemática",24,52);
  }
  function draw3d(w,h,theta,colors){
    const {text,muted,gold,blue}=colors;
    // Ordenação dos quatro cantos da espira retangular no plano definido por θ.
    const loop=[[-.72,-.58],[-.72,.58],[.72,.58],[.72,-.58]].map(([a,b])=>[-Math.sin(theta)*a,b,Math.cos(theta)*a]);
    const projected=loop.map((p)=>project(p,w,h));
    ctx.fillStyle="rgba(214,184,122,.08)";ctx.strokeStyle=gold;ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(...projected[0]);for(const p of projected.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fill();ctx.stroke();
    for(const y of [-.9,-.45,0,.45,.9])for(const z of [-.8,0,.8]){
      const from=project([-1.45,y,z],w,h),to=project([1.45,y,z],w,h);
      arrow(ctx,from[0],from[1],to[0],to[1],blue,1.2);
    }
    const n=project([Math.cos(theta)*.95,0,Math.sin(theta)*.95],w,h),origin=project([0,0,0],w,h);
    arrow(ctx,origin[0],origin[1],n[0],n[1],gold,3);
    const north=project([-1.75,0,0],w,h),south=project([1.75,0,0],w,h);
    ctx.fillStyle="#28456a";ctx.fillRect(north[0]-22,north[1]-27,44,54);ctx.fillRect(south[0]-22,south[1]-27,44,54);
    ctx.fillStyle="#fff";ctx.font="700 14px system-ui";ctx.fillText("N",north[0]-5,north[1]+5);ctx.fillText("S",south[0]-5,south[1]+5);
    ctx.fillStyle=text;ctx.font="600 14px system-ui";ctx.fillText("Espira em rotação uniforme",20,28);
    ctx.fillStyle=muted;ctx.font="12px system-ui";ctx.fillText("Arraste para mudar a perspectiva · B aponta de N para S",20,h-20);
    ctx.fillStyle=gold;ctx.fillText("n̂",n[0]+8,n[1]-8);
  }
  function drawChart(){
    const size=sizeCanvas(chart,chartCtx);if(!size)return;
    const {width:w,height:h}=size;
    chartCtx.clearRect(0,0,w,h);chartCtx.fillStyle=css("--bg-soft","#101a2c");chartCtx.fillRect(0,0,w,h);
    const grid=css("--line","rgba(140,160,190,.25)"),text=css("--text","#e8edf5"),muted=css("--muted","#9eb0c8"),gold=css("--gold","#d6b87a"),blue=css("--blue","#73b9ff");
    const left=54,right=w-14,mid=h/2,top=20,bottom=h-18,span=4,start=time-span;
    chartCtx.strokeStyle=grid;chartCtx.lineWidth=1;
    for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;chartCtx.beginPath();chartCtx.moveTo(x,top);chartCtx.lineTo(x,bottom);chartCtx.stroke();}
    chartCtx.beginPath();chartCtx.moveTo(left,mid);chartCtx.lineTo(right,mid);chartCtx.stroke();
    const scale=normalizeFaradayParameters(parameters);
    const maxFlux=Math.max(1e-6,scale.turns*scale.magneticField*scale.area);
    const maxEmf=Math.max(1e-6,maxFlux*2*Math.PI*scale.frequency);
    const drawWave=(fn,y0,amp,color)=>{
      chartCtx.strokeStyle=color;chartCtx.lineWidth=2;chartCtx.beginPath();
      for(let i=0;i<=180;i++){const t=start+span*i/180,v=fn(faradayState(parameters,t));const y=y0-v/amp*(h*.19);const x=left+(right-left)*i/180;if(i===0)chartCtx.moveTo(x,y);else chartCtx.lineTo(x,y);}
      chartCtx.stroke();
    };
    drawWave(s=>s.fluxLinkage,mid*.52,maxFlux,gold);
    drawWave(s=>s.emf,mid*1.52,maxEmf,blue);
    chartCtx.fillStyle=gold;chartCtx.font="12px system-ui";chartCtx.fillText("λ (Wb·espira)",left,15);
    chartCtx.fillStyle=blue;chartCtx.fillText("ε (V)",left,mid+16);
    chartCtx.fillStyle=text;chartCtx.font="11px system-ui";chartCtx.fillText(`${format(start,1)} s`,left,bottom);
    chartCtx.fillText(`${format(time,1)} s`,Math.max(left,right-46),bottom);
    chartCtx.fillStyle=muted;chartCtx.fillText("Eixos verticais escalados separadamente para facilitar a leitura.",left,h-2);
  }
  function draw(){drawScene();}
  function frame(now){
    if(!playing)return;
    if(lastFrame){const dt=Math.min(.05,(now-lastFrame)/1000);time=(time+dt*parameters.speed)%(1/parameters.frequency);}
    lastFrame=now;draw();
    raf=requestAnimationFrame(frame);
  }
  function start(){if(playing)return;playing=true;lastFrame=0;shell.querySelector("[data-play]").textContent="Pausar";syncPanelPlay();raf=requestAnimationFrame(frame);}
  function pause(){playing=false;lastFrame=0;cancelAnimationFrame(raf);shell.querySelector("[data-play]").textContent="Continuar";syncPanelPlay();}
  controls.forEach((input)=>{
    input.addEventListener("input",()=>{
      const key=input.dataset.param;parameters[key]=Number(input.value);
      if(key==="turns")parameters[key]=Math.round(parameters[key]);
      normalizeFaradayParameters(parameters);setControlOutputs();draw();
    });
  });
  shell.querySelector("[data-play]").addEventListener("click",()=>playing?pause():start());
  panelPlay?.addEventListener("click",()=>shell.querySelector("[data-play]").click());
  panelToggle?.addEventListener("click",()=>{const open=panel.classList.toggle("is-open");panelToggle.setAttribute("aria-expanded",String(open));});
  shell.querySelectorAll("[data-step]").forEach((button)=>button.addEventListener("click",()=>{pause();time=Math.max(0,time+Number(button.dataset.step));draw();}));
  shell.querySelector("[data-reset]").addEventListener("click",()=>{pause();time=0;Object.assign(parameters,defaults);for(const input of controls)input.value=String(parameters[input.dataset.param]);yaw=-.42;pitch=-.16;setControlOutputs();draw();});
  shell.querySelectorAll("[data-mode]").forEach((button)=>button.addEventListener("click",()=>{
    mode=button.dataset.mode;shell.querySelectorAll("[data-mode]").forEach((other)=>other.setAttribute("aria-pressed",String(other===button)));
    shell.querySelector("#faraday-help").textContent=mode==="3d"?"Vista 3D: arraste com mouse ou toque para mudar a perspectiva. Isso não altera o modelo físico.":"Vista 2D: projeção da espira e direção do campo. Selecione Vista 3D para girar a perspectiva com o mouse ou toque.";
    draw();
  }));
  const fullscreen=shell.querySelector("[data-fullscreen]");
  const panelToggle=shell.querySelector("#faraday-panel-toggle");
  const panel=shell.querySelector("#faraday-controls");
  const panelPlay=shell.querySelector("#faraday-panel-play");
  const syncPanelPlay=()=>{if(panelPlay){panelPlay.textContent=shell.querySelector("[data-play]").textContent;panelPlay.setAttribute("aria-pressed",String(playing));}};
  fullscreen.addEventListener("click",async()=>{
    try{if(!document.fullscreenElement)await shell.requestFullscreen();else await document.exitFullscreen();}
    catch{shell.querySelector("#faraday-help").textContent="A tela cheia não está disponível neste navegador. A simulação continua funcionando nesta página.";}
  });
  document.addEventListener("fullscreenchange",()=>{const full=document.fullscreenElement===shell;fullscreen.setAttribute("aria-pressed",String(full));if(panelToggle){panelToggle.hidden=!full;if(!full)panel.classList.remove("is-open");panelToggle.setAttribute("aria-expanded",String(panel.classList.contains("is-open")));}if(panelPlay)panelPlay.hidden=!full;syncPanelPlay();});
  scene.addEventListener("pointerdown",(event)=>{if(mode!=="3d")return;drag={x:event.clientX,y:event.clientY};scene.setPointerCapture(event.pointerId);});
  scene.addEventListener("pointermove",(event)=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag={x:event.clientX,y:event.clientY};yaw+=dx*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+dy*.008));draw();});
  scene.addEventListener("pointerup",()=>{drag=null;});
  scene.addEventListener("pointercancel",()=>{drag=null;});
  scene.addEventListener("keydown",(event)=>{if(mode!=="3d")return;const step=.08;if(event.key==="ArrowLeft")yaw-=step;else if(event.key==="ArrowRight")yaw+=step;else if(event.key==="ArrowUp")pitch=Math.max(-1.1,pitch-step);else if(event.key==="ArrowDown")pitch=Math.min(1.1,pitch+step);else return;event.preventDefault();draw();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing)pause();});
  if("ResizeObserver" in window)new ResizeObserver(draw).observe(shell);else window.addEventListener("resize",draw);
  setControlOutputs();draw();
}
