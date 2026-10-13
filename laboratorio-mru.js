import { crossingTime, meetEvents, mruAt, mruMetrics, sampleTimes, validateExperiment } from "./laboratorio-mru-core.js?v=mru-lab-20261012-1";

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const svg = $("mru-scene");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (value, digits = 2) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const short = (value) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const uid = (prefix) => prefix + "-" + Math.random().toString(36).slice(2, 9);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[c]);
  const validColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
  const colorSet = ["#4f88df","#d17953","#54b79b","#a47ce0","#dbb649"];
  const names = { "scientific-cart":"Carrinho científico","sport-cart":"Carrinho esportivo","position-sensor":"Sensor de posição",photogate:"Fotocélula","position-marker":"Marcador de posição","time-marker":"Marcadores temporais","start-line":"Linha de partida","finish-line":"Linha de chegada","distance-sign":"Placa de distância",cone:"Cone de sinalização",tree:"Árvore de referência",post:"Poste de referência",flag:"Bandeira" };
  const newCart = (i = 0) => ({ id:uid("cart"),kind:i===1?"sport-cart":"scientific-cart",name:"Carrinho "+String.fromCharCode(65+i),x0:i?5:0,v:i?-2:4,color:colorSet[i%colorSet.length],wheelColor:"#202935",size:1,wheelRadius:.03,opacity:1,details:true,vector:true,trail:true,visible:true,locked:false });
  const newFixtures = () => [{id:uid("sensor"),kind:"position-sensor",name:"Sensor de posição",x:3,color:"#f0c66e",visible:true,locked:false},{id:uid("gate"),kind:"photogate",name:"Fotocélula 1",x:8,color:"#79a8ff",visible:true,locked:false}];
  const initialConfig = () => ({duration:12,sampleInterval:1,carts:[newCart()],fixtures:newFixtures(),playbackRate:1,viewSpan:24,cameraCenter:0,cameraFollowOffset:0,cameraOffsetY:0,follow:true,showGrid:true,vectors:{velocity:true,acceleration:false,displacement:false},reduceMotion:Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)});
  const state = Object.assign(initialConfig(),{uiMode:"advanced",time:0,running:false,loop:true,mode:"explore",teacherReveal:false,selectedId:null,selectedIds:[],events:[],logged:new Set(),lastGateTimes:{},run:1,drag:null});
  try{const savedUiMode=localStorage.getItem("diario-bns-mru-ui-mode-v1");if(savedUiMode==="beginner"||savedUiMode==="advanced")state.uiMode=savedUiMode;}catch{}
  const undoStack=[],redoStack=[];
  let raf=0,lastFrame=0,lastChart=0,dragBefore=null,dragRenderFrame=0;
  let graphZoom=1;
  const chartSpecs=[
    {id:"mru-chart-position",key:"position",unit:"m",value:(car,t)=>mruAt(car,t).x,desc:"mru-chart-position-desc"},
    {id:"mru-chart-velocity",key:"velocity",unit:"m/s",value:(car)=>car.v,desc:"mru-chart-velocity-desc"},
    {id:"mru-chart-acceleration",key:"acceleration",unit:"m/s²",value:()=>0,desc:"mru-chart-acceleration-desc"}
  ];
  const clone=(value)=>JSON.parse(JSON.stringify(value));
  const currentCart=()=>state.carts.find((item)=>item.id===state.selectedId)||state.carts[0]||null;
  const entity=(id=state.selectedId)=>state.carts.find((item)=>item.id===id)||state.fixtures.find((item)=>item.id===id)||null;
  const isCart=(item)=>Boolean(item&&state.carts.some((car)=>car.id===item.id));
  function capture(){return clone({duration:state.duration,sampleInterval:state.sampleInterval,carts:state.carts,fixtures:state.fixtures,playbackRate:state.playbackRate,loop:state.loop,viewSpan:state.viewSpan,cameraCenter:state.cameraCenter,cameraFollowOffset:state.cameraFollowOffset,cameraOffsetY:state.cameraOffsetY,vectors:state.vectors,follow:state.follow,showGrid:state.showGrid,reduceMotion:state.reduceMotion});}
  const pendingSignature=(config)=>{const {viewSpan,cameraCenter,cameraFollowOffset,cameraOffsetY,follow,...experiment}=config;return JSON.stringify(experiment);};
  let savedConfigSnapshot=capture();
  let savedConfigSignature=pendingSignature(savedConfigSnapshot);
  let pendingReturnFocus=null;
  function hasPendingConfigChanges(){return pendingSignature(capture())!==savedConfigSignature;}
  function updatePendingSave(){
    const panel=$("mru-pending-save"),stage=$("mru-stage"),pending=hasPendingConfigChanges();
    if(!panel)return;
    const host=document.fullscreenElement||document.body;if(panel.parentElement!==host)host.append(panel);
    const wasOpen=!panel.hidden;
    panel.hidden=!pending;
    document.body.classList.toggle("mru-has-pending-save",pending);
    stage?.classList.toggle("mru-has-pending-save",pending);
    if(pending&&!wasOpen){pendingReturnFocus=document.activeElement instanceof HTMLElement&&!panel.contains(document.activeElement)?document.activeElement:null;requestAnimationFrame(()=>{if(!panel.hidden)$("#mru-save-pending")?.focus({preventScroll:true});});}
    else if(!pending&&wasOpen){const target=pendingReturnFocus;pendingReturnFocus=null;if(target?.isConnected)requestAnimationFrame(()=>target.focus({preventScroll:true}));}
  }
  function markSavedConfig(){savedConfigSnapshot=capture();savedConfigSignature=pendingSignature(savedConfigSnapshot);updatePendingSave();}
  function discardPendingConfig(){
    if(!hasPendingConfigChanges())return;
    pause();
    const camera={viewSpan:state.viewSpan,cameraCenter:state.cameraCenter,cameraFollowOffset:state.cameraFollowOffset,cameraOffsetY:state.cameraOffsetY,follow:state.follow};
    applyConfig({...clone(savedConfigSnapshot),...camera});
    status("Alterações descartadas; a última configuração salva foi restaurada.");
  }
  document.addEventListener("fullscreenchange",()=>{const panel=$("mru-pending-save"),host=document.fullscreenElement||document.body;if(panel&&panel.parentElement!==host)host.append(panel);});
  document.addEventListener("keydown",event=>{
    const panel=$("mru-pending-save");if(!panel||panel.hidden)return;
    if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();return;}
    if(event.key!=="Tab")return;
    const first=$("#mru-save-pending"),last=$("#mru-discard-pending");
    if(event.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){event.preventDefault();first?.focus();}
  },true);
  window.addEventListener("beforeunload",event=>{if(!hasPendingConfigChanges())return;event.preventDefault();event.returnValue="";});
  function historyPush(snapshot=capture()){undoStack.push(clone(snapshot));if(undoStack.length>30)undoStack.shift();redoStack.length=0;syncHistoryButtons();}
  function syncHistoryButtons(){$("mru-undo").disabled=!undoStack.length;$("mru-redo").disabled=!redoStack.length;}
  function status(message,kind="info"){$("mru-status").textContent=message;$("mru-status").dataset.kind=kind;}
  function applyConfig(config,resetTime=true){
    const valid=validateExperiment(config), allowed=new Set(Object.keys(names));
    state.duration=valid.duration;state.sampleInterval=valid.sampleInterval;
    state.carts=config.carts.map((car,i)=>({id:String(car.id),kind:car.kind==="sport-cart"?"sport-cart":"scientific-cart",name:String(car.name||("Carrinho "+String.fromCharCode(65+i))).trim().slice(0,42)||"Carrinho",x0:Number(car.x0),v:Number(car.v),color:validColor(car.color,colorSet[i%colorSet.length]),wheelColor:validColor(car.wheelColor,"#202935"),size:clamp(Number(car.size)||1,.55,1.7),wheelRadius:clamp(Number(car.wheelRadius)||.03,.01,.15),opacity:clamp(Number(car.opacity??1),.2,1),details:car.details!==false,vector:car.vector!==false,trail:car.trail!==false,visible:car.visible!==false,locked:car.locked===true}));
    state.fixtures=Array.isArray(config.fixtures)?config.fixtures.slice(0,50).filter((item)=>item&&allowed.has(item.kind)).map((item,i)=>({id:String(item.id||uid("obj")),kind:item.kind,name:String(item.name||names[item.kind]+" "+(i+1)).trim().slice(0,42)||names[item.kind],x:Number.isFinite(Number(item.x))?Number(item.x):0,color:validColor(item.color,"#f0c66e"),interval:clamp(Number(item.interval)||state.sampleInterval,.1,60),visible:item.visible!==false,locked:item.locked===true})): [];
    state.playbackRate=[.25,.5,1,2,4].includes(Number(config.playbackRate))?Number(config.playbackRate):1;state.loop=config.loop!==false;
    state.viewSpan=clamp(Number(config.viewSpan)||24,8,80);state.cameraCenter=Number(config.cameraCenter)||0;state.cameraFollowOffset=clamp(Number(config.cameraFollowOffset)||0,-1000000,1000000);state.follow=config.follow!==false;state.cameraOffsetY=clamp(Number(config.cameraOffsetY)||0,-500,500);state.showGrid=config.showGrid!==false;state.vectors={velocity:config.vectors?.velocity!==false,acceleration:config.vectors?.acceleration===true,displacement:config.vectors?.displacement===true};state.reduceMotion=config.reduceMotion===true;
    if(!state.carts.some((car)=>car.id===state.selectedId))state.selectedId=state.carts[0]?.id||null;
    state.selectedIds=state.selectedIds.filter((id)=>entity(id));if(state.selectedId&&!state.selectedIds.includes(state.selectedId))state.selectedIds=[state.selectedId];
    if(resetTime)state.time=0;state.events=[];state.logged=new Set();state.lastGateTimes={};state.run++;
    renderAll();
  }
  function stopCameraFollow(){if(!state.follow)return;const car=currentCart();if(car)state.cameraCenter=mruAt(car,state.time).x+state.cameraFollowOffset;state.cameraFollowOffset=0;state.follow=false;}
  function cameraMin(){let center=state.cameraCenter;const car=currentCart();if(state.follow&&car)center=mruAt(car,state.time).x+state.cameraFollowOffset;return center-state.viewSpan/2;}
  function laneY(index,total){return 258+index*(total>1?Math.min(43,172/(total-1)):0);}
  function niceStep(raw){const p=Math.pow(10,Math.floor(Math.log10(Math.max(raw,1e-6)))),n=raw/p;return(n<=1?1:n<=2?2:n<=5?5:10)*p;}
  function textSvg(x,y,value,cls,anchor="middle"){return '<text class="'+cls+'" x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" text-anchor="'+anchor+'">'+esc(value)+"</text>";}
  function cartSvg(car,index,x,y){
    const pos=mruAt(car,state.time).x, scale=clamp(car.size,.55,1.7), rotation=state.reduceMotion?0:(pos-car.x0)/car.wheelRadius*180/Math.PI, body=car.kind==="sport-cart"
      ?'<path class="mru-cart-body" d="M4-15Q10-25 30-27L45-37Q62-43 76-30L88-25Q95-20 96-13L94-5H3Z"/><path class="mru-cart-window" d="M35-28 47-36Q61-40 72-30L76-25H30Z"/>'
      :'<path class="mru-cart-body" d="M3-12Q4-20 12-22L22-23 32-38H68Q77-37 82-23L91-20Q96-17 96-10V-5H3Z"/><path class="mru-cart-window" d="M28-25 36-35H48V-25ZM53-35H66Q74-34 78-25H53Z"/>';
    const wheel=(cx)=>'<g transform="rotate('+rotation.toFixed(1)+" "+cx+' 0)"><circle class="mru-cart-wheel" cx="'+cx+'" cy="0" r="10"/><circle class="mru-cart-hub" cx="'+cx+'" cy="0" r="5"/><path class="mru-wheel-spoke" d="M'+cx+'-8v16M'+(cx-8)+' 0h16"/></g>';
    const len=clamp(Math.abs(car.v)*8,14,54),start=car.v<0?48+len:48,end=car.v<0?48:48+len;
    const vector=state.vectors.velocity&&car.vector?'<path class="mru-vector" style="--cart-color:'+validColor(car.color,colorSet[index%5])+'" d="M'+start+' -64H'+end+'" marker-end="url(#mru-arrow)"/>'+textSvg((start+end)/2,-70,"v = "+fmt(car.v)+" m/s","mru-cart-vector-value"):"";
    const acceleration=state.vectors.acceleration?textSvg(48,-54,"a = 0 m/s²","mru-cart-vector-value"):"";
    const trail=car.trail?'<path class="mru-trail" style="--cart-color:'+validColor(car.color,colorSet[index%5])+'" d="M'+(48+(car.x0-pos)*900/state.viewSpan).toFixed(2)+' 2H48"/>':"";
    const details=car.details?'<path class="mru-cart-highlight" d="M12-18h9m5-2 7-14m37 0 7 14"/><circle cx="15" cy="-9" r="1.8" fill="#fff"/><circle cx="84" cy="-9" r="1.8" fill="#fff"/>':"";
    return '<g class="mru-cart-group" data-entity-id="'+esc(car.id)+'" tabindex="0" role="button" aria-label="'+esc(car.name)+", posição "+fmt(pos)+" metros, velocidade "+fmt(car.v)+' metros por segundo" transform="translate('+(x-48).toFixed(1)+" "+y.toFixed(1)+') scale('+scale+')" style="--cart-color:'+validColor(car.color,colorSet[index%5])+';--wheel-color:'+validColor(car.wheelColor,"#202935")+';opacity:'+clamp(car.opacity,.2,1)+'">'+trail+vector+textSvg(48,-96,car.name,"mru-cart-name")+textSvg(48,-81,"x = "+fmt(pos)+" m","mru-cart-value")+acceleration+'<g aria-hidden="true">'+wheel(25)+wheel(72)+body+details+'<path d="M4-7H94" stroke="rgba(255,255,255,.2)"/></g></g>';
  }
  function fixtureSvg(item,x){
    const yTop=185,yBottom=456,color=validColor(item.color,"#f0c66e"),label=esc(item.name);
    let art="";
    if(item.kind==="position-sensor")art='<path d="M'+x+' '+yTop+'v245" stroke="'+color+'" stroke-width="3"/><rect x="'+(x-13)+'" y="'+(yTop-24)+'" width="26" height="22" rx="5" fill="#101a2b" stroke="'+color+'" stroke-width="2"/>'+textSvg(x,yTop-9,"S","mru-object-label");
    else if(item.kind==="photogate")art='<path d="M'+(x-11)+' '+(yTop+8)+'v28h22v-28" fill="none" stroke="'+color+'" stroke-width="4"/><path d="M'+(x-10)+' '+(yTop+30)+'h20" stroke="'+color+'" stroke-dasharray="3 3"/>'+textSvg(x,yTop-7,"F","mru-object-label");
    else if(["position-marker","start-line","finish-line"].includes(item.kind))art='<path class="mru-object-line" d="M'+x+' '+yTop+'V'+yBottom+'" style="stroke:'+color+'"/><path d="M'+(x-6)+' '+yTop+'h12" stroke="'+color+'" stroke-width="3"/>'+textSvg(x,yTop-8,label,"mru-object-label");
    else if(item.kind==="distance-sign")art='<path d="M'+x+' '+(yTop+20)+'v44m0-38h42v27h-42" fill="#17263b" stroke="'+color+'" stroke-width="2"/>'+textSvg(x+21,yTop+50,item.name,"mru-object-label");
    else if(item.kind==="cone")art='<path d="M'+(x-17)+' '+(yBottom-8)+' '+x+' '+(yTop+38)+' '+(x+17)+' '+(yBottom-8)+'Z" fill="'+color+'" stroke="#fff"/><path d="M'+(x-10)+' '+(yBottom-20)+'h20m-25 12h30" stroke="#fff" stroke-width="4"/>'+textSvg(x,yTop+27,item.name,"mru-object-label");
    else if(item.kind==="tree")art='<path d="M'+(x-5)+' '+(yBottom-2)+'h10l-2-36h-6Z" fill="#8b6948"/><circle cx="'+x+'" cy="'+(yTop+44)+'" r="25" fill="'+color+'"/><circle cx="'+(x-18)+'" cy="'+(yTop+57)+'" r="16" fill="'+color+'"/><circle cx="'+(x+17)+'" cy="'+(yTop+59)+'" r="17" fill="'+color+'"/>'+textSvg(x,yTop+7,item.name,"mru-object-label");
    else if(item.kind==="post")art='<path d="M'+x+' '+yBottom+'V'+(yTop+19)+'m-12 0h24" stroke="'+color+'" stroke-width="5"/>'+textSvg(x,yTop+4,item.name,"mru-object-label");
    else if(item.kind==="flag")art='<path d="M'+x+' '+yBottom+'V'+yTop+'m0 1h36l-8 12 8 12h-36" fill="'+color+'" stroke="'+color+'"/>'+textSvg(x+14,yTop+10,item.name,"mru-object-label");
    const hit='<rect class="mru-object-hit" data-entity-id="'+esc(item.id)+'" x="'+(x-12)+'" y="142" width="24" height="310" tabindex="0" role="button" aria-label="Mover '+label+'"/>';
    if(item.kind==="time-marker"){
      const markers=[];for(const car of state.carts){for(let t=item.interval;t<=state.time&&t<=120;t+=item.interval){const at=100+(mruAt(car,t).x-cameraMin())/state.viewSpan*900;if(at>=100&&at<=1000)markers.push('<circle cx="'+at+'" cy="'+laneY(state.carts.indexOf(car),state.carts.length)+'" r="4" fill="'+color+'"/>'+textSvg(at,laneY(state.carts.indexOf(car),state.carts.length)-8,fmt(t,1)+" s","mru-grid-label"));}}return markers.join("");
    }
    return '<g class="mru-fixture-group" data-entity-id="'+esc(item.id)+'">'+art+hit+'</g>';
  }
  function drawScene(){
    $("mru-camera-world").setAttribute("transform","translate(0 "+state.cameraOffsetY.toFixed(2)+")");
    const min=cameraMin(),max=min+state.viewSpan,xOf=(x)=>100+(x-min)/state.viewSpan*900,grid=[],ticks=niceStep(state.viewSpan/10);
    let value=Math.ceil(min/ticks)*ticks;
    for(let i=0;i<70&&value<=max+1e-8;i++,value+=ticks){
      const x=xOf(value),major=Math.abs(value/(ticks*5)-Math.round(value/(ticks*5)))<1e-5;
      if(state.showGrid)grid.push('<path class="'+(major?"mru-grid-major":"mru-grid-line")+'" d="M'+x+' 132V467"/>');
      grid.push('<path class="'+(major||Math.abs(value)<1e-8?"mru-tick-major":"mru-tick")+'" d="M'+x+' 104v'+(major?18:10)+'"/>');
      grid.push(textSvg(x,96,short(value)+" m","mru-grid-label"));
    }
    $("mru-scene-grid").innerHTML=grid.join("");
    const track=['<path class="mru-axis-line" d="M100 470H1010"/><path class="mru-axis-line" d="M1010 470l-12-7v14Z" fill="#d4deea"/>',textSvg(1013,491,"x (m)","mru-axis-label","end")];
    const zero=xOf(0);if(zero>=100&&zero<=1000)track.push('<path class="mru-zero-line" d="M'+zero+' 120V468"/>',textSvg(zero,486,"0 · origem","mru-axis-label"));
    state.carts.filter(car=>car.visible).forEach((car,index)=>{const y=laneY(index,state.carts.filter(item=>item.visible).length);track.push('<path d="M100 '+(y+3)+'H1000" stroke="rgba(15,22,32,.8)" stroke-width="24"/><path class="mru-track-rail" d="M100 '+y+'H1000"/><path class="mru-track-stripe" d="M100 '+(y+10)+'H1000"/>',textSvg(90,y-16,car.name,"mru-grid-label","end"));});
    $("mru-scene-track").innerHTML=track.join("");
    const fixtures=[];for(const item of state.fixtures){if(!item.visible)continue;const x=xOf(item.x);if(item.kind==="time-marker")fixtures.push(fixtureSvg(item,x));else if(x>75&&x<1025)fixtures.push(fixtureSvg(item,x));}
    $("mru-scene-objects").innerHTML=fixtures.join("");
    const active=state.carts.filter(car=>car.visible),cars=[];
    active.forEach((car,index)=>{const x=xOf(mruAt(car,state.time).x);if(x>50&&x<1050)cars.push(cartSvg(car,index,x,laneY(index,active.length)-12));else cars.push('<g aria-label="'+esc(car.name)+' fora do enquadramento"><path d="'+(x<50?"M115 220l-16 10 16 10Z":"M985 220l16 10-16 10Z")+'" fill="'+validColor(car.color,"#4f88df")+'"/>'+textSvg(x<50?105:995,255,car.name+" · x = "+fmt(mruAt(car,state.time).x)+" m","mru-grid-label")+"</g>");});
    $("mru-scene-carts").innerHTML=cars.join("");
    const cart=currentCart(),overlay=[];if(cart&&state.time>0&&state.vectors.displacement){const a=xOf(cart.x0),b=xOf(mruAt(cart,state.time).x);if(a>100&&a<1000&&b>100&&b<1000)overlay.push('<path d="M'+a+' 154H'+b+'" stroke="'+validColor(cart.color,"#4f88df")+'" stroke-width="2.5" stroke-dasharray="5 6" marker-end="url(#mru-arrow)"/><circle cx="'+a+'" cy="154" r="4" fill="'+validColor(cart.color,"#4f88df")+'"/>');}
    $("mru-scene-overlay").innerHTML=overlay.join("");
    const visible=state.carts.filter(car=>car.visible);
    $("mru-scene-summary").textContent=visible.length+" carrinho"+(visible.length===1?"":"s")+" · t = "+fmt(state.time)+" s";
    $("mru-svg-desc").textContent=visible.map(car=>car.name+": posição "+fmt(mruAt(car,state.time).x)+" m e velocidade constante "+fmt(car.v)+" m/s.").join(" ")||"Pista vazia. Adicione um carrinho.";
    $("mru-live-description").textContent=$("mru-svg-desc").textContent;
    $("mru-view-span").value=state.viewSpan;$("mru-view-span-value").textContent=fmt(state.viewSpan,0)+" m";
    $("mru-follow-toggle").textContent=state.follow?"Câmera: acompanhar":"Câmera: fixa";$("mru-follow-toggle").setAttribute("aria-pressed",String(state.follow));
    $("mru-show-grid").checked=state.showGrid;$("mru-reduce-motion").checked=state.reduceMotion;
  }
  function syncPlaybackButtons(){
    const label=state.running?"Pausar":state.time>=state.duration&&!state.loop?"Recomeçar":"Continuar";
    for(const id of ["mru-play","mru-fullscreen-play"]){const button=$(id);if(button){button.textContent=label;button.setAttribute("aria-pressed",String(state.running));button.setAttribute("aria-label",state.running?"Pausar animação":label==="Recomeçar"?"Recomeçar animação":"Retomar animação");}}
  }
  function renderReadouts(){
    const car=currentCart(),timeLabel="t = "+fmt(state.time)+" s";$("mru-time-readout").textContent=timeLabel;const fullscreenTime=$("mru-fullscreen-time");if(fullscreenTime)fullscreenTime.textContent=timeLabel;
    $("mru-timeline").max=state.duration;$("mru-timeline").value=state.time;$("mru-timeline-value").textContent=fmt(state.time)+" s";
    syncPlaybackButtons();
    if(!car){$("mru-readouts").innerHTML="<p class=\"mru-muted\">Adicione um carrinho para ver as leituras.</p>";return;}
    const p=mruAt(car,state.time),m=mruMetrics(car,0,state.time);
    const rows=[["Posição atual x(t)",fmt(p.x)+" m"],["Posição inicial x₀",fmt(p.x0)+" m"],["Velocidade constante v",fmt(p.v)+" m/s"],["Aceleração a","0,00 m/s²"],["Deslocamento Δx",fmt(m.displacement)+" m"],["Distância percorrida",fmt(m.distance)+" m"],["Tempo decorrido",fmt(state.time)+" s"],["Velocidade média",fmt(m.averageVelocity)+" m/s"],["Rapidez média",fmt(m.averageSpeed)+" m/s"]];
    $("mru-readouts").innerHTML=rows.map(row=>'<div class="mru-readout"><span>'+row[0]+"</span><strong>"+row[1]+"</strong></div>").join("");
    $("mru-direction-pill").textContent=p.direction;
    const meetings=meetEvents(state.carts,state.duration).filter(item=>item.type==="meeting");
    $("mru-meeting-note").textContent=meetings.map(item=>{const a=state.carts.find(car=>car.id===item.first),b=state.carts.find(car=>car.id===item.second);return a.name+" e "+b.name+" se encontram em t = "+fmt(item.time)+" s, x = "+fmt(item.position)+" m."}).join(" ")||(state.carts.length>1?"Não há encontro no intervalo selecionado.":"");
  }
  function renderObjects(){
    const all=state.carts.concat(state.fixtures);
    $("mru-object-list").innerHTML=all.map(item=>'<li><button type="button" data-select-id="'+esc(item.id)+'" aria-current="'+String(item.id===state.selectedId)+'" aria-pressed="'+String(state.selectedIds.includes(item.id))+'"><span class="mru-object-swatch" style="--swatch:'+validColor(item.color,"#d6b87a")+'"></span><span>'+esc(item.name)+'<small> · '+esc(names[item.kind]||"Objeto")+"</small></span><small>"+(isCart(item)?fmt(item.v)+" m/s":"x = "+fmt(item.x)+" m")+"</small></button></li>").join("")||'<li class="mru-muted">Adicione um carrinho para começar.</li>';
    const selectedItems=state.selectedIds.map(id=>entity(id)).filter(Boolean);
    const removableCount=state.selectedIds.filter(id=>state.fixtures.some(item=>item.id===id)||(state.carts.some(car=>car.id===id)&&state.carts.length>1)).length;
    const sceneDelete=$("mru-scene-delete"),sceneDeleteLabel=$("mru-scene-delete-label");
    if(sceneDelete){sceneDelete.hidden=!item;sceneDelete.disabled=!removableCount;sceneDelete.setAttribute("aria-label",removableCount?"Excluir "+(selectedItems.length>1?selectedItems.length+" objetos selecionados":item.name):"O último carrinho não pode ser removido");}
    if(sceneDeleteLabel)sceneDeleteLabel.textContent=selectedItems.length>1?selectedItems.length+" objetos selecionados":item?item.name+" selecionado":"Selecione um objeto";
    const item=entity();$("mru-remove").disabled=!state.selectedIds.length||state.selectedIds.every(id=>state.carts.some(car=>car.id===id)&&state.carts.length===1);
    $("mru-duplicate").disabled=!state.selectedIds.length;$("mru-restore-object").disabled=!item;
    $("mru-layer-up").disabled=!item||isCart(item);$("mru-layer-down").disabled=!item||isCart(item);
  }
  function prop(id,label,value,type,attrs="",full=false){return '<label class="'+(full?"full":"")+'" for="mru-prop-'+id+'">'+label+'<input class="mru-prop" id="mru-prop-'+id+'" data-prop="'+id+'" type="'+type+'" value="'+esc(value)+'" '+attrs+"></label>";}
  function renderProperties(){
    const item=entity();if(!item){$("mru-properties").innerHTML='<p class="mru-muted">Selecione um objeto para editar suas propriedades.</p>';return;}
    let html="<h3>"+esc(item.name)+"</h3><div class=\"mru-properties-grid\">"+prop("name","Nome",item.name,"text",'maxlength="42" required',true);
    if(isCart(item)){
      html+=prop("x0","Posição inicial x₀",item.x0,"number",'step="0.1" min="-1000000" max="1000000"')+prop("v","Velocidade v",item.v,"number",'step="0.1" min="-100" max="100"');
      html+=prop("color","Cor da carroceria",item.color,"color")+prop("wheelColor","Cor das rodas",item.wheelColor,"color");
      html+=prop("size","Tamanho visual",item.size,"range",'min="0.55" max="1.7" step="0.05"')+prop("wheelRadius","Raio da roda",item.wheelRadius,"number",'min="0.01" max="0.15" step="0.005"');
      html+=prop("opacity","Opacidade",item.opacity,"range",'min="0.2" max="1" step="0.05"');
      html+='<label class="full" for="mru-prop-kind">Aparência<select class="mru-prop" id="mru-prop-kind" data-prop="kind"><option value="scientific-cart" '+(item.kind==="scientific-cart"?"selected":"")+'>Carrinho científico</option><option value="sport-cart" '+(item.kind==="sport-cart"?"selected":"")+'>Carrinho esportivo</option></select></label>';
      for(const key of ["details","vector","trail"])html+='<label class="mru-inline-check"><input class="mru-prop" data-prop="'+key+'" type="checkbox" '+(item[key]?"checked":"")+'> '+({details:"Detalhes",vector:"Vetor v",trail:"Trajetória"}[key])+"</label>";
    }else{
      html+=prop("x","Posição fixa x",item.x,"number",'step="0.1" min="-1000000" max="1000000"')+prop("color","Cor",item.color,"color");
      if(item.kind==="time-marker")html+=prop("interval","Intervalo temporal",item.interval||state.sampleInterval,"number",'min="0.1" max="60" step="0.1"');
    }
    html+='<label class="mru-inline-check full"><input class="mru-prop" data-prop="visible" type="checkbox" '+(item.visible!==false?"checked":"")+'> Exibir</label><label class="mru-inline-check full"><input class="mru-prop" data-prop="locked" type="checkbox" '+(item.locked?"checked":"")+'> Bloquear posição</label></div>';
    const actionMarkup='<div class="mru-edit-actions" id="mru-edit-actions" hidden><p>Pré-visualização aplicada em tempo real. As alterações aparecem na pista, nas leituras e nos gráficos.</p><button id="mru-prop-discard" class="button button-outline" type="button">Descartar edição deste objeto</button><span id="mru-edit-feedback" class="mru-edit-feedback" role="status" aria-live="polite"></span></div>';
    $("mru-properties").innerHTML=html+actionMarkup;
    const editingId=item.id, fields=[...$("mru-properties").querySelectorAll(".mru-prop")], actionBox=$("mru-edit-actions"), feedback=$("mru-edit-feedback");
    const original=clone(item),editBefore=capture();let draft=clone(item),editHistoryPushed=false,wasDirty=false,lastFeedback="";
    function updateDraft(field){
      const key=field.dataset.prop;if(!key)return false;
      let value=field.type==="checkbox"?field.checked:(field.type==="number"||field.type==="range"?Number(field.value):field.value);
      if((field.type==="number"||field.type==="range")&&(field.value.trim()===""||!Number.isFinite(value)))return false;
      value=normalize(key,value,field);
      if(key==="name"&&!value)return false;
      draft[key]=value;
      if(["x0","v0","v","a"].includes(key)){
        for(const peer of fields.filter(node=>node!==field&&node.dataset.prop===key)){
          if(peer.type==="range")peer.value=String(clamp(value,Number(peer.min),Number(peer.max)));
          else peer.value=String(value);
        }
      }
      return true;
    }
    function changedDraft(){return Object.keys(draft).some(key=>JSON.stringify(draft[key])!==JSON.stringify(original[key]));}
    function showFeedback(text){if(text!==lastFeedback){feedback.textContent=text;lastFeedback=text;}}
    function preview(){
      const target=entity(editingId);if(!target)return;
      const changed=changedDraft(),physicalChanged=["x0","v"].some(key=>target[key]!==draft[key]);
      if(changed){
        if(!editHistoryPushed){historyPush(editBefore);editHistoryPushed=true;}
        Object.assign(target,clone(draft));
        changedParameter(false);
        actionBox.hidden=false;
        if(!wasDirty){showFeedback(physicalChanged?"Condição atualizada; trajetória recalculada em t = "+fmt(state.time)+" s.":"Pré-visualização atualizada na pista, nos dados e nos gráficos.");wasDirty=true;}
        renderObjects();refreshFrame(true);renderDataTable();drawCharts();updatePendingSave();
      }else{
        const targetChanged=Object.keys(original).some(key=>JSON.stringify(target[key])!==JSON.stringify(original[key]));
        if(targetChanged){
          const physicalRestore=["x0","v"].some(key=>target[key]!==original[key]);
          Object.assign(target,clone(original));changedParameter(false);
          renderObjects();refreshFrame(true);renderDataTable();drawCharts();updatePendingSave();
        }
        actionBox.hidden=true;wasDirty=false;showFeedback("Nenhuma alteração pendente neste objeto.");
      }
    }
    fields.forEach(field=>{
      const handle=()=>{
        const valid=updateDraft(field);
        const invalid=fields.some(node=>((node.type==="number"||node.type==="range")&&(node.value.trim()===""||!Number.isFinite(Number(node.value))))||(node.dataset.prop==="name"&&!String(node.value).trim()));
        if(!valid||invalid){actionBox.hidden=false;showFeedback("Pré-visualização pausada até que os campos obrigatórios tenham valores válidos.");return;}
        preview();
      };
      field.addEventListener("input",handle);field.addEventListener("change",handle);
    });
    $("mru-prop-discard").addEventListener("click",()=>{
      draft=clone(original);
      const target=entity(editingId);if(target){const changed=Object.keys(original).some(key=>JSON.stringify(target[key])!==JSON.stringify(original[key]));if(changed){const physicalChanged=["x0","v"].some(key=>target[key]!==original[key]);Object.assign(target,clone(original));changedParameter(false);renderAll();}}
      status("Edição do objeto descartada.");renderProperties();
    });
  }
  function renderDataTable(){
    const times=sampleTimes(state.duration,state.sampleInterval,80),rows=[];
    for(const t of times)for(const car of state.carts){const p=mruAt(car,t);rows.push("<tr><td>"+fmt(t)+"</td><td>"+esc(car.name)+"</td><td>"+fmt(p.x)+"</td><td>"+fmt(p.v)+"</td><td>0,00</td><td>"+fmt(p.displacement)+"</td></tr>");}
    $("mru-data-table").innerHTML=rows.join("");
    $("mru-table-status").textContent=times.length>=80?"Tabela visual limitada a 80 instantes por carrinho; o CSV pode exportar até 5.000 instantes.":times.length+" instantes por carrinho · modelo ideal sem ruído experimental.";
  }
  function renderInstruments(){
    const car=currentCart(),cards=state.fixtures.filter(item=>["position-sensor","photogate"].includes(item.kind)).map(item=>{
      if(item.kind==="position-sensor"){const p=car?mruAt(car,state.time):null;return'<div class="mru-instrument-card"><strong>'+esc(item.name)+' · posição</strong><span>'+ (p?"x = "+fmt(p.x)+" m · leitura = "+fmt(p.x)+" m · Δx até o sensor = "+fmt(p.x-item.x)+" m":"Adicione um carrinho para medir.")+"</span></div>";}
      const t=car?crossingTime(car,item.x):null;return'<div class="mru-instrument-card"><strong>'+esc(item.name)+' · x = '+fmt(item.x)+' m</strong><span>'+ (t===null?"Sem cruzamento no movimento selecionado.":"Passagem calculada: t = "+fmt(t)+" s · "+(car.v<0?"sentido negativo":car.v>0?"sentido positivo":"repouso"))+"</span></div>";
    });
    $("mru-instrument-readings").innerHTML=cards.join("")||'<p class="mru-muted">Adicione sensores pela biblioteca de objetos.</p>';
    $("mru-events").innerHTML=state.events.slice(-20).reverse().map(event=>"<li>"+fmt(event.time)+" s · "+esc(event.cart)+" cruzou "+esc(event.gate)+" em x = "+fmt(event.position)+" m"+(event.interval===null?"":" · Δt = "+fmt(event.interval)+" s")+"</li>").join("")||"<li>Nenhum cruzamento registrado nesta execução.</li>";
    const a=Number($("mru-ruler-a").value)||0,b=Number($("mru-ruler-b").value)||0;
    $("mru-ruler-result").textContent="Δx = "+fmt(b-a)+" m · distância = "+fmt(Math.abs(b-a))+" m";
  }
  function drawChart(spec){
    const canvas=$(spec.id),ctx=canvas.getContext("2d");if(!ctx)return;
    const box=canvas.getBoundingClientRect(),width=Math.max(280,box.width||320),height=Math.max(150,box.height||200),ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    const css=getComputedStyle(document.documentElement),muted=css.getPropertyValue("--muted").trim()||"#9aa6b9",surface=css.getPropertyValue("--surface").trim()||"#101a2c";
    const left=47,right=width-12,top=14,bottom=height-30,values=[];
    state.carts.forEach(car=>{for(let i=0;i<=60;i++)values.push(spec.value(car,state.duration*i/60));});
    let low=Math.min(0,...values),high=Math.max(0,...values);if(high-low<1e-9){low-=1;high+=1;}
    const pad=(high-low)*.12;low-=pad;high+=pad;
    const center=(low+high)/2,zoomedSpan=(high-low)/graphZoom;low=center-zoomedSpan/2;high=center+zoomedSpan/2;
    const X=t=>left+clamp(t/state.duration,0,1)*(right-left),Y=v=>bottom-(v-low)/(high-low)*(bottom-top);
    ctx.clearRect(0,0,width,height);ctx.fillStyle=surface;ctx.fillRect(0,0,width,height);ctx.strokeStyle="rgba(177,194,219,.17)";ctx.fillStyle=muted;ctx.font="10px system-ui,sans-serif";
    for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.textAlign="right";ctx.fillText(short(high-(high-low)*i/4),left-5,y+3);}
    for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();ctx.textAlign="center";ctx.fillText(short(state.duration*i/4),x,height-7);}
    ctx.strokeStyle="rgba(215,225,238,.7)";ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
    state.carts.forEach((car,index)=>{ctx.beginPath();ctx.strokeStyle=validColor(car.color,colorSet[index%5]);ctx.lineWidth=car.id===state.selectedId?2.6:1.8;ctx.setLineDash(index%2?[5,3]:[]);for(let i=0;i<=100;i++){const t=state.duration*i/100,x=X(t),y=Y(spec.value(car,t));if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);});
    const marker=X(state.time);ctx.strokeStyle="#f0c66e";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(marker,top);ctx.lineTo(marker,bottom);ctx.stroke();ctx.setLineDash([]);
    if(currentCart()){ctx.fillStyle="#f0c66e";ctx.beginPath();ctx.arc(marker,Y(spec.value(currentCart(),state.time)),4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=muted;ctx.textAlign="left";ctx.fillText(spec.unit,5,12);
    const car=currentCart();$(spec.desc).textContent=spec.key==="position"?(car?"Neste instante x = "+fmt(mruAt(car,state.time).x)+" m; a inclinação da reta é v.":"Adicione um carrinho.") :spec.key==="velocity"?(state.carts.map(item=>item.name+": "+fmt(item.v)+" m/s").join(" · ")||"Adicione um carrinho."):"a = 0 m/s² em todos os instantes do MRU.";
  }
  function drawCharts(){chartSpecs.forEach(drawChart);}
  function renderMode(){
    document.querySelectorAll("[data-mru-mode]").forEach(button=>{const active=button.dataset.mruMode===state.mode;button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active));});
    $("mru-mode-note").textContent={explore:"Altere as condições e observe o movimento em tempo real.",investigate:"Faça uma previsão e use o modelo para explicar o resultado.",teacher:"Prepare a demonstração e escolha quando mostrar as respostas."}[state.mode];
    $("mru-investigation").hidden=state.mode!=="investigate";$("mru-teacher-reveal").hidden=state.mode!=="teacher";
    const hidden=state.mode==="teacher"&&!state.teacherReveal;
    $("mru-results-heading").closest(".mru-results-card").hidden=hidden;$("mru-graphs-heading").closest(".mru-graphs-card").hidden=hidden;$("mru-table-heading").closest(".mru-table-card").hidden=hidden;
    $("mru-teacher-reveal").textContent=state.teacherReveal?"Ocultar resultados":"Mostrar resultados";
  }
  function setupFullscreenDock(){
    const stage=$("mru-stage"),tools=$("mru-fullscreen-tools"),drawer=$("mru-fullscreen-drawer"),content=drawer.querySelector(".mru-fullscreen-drawer-content");
    const selectors=[".mru-mode-bar",".mru-camera-details",".mru-vector-details",".mru-playback-card",".mru-results-card",".mru-graphs-card",".mru-table-card",".mru-sidebar",".mru-investigation-card"];
    const relocated=[];
    function movePanelsIntoDock(){
      for(const selector of selectors){const node=document.querySelector(selector);if(!node||content.contains(node))continue;const marker=document.createComment("fullscreen panel position");node.parentNode.insertBefore(marker,node);content.append(node);relocated.push({node,marker});}
    }
    function restorePanels(){
      for(const {node,marker} of relocated){if(marker.parentNode)marker.parentNode.replaceChild(node,marker);}
      relocated.length=0;
    }
    $("mru-fullscreen-menu").addEventListener("click",()=>{
      const open=drawer.hidden;drawer.hidden=!open;stage.classList.toggle("mru-drawer-collapsed",!open);
      $("mru-fullscreen-menu").setAttribute("aria-expanded",String(open));
      $("mru-fullscreen-menu").textContent=open?"Fechar painel":"☰ Controles";
      if(open)drawer.scrollTop=0;
      requestAnimationFrame(()=>{refreshFrame(true);drawCharts();});
    });
    $("mru-fullscreen-play").addEventListener("click",()=>state.running?pause("Simulação pausada."):play());
    $("mru-fullscreen-exit").addEventListener("click",()=>{if(document.fullscreenElement)document.exitFullscreen();});
    document.addEventListener("fullscreenchange",()=>{
      const active=document.fullscreenElement===stage;
      if(active){
        movePanelsIntoDock();tools.hidden=false;drawer.hidden=true;stage.classList.add("mru-drawer-collapsed");
        $("mru-fullscreen-menu").setAttribute("aria-expanded","false");$("mru-fullscreen-menu").textContent="☰ Controles";
        document.body.classList.add("mru-fullscreen-active");syncPlaybackButtons();
        requestAnimationFrame(()=>{refreshFrame(true);drawCharts();});
      }else{
        restorePanels();tools.hidden=true;drawer.hidden=true;stage.classList.remove("mru-drawer-collapsed");
        document.body.classList.remove("mru-fullscreen-active");syncPlaybackButtons();setTimeout(drawCharts,100);
      }
      $("mru-fullscreen").textContent=active?"Sair da tela cheia":"Tela cheia";
      
    });
  }
  function renderAll(){
    $("mru-duration").value=state.duration;$("mru-sample-interval").value=state.sampleInterval;$("mru-playback-rate").value=state.playbackRate;$("mru-loop").checked=state.loop;
    $("mru-timeline").max=state.duration;$("mru-timeline").step=Math.min(.05,state.duration/100);
    renderMode();renderObjects();renderProperties();drawScene();renderReadouts();renderInstruments();renderDataTable();drawCharts();syncHistoryButtons();
    document.body.classList.toggle("mru-reduced-motion",state.reduceMotion);
  }
  function refreshFrame(forceCharts=false,time=performance.now()){
    drawScene();renderReadouts();renderInstruments();
    if(forceCharts||time-lastChart>120){drawCharts();lastChart=time;}
  }
  function setStatusAt(time,source){
    const car=currentCart();$("mru-graph-inspection").textContent="Ponto de inspeção ("+fmt(time)+" s): "+(car?car.name+" · x = "+fmt(mruAt(car,time).x)+" m · v = "+fmt(car.v)+" m/s · a = 0 m/s².":"sem carrinho.");
    if(source==="chart")status("Cursor sincronizado em t = "+fmt(time)+" s.");
  }
  function pause(message=""){
    state.running=false;if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;
    syncPlaybackButtons();if(message)status(message);
  }
  function clearMeasurementRun(){state.events=[];state.logged=new Set();state.lastGateTimes={};state.run++;}
  function changedParameter(pauseAnimation=true){
    if(pauseAnimation&&state.running)pause("Parâmetro alterado. Simulação pausada e recalculada.");
    clearMeasurementRun();
  }
  function logCrossings(from,to){
    if(to<=from)return;
    for(const gate of state.fixtures.filter(item=>item.kind==="photogate"&&item.visible))for(const car of state.carts){
      const t=crossingTime(car,gate.x),key=state.run+"|"+gate.id+"|"+car.id;
      if(t===null||t<=from+1e-8||t>to+1e-8||t>state.duration+1e-8||state.logged.has(key))continue;
      state.logged.add(key);const previous=state.lastGateTimes[gate.id];
      state.events.push({time:t,position:gate.x,cart:car.name,gate:gate.name,interval:Number.isFinite(previous)?t-previous:null});
      state.lastGateTimes[gate.id]=t;
    }
  }
  let lastVisualFrame=0;
  function animationFrame(time){
    if(!state.running){raf=0;lastFrame=0;return;}
    if(lastFrame){
      let remaining=Math.max(0,(time-lastFrame)/1000)*state.playbackRate,guard=0;
      while(remaining>1e-9&&guard++<20){
        const advance=Math.min(remaining,state.duration-state.time),before=state.time;state.time+=advance;logCrossings(before,state.time);remaining-=advance;
        if(state.time>=state.duration-1e-9){
          if(state.loop){state.time=0;state.run++;state.logged=new Set();state.lastGateTimes={};}
          else{state.time=state.duration;state.running=false;remaining=0;status("Experimento concluído. Reinicie ou escolha outro instante na linha do tempo.");}
        }
      }
    }
    lastFrame=time;
    if(time-lastVisualFrame>=(state.reduceMotion?180:33)){refreshFrame(false,time);lastVisualFrame=time;}
    if(state.running)raf=requestAnimationFrame(animationFrame);else{raf=0;lastFrame=0;syncPlaybackButtons();}
  }
  function play(){
    if(state.time>=state.duration)state.time=0;
    state.running=true;lastFrame=0;syncPlaybackButtons();
    status("Simulação em andamento · x(t) = x₀ + vt.");raf=requestAnimationFrame(animationFrame);
  }
  function setTime(time,source="timeline"){
    pause();state.time=clamp(Number(time)||0,0,state.duration);refreshFrame(true);setStatusAt(state.time,source);
  }
  function step(amount){pause();state.time=clamp(state.time+amount,0,state.duration);refreshFrame(true);status("Instante ajustado para t = "+fmt(state.time)+" s.");}
  function select(id,additive=false){
    const item=entity(id);if(!item)return;
    if(additive){state.selectedIds=state.selectedIds.includes(id)?state.selectedIds.filter(value=>value!==id):state.selectedIds.concat(id);if(!state.selectedIds.includes(state.selectedId))state.selectedId=state.selectedIds.at(-1)||item.id;}
    else{state.selectedId=id;state.selectedIds=[id];}
    if(isCart(item)&&state.follow)state.cameraCenter=mruAt(item,state.time).x;
    renderObjects();renderProperties();refreshFrame(true);
  }
  function addObject(kind){
    if(kind==="scientific-cart"||kind==="sport-cart"){
      if(state.carts.length>=5){status("A bancada comporta até cinco carrinhos.","error");return;}
      historyPush();const i=state.carts.length,ref=currentCart(),car=newCart(i);car.kind=kind;car.x0=ref?mruAt(ref,state.time).x+2:0;car.vector=state.vectors.velocity;state.carts.push(car);select(car.id);
    }else{
      if(state.fixtures.length>=50){status("A bancada comporta até cinquenta referências.","error");return;}
      historyPush();const i=state.fixtures.filter(item=>item.kind===kind).length+1,car=currentCart();
      const item={id:uid("obj"),kind,name:names[kind]+(kind==="time-marker"?"":" "+i),x:car?mruAt(car,state.time).x+4:0,color:kind==="position-sensor"?"#f0c66e":"#79a8ff",interval:state.sampleInterval,visible:true,locked:false};
      state.fixtures.push(item);select(item.id);
    }
    changedParameter();renderAll();status(kind==="photogate"?"Fotocélula pronta; a passagem será registrada durante a reprodução.":"Objeto adicionado. Ajuste nome, posição e aparência no editor.");
  }
  function duplicateSelection(){
    const selected=state.selectedIds.map(id=>entity(id)).filter(Boolean),cars=selected.filter(isCart).length;
    if(!selected.length)return;if(state.carts.length+cars>5){status("Há espaço para até cinco carrinhos.","error");return;}
    historyPush();const copies=[];
    selected.forEach(item=>{const copy=clone(item);copy.id=uid(isCart(item)?"cart":"obj");copy.name=String(item.name+" cópia").slice(0,42);if(isCart(item)){copy.x0+=1.5;state.carts.push(copy);}else{copy.x+=1.5;state.fixtures.push(copy);}copies.push(copy);});
    state.selectedId=copies.at(-1).id;state.selectedIds=copies.map(item=>item.id);changedParameter();renderAll();status("Cópia criada e selecionada.");
  }
  function removeSelection(){
    const removable=state.selectedIds.filter(id=>state.fixtures.some(item=>item.id===id)||(state.carts.some(car=>car.id===id)&&state.carts.length>1));
    if(!removable.length){status("Mantenha pelo menos um carrinho na bancada; adicione outro antes de removê-lo.","error");return;}
    historyPush();state.fixtures=state.fixtures.filter(item=>!removable.includes(item.id));state.carts=state.carts.filter(item=>!removable.includes(item.id));
    state.selectedIds=state.selectedIds.filter(id=>!removable.includes(id));if(!state.selectedIds.includes(state.selectedId))state.selectedId=state.selectedIds[0]||state.carts[0]?.id||state.fixtures[0]?.id||null;
    if(state.selectedId&&!state.selectedIds.length)state.selectedIds=[state.selectedId];changedParameter();renderAll();status(removable.length+" objeto(s) removido(s).");
  }
  function restoreSelected(){
    const item=entity();if(!item)return;historyPush();
    if(isCart(item))Object.assign(item,{kind:"scientific-cart",x0:0,v:4,color:colorSet[0],wheelColor:"#202935",size:1,wheelRadius:.03,opacity:1,details:true,vector:true,trail:true,visible:true,locked:false});
    else Object.assign(item,{x:0,color:"#f0c66e",visible:true,locked:false,interval:state.sampleInterval});
    changedParameter();renderAll();status("Valores padrão restaurados.");
  }
  function moveLayer(direction){
    const item=entity();if(!item||isCart(item))return;const from=state.fixtures.findIndex(obj=>obj.id===item.id),to=clamp(from+direction,0,state.fixtures.length-1);if(from===to)return;
    historyPush();state.fixtures.splice(to,0,state.fixtures.splice(from,1)[0]);renderAll();
  }
  function clearScene(){
    if(!confirm("Limpar a cena? Os objetos de referência serão removidos e o carrinho volta aos valores iniciais."))return;
    historyPush();const car=state.carts[0]||newCart();Object.assign(car,newCart(0),{id:car.id,name:"Carrinho A"});state.carts=[car];state.fixtures=[];state.selectedId=car.id;state.selectedIds=[car.id];state.time=0;changedParameter();renderAll();status("Cena limpa. O referencial e um carrinho foram mantidos.");
  }
  function undo(){if(!undoStack.length)return;redoStack.push(capture());const old=undoStack.pop();applyConfig(old,false);syncHistoryButtons();status("Última alteração desfeita.");}
  function redo(){if(!redoStack.length)return;undoStack.push(capture());const next=redoStack.pop();applyConfig(next,false);syncHistoryButtons();status("Alteração refeita.");}
  function renderInputs(){ $("mru-duration").value=state.duration;$("mru-sample-interval").value=state.sampleInterval;$("mru-playback-rate").value=state.playbackRate;$("mru-loop").checked=state.loop; }
  function renderUiMode(){const beginner=state.uiMode==="beginner";document.body.classList.toggle("mru-beginner-mode",beginner);document.querySelectorAll("[data-mru-ui-mode]").forEach(button=>{const active=button.dataset.mruUiMode===state.uiMode;button.setAttribute("aria-pressed",String(active));button.classList.toggle("is-active",active);});document.querySelectorAll("#mru-add-type option[data-advanced-only]").forEach(option=>{option.hidden=beginner;});const selector=$("mru-add-type");if(beginner&&selector.selectedOptions[0]?.hidden)selector.value="scientific-cart";}
function setUiMode(mode){if(mode!=="beginner"&&mode!=="advanced")return;state.uiMode=mode;if(mode==="beginner"&&state.mode!=="explore"){state.mode="explore";state.teacherReveal=false;renderMode();}try{localStorage.setItem("diario-bns-mru-ui-mode-v1",mode);}catch{}renderUiMode();}
function renderVectorControls(){document.querySelectorAll("#mru-vector-panel [data-vector]").forEach(button=>{const active=state.vectors[button.dataset.vector]===true;button.setAttribute("aria-pressed",String(active));button.classList.toggle("is-active",active);button.textContent=({velocity:"Velocidade",acceleration:"Aceleração",displacement:"Deslocamento"})[button.dataset.vector]+(active?" · ligado":" · desligado");});}
function toggleVector(key){if(!Object.prototype.hasOwnProperty.call(state.vectors,key))return;const before=capture();state.vectors[key]=!state.vectors[key];const property={velocity:"vector",acceleration:"vectorA",displacement:"vectorD"}[key];if(property)state.carts.forEach(car=>{car[property]=state.vectors[key];});historyPush(before);renderVectorControls();drawScene();updatePendingSave();}
function renderMode(){
    document.querySelectorAll("[data-mru-mode]").forEach(button=>{const on=button.dataset.mruMode===state.mode;button.classList.toggle("is-active",on);button.setAttribute("aria-pressed",String(on));});
    $("mru-mode-note").textContent={explore:"Altere as condições e observe o movimento em tempo real.",investigate:"Faça uma previsão e use o modelo para explicar o resultado.",teacher:"Prepare a demonstração e escolha quando mostrar as respostas."}[state.mode];
    $("mru-investigation").hidden=state.mode!=="investigate";$("mru-teacher-reveal").hidden=state.mode!=="teacher";
    const hidden=state.mode==="teacher"&&!state.teacherReveal;$("mru-results-heading").closest(".mru-results-card").hidden=hidden;$("mru-graphs-heading").closest(".mru-graphs-card").hidden=hidden;$("mru-table-heading").closest(".mru-table-card").hidden=hidden;
    $("mru-teacher-reveal").textContent=state.teacherReveal?"Ocultar resultados":"Mostrar resultados";
  }
  function renderAll(){
    renderInputs();renderMode();renderObjects();renderProperties();drawScene();renderReadouts();renderInstruments();renderDataTable();drawCharts();syncHistoryButtons();
    $("mru-timeline").max=state.duration;$("mru-timeline").step=Math.min(.05,state.duration/100);document.body.classList.toggle("mru-reduced-motion",state.reduceMotion);
    updatePendingSave();
  renderVectorControls();renderUiMode();}
  function pointerWorld(event){const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const pos=point.matrixTransform(svg.getScreenCTM().inverse());return cameraMin()+(pos.x-100)/900*state.viewSpan;}
  function installCameraNavigation(){
    const pointers=new Map();let gesture=null,renderFrame=0,lastTap={time:0,x:0,y:0};
    const pointAt=(event)=>{const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;return point.matrixTransform(svg.getScreenCTM().inverse());};
    const intercept=(event)=>{event.preventDefault();event.stopImmediatePropagation();};
    const scheduleRender=()=>{if(renderFrame)return;renderFrame=requestAnimationFrame(()=>{renderFrame=0;drawScene();updatePendingSave();});};
    const resetCamera=()=>{state.viewSpan=24;state.cameraCenter=0;state.cameraFollowOffset=0;state.follow=true;state.cameraOffsetY=0;drawScene();updatePendingSave();};
    const centerCamera=()=>{const car=currentCart();state.follow=false;state.cameraFollowOffset=0;if(car)state.cameraCenter=mruAt(car,state.time).x;state.cameraOffsetY=0;drawScene();updatePendingSave();};
    const fitExperiment=()=>{
      const xs=state.carts.filter(item=>item.visible!==false).map(car=>mruAt(car,state.time).x).concat(state.fixtures.filter(item=>item.visible!==false).map(item=>item.x));
      if(!xs.length){resetCamera();return;}
      const min=Math.min(...xs),max=Math.max(...xs),margin=Math.max(2,(max-min)*.15);
      state.viewSpan=clamp(max-min+margin*2,8,80);state.cameraCenter=(min+max)/2;state.cameraFollowOffset=0;state.follow=false;state.cameraOffsetY=0;drawScene();updatePendingSave();
    };
    const zoomAt=(point,factor)=>{
      const ratio=clamp((point.x-100)/900,0,1),world=cameraMin()+ratio*state.viewSpan,car=currentCart();
      const followedX=car?mruAt(car,state.time).x:null;
      state.viewSpan=clamp(state.viewSpan*factor,8,80);
      if(state.follow&&Number.isFinite(followedX))state.cameraFollowOffset=world-followedX-(ratio-.5)*state.viewSpan;
      else{stopCameraFollow();state.cameraCenter=world-(ratio-.5)*state.viewSpan;}
      drawScene();updatePendingSave();
    };
    const centerPoint=()=>({x:550,y:250});
    $("mru-zoom-in").addEventListener("click",()=>zoomAt(centerPoint(),1/1.12));$("mru-fullscreen-zoom-in").addEventListener("click",()=>zoomAt(centerPoint(),1/1.12));
    $("mru-zoom-out").addEventListener("click",()=>zoomAt(centerPoint(),1.12));$("mru-fullscreen-zoom-out").addEventListener("click",()=>zoomAt(centerPoint(),1.12));
    $("mru-zoom-reset").addEventListener("click",()=>{state.viewSpan=24;if(state.follow)state.cameraFollowOffset=0;drawScene();updatePendingSave();});
    $("mru-center-camera").addEventListener("click",centerCamera);
    $("mru-fit-camera").addEventListener("click",fitExperiment);
    svg.addEventListener("pointerdown",event=>{
      const target=event.target instanceof Element?event.target:null;
      const onObject=Boolean(target?.closest("[data-entity-id]"));
      const touch=event.pointerType==="touch";
      const point=pointAt(event);
      if(touch&&!onObject){
        const now=performance.now();
        if(now-lastTap.time<330&&Math.hypot(point.x-lastTap.x,point.y-lastTap.y)<28){
          lastTap={time:0,x:0,y:0};resetCamera();intercept(event);return;
        }
        lastTap={time:now,x:point.x,y:point.y};
      }
      if(touch||(!onObject&&event.pointerType==="mouse"))pointers.set(event.pointerId,{point,pointerType:event.pointerType});
      const touchPointers=[...pointers.entries()].filter(([,value])=>value.pointerType==="touch");
      if(touch&&touchPointers.length>=2){
        if(state.drag)stopDrag({pointerId:state.drag.pointer});
        const pair=touchPointers.slice(-2),a=pair[0][1].point,b=pair[1][1].point,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const ratio=clamp((mid.x-100)/900,0,1);
        gesture={type:"pinch",ids:pair.map(([id])=>id),distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),span:state.viewSpan,anchorWorld:cameraMin()+ratio*state.viewSpan,ratio,centerY:mid.y,offsetY:state.cameraOffsetY};
        stopCameraFollow();
        for(const [id] of pair){try{svg.setPointerCapture(id);}catch{}}
        svg.classList.add("is-camera-moving");intercept(event);return;
      }
      if(!onObject&&!gesture&&(touch||event.pointerType==="mouse")){
        gesture={type:"pan",id:event.pointerId,last:point};
        try{svg.setPointerCapture(event.pointerId);}catch{}
        svg.classList.add("is-camera-moving");intercept(event);
      }
    },true);
    svg.addEventListener("pointermove",event=>{
      if(pointers.has(event.pointerId))pointers.get(event.pointerId).point=pointAt(event);
      if(gesture?.type==="pan"&&gesture.id===event.pointerId){
        const point=pointAt(event),dx=point.x-gesture.last.x,dy=point.y-gesture.last.y;gesture.last=point;
        stopCameraFollow();state.cameraCenter-=dx/900*state.viewSpan;state.cameraOffsetY=clamp(state.cameraOffsetY+dy,-500,500);scheduleRender();intercept(event);return;
      }
      if(gesture?.type==="pinch"&&gesture.ids.includes(event.pointerId)){
        const a=pointers.get(gesture.ids[0])?.point,b=pointers.get(gesture.ids[1])?.point;
        if(!a||!b)return;
        const distance=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),midY=(a.y+b.y)/2;
        state.viewSpan=clamp(gesture.span*Math.pow(gesture.distance/distance,.78),8,80);
        state.cameraCenter=gesture.anchorWorld-(gesture.ratio-.5)*state.viewSpan;
        state.cameraOffsetY=clamp(gesture.offsetY+midY-gesture.centerY,-500,500);state.cameraFollowOffset=0;state.follow=false;scheduleRender();intercept(event);
      }
    },true);
    const endPointer=event=>{
      if(!pointers.has(event.pointerId))return;
      const activeGesture=gesture;if(!activeGesture){pointers.delete(event.pointerId);return;}intercept(event);pointers.delete(event.pointerId);
      if(activeGesture?.type==="pinch"){
        const remaining=[...pointers.entries()].filter(([,value])=>value.pointerType==="touch");
        if(remaining.length){const [id,value]=remaining[0];gesture={type:"pan",id,last:value.point};}
        else gesture=null;
      }else if(activeGesture?.type==="pan"&&activeGesture.id===event.pointerId)gesture=null;
      if(!gesture)svg.classList.remove("is-camera-moving");
      scheduleRender();
    };
    svg.addEventListener("pointerup",endPointer,true);svg.addEventListener("pointercancel",endPointer,true);
    svg.addEventListener("dblclick",event=>{const target=event.target instanceof Element?event.target:null;if(!target?.closest("[data-entity-id]")){event.preventDefault();resetCamera();}},true);
    svg.addEventListener("wheel",event=>{
      const point=pointAt(event),rect=svg.getBoundingClientRect(),factor=event.deltaMode===1?16:event.deltaMode===2?rect.height:1;
      if(event.ctrlKey||event.metaKey){zoomAt(point,Math.exp(event.deltaY*factor*.0008));}
      else{
        if(state.follow)state.cameraFollowOffset+=(event.deltaX*factor)/Math.max(1,rect.width)*state.viewSpan;
        else state.cameraCenter+=(event.deltaX*factor)/Math.max(1,rect.width)*state.viewSpan;
        state.cameraOffsetY=clamp(state.cameraOffsetY-(event.deltaY*factor)*500/Math.max(1,rect.height),-500,500);
        drawScene();updatePendingSave();
      }
      event.preventDefault();
    },{passive:false});
  }
  function download(name,content,type){
    const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement("a");link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportCsv(){
    const times=sampleTimes(state.duration,state.sampleInterval,5000),rows=[["tempo_s","carrinho","posicao_x_m","velocidade_m_s","aceleracao_m_s2","deslocamento_m"]];
    for(const t of times)for(const car of state.carts){const p=mruAt(car,t);rows.push([fmt(t),car.name,fmt(p.x),fmt(p.v),"0",fmt(p.displacement)]);}
    download("dados-mru.csv","\uFEFF"+rows.map(row=>row.map(value=>"\""+String(value).replace(/"/g,"\"\"")+"\"").join(";")).join("\r\n"),"text/csv;charset=utf-8");
  }
  function exportJson(){
    const data={tipo:"Laboratório de MRU",modelo:"x(t) = x₀ + vt",criado:new Date().toISOString(),configuração:capture(),tempoAtual_s:state.time,estado:state.carts.map(car=>({nome:car.name,x0_m:car.x0,v_m_s:car.v,a_m_s2:0,xAtual_m:mruAt(car,state.time).x}))};
    download("experimento-mru.json",JSON.stringify(data,null,2),"application/json;charset=utf-8");
  }
  function importConfig(parsed){
    const config=parsed.configuração||parsed.config||parsed;validateExperiment(config);applyConfig(config);pause();
  }
  function saveLocal(){
    try{localStorage.setItem("diario-bns-mru-config-v1",JSON.stringify(capture()));markSavedConfig();$("mru-save-status").textContent="Experimento salvo neste dispositivo.";}
    catch{$("mru-save-status").textContent="Não foi possível salvar. Baixe a configuração JSON.";}
  }
  function loadLocal(){
    try{const raw=localStorage.getItem("diario-bns-mru-config-v1");if(!raw){$("mru-save-status").textContent="Nenhum experimento salvo neste navegador.";return;}importConfig(JSON.parse(raw));markSavedConfig();$("mru-save-status").textContent="Experimento carregado do armazenamento local.";}
    catch(error){$("mru-save-status").textContent="O arquivo salvo não passou pela validação: "+error.message;}
  }
  async function shareConfig(){
    const url=location.origin+location.pathname+"?config="+encodeURIComponent(JSON.stringify(capture()));
    if(url.length>5000){$("mru-save-status").textContent="A configuração é grande para compartilhar por link; use o arquivo JSON.";return;}
    try{await navigator.clipboard.writeText(url);$("mru-save-status").textContent="Link da configuração copiado.";}
    catch{$("mru-save-status").textContent="O navegador não liberou a cópia. Exporte o arquivo JSON para compartilhar.";}
  }
  function exportScene(){
    const copy=svg.cloneNode(true);copy.setAttribute("xmlns",NS);
    const style=document.createElementNS(NS,"style");
    style.textContent=".mru-scene-bg{fill:#0b1524}.mru-grid-line{stroke:rgba(193,211,236,.12)}.mru-grid-major{stroke:rgba(193,211,236,.23)}.mru-grid-label,.mru-axis-label,.mru-object-label,.mru-cart-label{font:13px system-ui,sans-serif;fill:#d7e1ee}.mru-grid-label{font-size:12px;fill:#9eabc0}.mru-axis-line{stroke:#d4deea;stroke-width:2}.mru-zero-line{stroke:#f0c66e;stroke-width:2;stroke-dasharray:6 5}.mru-track-rail{stroke:#aab7c7;stroke-width:5}.mru-track-stripe{stroke:#526176;stroke-width:2;stroke-dasharray:12 12}.mru-tick{stroke:#bbc7d6}.mru-tick-major{stroke:#f0c66e}.mru-cart-wheel{fill:#202935;stroke:#080c12}.mru-cart-hub{fill:#b9c5d3}.mru-wheel-spoke{stroke:#e3e8ed}.mru-trail{fill:none;stroke:#79a8ff;stroke-width:3;stroke-dasharray:3 8}.mru-vector{stroke:#79a8ff;stroke-width:3}";
    copy.insertBefore(style,copy.firstChild);download("pista-mru.svg",new XMLSerializer().serializeToString(copy),"image/svg+xml;charset=utf-8");
  }
  function exportCharts(){
    chartSpecs.forEach(spec=>{const link=document.createElement("a");link.href=$(spec.id).toDataURL("image/png");link.download=spec.id+".png";document.body.append(link);link.click();link.remove();});
  }
  function checkPrediction(){
    const car=currentCart(),answer=Number($("mru-prediction").value),time=Math.min(3,state.duration);
    if(!car||!Number.isFinite(answer)){$("mru-prediction-feedback").textContent="Digite uma posição prevista em metros.";return;}
    const expected=mruAt(car,time).x;
    $("mru-prediction-feedback").textContent=Math.abs(answer-expected)<=.05
      ?"A previsão coincide com o modelo: x("+fmt(time)+" s) = "+fmt(expected)+" m. Explique como x₀ e v determinam o resultado."
      :"O modelo prevê x("+fmt(time)+" s) = "+fmt(expected)+" m. Compare com x(t) = x₀ + vt e observe o sinal da velocidade.";
  }
  function setDuration(value){
    if(!Number.isFinite(value)||value<.1||value>3600){status("A duração precisa ficar entre 0,1 e 3.600 s.","error");renderInputs();return;}
    const before=capture();state.duration=value;state.sampleInterval=Math.min(state.sampleInterval,value);state.time=Math.min(state.time,value);
    historyPush(before);changedParameter();renderAll();status("Duração alterada. Volte ao início para iniciar as novas medições.");
  }
  function setSampleInterval(value){
    if(!Number.isFinite(value)||value<=0||value>state.duration){status("O intervalo precisa ser positivo e não maior que a duração.","error");renderInputs();return;}
    const before=capture();state.sampleInterval=value;historyPush(before);changedParameter();renderAll();
  }
  function startDrag(event){
    const node=event.target.closest("[data-entity-id]");if(!node)return;
    const item=entity(node.dataset.entityId);if(!item)return;select(item.id,event.shiftKey);if(item.locked)return;
    if(state.running)pause("Simulação pausada para reposicionar.");
    dragBefore=capture();state.drag={id:item.id,pointer:event.pointerId,moved:false};svg.setPointerCapture(event.pointerId);event.preventDefault();
  }
  function moveDrag(event){
    if(!state.drag||state.drag.pointer!==event.pointerId)return;const item=entity(state.drag.id);if(!item)return;
    const x=pointerWorld(event);if(state.follow&&isCart(item))stopCameraFollow();if(isCart(item))item.x0=x-item.v*state.time;else item.x=x;state.drag.moved=true;
    if(!dragRenderFrame)dragRenderFrame=requestAnimationFrame(()=>{dragRenderFrame=0;refreshFrame(false,performance.now());});
  }
  function stopDrag(event){
    if(!state.drag||state.drag.pointer!==event.pointerId)return;
    if(dragRenderFrame){cancelAnimationFrame(dragRenderFrame);dragRenderFrame=0;}
    if(state.drag.moved){historyPush(dragBefore);changedParameter();renderObjects();renderProperties();refreshFrame(true);renderDataTable();drawCharts();}
    state.drag=null;dragBefore=null;updatePendingSave();
  }

  $("mru-object-list").addEventListener("click",event=>{const button=event.target.closest("[data-select-id]");if(button)select(button.dataset.selectId,event.shiftKey);});
  $("mru-add-object").addEventListener("click",()=>addObject($("mru-add-type").value));
  $("mru-duplicate").addEventListener("click",duplicateSelection);$("mru-remove").addEventListener("click",removeSelection);$("mru-scene-delete").addEventListener("click",removeSelection);
  $("mru-restore-object").addEventListener("click",restoreSelected);$("mru-layer-up").addEventListener("click",()=>moveLayer(1));$("mru-layer-down").addEventListener("click",()=>moveLayer(-1));
  $("mru-clear-scene").addEventListener("click",clearScene);$("mru-undo").addEventListener("click",undo);$("mru-redo").addEventListener("click",redo);
  $("mru-play").addEventListener("click",()=>state.running?pause("Simulação pausada. O estado foi preservado."):play());
  $("mru-step-back").addEventListener("click",()=>step(-(Number($("mru-step-size").value)||.5)));
  $("mru-step-forward").addEventListener("click",()=>step(Number($("mru-step-size").value)||.5));
  $("mru-reset").addEventListener("click",()=>{pause();state.time=0;clearMeasurementRun();refreshFrame(true);status("Relógio reiniciado; parâmetros preservados.");});
  $("mru-return-start").addEventListener("click",()=>setTime(0));
  $("mru-timeline").addEventListener("input",event=>setTime(Number(event.target.value)));
  $("mru-duration").addEventListener("change",event=>setDuration(Number(event.target.value)));
  $("mru-sample-interval").addEventListener("change",event=>setSampleInterval(Number(event.target.value)));
  $("mru-playback-rate").addEventListener("change",event=>{state.playbackRate=Number(event.target.value);updatePendingSave();});
  $("mru-step-size").addEventListener("change",event=>{const n=Number(event.target.value);if(!Number.isFinite(n)||n<=0||n>10){event.target.value=".5";status("O passo temporal deve ficar entre 0,01 e 10 s.","error");}});
  $("mru-loop").addEventListener("change",event=>{state.loop=event.target.checked;updatePendingSave();});
  $("mru-view-span").addEventListener("input",event=>{state.viewSpan=clamp(Number(event.target.value),8,80);$("mru-view-span-value").textContent=fmt(state.viewSpan,0)+" m";drawScene();updatePendingSave();});
  $("mru-pan-left").addEventListener("click",()=>{stopCameraFollow();state.cameraCenter-=state.viewSpan*.2;drawScene();updatePendingSave();});
  $("mru-pan-right").addEventListener("click",()=>{stopCameraFollow();state.cameraCenter+=state.viewSpan*.2;drawScene();updatePendingSave();});
  $("mru-follow-toggle").addEventListener("click",()=>{if(state.follow){const car=currentCart();if(car)state.cameraCenter=mruAt(car,state.time).x+state.cameraFollowOffset;state.follow=false;}else{state.follow=true;state.cameraFollowOffset=0;}state.cameraOffsetY=0;drawScene();updatePendingSave();});
  $("mru-recenter").addEventListener("click",()=>{state.follow=true;state.cameraFollowOffset=0;state.cameraOffsetY=0;drawScene();updatePendingSave();});
  $("mru-show-grid").addEventListener("change",event=>{state.showGrid=event.target.checked;drawScene();updatePendingSave();});
  $("mru-reduce-motion").addEventListener("change",event=>{state.reduceMotion=event.target.checked;document.body.classList.toggle("mru-reduced-motion",state.reduceMotion);drawScene();updatePendingSave();});
  $("mru-high-contrast").addEventListener("change",event=>{document.body.classList.toggle("mru-high-contrast",event.target.checked);});
  $("mru-text-size").addEventListener("input",event=>{const size=Number(event.target.value);document.documentElement.style.fontSize=size+"%";$("mru-text-size-value").textContent=size+"%";});
  $("mru-graph-zoom").addEventListener("change",event=>{graphZoom=Number(event.target.value)||1;drawCharts();});
  $("mru-ruler-a").addEventListener("input",renderInstruments);$("mru-ruler-b").addEventListener("input",renderInstruments);
  $("mru-save").addEventListener("click",saveLocal);$("mru-save-pending").addEventListener("click",saveLocal);$("mru-discard-pending").addEventListener("click",discardPendingConfig);$("mru-load").addEventListener("click",loadLocal);$("mru-share").addEventListener("click",shareConfig);
  $("mru-export-csv").addEventListener("click",exportCsv);$("mru-export-json").addEventListener("click",exportJson);$("mru-export-scene").addEventListener("click",exportScene);$("mru-export-graphs").addEventListener("click",exportCharts);
  $("mru-import-file").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{if(file.size>500000)throw new RangeError("O arquivo excede 500 KB.");importConfig(JSON.parse(await file.text()));$("mru-save-status").textContent="Configuração importada.";}
    catch(error){$("mru-save-status").textContent="Não foi possível importar: "+error.message;}event.target.value="";
  });
  $("mru-reset-config").addEventListener("click",()=>{
    if(!confirm("Restaurar a cena inicial? As alterações feitas nesta página serão substituídas."))return;
    pause();state.selectedId=null;state.selectedIds=[];state.mode="explore";state.teacherReveal=false;state.loop=true;undoStack.length=0;redoStack.length=0;applyConfig(initialConfig());state.selectedId=state.carts[0].id;state.selectedIds=[state.selectedId];renderAll();status("Configuração inicial restaurada.");
  });
  $("mru-check-prediction").addEventListener("click",checkPrediction);
  $("mru-teacher-reveal").addEventListener("click",()=>{state.teacherReveal=!state.teacherReveal;renderMode();});
  document.querySelectorAll("[data-mru-mode]").forEach(button=>button.addEventListener("click",()=>{state.mode=button.dataset.mruMode;state.teacherReveal=false;renderMode();}));
  svg.addEventListener("pointerdown",startDrag);svg.addEventListener("pointermove",moveDrag);svg.addEventListener("pointerup",stopDrag);svg.addEventListener("pointercancel",stopDrag);
  installCameraNavigation();
  svg.addEventListener("keydown",event=>{
    if(event.altKey&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){event.preventDefault();stopCameraFollow();const dx=event.key==="ArrowLeft"?-1:event.key==="ArrowRight"?1:0,dy=event.key==="ArrowUp"?-1:event.key==="ArrowDown"?1:0;state.cameraCenter+=dx*state.viewSpan*.05;state.cameraOffsetY=clamp(state.cameraOffsetY+dy*12,-500,500);drawScene();updatePendingSave();return;}
    if(event.key==="+"||event.key==="="){event.preventDefault();const ratio=.5,world=cameraMin()+ratio*state.viewSpan;state.viewSpan=clamp(state.viewSpan/1.2,8,80);state.follow=false;state.cameraFollowOffset=0;state.cameraCenter=world-(ratio-.5)*state.viewSpan;drawScene();updatePendingSave();return;}
    if(event.key==="-"){event.preventDefault();const ratio=.5,world=cameraMin()+ratio*state.viewSpan;state.viewSpan=clamp(state.viewSpan*1.2,8,80);state.follow=false;state.cameraFollowOffset=0;state.cameraCenter=world-(ratio-.5)*state.viewSpan;drawScene();updatePendingSave();return;}
    if(event.key==="0"){event.preventDefault();state.viewSpan=24;state.cameraCenter=0;state.cameraOffsetY=0;state.follow=true;drawScene();updatePendingSave();return;}
    if(event.code==="Space"){event.preventDefault();state.running?pause():play();return;}
    if(!["ArrowLeft","ArrowRight"].includes(event.key))return;const item=entity();if(!item||item.locked)return;
    event.preventDefault();const before=capture(),delta=(event.key==="ArrowRight"?1:-1)*(event.shiftKey?1:.1);if(isCart(item)){item.x0+=delta;state.time=0;}else item.x+=delta;
    historyPush(before);changedParameter();renderAll();
  });
  document.addEventListener("keydown",event=>{
    if(event.code!=="Space"||event.target.matches("input,select,textarea,button,[contenteditable=true]"))return;
    event.preventDefault();state.running?pause("Simulação pausada pelo teclado."):play();
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.running)lastFrame=0;});
  $("mru-fullscreen").addEventListener("click",async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await $("mru-stage").requestFullscreen();}
    catch{status("Tela cheia indisponível neste navegador.","error");}
  });
  chartSpecs.forEach(spec=>{
    const canvas=$(spec.id);
    canvas.addEventListener("pointermove",event=>{const box=canvas.getBoundingClientRect(),ratio=clamp((event.clientX-box.left-47)/Math.max(1,box.width-59),0,1),t=ratio*state.duration;setStatusAt(t,"chart");});
    canvas.addEventListener("click",event=>{const box=canvas.getBoundingClientRect(),ratio=clamp((event.clientX-box.left-47)/Math.max(1,box.width-59),0,1);setTime(ratio*state.duration,"chart");});
    canvas.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();setTime(state.time+(event.key==="ArrowRight"?1:-1),"chart");}});
  });
  window.addEventListener("resize",drawCharts);
  if("ResizeObserver"in window){const observer=new ResizeObserver(drawCharts);document.querySelectorAll(".mru-chart").forEach(node=>observer.observe(node));}
  const shared=new URLSearchParams(location.search).get("config");
  if(shared){try{importConfig(JSON.parse(shared));}catch(error){status("Configuração do link inválida: "+error.message,"error");}}
  document.querySelectorAll("[data-mru-ui-mode]").forEach(button=>button.addEventListener("click",()=>setUiMode(button.dataset.mruUiMode)));document.querySelectorAll("#mru-vector-panel [data-vector]").forEach(button=>button.addEventListener("click",()=>toggleVector(button.dataset.vector)));state.selectedId=state.carts[0].id;state.selectedIds=[state.selectedId];renderAll();setupFullscreenDock();
})();

