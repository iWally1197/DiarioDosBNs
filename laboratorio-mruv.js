import { crossingTime as crossingTimeCalc, crossingTimes, meetEvents as meetEventsCalc, mruvAt as mruvAtCalc, mruvMetrics as mruvMetricsCalc, sampleTimes, stoppingTime, torricelli, validateExperiment } from "./laboratorio-mruv-core.js?v=mruv-lab-20261012-1";

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const svg = $("mruv-scene");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (value, digits = 2) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const short = (value) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const uid = (prefix) => prefix + "-" + Math.random().toString(36).slice(2, 9);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[c]);
  const validColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
  const colorSet = ["#4f88df","#d17953","#54b79b","#a47ce0","#dbb649"];
  const names = { "scientific-cart":"Carrinho científico","sport-cart":"Carrinho esportivo","minimal-cart":"Carrinho minimalista","position-sensor":"Sensor de posição","velocity-sensor":"Sensor de velocidade","acceleration-marker":"Marcador de aceleração",photogate:"Fotocélula",stopwatch:"Cronômetro",ruler:"Régua","position-marker":"Marcador de posição","time-marker":"Marcadores temporais","start-line":"Linha de partida","finish-line":"Linha de chegada","distance-sign":"Placa de distância",cone:"Cone de sinalização",tree:"Árvore de referência",post:"Poste de referência",flag:"Bandeira","point-observer":"Ponto de observação","vector-indicator":"Indicador vetorial","data-label":"Etiqueta de dados","track-alternate":"Trilho visual alternativo","stop-marker":"Marcador de parada","turn-marker":"Marcador de inversão","study-region":"Região de estudo" };
  const newCart = (i = 0) => ({ id:uid("cart"),kind:i===1?"sport-cart":"scientific-cart",name:"Carrinho "+String.fromCharCode(65+i),x0:i?5:0,v0:i?-2:2,a:i?-.5:1,color:colorSet[i%colorSet.length],wheelColor:"#202935",size:1,wheelRadius:.03,opacity:1,details:true,vector:true,vectorA:true,vectorD:true,trail:true,chartVisible:true,visible:true,locked:false });
  const newFixtures = () => [{id:uid("sensor"),kind:"position-sensor",name:"Sensor de posição",x:3,color:"#f0c66e",visible:true,locked:false},{id:uid("gate"),kind:"photogate",name:"Fotocélula 1",x:8,color:"#79a8ff",visible:true,locked:false}];
  const initialConfig = () => ({duration:12,sampleInterval:1,carts:[newCart()],fixtures:newFixtures(),playbackRate:1,viewSpan:24,cameraCenter:0,cameraFollowOffset:0,cameraOffsetY:0,follow:true,showGrid:true,vectors:{velocity:true,acceleration:true,displacement:true},brakingMode:false,highContrast:false,simpleMode:false,reduceMotion:Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)});
  const state = Object.assign(initialConfig(),{uiMode:"advanced",time:0,running:false,loop:true,mode:"explore",teacherReveal:false,selectedId:null,selectedIds:[],events:[],logged:new Set(),lastGateTimes:{},run:1,drag:null});
  try{const savedUiMode=localStorage.getItem("diario-bns-mruv-ui-mode-v1");if(savedUiMode==="beginner"||savedUiMode==="advanced")state.uiMode=savedUiMode;}catch{}
  const undoStack=[],redoStack=[];
  let raf=0,lastFrame=0,lastChart=0,dragBefore=null,dragRenderFrame=0,lastVisualFrame=0;
  let graphZoom=1;
  const at=(cart,time)=>mruvAtCalc(cart,time,{brakingMode:state.brakingMode});
  const metrics=(cart,start,end)=>mruvMetricsCalc(cart,start,end,{brakingMode:state.brakingMode});
  const crossing=(cart,pos)=>crossingTimeCalc(cart,pos,state.duration,{brakingMode:state.brakingMode});
  const meetings=(carts,duration)=>meetEventsCalc(carts,duration,{brakingMode:state.brakingMode});
  const chartSpecs=[
    {id:"mruv-chart-position",key:"position",unit:"m",value:(car,t)=>at(car,t).x,desc:"mruv-chart-position-desc",legend:"mruv-chart-position-legend"},
    {id:"mruv-chart-velocity",key:"velocity",unit:"m/s",value:(car,t)=>at(car,t).v,desc:"mruv-chart-velocity-desc",legend:"mruv-chart-velocity-legend"},
    {id:"mruv-chart-acceleration",key:"acceleration",unit:"m/s²",value:(car,t)=>at(car,t).a,desc:"mruv-chart-acceleration-desc",legend:"mruv-chart-acceleration-legend"}
  ];
  const clone=(value)=>JSON.parse(JSON.stringify(value));
  const currentCart=()=>state.carts.find((item)=>item.id===state.selectedId)||state.carts[0]||null;
  const entity=(id=state.selectedId)=>state.carts.find((item)=>item.id===id)||state.fixtures.find((item)=>item.id===id)||null;
  const isCart=(item)=>Boolean(item&&state.carts.some((car)=>car.id===item.id));
  function mruvAt(cart,time){return at(cart,time);}
  function mruvMetrics(cart,start,end){return metrics(cart,start,end);}
  function crossingTime(cart,pos){return crossing(cart,pos);}
  function meetEvents(carts,duration){return meetings(carts,duration);}
  function capture(){return clone({duration:state.duration,sampleInterval:state.sampleInterval,carts:state.carts,fixtures:state.fixtures,playbackRate:state.playbackRate,loop:state.loop,viewSpan:state.viewSpan,cameraCenter:state.cameraCenter,cameraFollowOffset:state.cameraFollowOffset,cameraOffsetY:state.cameraOffsetY,vectors:state.vectors,follow:state.follow,showGrid:state.showGrid,brakingMode:state.brakingMode,highContrast:state.highContrast,simpleMode:state.simpleMode,reduceMotion:state.reduceMotion});}
  const pendingSignature=(config)=>{const {viewSpan,cameraCenter,cameraFollowOffset,cameraOffsetY,follow,...experiment}=config;return JSON.stringify(experiment);};
  let savedConfigSnapshot=capture();
  let savedConfigSignature=pendingSignature(savedConfigSnapshot);
  let pendingReturnFocus=null;
  function hasPendingConfigChanges(){return pendingSignature(capture())!==savedConfigSignature;}
  function updatePendingSave(){
    const panel=$("mruv-pending-save"),stage=$("mruv-stage"),pending=hasPendingConfigChanges();
    if(!panel)return;
    const host=document.fullscreenElement||document.body;if(panel.parentElement!==host)host.append(panel);
    const wasOpen=!panel.hidden;
    panel.hidden=!pending;
    document.body.classList.toggle("mruv-has-pending-save",pending);
    stage?.classList.toggle("mruv-has-pending-save",pending);
    if(pending&&!wasOpen){pendingReturnFocus=document.activeElement instanceof HTMLElement&&!panel.contains(document.activeElement)?document.activeElement:null;requestAnimationFrame(()=>{if(!panel.hidden)$("#mruv-save-pending")?.focus({preventScroll:true});});}
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
  document.addEventListener("fullscreenchange",()=>{const panel=$("mruv-pending-save"),host=document.fullscreenElement||document.body;if(panel&&panel.parentElement!==host)host.append(panel);});
  document.addEventListener("keydown",event=>{
    const panel=$("mruv-pending-save");if(!panel||panel.hidden)return;
    if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();return;}
    if(event.key!=="Tab")return;
    const first=$("#mruv-save-pending"),last=$("#mruv-discard-pending");
    if(event.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){event.preventDefault();first?.focus();}
  },true);
  window.addEventListener("beforeunload",event=>{if(!hasPendingConfigChanges())return;event.preventDefault();event.returnValue="";});
  function historyPush(snapshot=capture()){undoStack.push(clone(snapshot));if(undoStack.length>30)undoStack.shift();redoStack.length=0;syncHistoryButtons();}
  function syncHistoryButtons(){$("mruv-undo").disabled=!undoStack.length;$("mruv-redo").disabled=!redoStack.length;}
  function status(message,kind="info"){$("mruv-status").textContent=message;$("mruv-status").dataset.kind=kind;}
  function applyConfig(config,resetTime=true){
    const valid=validateExperiment(config), allowed=new Set(Object.keys(names));
    state.duration=valid.duration;state.sampleInterval=valid.sampleInterval;
    state.carts=config.carts.map((car,i)=>({id:String(car.id),kind:["sport-cart","minimal-cart"].includes(car.kind)?car.kind:"scientific-cart",name:String(car.name||("Carrinho "+String.fromCharCode(65+i))).trim().slice(0,42)||"Carrinho",x0:Number(car.x0),v0:Number(car.v0??car.v??0),a:Number(car.a??0),color:validColor(car.color,colorSet[i%colorSet.length]),wheelColor:validColor(car.wheelColor,"#202935"),size:clamp(Number(car.size)||1,.55,1.7),wheelRadius:clamp(Number(car.wheelRadius)||.03,.01,.15),opacity:clamp(Number(car.opacity??1),.2,1),details:car.details!==false,vector:car.vector!==false,vectorA:car.vectorA!==false,vectorD:car.vectorD!==false,trail:car.trail!==false,chartVisible:car.chartVisible!==false,visible:car.visible!==false,locked:car.locked===true}));
    state.fixtures=Array.isArray(config.fixtures)?config.fixtures.slice(0,50).filter((item)=>item&&allowed.has(item.kind)).map((item,i)=>({id:String(item.id||uid("obj")),kind:item.kind,name:String(item.name||names[item.kind]+" "+(i+1)).trim().slice(0,42)||names[item.kind],x:Number.isFinite(Number(item.x))?Number(item.x):0,color:validColor(item.color,"#f0c66e"),interval:clamp(Number(item.interval)||state.sampleInterval,.1,60),visible:item.visible!==false,locked:item.locked===true})): [];
    state.playbackRate=[.25,.5,1,2,4].includes(Number(config.playbackRate))?Number(config.playbackRate):1;state.loop=config.loop!==false;state.brakingMode=config.brakingMode===true;
    state.viewSpan=clamp(Number(config.viewSpan)||24,8,80);state.cameraCenter=Number(config.cameraCenter)||0;state.cameraFollowOffset=clamp(Number(config.cameraFollowOffset)||0,-1000000,1000000);state.follow=config.follow!==false;state.cameraOffsetY=clamp(Number(config.cameraOffsetY)||0,-500,500);state.showGrid=config.showGrid!==false;state.vectors={velocity:config.vectors?.velocity!==false,acceleration:config.vectors?.acceleration!==false,displacement:config.vectors?.displacement!==false};state.highContrast=config.highContrast===true;state.simpleMode=config.simpleMode===true;state.reduceMotion=config.reduceMotion===true;
    if(!state.carts.some((car)=>car.id===state.selectedId))state.selectedId=state.carts[0]?.id||null;
    state.selectedIds=state.selectedIds.filter((id)=>entity(id));if(state.selectedId&&!state.selectedIds.includes(state.selectedId))state.selectedIds=[state.selectedId];
    if(resetTime)state.time=0;state.events=[];state.logged=new Set();state.lastGateTimes={};state.run++;
    renderAll();
  }
  function stopCameraFollow(){if(!state.follow)return;const car=currentCart();if(car)state.cameraCenter=at(car,state.time).x+state.cameraFollowOffset;state.cameraFollowOffset=0;state.follow=false;}
  function cameraMin(){let center=state.cameraCenter;const car=currentCart();if(state.follow&&car)center=mruvAt(car,state.time).x+state.cameraFollowOffset;return center-state.viewSpan/2;}
  function laneY(index,total){return 258+index*(total>1?Math.min(43,172/(total-1)):0);}
  function niceStep(raw){const p=Math.pow(10,Math.floor(Math.log10(Math.max(raw,1e-6)))),n=raw/p;return(n<=1?1:n<=2?2:n<=5?5:10)*p;}
  function textSvg(x,y,value,cls,anchor="middle"){return '<text class="'+cls+'" x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" text-anchor="'+anchor+'">'+esc(value)+"</text>";}
  function cartSvg(car,index,x,y){
    const p=mruvAt(car,state.time),pos=p.x, scale=clamp(car.size,.55,1.7), rotation=(pos-car.x0)/car.wheelRadius*180/Math.PI, body=car.kind==="sport-cart"
      ?'<path class="mruv-cart-body" d="M4-15Q10-25 30-27L45-37Q62-43 76-30L88-25Q95-20 96-13L94-5H3Z"/><path class="mruv-cart-window" d="M35-28 47-36Q61-40 72-30L76-25H30Z"/>'
      :car.kind==="minimal-cart"
      ?'<path class="mruv-cart-body" d="M7-8V-22Q7-27 13-27H86Q92-27 92-22V-8Z"/><path class="mruv-cart-window" d="M20-24H40V-12H20ZM47-24H78V-12H47Z"/>'
      :'<path class="mruv-cart-body" d="M3-12Q4-20 12-22L22-23 32-38H68Q77-37 82-23L91-20Q96-17 96-10V-5H3Z"/><path class="mruv-cart-window" d="M28-25 36-35H48V-25ZM53-35H66Q74-34 78-25H53Z"/>';
    const wheel=(cx)=>'<g transform="rotate('+rotation.toFixed(1)+" "+cx+' 0)"><circle class="mruv-cart-wheel" cx="'+cx+'" cy="0" r="10"/><circle class="mruv-cart-hub" cx="'+cx+'" cy="0" r="5"/><path class="mruv-wheel-spoke" d="M'+cx+'-8v16M'+(cx-8)+' 0h16"/></g>';
    const vectorFor=(value,y,color,label)=>{if(Math.abs(value)<1e-8)return textSvg(48,y-4,label+" = 0","mruv-cart-label");const len=clamp(Math.abs(value)*8,10,54),start=value<0?48+len:48,end=value<0?48:48+len;return '<path class="mruv-vector" style="stroke:'+color+'" d="M'+start+' '+y+'H'+end+'" marker-end="url(#mruv-arrow)"/>'+textSvg((start+end)/2,y-5,label+" = "+fmt(value),"mruv-cart-label");};
    const vector=(state.vectors.velocity&&car.vector?vectorFor(p.v,-64,validColor(car.color,colorSet[index%5]),"v"):"")+(state.vectors.acceleration&&car.vectorA?vectorFor(p.a,-48,"#f0c66e","a"):"");
    const displacementVector=state.vectors.displacement&&car.vectorD&&Math.abs(p.displacement)>1e-8?'<path class="mruv-displacement-vector" d="M'+(48+(car.x0-pos)*900/state.viewSpan).toFixed(2)+' 18H48" marker-end="url(#mruv-arrow)"/>'+textSvg((96+(car.x0-pos)*900/state.viewSpan)/2,31,"Δx = "+fmt(p.displacement)+" m","mruv-cart-label"):"";
    const trail=car.trail?'<path class="mruv-trail" style="--cart-color:'+validColor(car.color,colorSet[index%5])+'" d="M'+(48+(car.x0-pos)*900/state.viewSpan).toFixed(2)+' 2H48"/>':"";
    const details=car.details?'<path class="mruv-cart-highlight" d="M12-18h9m5-2 7-14m37 0 7 14"/><circle cx="15" cy="-9" r="1.8" fill="#fff"/><circle cx="84" cy="-9" r="1.8" fill="#fff"/>':"";
    return '<g class="mruv-cart-group" data-entity-id="'+esc(car.id)+'" tabindex="0" role="button" aria-label="'+esc(car.name)+", posição "+fmt(pos)+" metros, velocidade "+fmt(p.v)+' metros por segundo" transform="translate('+(x-48).toFixed(1)+" "+y.toFixed(1)+') scale('+scale+')" style="--cart-color:'+validColor(car.color,colorSet[index%5])+';--wheel-color:'+validColor(car.wheelColor,"#202935")+';opacity:'+clamp(car.opacity,.2,1)+'">'+trail+vector+displacementVector+textSvg(48,-96,car.name,"mruv-cart-name")+textSvg(48,-81,"x = "+fmt(pos)+" m","mruv-cart-value")+'<g aria-hidden="true">'+wheel(25)+wheel(72)+body+details+'<path d="M4-7H94" stroke="rgba(255,255,255,.2)"/></g></g>';
  }
  function fixtureSvg(item,x){
    const yTop=185,yBottom=456,color=validColor(item.color,"#f0c66e"),label=esc(item.name);
    let art="";
    if(item.kind==="position-sensor")art='<path d="M'+x+' '+yTop+'v245" stroke="'+color+'" stroke-width="3"/><rect x="'+(x-13)+'" y="'+(yTop-24)+'" width="26" height="22" rx="5" fill="#101a2b" stroke="'+color+'" stroke-width="2"/>'+textSvg(x,yTop-9,"S","mruv-object-label");
    else if(item.kind==="photogate")art='<path d="M'+(x-11)+' '+(yTop+8)+'v28h22v-28" fill="none" stroke="'+color+'" stroke-width="4"/><path d="M'+(x-10)+' '+(yTop+30)+'h20" stroke="'+color+'" stroke-dasharray="3 3"/>'+textSvg(x,yTop-7,"F","mruv-object-label");
    else if(["position-marker","start-line","finish-line"].includes(item.kind))art='<path class="mruv-object-line" d="M'+x+' '+yTop+'V'+yBottom+'" style="stroke:'+color+'"/><path d="M'+(x-6)+' '+yTop+'h12" stroke="'+color+'" stroke-width="3"/>'+textSvg(x,yTop-8,label,"mruv-object-label");
    else if(item.kind==="distance-sign")art='<path d="M'+x+' '+(yTop+20)+'v44m0-38h42v27h-42" fill="#17263b" stroke="'+color+'" stroke-width="2"/>'+textSvg(x+21,yTop+50,item.name,"mruv-object-label");
    else if(item.kind==="cone")art='<path d="M'+(x-17)+' '+(yBottom-8)+' '+x+' '+(yTop+38)+' '+(x+17)+' '+(yBottom-8)+'Z" fill="'+color+'" stroke="#fff"/><path d="M'+(x-10)+' '+(yBottom-20)+'h20m-25 12h30" stroke="#fff" stroke-width="4"/>'+textSvg(x,yTop+27,item.name,"mruv-object-label");
    else if(item.kind==="tree")art='<path d="M'+(x-5)+' '+(yBottom-2)+'h10l-2-36h-6Z" fill="#8b6948"/><circle cx="'+x+'" cy="'+(yTop+44)+'" r="25" fill="'+color+'"/><circle cx="'+(x-18)+'" cy="'+(yTop+57)+'" r="16" fill="'+color+'"/><circle cx="'+(x+17)+'" cy="'+(yTop+59)+'" r="17" fill="'+color+'"/>'+textSvg(x,yTop+7,item.name,"mruv-object-label");
    else if(item.kind==="post")art='<path d="M'+x+' '+yBottom+'V'+(yTop+19)+'m-12 0h24" stroke="'+color+'" stroke-width="5"/>'+textSvg(x,yTop+4,item.name,"mruv-object-label");
    else if(item.kind==="flag")art='<path d="M'+x+' '+yBottom+'V'+yTop+'m0 1h36l-8 12 8 12h-36" fill="'+color+'" stroke="'+color+'"/>'+textSvg(x+14,yTop+10,item.name,"mruv-object-label");
    else if(item.kind==="velocity-sensor"||item.kind==="acceleration-marker"||item.kind==="stopwatch")art='<rect x="'+(x-27)+'" y="'+(yTop-19)+'" width="54" height="35" rx="7" fill="#111d30" stroke="'+color+'" stroke-width="2"/>'+textSvg(x,yTop+4,item.kind==="velocity-sensor"?"v(t)":item.kind==="acceleration-marker"?"a(t)":"t","mruv-object-label");
    else if(item.kind==="ruler")art='<path d="M'+x+' '+(yTop+5)+'v22m-8-15h16m-12 7h8" stroke="'+color+'" stroke-width="2"/>'+textSvg(x,yTop-6,"m","mruv-object-label");
    else if(item.kind==="point-observer")art='<circle cx="'+x+'" cy="'+(yTop+28)+'" r="11" fill="#111d30" stroke="'+color+'" stroke-width="3"/><path d="M'+(x-18)+' '+(yTop+28)+'h36m-18-18v36" stroke="'+color+'"/>'+textSvg(x,yTop+7,item.name,"mruv-object-label");
    else if(item.kind==="vector-indicator")art='<path d="M'+(x-20)+' '+(yTop+30)+'h40m-10-9 10 9-10 9" fill="none" stroke="'+color+'" stroke-width="3"/>'+textSvg(x,yTop+8,"v · a","mruv-object-label");
    else if(item.kind==="data-label")art='<rect x="'+(x-34)+'" y="'+(yTop-17)+'" width="68" height="32" rx="5" fill="#111d30" stroke="'+color+'"/>'+textSvg(x,yTop+4,item.name,"mruv-object-label");
    else if(item.kind==="track-alternate")art='<path d="M'+(x-24)+' '+(yBottom-4)+'h48" stroke="'+color+'" stroke-width="9" stroke-dasharray="5 5"/>'+textSvg(x,yBottom-18,item.name,"mruv-object-label");
    else if(item.kind==="stop-marker"||item.kind==="turn-marker")art='<path d="M'+x+' '+yTop+'V'+yBottom+'" stroke="'+color+'" stroke-width="4" stroke-dasharray="7 5"/><circle cx="'+x+'" cy="'+(yTop+35)+'" r="10" fill="#111d30" stroke="'+color+'" stroke-width="3"/>'+textSvg(x,yTop+39,item.kind==="stop-marker"?"0":"↔","mruv-object-label");
    else if(item.kind==="study-region")art='<rect x="'+(x-38)+'" y="'+(yTop+38)+'" width="76" height="'+(yBottom-yTop-45)+'" rx="6" fill="'+color+'" fill-opacity=".12" stroke="'+color+'" stroke-dasharray="5 4"/>'+textSvg(x,yTop+58,item.name,"mruv-object-label");
    const hit='<rect class="mruv-object-hit" data-entity-id="'+esc(item.id)+'" x="'+(x-12)+'" y="142" width="24" height="310" tabindex="0" role="button" aria-label="Mover '+label+'"/>';
    if(item.kind==="time-marker"){
      const markers=[];for(const car of state.carts){for(let t=item.interval;t<=state.time&&t<=120;t+=item.interval){const at=100+(mruvAt(car,t).x-cameraMin())/state.viewSpan*900;if(at>=100&&at<=1000)markers.push('<circle cx="'+at+'" cy="'+laneY(state.carts.indexOf(car),state.carts.length)+'" r="4" fill="'+color+'"/>'+textSvg(at,laneY(state.carts.indexOf(car),state.carts.length)-8,fmt(t,1)+" s","mruv-grid-label"));}}return markers.join("");
    }
    return '<g class="mruv-fixture-group" data-entity-id="'+esc(item.id)+'">'+art+hit+'</g>';
  }
  function drawScene(){
    $("mruv-camera-world").setAttribute("transform","translate(0 "+state.cameraOffsetY.toFixed(2)+")");
    const min=cameraMin(),max=min+state.viewSpan,xOf=(x)=>100+(x-min)/state.viewSpan*900,grid=[],ticks=niceStep(state.viewSpan/10);
    let value=Math.ceil(min/ticks)*ticks;
    for(let i=0;i<70&&value<=max+1e-8;i++,value+=ticks){
      const x=xOf(value),major=Math.abs(value/(ticks*5)-Math.round(value/(ticks*5)))<1e-5;
      if(state.showGrid)grid.push('<path class="'+(major?"mruv-grid-major":"mruv-grid-line")+'" d="M'+x+' 132V467"/>');
      grid.push('<path class="'+(major||Math.abs(value)<1e-8?"mruv-tick-major":"mruv-tick")+'" d="M'+x+' 104v'+(major?18:10)+'"/>');
      grid.push(textSvg(x,96,short(value)+" m","mruv-grid-label"));
    }
    $("mruv-scene-grid").innerHTML=grid.join("");
    const track=['<path class="mruv-axis-line" d="M100 470H1010"/><path class="mruv-axis-line" d="M1010 470l-12-7v14Z" fill="#d4deea"/>',textSvg(1013,491,"x (m)","mruv-axis-label","end")];
    const zero=xOf(0);if(zero>=100&&zero<=1000)track.push('<path class="mruv-zero-line" d="M'+zero+' 120V468"/>',textSvg(zero,486,"0 · origem","mruv-axis-label"));
    state.carts.filter(car=>car.visible).forEach((car,index)=>{const y=laneY(index,state.carts.filter(item=>item.visible).length);track.push('<path d="M100 '+(y+3)+'H1000" stroke="rgba(15,22,32,.8)" stroke-width="24"/><path class="mruv-track-rail" d="M100 '+y+'H1000"/><path class="mruv-track-stripe" d="M100 '+(y+10)+'H1000"/>',textSvg(90,y-16,car.name,"mruv-grid-label","end"));});
    $("mruv-scene-track").innerHTML=track.join("");
    const fixtures=[];for(const item of state.fixtures){if(!item.visible)continue;let position=item.x;const car=currentCart();if(car&&((item.kind==="stop-marker"&&state.brakingMode)||(item.kind==="turn-marker"&&!state.brakingMode))){const stop=stoppingTime(car);if(stop!==null)position=mruvAt(car,stop).x;}const x=xOf(position);if(item.kind==="time-marker")fixtures.push(fixtureSvg(item,x));else if(x>75&&x<1025)fixtures.push(fixtureSvg(item,x));}
    $("mruv-scene-objects").innerHTML=fixtures.join("");
    const active=state.carts.filter(car=>car.visible),cars=[];
    active.forEach((car,index)=>{const x=xOf(mruvAt(car,state.time).x);if(x>50&&x<1050)cars.push(cartSvg(car,index,x,laneY(index,active.length)-12));else cars.push('<g aria-label="'+esc(car.name)+' fora do enquadramento"><path d="'+(x<50?"M115 220l-16 10 16 10Z":"M985 220l16 10-16 10Z")+'" fill="'+validColor(car.color,"#4f88df")+'"/>'+textSvg(x<50?105:995,255,car.name+" · x = "+fmt(mruvAt(car,state.time).x)+" m","mruv-grid-label")+"</g>");});
    $("mruv-scene-carts").innerHTML=cars.join("");
    const cart=currentCart(),overlay=[];if(cart&&state.time>0){const a=xOf(cart.x0),b=xOf(mruvAt(cart,state.time).x);if(a>100&&a<1000&&b>100&&b<1000)overlay.push('<path d="M'+a+' 154H'+b+'" stroke="'+validColor(cart.color,"#4f88df")+'" stroke-width="2.5" stroke-dasharray="5 6"/><circle cx="'+a+'" cy="154" r="4" fill="'+validColor(cart.color,"#4f88df")+'"/>');}
    $("mruv-scene-overlay").innerHTML=overlay.join("");
    const visible=state.carts.filter(car=>car.visible);
    $("mruv-scene-summary").textContent=visible.length+" carrinho"+(visible.length===1?"":"s")+" · t = "+fmt(state.time)+" s";
    $("mruv-svg-desc").textContent=visible.map(car=>{const p=mruvAt(car,state.time);return car.name+": posição "+fmt(p.x)+" m, velocidade "+fmt(p.v)+" m/s e aceleração "+fmt(p.a)+" m/s².";}).join(" ")||"Pista vazia. Adicione um carrinho.";
    $("mruv-live-description").textContent=$("mruv-svg-desc").textContent;
    $("mruv-view-span").value=state.viewSpan;$("mruv-view-span-value").textContent=fmt(state.viewSpan,0)+" m";
    $("mruv-follow-toggle").textContent=state.follow?"Câmera: acompanhar":"Câmera: fixa";$("mruv-follow-toggle").setAttribute("aria-pressed",String(state.follow));
    $("mruv-show-grid").checked=state.showGrid;$("mruv-reduce-motion").checked=state.reduceMotion;$("mruv-high-contrast").checked=state.highContrast;$("mruv-simple-mode").checked=state.simpleMode;
  }
  function syncPlaybackButtons(){
    const label=state.running?"Pausar":state.time>=state.duration&&!state.loop?"Recomeçar":"Continuar";
    for(const id of ["mruv-play","mruv-fullscreen-play"]){const button=$(id);if(button){button.textContent=label;button.setAttribute("aria-pressed",String(state.running));button.setAttribute("aria-label",state.running?"Pausar animação":label==="Recomeçar"?"Recomeçar animação":"Retomar animação");}}
  }
  function renderReadouts(){
    const car=currentCart(),timeLabel="t = "+fmt(state.time)+" s";$("mruv-time-readout").textContent=timeLabel;const fullscreenTime=$("mruv-fullscreen-time");if(fullscreenTime)fullscreenTime.textContent=timeLabel;
    $("mruv-timeline").max=state.duration;$("mruv-timeline").value=state.time;$("mruv-timeline-value").textContent=fmt(state.time)+" s";
    syncPlaybackButtons();
    if(!car){$("mruv-readouts").innerHTML="<p class=\"mruv-muted\">Adicione um carrinho para ver as leituras.</p>";return;}
    const p=mruvAt(car,state.time),m=mruvMetrics(car,0,state.time);
    const rows=[["Posição atual x(t)",fmt(p.x)+" m"],["Posição inicial x₀",fmt(p.x0)+" m"],["Velocidade inicial v₀",fmt(p.v0)+" m/s"],["Velocidade instantânea v(t)",fmt(p.v)+" m/s"],["Aceleração atual a(t)",fmt(p.a)+" m/s²"],["Deslocamento Δx",fmt(m.displacement)+" m"],["Distância percorrida",fmt(m.distance)+" m"],["Tempo decorrido",fmt(state.time)+" s"],["Velocidade média",fmt(m.averageVelocity)+" m/s"],["Rapidez média",fmt(m.averageSpeed)+" m/s"],["Variação de velocidade Δv",fmt(p.v-p.v0)+" m/s"]];
    $("mruv-readouts").innerHTML=rows.map(row=>'<div class="mruv-readout"><span>'+row[0]+"</span><strong>"+row[1]+"</strong></div>").join("");
    $("mruv-direction-pill").textContent=p.direction;
    const meetings=meetEvents(state.carts,state.duration).filter(item=>item.type==="meeting");
    $("mruv-meeting-note").textContent=meetings.map(item=>{const a=state.carts.find(car=>car.id===item.first),b=state.carts.find(car=>car.id===item.second);return a.name+" e "+b.name+" se encontram em t = "+fmt(item.time)+" s, x = "+fmt(item.position)+" m."}).join(" ")||(state.carts.length>1?"Não há encontro no intervalo selecionado.":"");
    const stops=state.carts.map(item=>({cart:item,time:stoppingTime(item)})).filter(item=>item.time!==null);$("mruv-stop-comparison").textContent=stops.length>1?"Comparação dos tempos de parada: "+stops.map(item=>item.cart.name+" · "+fmt(item.time)+" s").join("; "):"";
    const stop=stoppingTime(car),tor=torricelli(car,p.x-car.x0);
    $("mruv-turn-analysis").textContent=stop!==null?"A velocidade zera em t = "+fmt(stop)+" s, na posição x = "+fmt(mruvAt(car,stop).x)+" m (Δx até esse instante = "+fmt(mruvAt(car,stop).x-car.x0)+" m). "+(state.brakingMode?"A frenagem controlada mantém o carrinho parado após esse instante.":"No MRUV estrito, a aceleração continua e o carrinho inverte o sentido."):p.behavior+"; "+(p.v*p.a<0?"a velocidade e a aceleração têm sinais opostos.":p.v*p.a>0?"a velocidade e a aceleração têm o mesmo sinal.":"a rapidez está constante ou o carrinho está no instante de repouso.");
    $("mruv-torricelli-result").textContent=state.brakingMode&&stop!==null&&state.time>=stop?"Torricelli não se aplica depois do corte de aceleração: este trecho mantém velocidade zero.":"v² = v₀² + 2aΔx → "+fmt(tor.finalVelocitySquared)+" m²/s²; velocidade calculada: "+fmt(p.v*p.v)+" m²/s².";
    $("mruv-equation-substitution").textContent="x = "+fmt(car.x0)+" + ("+fmt(car.v0)+")("+fmt(state.time)+") + ½("+fmt(car.a)+")("+fmt(state.time)+")² = "+fmt(p.x)+" m · v = v₀ + at = "+fmt(p.v)+" m/s · a = "+fmt(p.a)+" m/s².";
  }
  function renderObjects(){
    const all=state.carts.concat(state.fixtures);
    $("mruv-object-list").innerHTML=all.map(item=>'<li><button type="button" data-select-id="'+esc(item.id)+'" aria-current="'+String(item.id===state.selectedId)+'" aria-pressed="'+String(state.selectedIds.includes(item.id))+'"><span class="mruv-object-swatch" style="--swatch:'+validColor(item.color,"#d6b87a")+'"></span><span>'+esc(item.name)+'<small> · '+esc(names[item.kind]||"Objeto")+"</small></span><small>"+(isCart(item)?"v₀ "+fmt(item.v0)+" · a "+fmt(item.a):"x = "+fmt(item.x)+" m")+"</small></button></li>").join("")||'<li class="mruv-muted">Adicione um carrinho para começar.</li>';
    const item=entity();$("mruv-remove").disabled=!state.selectedIds.length||state.selectedIds.every(id=>state.carts.some(car=>car.id===id)&&state.carts.length===1);
    $("mruv-duplicate").disabled=!state.selectedIds.length;$("mruv-restore-object").disabled=!item;
    $("mruv-layer-up").disabled=!item||isCart(item);$("mruv-layer-down").disabled=!item||isCart(item);
  }
  function normalize(key,value,field){
    if(key==="name")return String(value).trim().slice(0,42);
    if(field.type==="checkbox")return Boolean(value);
    if(field.type==="number"||field.type==="range"){
      const numeric=Number(value),min=field.min===""?-Infinity:Number(field.min),max=field.max===""?Infinity:Number(field.max);
      return Number.isFinite(numeric)?clamp(numeric,min,max):numeric;
    }
    if(field.type==="color")return validColor(value,field.value||"#4f88df");
    return String(value);
  }
  function prop(id,label,value,type,attrs="",full=false){return '<div class="mruv-property-field'+(full?" full":"")+'"><div class="mruv-property-field-head"><label for="mruv-prop-'+id+'">'+label+'</label><button class="button button-outline mruv-field-apply" data-apply-prop="'+id+'" type="button" aria-label="Aplicar alteração: '+esc(label)+'">Aplicar</button></div><input class="mruv-prop" id="mruv-prop-'+id+'" data-prop="'+id+'" type="'+type+'" value="'+esc(value)+'" '+attrs+"></div>";}
  function toggleProp(id,label,checked,full=false){return '<div class="mruv-property-toggle'+(full?" full":"")+'"><label class="mruv-inline-check"><input class="mruv-prop" data-prop="'+id+'" type="checkbox" '+(checked?'checked':'')+'> '+label+'</label><button class="button button-outline mruv-field-apply" data-apply-prop="'+id+'" type="button" aria-label="Aplicar alteração: '+esc(label)+'">Aplicar</button></div>';}
  function parameterControl(id,label,value,min,max,step){const exactMin=id==="x0"?-1000000:id==="v0"?-100:-20,exactMax=id==="x0"?1000000:id==="v0"?100:20;return '<div class="mruv-property-field mruv-parameter-control"><div class="mruv-property-field-head"><label for="mruv-prop-'+id+'">'+label+'</label><button class="button button-outline mruv-field-apply" data-apply-prop="'+id+'" type="button" aria-label="Aplicar alteração: '+esc(label)+'">Aplicar</button></div><input class="mruv-prop" id="mruv-prop-'+id+'" data-prop="'+id+'" type="number" value="'+esc(value)+'" step="'+step+'" min="'+exactMin+'" max="'+exactMax+'" aria-label="'+label+' · valor preciso"><input class="mruv-prop" id="mruv-prop-'+id+'-range" data-prop="'+id+'" type="range" value="'+esc(value)+'" min="'+min+'" max="'+max+'" step="'+step+'" aria-label="'+label+' · ajuste deslizante"></div>';}
  function renderProperties(){
    const item=entity();if(!item){$("mruv-properties").innerHTML='<p class="mruv-muted">Selecione um objeto para editar suas propriedades.</p>';return;}
    let html="<h3>"+esc(item.name)+"</h3><div class=\"mruv-properties-grid\">"+prop("name","Nome",item.name,"text",'maxlength="42" required',true);
    if(isCart(item)){
      html+=parameterControl("x0","Posição inicial x₀ (m)",item.x0,-50,50,.1)+parameterControl("v0","Velocidade inicial v₀ (m/s)",item.v0,-20,20,.1)+parameterControl("a","Aceleração a (m/s²)",item.a,-10,10,.1);
      html+=prop("color","Cor da carroceria",item.color,"color")+prop("wheelColor","Cor das rodas",item.wheelColor,"color");
      html+=prop("size","Tamanho visual",item.size,"range",'min="0.55" max="1.7" step="0.05"')+prop("wheelRadius","Raio da roda",item.wheelRadius,"number",'min="0.01" max="0.15" step="0.005"');
      html+=prop("opacity","Opacidade",item.opacity,"range",'min="0.2" max="1" step="0.05"');
      html+='<div class="mruv-property-field full"><div class="mruv-property-field-head"><label for="mruv-prop-kind">Aparência</label><button class="button button-outline mruv-field-apply" data-apply-prop="kind" type="button" aria-label="Aplicar alteração: Aparência">Aplicar</button></div><select class="mruv-prop" id="mruv-prop-kind" data-prop="kind"><option value="scientific-cart" '+(item.kind==="scientific-cart"?"selected":"")+'>Carrinho científico</option><option value="sport-cart" '+(item.kind==="sport-cart"?"selected":"")+'>Carrinho esportivo</option><option value="minimal-cart" '+(item.kind==="minimal-cart"?"selected":"")+'>Carrinho minimalista</option></select></div>';
      for(const key of ["details","vector","vectorA","vectorD","trail","chartVisible"])html+=toggleProp(key,{details:"Detalhes",vector:"Vetor velocidade",vectorA:"Vetor aceleração",vectorD:"Vetor deslocamento",trail:"Trajetória",chartVisible:"Mostrar nos gráficos"}[key],item[key]!==false);
    }else{
      html+=prop("x","Posição fixa x",item.x,"number",'step="0.1" min="-1000000" max="1000000"')+prop("color","Cor",item.color,"color");
      if(item.kind==="time-marker")html+=prop("interval","Intervalo temporal",item.interval||state.sampleInterval,"number",'min="0.1" max="60" step="0.1"');
    }
    html+=toggleProp("visible","Exibir",item.visible!==false,true)+toggleProp("locked","Bloquear posição",!!item.locked,true)+"</div>";
    const actionMarkup='<div class="mruv-edit-actions" id="mruv-edit-actions" hidden><p>Altere um campo e confirme pelo botão Aplicar ao lado dele. Os outros campos pendentes ficam separados.</p><button id="mruv-prop-discard" class="button button-outline" type="button" disabled>Descartar alterações pendentes</button><span id="mruv-edit-feedback" class="mruv-edit-feedback" role="status" aria-live="polite"></span></div>';
    $("mruv-properties").innerHTML=html+actionMarkup;
    const editingId=item.id, fields=[...$("mruv-properties").querySelectorAll(".mruv-prop")], applyButtons=[...$("mruv-properties").querySelectorAll("[data-apply-prop]")], actionBox=$("mruv-edit-actions"), feedback=$("mruv-edit-feedback"), discardButton=$("mruv-prop-discard");
    let draft=clone(item),lastFeedback="";const lastEditedField=new Map();
    function showFeedback(text){if(text!==lastFeedback){feedback.textContent=text;lastFeedback=text;}}
    function keyFields(key){return fields.filter(field=>field.dataset.prop===key);}
    function validField(field){return !((field.type==="number"||field.type==="range")&&(field.value.trim()===""||!Number.isFinite(Number(field.value))))&&!(field.dataset.prop==="name"&&!String(field.value).trim());}
    function updateDraft(field){
      const key=field.dataset.prop;if(!key)return false;
      if(!validField(field))return false;
      let value=field.type==="checkbox"?field.checked:(field.type==="number"||field.type==="range"?Number(field.value):field.value);
      value=normalize(key,value,field);
      draft[key]=value;
      for(const peer of keyFields(key).filter(node=>node!==field)){
        if(peer.type==="range")peer.value=String(clamp(value,Number(peer.min),Number(peer.max)));
        else peer.value=String(value);
      }
      return true;
    }
    function pendingKeys(){
      const target=entity(editingId);if(!target)return [];
      return [...new Set(applyButtons.map(button=>button.dataset.applyProp))].filter(key=>JSON.stringify(draft[key])!==JSON.stringify(target[key]));
    }
    function refreshApplyButtons(){
      const pending=pendingKeys(), invalid=fields.some(field=>!validField(field));
      actionBox.hidden=!pending.length&&!invalid;
      discardButton.disabled=!pending.length;
      if(pending.length)showFeedback("Confirme cada campo pendente no botão correspondente.");
      else if(!invalid)actionBox.hidden=true;
    }
    function stage(field){
      lastEditedField.set(field.dataset.prop,field);
      const valid=updateDraft(field);
      refreshApplyButtons();
      if(!valid||keyFields(field.dataset.prop).some(node=>!validField(node))){
        actionBox.hidden=false;showFeedback("Preencha este campo com um valor válido antes de confirmar.");
      }
    }
    function applyProperty(key){
      const target=entity(editingId), group=keyFields(key);
      if(!target)return;
      const source=lastEditedField.get(key)||group.find(field=>field.type!=="range")||group[0];
      if(source)updateDraft(source);
      if(group.some(field=>!validField(field))){showFeedback("Corrija este campo antes de aplicar.");group.find(field=>!validField(field))?.focus();return;}
      const pending=JSON.stringify(draft[key])!==JSON.stringify(target[key]);
      if(!pending){refreshApplyButtons();showFeedback("Esse campo não tem alteração pendente.");return;}
      const physicalChanged=["x0","v0","a"].includes(key);
      historyPush();
      target[key]=clone(draft[key]);
      changedParameter(false);
      if(key==="name"){const heading=$("mruv-properties").querySelector("h3");if(heading)heading.textContent=target.name;}
      renderObjects();refreshFrame(true);renderDataTable();drawCharts();updatePendingSave();
      refreshApplyButtons();
      showFeedback(physicalChanged?"Alteração aplicada; movimento atualizado em t = "+fmt(state.time)+" s.":"Alteração aplicada na animação, nos dados e nos gráficos.");
    }
    fields.forEach(field=>{
      field.addEventListener("input",()=>stage(field));field.addEventListener("change",()=>stage(field));
    });
    applyButtons.forEach(button=>button.addEventListener("click",()=>applyProperty(button.dataset.applyProp)));
    discardButton.addEventListener("click",()=>{
      status("Alterações pendentes descartadas; os valores já aplicados foram mantidos.");
      renderProperties();
    });
  }
  function renderDataTable(){
    const times=sampleTimes(state.duration,state.sampleInterval,80),rows=[];
    for(const t of times)for(const car of state.carts){const p=mruvAt(car,t),m=mruvMetrics(car,0,t);rows.push("<tr><td>"+fmt(t)+"</td><td>"+esc(car.name)+"</td><td>"+fmt(p.x)+"</td><td>"+fmt(p.v)+"</td><td>"+fmt(p.a)+"</td><td>"+fmt(p.displacement)+"</td><td>"+fmt(m.distance)+"</td><td>"+fmt(p.v-p.v0)+"</td></tr>");}
    $("mruv-data-table").innerHTML=rows.join("");
    $("mruv-table-status").textContent=times.length>=80?"Tabela visual limitada a 80 instantes por carrinho; o CSV pode exportar até 5.000 instantes.":times.length+" instantes por carrinho · modelo ideal sem ruído experimental.";
  }
  function renderInstruments(){
    const car=currentCart(),cards=state.fixtures.filter(item=>["position-sensor","velocity-sensor","acceleration-marker","stopwatch","photogate"].includes(item.kind)).map(item=>{
      if(!car)return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+'</strong><span>Adicione um carrinho para medir.</span></div>';
      const p=mruvAt(car,state.time);
      if(item.kind==="position-sensor")return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+' · posição</strong><span>x = '+fmt(p.x)+' m · distância assinada ao sensor = '+fmt(p.x-item.x)+' m</span></div>';
      if(item.kind==="velocity-sensor")return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+' · velocidade</strong><span>v(t) = '+fmt(p.v)+' m/s · sentido: '+esc(p.direction)+'</span></div>';
      if(item.kind==="acceleration-marker")return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+' · aceleração</strong><span>a(t) = '+fmt(p.a)+' m/s² · '+esc(p.behavior)+'</span></div>';
      if(item.kind==="stopwatch")return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+' · cronômetro</strong><span>t = '+fmt(state.time)+' s'+(stoppingTime(car)!==null?" · instante de parada: "+fmt(stoppingTime(car))+" s":"")+'</span></div>';
      const times=crossingTimes(car,item.x,state.duration,{brakingMode:state.brakingMode});return'<div class="mruv-instrument-card"><strong>'+esc(item.name)+' · x = '+fmt(item.x)+' m</strong><span>'+ (!times.length?"Sem cruzamento no movimento selecionado.":"Passagem(ns): "+times.map(t=>fmt(t)+" s").join(" · ")+" · "+p.direction)+"</span></div>";
    });
    $("mruv-instrument-readings").innerHTML=cards.join("")||'<p class="mruv-muted">Adicione sensores pela biblioteca de objetos.</p>';
    $("mruv-events").innerHTML=state.events.slice(-20).reverse().map(event=>"<li>"+fmt(event.time)+" s · "+esc(event.cart)+" cruzou "+esc(event.gate)+" em x = "+fmt(event.position)+" m"+(event.interval===null?"":" · Δt = "+fmt(event.interval)+" s")+"</li>").join("")||"<li>Nenhum cruzamento registrado nesta execução.</li>";
    const a=Number($("mruv-ruler-a").value)||0,b=Number($("mruv-ruler-b").value)||0;
    $("mruv-ruler-result").textContent="Δx = "+fmt(b-a)+" m · distância = "+fmt(Math.abs(b-a))+" m";
  }
  function drawChart(spec){
    const canvas=$(spec.id),ctx=canvas.getContext("2d");if(!ctx)return;
    const box=canvas.getBoundingClientRect(),width=Math.max(280,box.width||320),height=Math.max(150,box.height||200),ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    const css=getComputedStyle(document.documentElement),muted=css.getPropertyValue("--muted").trim()||"#9aa6b9",surface=css.getPropertyValue("--surface").trim()||"#101a2c";
    const left=47,right=width-12,top=14,bottom=height-30,values=[];
    const visibleCarts=state.carts.filter(car=>car.chartVisible!==false);
    visibleCarts.forEach(car=>{for(let i=0;i<=60;i++)values.push(spec.value(car,state.duration*i/60));});
    let low=Math.min(0,...values),high=Math.max(0,...values);if(high-low<1e-9){low-=1;high+=1;}
    const pad=(high-low)*.12;low-=pad;high+=pad;
    const center=(low+high)/2,zoomedSpan=(high-low)/graphZoom;low=center-zoomedSpan/2;high=center+zoomedSpan/2;
    const X=t=>left+clamp(t/state.duration,0,1)*(right-left),Y=v=>bottom-(v-low)/(high-low)*(bottom-top);
    ctx.clearRect(0,0,width,height);ctx.fillStyle=surface;ctx.fillRect(0,0,width,height);ctx.strokeStyle="rgba(177,194,219,.17)";ctx.fillStyle=muted;ctx.font="10px system-ui,sans-serif";
    for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.textAlign="right";ctx.fillText(short(high-(high-low)*i/4),left-5,y+3);}
    for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();ctx.textAlign="center";ctx.fillText(short(state.duration*i/4),x,height-7);}
    ctx.strokeStyle="rgba(215,225,238,.7)";ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
    const selected=currentCart(),now=clamp(state.time,0,state.duration);
    if(selected&&selected.chartVisible!==false&&now>0&&(spec.key==="velocity"||spec.key==="acceleration")){ctx.beginPath();ctx.moveTo(X(0),Y(0));for(let i=0;i<=40;i++){const t=now*i/40;ctx.lineTo(X(t),Y(spec.value(selected,t)));}ctx.lineTo(X(now),Y(0));ctx.closePath();ctx.fillStyle="rgba(240,198,110,.12)";ctx.fill();}
    visibleCarts.forEach(car=>{const index=state.carts.indexOf(car);ctx.beginPath();ctx.strokeStyle=validColor(car.color,colorSet[index%5]);ctx.lineWidth=car.id===state.selectedId?2.6:1.8;ctx.setLineDash(index%2?[5,3]:[]);for(let i=0;i<=100;i++){const t=state.duration*i/100,x=X(t),y=Y(spec.value(car,t));if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);});
    if(spec.key==="position"&&selected&&selected.chartVisible!==false){const point=at(selected,now),delta=state.duration/10,t1=Math.max(0,now-delta),t2=Math.min(state.duration,now+delta);ctx.beginPath();ctx.moveTo(X(t1),Y(point.x+point.v*(t1-now)));ctx.lineTo(X(t2),Y(point.x+point.v*(t2-now)));ctx.strokeStyle="#f0c66e";ctx.lineWidth=1.4;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);}
    const marker=X(state.time);ctx.strokeStyle="#f0c66e";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(marker,top);ctx.lineTo(marker,bottom);ctx.stroke();ctx.setLineDash([]);
    if(selected&&selected.chartVisible!==false){ctx.fillStyle="#f0c66e";ctx.beginPath();ctx.arc(marker,Y(spec.value(selected,state.time)),4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=muted;ctx.textAlign="left";ctx.fillText(spec.unit,5,12);
    const legend=$(spec.legend);legend.innerHTML=state.carts.map((car,index)=>'<button class="mruv-legend-item" type="button" data-chart-cart="'+esc(car.id)+'" aria-pressed="'+String(car.chartVisible!==false)+'" style="--legend-color:'+validColor(car.color,colorSet[index%5])+'"><span aria-hidden="true" class="mruv-legend-line '+(index%2?"dashed":"")+'"></span>'+esc(car.name)+'</button>').join("");
    const car=currentCart(),atNow=car?mruvAt(car,state.time):null;$(spec.desc).textContent=spec.key==="position"?(atNow?"Neste instante x = "+fmt(atNow.x)+" m; inclinação tangente v(t) = "+fmt(atNow.v)+" m/s. Curvas exibidas: "+(visibleCarts.map(item=>item.name).join(", ")||"nenhuma")+".":"Adicione um carrinho.") :spec.key==="velocity"?(visibleCarts.map(item=>item.name+": "+fmt(mruvAt(item,state.time).v)+" m/s").join(" · ")||"Oculte ou mostre cada curva pela legenda."):(visibleCarts.map(item=>item.name+": "+fmt(mruvAt(item,state.time).a)+" m/s²").join(" · ")||"Oculte ou mostre cada curva pela legenda.");
  }
  function drawCharts(){chartSpecs.forEach(drawChart);}
  function refreshFrame(forceCharts=false,time=performance.now()){
    drawScene();renderReadouts();renderInstruments();
    if(forceCharts||time-lastChart>120){drawCharts();lastChart=time;}
  }
  function setStatusAt(time,source){
    const car=currentCart(),p=car?mruvAt(car,time):null;$("mruv-graph-inspection").textContent="Ponto de inspeção ("+fmt(time)+" s): "+(car?car.name+" · x = "+fmt(p.x)+" m · v = "+fmt(p.v)+" m/s · a = "+fmt(p.a)+" m/s².":"sem carrinho.");
    if(source==="chart")status("Cursor sincronizado em t = "+fmt(time)+" s.");
  }
  function pause(message=""){
    state.running=false;if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;
    syncPlaybackButtons();if(message)status(message);
  }
  function clearMeasurementRun(){state.events=[];state.logged=new Set();state.lastGateTimes={};state.run++;}
  function changedParameter(pauseAnimation=true){
    if(pauseAnimation&&state.running)pause("Parâmetro alterado. Simulação pausada e recalculada.");
    clearMeasurementRun();if($("mruv-preset").value!=="custom")$("mruv-preset").value="custom";
  }
  function logCrossings(from,to){
    if(to<=from)return;
    for(const gate of state.fixtures.filter(item=>item.kind==="photogate"&&item.visible))for(const car of state.carts){
      const times=crossingTimes(car,gate.x,state.duration,{brakingMode:state.brakingMode});
      for(const t of times){const key=state.run+"|"+gate.id+"|"+car.id+"|"+t.toFixed(8);
        if(t<=from+1e-8||t>to+1e-8||t>state.duration+1e-8||state.logged.has(key))continue;
        state.logged.add(key);const gateKey=gate.id+"|"+car.id,previous=state.lastGateTimes[gateKey];
        state.events.push({time:t,position:gate.x,cart:car.name,gate:gate.name,interval:Number.isFinite(previous)?t-previous:null});
        state.lastGateTimes[gateKey]=t;
      }
    }
  }
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
    status("Simulação em andamento · x(t) = x₀ + v₀t + ½at²; v(t) = v₀ + at.");raf=requestAnimationFrame(animationFrame);
  }
  function setTime(time,source="timeline"){
    pause();state.time=clamp(Number(time)||0,0,state.duration);refreshFrame(true);setStatusAt(state.time,source);
  }
  function step(amount){pause();state.time=clamp(state.time+amount,0,state.duration);refreshFrame(true);status("Instante ajustado para t = "+fmt(state.time)+" s.");}
  function select(id,additive=false){
    const item=entity(id);if(!item)return;
    if(additive){state.selectedIds=state.selectedIds.includes(id)?state.selectedIds.filter(value=>value!==id):state.selectedIds.concat(id);if(!state.selectedIds.includes(state.selectedId))state.selectedId=state.selectedIds.at(-1)||item.id;}
    else{state.selectedId=id;state.selectedIds=[id];}
    if(isCart(item)&&state.follow)state.cameraCenter=mruvAt(item,state.time).x;
    renderObjects();renderProperties();refreshFrame(true);
  }
  function addObject(kind){
    if(["scientific-cart","sport-cart","minimal-cart"].includes(kind)){
      if(state.carts.length>=5){status("A bancada comporta até cinco carrinhos.","error");return;}
      historyPush();const i=state.carts.length,ref=currentCart(),p=ref?mruvAt(ref,state.time):null,car=newCart(i);car.kind=kind;car.x0=p?p.x+2:0;car.v0=p?p.v:0;car.a=ref?ref.a:1;car.vector=state.vectors.velocity;car.vectorA=state.vectors.acceleration;car.vectorD=state.vectors.displacement;state.carts.push(car);select(car.id);
    }else{
      if(state.fixtures.length>=50){status("A bancada comporta até cinquenta referências.","error");return;}
      historyPush();const i=state.fixtures.filter(item=>item.kind===kind).length+1,car=currentCart();
      const item={id:uid("obj"),kind,name:names[kind]+(kind==="time-marker"?"":" "+i),x:car?mruvAt(car,state.time).x+4:0,color:kind==="position-sensor"?"#f0c66e":"#79a8ff",interval:state.sampleInterval,visible:true,locked:false};
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
    if(isCart(item))Object.assign(item,{kind:"scientific-cart",x0:0,v0:2,a:1,color:colorSet[0],wheelColor:"#202935",size:1,wheelRadius:.03,opacity:1,details:true,vector:true,vectorA:true,vectorD:true,trail:true,chartVisible:true,visible:true,locked:false});
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
  function renderInputs(){ $("mruv-duration").value=state.duration;$("mruv-sample-interval").value=state.sampleInterval;$("mruv-playback-rate").value=state.playbackRate;$("mruv-loop").checked=state.loop;$("mruv-braking-mode").checked=state.brakingMode; }
  function renderUiMode(){const beginner=state.uiMode==="beginner";document.body.classList.toggle("mruv-beginner-mode",beginner);document.querySelectorAll("[data-mruv-ui-mode]").forEach(button=>{const active=button.dataset.mruvUiMode===state.uiMode;button.setAttribute("aria-pressed",String(active));button.classList.toggle("is-active",active);});document.querySelectorAll("#mruv-add-type option[data-advanced-only]").forEach(option=>{option.hidden=beginner;});const selector=$("mruv-add-type");if(beginner&&selector.selectedOptions[0]?.hidden)selector.value="scientific-cart";}
function setUiMode(mode){if(mode!=="beginner"&&mode!=="advanced")return;state.uiMode=mode;if(mode==="beginner"&&state.mode!=="explore"){state.mode="explore";state.teacherReveal=false;renderMode();}try{localStorage.setItem("diario-bns-mruv-ui-mode-v1",mode);}catch{}renderUiMode();}
function renderVectorControls(){document.querySelectorAll("#mruv-vector-panel [data-vector]").forEach(button=>{const active=state.vectors[button.dataset.vector]===true;button.setAttribute("aria-pressed",String(active));button.classList.toggle("is-active",active);button.textContent=({velocity:"Velocidade",acceleration:"Aceleração",displacement:"Deslocamento"})[button.dataset.vector]+(active?" · ligado":" · desligado");});}
function toggleVector(key){if(!Object.prototype.hasOwnProperty.call(state.vectors,key))return;const before=capture();state.vectors[key]=!state.vectors[key];const property={velocity:"vector",acceleration:"vectorA",displacement:"vectorD"}[key];if(property)state.carts.forEach(car=>{car[property]=state.vectors[key];});historyPush(before);renderVectorControls();drawScene();updatePendingSave();}
function renderMode(){
    document.querySelectorAll("[data-mruv-mode]").forEach(button=>{const on=button.dataset.mruvMode===state.mode;button.classList.toggle("is-active",on);button.setAttribute("aria-pressed",String(on));});
    $("mruv-mode-note").textContent={explore:"Altere as condições e observe o movimento em tempo real.",investigate:"Faça uma previsão e use o modelo para explicar o resultado.",teacher:"Prepare a demonstração e escolha quando mostrar as respostas."}[state.mode];
    $("mruv-investigation").hidden=state.mode!=="investigate";$("mruv-teacher-reveal").hidden=state.mode!=="teacher";
    const hidden=state.mode==="teacher"&&!state.teacherReveal;$("mruv-results-heading").closest(".mruv-results-card").hidden=hidden;$("mruv-graphs-heading").closest(".mruv-graphs-card").hidden=hidden;$("mruv-table-heading").closest(".mruv-table-card").hidden=hidden;$("mruv-math-card").hidden=hidden;
    $("mruv-teacher-reveal").textContent=state.teacherReveal?"Ocultar resultados":"Mostrar resultados";
  }
  function setupFullscreenTimePicker(){
    const toggle=$("mruv-fullscreen-time-toggle"),picker=$("mruv-fullscreen-time-picker"),input=$("mruv-fullscreen-time-input"),closeButton=$("mruv-fullscreen-time-close");
    const close=()=>{
      picker.hidden=true;
      toggle.setAttribute("aria-expanded","false");
      toggle.textContent="⏱ Escolher tempo";
    };
    toggle.addEventListener("click",()=>{
      if(!picker.hidden){close();return;}
      pause();
      input.max=String(state.duration);
      input.value=String(Number(state.time.toFixed(2)));
      picker.hidden=false;
      toggle.setAttribute("aria-expanded","true");
      toggle.textContent="Fechar seletor";
      requestAnimationFrame(()=>input.focus());
    });
    picker.addEventListener("submit",event=>{
      event.preventDefault();
      input.max=String(state.duration);
      if(!input.reportValidity())return;
      setTime(input.valueAsNumber,"fullscreen");
      close();
      status("Animação ajustada para t = "+fmt(state.time)+" s.");
    });
    closeButton.addEventListener("click",()=>{close();toggle.focus();});
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!picker.hidden){close();toggle.focus();}
    });
    return close;
  }

  function setupFullscreenDock(){
    const stage=$("mruv-stage"),tools=$("mruv-fullscreen-tools"),drawer=$("mruv-fullscreen-drawer"),content=drawer.querySelector(".mruv-fullscreen-drawer-content");
    const selectors=[".mruv-mode-bar",".mruv-camera-details",".mruv-vector-details",".mruv-playback-card",".mruv-results-card","#mruv-math-card","#mruv-graphs-card",".mruv-table-card",".mruv-sidebar",".mruv-investigation-card"];
    const relocated=[];
    const closeTimePicker=setupFullscreenTimePicker();
    function movePanelsIntoDock(){
      for(const selector of selectors){const node=document.querySelector(selector);if(!node||content.contains(node))continue;const marker=document.createComment("fullscreen panel position");node.parentNode.insertBefore(marker,node);content.append(node);relocated.push({node,marker});}
    }
    function restorePanels(){
      for(const {node,marker} of relocated){if(marker.parentNode)marker.parentNode.replaceChild(node,marker);}
      relocated.length=0;
    }
    $("mruv-fullscreen-menu").addEventListener("click",()=>{
      const open=drawer.hidden;drawer.hidden=!open;stage.classList.toggle("mruv-drawer-collapsed",!open);
      $("mruv-fullscreen-menu").setAttribute("aria-expanded",String(open));
      $("mruv-fullscreen-menu").textContent=open?"Fechar painel":"☰ Controles";
      if(open)drawer.scrollTop=0;
      requestAnimationFrame(()=>{refreshFrame(true);drawCharts();});
    });
    $("mruv-fullscreen-play").addEventListener("click",()=>state.running?pause("Simulação pausada."):play());
    $("mruv-fullscreen-exit").addEventListener("click",()=>{if(document.fullscreenElement)document.exitFullscreen();});
    document.addEventListener("fullscreenchange",()=>{
      const active=document.fullscreenElement===stage;
      if(active){
        movePanelsIntoDock();tools.hidden=false;drawer.hidden=true;stage.classList.add("mruv-drawer-collapsed");
        $("mruv-fullscreen-menu").setAttribute("aria-expanded","false");$("mruv-fullscreen-menu").textContent="☰ Controles";
        document.body.classList.add("mruv-fullscreen-active");syncPlaybackButtons();
        requestAnimationFrame(()=>{refreshFrame(true);drawCharts();});
      }else{
        restorePanels();tools.hidden=true;drawer.hidden=true;stage.classList.remove("mruv-drawer-collapsed");
        document.body.classList.remove("mruv-fullscreen-active");syncPlaybackButtons();setTimeout(drawCharts,100);closeTimePicker();
      }
      $("mruv-fullscreen").textContent=active?"Sair da tela cheia":"Tela cheia";
      $("mruv-graphs-fullscreen").textContent=document.fullscreenElement===$("mruv-graphs-card")?"Sair dos gráficos em tela cheia":"Gráficos em tela cheia";
    });
  }
  function renderAll(){
    renderInputs();renderMode();renderObjects();renderProperties();drawScene();renderReadouts();renderInstruments();renderDataTable();drawCharts();renderSavedExperiments();syncHistoryButtons();
    $("mruv-timeline").max=state.duration;$("mruv-timeline").step=Math.min(.05,state.duration/100);document.body.classList.toggle("mruv-reduced-motion",state.reduceMotion);document.body.classList.toggle("mruv-high-contrast",state.highContrast);document.body.classList.toggle("mruv-simple-mode",state.simpleMode);
    updatePendingSave();
  renderVectorControls();renderUiMode();}
  function pointerWorld(event){const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const pos=point.matrixTransform(svg.getScreenCTM().inverse());return cameraMin()+(pos.x-100)/900*state.viewSpan;}
  function installCameraNavigation(){
    const pointers=new Map();let gesture=null,renderFrame=0,lastTap={time:0,x:0,y:0};
    const pointAt=(event)=>{const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;return point.matrixTransform(svg.getScreenCTM().inverse());};
    const intercept=(event)=>{event.preventDefault();event.stopImmediatePropagation();};
    const scheduleRender=()=>{if(renderFrame)return;renderFrame=requestAnimationFrame(()=>{renderFrame=0;drawScene();updatePendingSave();});};
    const resetCamera=()=>{state.viewSpan=24;state.cameraCenter=0;state.cameraFollowOffset=0;state.follow=true;state.cameraOffsetY=0;drawScene();updatePendingSave();};
    const centerCamera=()=>{const car=currentCart();state.follow=false;state.cameraFollowOffset=0;if(car)state.cameraCenter=at(car,state.time).x;state.cameraOffsetY=0;drawScene();updatePendingSave();};
    const fitExperiment=()=>{
      const xs=state.carts.filter(item=>item.visible!==false).map(car=>at(car,state.time).x).concat(state.fixtures.filter(item=>item.visible!==false).map(item=>item.x));
      if(!xs.length){resetCamera();return;}
      const min=Math.min(...xs),max=Math.max(...xs),margin=Math.max(2,(max-min)*.15);
      state.viewSpan=clamp(max-min+margin*2,8,80);state.cameraCenter=(min+max)/2;state.cameraFollowOffset=0;state.follow=false;state.cameraOffsetY=0;drawScene();updatePendingSave();
    };
    const zoomAt=(point,factor)=>{
      const ratio=clamp((point.x-100)/900,0,1),world=cameraMin()+ratio*state.viewSpan,car=currentCart();
      const followedX=car?at(car,state.time).x:null;
      state.viewSpan=clamp(state.viewSpan*factor,8,80);
      if(state.follow&&Number.isFinite(followedX))state.cameraFollowOffset=world-followedX-(ratio-.5)*state.viewSpan;
      else{stopCameraFollow();state.cameraCenter=world-(ratio-.5)*state.viewSpan;}
      drawScene();updatePendingSave();
    };
    const centerPoint=()=>({x:550,y:250});
    $("mruv-zoom-in").addEventListener("click",()=>zoomAt(centerPoint(),1/1.12));$("mruv-fullscreen-zoom-in").addEventListener("click",()=>zoomAt(centerPoint(),1/1.12));
    $("mruv-zoom-out").addEventListener("click",()=>zoomAt(centerPoint(),1.12));$("mruv-fullscreen-zoom-out").addEventListener("click",()=>zoomAt(centerPoint(),1.12));
    $("mruv-zoom-reset").addEventListener("click",()=>{state.viewSpan=24;if(state.follow)state.cameraFollowOffset=0;drawScene();updatePendingSave();});
    $("mruv-center-camera").addEventListener("click",centerCamera);
    $("mruv-fit-camera").addEventListener("click",fitExperiment);
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
    const times=sampleTimes(state.duration,state.sampleInterval,5000),rows=[["tempo_s","carrinho","posicao_x_m","velocidade_m_s","aceleracao_m_s2","deslocamento_m","distancia_m","variacao_velocidade_m_s"]];
    for(const t of times)for(const car of state.carts){const p=mruvAt(car,t),m=mruvMetrics(car,0,t);rows.push([fmt(t),car.name,fmt(p.x),fmt(p.v),fmt(p.a),fmt(p.displacement),fmt(m.distance),fmt(p.v-p.v0)]);}
    download("dados-mruv.csv","\uFEFF"+rows.map(row=>row.map(value=>"\""+String(value).replace(/"/g,"\"\"")+"\"").join(";")).join("\r\n"),"text/csv;charset=utf-8");
  }
  function exportJson(){
    const data={tipo:"Laboratório de MRUV",modelo:"x(t) = x₀ + v₀t + ½at²; v(t) = v₀ + at",criado:new Date().toISOString(),configuração:capture(),tempoAtual_s:state.time,estado:state.carts.map(car=>{const p=mruvAt(car,state.time);return{nome:car.name,x0_m:car.x0,v0_m_s:car.v0,a_m_s2:car.a,xAtual_m:p.x,vAtual_m_s:p.v,aAtual_m_s2:p.a};})};
    download("experimento-mruv.json",JSON.stringify(data,null,2),"application/json;charset=utf-8");
  }
  function importConfig(parsed){
    const config=parsed.configuração||parsed.config||parsed;validateExperiment(config);applyConfig(config);pause();
  }
  const experimentStorageKey="diario-bns-mruv-experiments-v1";
  function savedExperiments(){
    try{const parsed=JSON.parse(localStorage.getItem(experimentStorageKey)||"[]");if(Array.isArray(parsed))return parsed.filter(item=>item&&typeof item.name==="string"&&item.config&&Array.isArray(item.config.carts));
      const legacy=localStorage.getItem("diario-bns-mruv-config-v2");return legacy?[{id:"legacy",name:"Experimento salvo anteriormente",config:JSON.parse(legacy)}]:[];
    }catch{return[];}
  }
  function renderSavedExperiments(){
    const select=$("mruv-saved-experiments"),current=select.value,list=savedExperiments();select.innerHTML='<option value="">Selecione um experimento salvo</option>'+list.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.name)+'</option>').join("");
    if(list.some(item=>item.id===current))select.value=current;const disabled=!select.value;for(const id of ["mruv-load","mruv-duplicate-saved","mruv-rename-saved","mruv-delete-saved"])$(id).disabled=disabled;
  }
  function saveLocal(){
    try{const list=savedExperiments(),select=$("mruv-saved-experiments"),id=select.value;let item=list.find(entry=>entry.id===id);
      if(!item){const name=prompt("Nome para este experimento:","Meu experimento MRUV");if(name===null)return;const clean=String(name).trim().slice(0,48);if(!clean){$("mruv-save-status").textContent="Digite um nome para salvar o experimento.";return;}if(list.length>=50){$("mruv-save-status").textContent="O limite local é de 50 experimentos. Apague um salvo antes de criar outro.";return;}item={id:uid("experiment"),name:clean,config:capture(),updatedAt:new Date().toISOString()};list.push(item);}
      else{item.config=capture();item.updatedAt=new Date().toISOString();}
      localStorage.setItem(experimentStorageKey,JSON.stringify(list));renderSavedExperiments();select.value=item.id;renderSavedExperiments();markSavedConfig();$("mruv-save-status").textContent="“"+item.name+"” salvo neste dispositivo.";
    }catch{$("mruv-save-status").textContent="Não foi possível salvar. Baixe a configuração JSON.";}
  }
  function loadLocal(){
    try{const item=savedExperiments().find(entry=>entry.id===$("mruv-saved-experiments").value);if(!item){$("mruv-save-status").textContent="Selecione um experimento salvo para carregar.";return;}historyPush(capture());importConfig(item.config);markSavedConfig();$("mruv-save-status").textContent="“"+item.name+"” carregado.";}
    catch(error){$("mruv-save-status").textContent="O experimento salvo não passou pela validação: "+error.message;}
  }
  function duplicateSaved(){
    try{const list=savedExperiments(),source=list.find(item=>item.id===$("mruv-saved-experiments").value);if(!source)return;if(list.length>=50){$("mruv-save-status").textContent="O limite local é de 50 experimentos. Apague um salvo antes de duplicar.";return;}const copy={...clone(source),id:uid("experiment"),name:(source.name+" (cópia)").slice(0,48),updatedAt:new Date().toISOString()};list.push(copy);localStorage.setItem(experimentStorageKey,JSON.stringify(list));renderSavedExperiments();$("mruv-saved-experiments").value=copy.id;renderSavedExperiments();$("mruv-save-status").textContent="Cópia “"+copy.name+"” criada.";}catch{$("mruv-save-status").textContent="Não foi possível duplicar. Exporte a configuração JSON.";}
  }
  function renameSaved(){
    try{const list=savedExperiments(),item=list.find(entry=>entry.id===$("mruv-saved-experiments").value);if(!item)return;const name=prompt("Novo nome do experimento:",item.name);if(name===null)return;const clean=String(name).trim().slice(0,48);if(!clean){$("mruv-save-status").textContent="O nome não pode ficar vazio.";return;}item.name=clean;localStorage.setItem(experimentStorageKey,JSON.stringify(list));renderSavedExperiments();$("mruv-saved-experiments").value=item.id;renderSavedExperiments();$("mruv-save-status").textContent="Experimento renomeado para “"+item.name+"”.";}catch{$("mruv-save-status").textContent="Não foi possível renomear o experimento salvo.";}
  }
  function deleteSaved(){
    try{const list=savedExperiments(),id=$("mruv-saved-experiments").value,item=list.find(entry=>entry.id===id);if(!item)return;if(!confirm("Apagar o experimento salvo “"+item.name+"”?"))return;localStorage.setItem(experimentStorageKey,JSON.stringify(list.filter(entry=>entry.id!==id)));renderSavedExperiments();$("mruv-save-status").textContent="Experimento salvo apagado.";}catch{$("mruv-save-status").textContent="Não foi possível apagar o experimento salvo.";}
  }
  async function shareConfig(){
    const url=location.origin+location.pathname+"?config="+encodeURIComponent(JSON.stringify(capture()));
    if(url.length>5000){$("mruv-save-status").textContent="A configuração é grande para compartilhar por link; use o arquivo JSON.";return;}
    try{await navigator.clipboard.writeText(url);$("mruv-save-status").textContent="Link da configuração copiado.";}
    catch{$("mruv-save-status").textContent="O navegador não liberou a cópia. Exporte o arquivo JSON para compartilhar.";}
  }
  function exportScene(){
    const copy=svg.cloneNode(true);copy.setAttribute("xmlns",NS);
    const style=document.createElementNS(NS,"style");
    style.textContent=".mruv-scene-bg{fill:#0b1524}.mruv-grid-line{stroke:rgba(193,211,236,.12)}.mruv-grid-major{stroke:rgba(193,211,236,.23)}.mruv-grid-label,.mruv-axis-label,.mruv-object-label,.mruv-cart-label{font:13px system-ui,sans-serif;fill:#d7e1ee}.mruv-grid-label{font-size:12px;fill:#9eabc0}.mruv-axis-line{stroke:#d4deea;stroke-width:2}.mruv-zero-line{stroke:#f0c66e;stroke-width:2;stroke-dasharray:6 5}.mruv-track-rail{stroke:#aab7c7;stroke-width:5}.mruv-track-stripe{stroke:#526176;stroke-width:2;stroke-dasharray:12 12}.mruv-tick{stroke:#bbc7d6}.mruv-tick-major{stroke:#f0c66e}.mruv-cart-wheel{fill:#202935;stroke:#080c12}.mruv-cart-hub{fill:#b9c5d3}.mruv-wheel-spoke{stroke:#e3e8ed}.mruv-trail{fill:none;stroke:#79a8ff;stroke-width:3;stroke-dasharray:3 8}.mruv-vector{stroke:#79a8ff;stroke-width:3}.mruv-displacement-vector{fill:none;stroke:#75d6c1;stroke-width:2;stroke-dasharray:4 3}";
    copy.insertBefore(style,copy.firstChild);download("pista-mruv.svg",new XMLSerializer().serializeToString(copy),"image/svg+xml;charset=utf-8");
  }
  function exportCharts(){
    chartSpecs.forEach(spec=>{const link=document.createElement("a");link.href=$(spec.id).toDataURL("image/png");link.download=spec.id+".png";document.body.append(link);link.click();link.remove();});
  }
  function checkPrediction(){
    const car=currentCart(),answerX=Number($("mruv-prediction").value),answerV=Number($("mruv-prediction-v").value),time=Number($("mruv-prediction-time").value);
    if(!car||$("mruv-prediction").value.trim()===""||$("mruv-prediction-v").value.trim()===""||$("mruv-prediction-time").value.trim()===""||!Number.isFinite(answerX)||!Number.isFinite(answerV)||!Number.isFinite(time)||time<0||time>state.duration){$("mruv-prediction-feedback").textContent="Informe previsões válidas para um instante entre zero e a duração do experimento.";return;}
    const expected=mruvAt(car,time),positionMatches=Math.abs(answerX-expected.x)<=.05,velocityMatches=Math.abs(answerV-expected.v)<=.05;
    $("mruv-prediction-feedback").textContent=(positionMatches?"Posição correta":"Posição prevista incorretamente")+" · x("+fmt(time)+" s) = "+fmt(expected.x)+" m; "+(velocityMatches?"velocidade correta":"velocidade prevista incorretamente")+" · v("+fmt(time)+" s) = "+fmt(expected.v)+" m/s. Explique usando as equações horárias e os sinais de v₀ e a.";
  }
  function loadPreset(key=$("mruv-preset").value){
    const cart=(name,x0,v0,a,kind="scientific-cart",color="#4f88df")=>({id:uid("cart"),kind,name,x0,v0,a,color,wheelColor:"#202935",size:1,wheelRadius:.03,opacity:1,details:true,vector:true,vectorA:true,vectorD:true,trail:true,chartVisible:true,visible:true,locked:false});
    const presets={
      rest:{duration:10,carts:[cart("Partida do repouso",0,0,2)],fixtures:newFixtures(),question:"Partindo do repouso, qual será a posição e a velocidade após 4 s?"},
      initial:{duration:8,carts:[cart("Velocidade inicial",0,2,1)],fixtures:newFixtures(),question:"Compare a contribuição da velocidade inicial e da aceleração após 3 s."},
      brake:{duration:8,carts:[cart("Aceleração oposta",0,10,-2)],fixtures:newFixtures(),brakingMode:true,question:"Em que instante a rapidez zera? Compare a frenagem controlada com a continuação da aceleração no MRUV estrito."},
      retrograde:{duration:8,carts:[cart("Sentido negativo",8,-2,-1)],fixtures:newFixtures(),question:"A posição diminui ou aumenta? O que o sinal de a indica neste movimento?"},
      compare:{duration:10,carts:[cart("MRU",0,2,0,"minimal-cart","#54b79b"),cart("MRUV",0,2,1,"sport-cart","#d17953")],fixtures:newFixtures(),question:"Em intervalos iguais, os dois carrinhos percorrem distâncias iguais?"},
      meeting:{duration:8,carts:[cart("Móvel A",0,10,-2,"scientific-cart","#4f88df"),cart("Móvel B",20,0,0,"sport-cart","#d17953")],fixtures:newFixtures(),question:"Quantas vezes os carrinhos se encontram no intervalo?"},
      accelerations:{duration:10,carts:[cart("Aceleração positiva",0,0,1,"scientific-cart","#4f88df"),cart("Aceleração negativa",16,0,-.5,"sport-cart","#d17953")],fixtures:newFixtures(),question:"Como os sinais das acelerações alteram as curvas de posição?"},
      turn:{duration:8,carts:[cart("Inversão",0,8,-2)],fixtures:newFixtures(),question:"Marque o instante em que o carrinho para e identifique o sentido depois dele."},
      measure:{duration:8,carts:[cart("Carrinho medido",0,1,1.2)],fixtures:[{id:uid("sensor"),kind:"position-sensor",name:"Sensor A",x:4,color:"#f0c66e",visible:true,locked:false},{id:uid("gate"),kind:"photogate",name:"Fotocélula",x:8,color:"#79a8ff",visible:true,locked:false}],question:"Use os dados da tabela para estimar Δv/Δt e comparar com a aceleração configurada."},
      challenge:{duration:8,carts:[cart("Desafio",0,3,-.5)],fixtures:newFixtures(),question:"Antes de iniciar, preveja x e v do carrinho após 3 s; depois compare com a simulação."}
    };
    const chosen=presets[key];if(!chosen){status("Escolha um experimento guiado na lista.","error");return;}
    pause();state.selectedId=null;state.selectedIds=[];state.mode=key==="challenge"?"investigate":"explore";state.teacherReveal=false;
    applyConfig({...initialConfig(),...chosen,sampleInterval:1,playbackRate:1,loop:true,brakingMode:chosen.brakingMode===true});
    state.selectedId=state.carts[0].id;state.selectedIds=[state.selectedId];
    $("mruv-challenge-question").textContent=chosen.question;$("mruv-preset").value=key;renderAll();status("Experimento carregado. Revise as condições iniciais antes de iniciar.");
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
    const item=entity(node.dataset.entityId);if(!item)return;const alreadySelected=state.selectedIds.includes(item.id);if(!alreadySelected||event.shiftKey)select(item.id,event.shiftKey);if(item.locked)return;
    if(state.running)pause("Simulação pausada para reposicionar.");
    dragBefore=capture();state.drag={id:item.id,pointer:event.pointerId,lastX:pointerWorld(event),groupIds:state.selectedIds.slice(),moved:false};svg.setPointerCapture(event.pointerId);event.preventDefault();
  }
  function moveDrag(event){
    if(!state.drag||state.drag.pointer!==event.pointerId)return;const item=entity(state.drag.id);if(!item)return;
    const x=pointerWorld(event),delta=x-state.drag.lastX;state.drag.lastX=x;if(state.follow&&state.drag.groupIds.some(id=>isCart(entity(id))))stopCameraFollow();for(const id of state.drag.groupIds){const member=entity(id);if(!member||member.locked)continue;if(isCart(member))member.x0+=delta;else member.x+=delta;}state.drag.moved=true;
    if(!dragRenderFrame)dragRenderFrame=requestAnimationFrame(()=>{dragRenderFrame=0;refreshFrame(false,performance.now());});
  }
  function stopDrag(event){
    if(!state.drag||state.drag.pointer!==event.pointerId)return;
    if(dragRenderFrame){cancelAnimationFrame(dragRenderFrame);dragRenderFrame=0;}
    if(state.drag.moved){historyPush(dragBefore);changedParameter();renderObjects();renderProperties();refreshFrame(true);renderDataTable();drawCharts();}
    state.drag=null;dragBefore=null;updatePendingSave();
  }

  $("mruv-object-list").addEventListener("click",event=>{const button=event.target.closest("[data-select-id]");if(button)select(button.dataset.selectId,event.shiftKey);});
  $("mruv-add-object").addEventListener("click",()=>addObject($("mruv-add-type").value));
  $("mruv-duplicate").addEventListener("click",duplicateSelection);$("mruv-remove").addEventListener("click",removeSelection);
  $("mruv-restore-object").addEventListener("click",restoreSelected);$("mruv-layer-up").addEventListener("click",()=>moveLayer(1));$("mruv-layer-down").addEventListener("click",()=>moveLayer(-1));
  $("mruv-clear-scene").addEventListener("click",clearScene);$("mruv-undo").addEventListener("click",undo);$("mruv-redo").addEventListener("click",redo);
  $("mruv-play").addEventListener("click",()=>state.running?pause("Simulação pausada. O estado foi preservado."):play());
  $("mruv-step-back").addEventListener("click",()=>step(-(Number($("mruv-step-size").value)||.5)));
  $("mruv-step-forward").addEventListener("click",()=>step(Number($("mruv-step-size").value)||.5));
  $("mruv-reset").addEventListener("click",()=>{pause();state.time=0;clearMeasurementRun();refreshFrame(true);status("Relógio reiniciado; parâmetros preservados.");});
  $("mruv-return-start").addEventListener("click",()=>setTime(0));
  $("mruv-timeline").addEventListener("input",event=>setTime(Number(event.target.value)));
  $("mruv-duration").addEventListener("change",event=>setDuration(Number(event.target.value)));
  $("mruv-sample-interval").addEventListener("change",event=>setSampleInterval(Number(event.target.value)));
  $("mruv-playback-rate").addEventListener("change",event=>{state.playbackRate=Number(event.target.value);updatePendingSave();});
  $("mruv-load-preset").addEventListener("click",()=>loadPreset());
  $("mruv-braking-mode").addEventListener("change",event=>{const before=capture();state.brakingMode=event.target.checked;historyPush(before);changedParameter();renderAll();status(state.brakingMode?"Frenagem por trechos ativada: a aceleração para quando v = 0.":"MRUV estrito ativado: a aceleração continua após a inversão.");});
  $("mruv-step-size").addEventListener("change",event=>{const n=Number(event.target.value);if(!Number.isFinite(n)||n<=0||n>10){event.target.value=".5";status("O passo temporal deve ficar entre 0,01 e 10 s.","error");}});
  $("mruv-loop").addEventListener("change",event=>{state.loop=event.target.checked;updatePendingSave();});
  $("mruv-view-span").addEventListener("input",event=>{state.viewSpan=clamp(Number(event.target.value),8,80);$("mruv-view-span-value").textContent=fmt(state.viewSpan,0)+" m";drawScene();updatePendingSave();});
  $("mruv-pan-left").addEventListener("click",()=>{stopCameraFollow();state.cameraCenter-=state.viewSpan*.2;drawScene();updatePendingSave();});
  $("mruv-pan-right").addEventListener("click",()=>{stopCameraFollow();state.cameraCenter+=state.viewSpan*.2;drawScene();updatePendingSave();});
  $("mruv-follow-toggle").addEventListener("click",()=>{if(state.follow){const car=currentCart();if(car)state.cameraCenter=at(car,state.time).x+state.cameraFollowOffset;state.follow=false;}else{state.follow=true;state.cameraFollowOffset=0;}state.cameraOffsetY=0;drawScene();updatePendingSave();});
  $("mruv-recenter").addEventListener("click",()=>{state.follow=true;state.cameraFollowOffset=0;state.cameraOffsetY=0;drawScene();updatePendingSave();});
  $("mruv-show-grid").addEventListener("change",event=>{state.showGrid=event.target.checked;drawScene();updatePendingSave();});
  $("mruv-reduce-motion").addEventListener("change",event=>{state.reduceMotion=event.target.checked;document.body.classList.toggle("mruv-reduced-motion",state.reduceMotion);drawScene();updatePendingSave();});
  $("mruv-high-contrast").addEventListener("change",event=>{state.highContrast=event.target.checked;document.body.classList.toggle("mruv-high-contrast",state.highContrast);updatePendingSave();});
  $("mruv-simple-mode").addEventListener("change",event=>{state.simpleMode=event.target.checked;document.body.classList.toggle("mruv-simple-mode",state.simpleMode);updatePendingSave();});
  $("mruv-text-size").addEventListener("input",event=>{const size=Number(event.target.value);document.documentElement.style.fontSize=size+"%";$("mruv-text-size-value").textContent=size+"%";});
  $("mruv-graph-zoom").addEventListener("change",event=>{graphZoom=Number(event.target.value)||1;drawCharts();});
  $("mruv-ruler-a").addEventListener("input",renderInstruments);$("mruv-ruler-b").addEventListener("input",renderInstruments);
  $("mruv-saved-experiments").addEventListener("change",renderSavedExperiments);$("mruv-duplicate-saved").addEventListener("click",duplicateSaved);$("mruv-rename-saved").addEventListener("click",renameSaved);$("mruv-delete-saved").addEventListener("click",deleteSaved);
  $("mruv-save").addEventListener("click",saveLocal);$("mruv-save-pending").addEventListener("click",saveLocal);$("mruv-discard-pending").addEventListener("click",discardPendingConfig);$("mruv-load").addEventListener("click",loadLocal);$("mruv-share").addEventListener("click",shareConfig);
  $("mruv-export-csv").addEventListener("click",exportCsv);$("mruv-export-json").addEventListener("click",exportJson);$("mruv-export-scene").addEventListener("click",exportScene);$("mruv-export-graphs").addEventListener("click",exportCharts);
  $("mruv-import-file").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{if(file.size>500000)throw new RangeError("O arquivo excede 500 KB.");importConfig(JSON.parse(await file.text()));$("mruv-save-status").textContent="Configuração importada.";}
    catch(error){$("mruv-save-status").textContent="Não foi possível importar: "+error.message;}event.target.value="";
  });
  $("mruv-reset-config").addEventListener("click",()=>{
    if(!confirm("Restaurar a cena inicial? As alterações feitas nesta página serão substituídas."))return;
    pause();state.selectedId=null;state.selectedIds=[];state.mode="explore";state.teacherReveal=false;state.loop=true;undoStack.length=0;redoStack.length=0;applyConfig(initialConfig());state.selectedId=state.carts[0].id;state.selectedIds=[state.selectedId];renderAll();status("Configuração inicial restaurada.");
  });
  $("mruv-check-prediction").addEventListener("click",checkPrediction);
  $("mruv-teacher-reveal").addEventListener("click",()=>{state.teacherReveal=!state.teacherReveal;renderMode();});
  document.querySelectorAll("[data-mruv-mode]").forEach(button=>button.addEventListener("click",()=>{state.mode=button.dataset.mruvMode;state.teacherReveal=false;renderMode();}));
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
  $("mruv-chart-grid").addEventListener("click",event=>{const button=event.target.closest("[data-chart-cart]");if(!button)return;const car=state.carts.find(item=>item.id===button.dataset.chartCart);if(!car)return;const before=capture();car.chartVisible=car.chartVisible===false;historyPush(before);renderProperties();drawCharts();updatePendingSave();});
  $("mruv-fullscreen").addEventListener("click",async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await $("mruv-stage").requestFullscreen();}
    catch{status("Tela cheia indisponível neste navegador.","error");}
  });
  $("mruv-graphs-fullscreen").addEventListener("click",async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await $("mruv-graphs-card").requestFullscreen();}
    catch{status("Tela cheia dos gráficos indisponível neste navegador.","error");}
  });
  chartSpecs.forEach(spec=>{
    const canvas=$(spec.id);
    canvas.addEventListener("pointermove",event=>{const box=canvas.getBoundingClientRect(),ratio=clamp((event.clientX-box.left-47)/Math.max(1,box.width-59),0,1),t=ratio*state.duration;setStatusAt(t,"chart");});
    canvas.addEventListener("click",event=>{const box=canvas.getBoundingClientRect(),ratio=clamp((event.clientX-box.left-47)/Math.max(1,box.width-59),0,1);setTime(ratio*state.duration,"chart");});
    canvas.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();setTime(state.time+(event.key==="ArrowRight"?1:-1),"chart");}});
  });
  window.addEventListener("resize",drawCharts);
  if("ResizeObserver"in window){const observer=new ResizeObserver(drawCharts);document.querySelectorAll(".mruv-chart").forEach(node=>observer.observe(node));}
  const shared=new URLSearchParams(location.search).get("config");
  if(shared){try{importConfig(JSON.parse(shared));}catch(error){status("Configuração do link inválida: "+error.message,"error");}}
  document.querySelectorAll("[data-mruv-ui-mode]").forEach(button=>button.addEventListener("click",()=>setUiMode(button.dataset.mruvUiMode)));document.querySelectorAll("#mruv-vector-panel [data-vector]").forEach(button=>button.addEventListener("click",()=>toggleVector(button.dataset.vector)));state.selectedId=state.carts[0].id;state.selectedIds=[state.selectedId];renderAll();setupFullscreenDock();
})();
