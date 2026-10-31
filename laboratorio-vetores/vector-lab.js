import {
  accelerationFromForce, add, angleBetween, cross, dot, magnitude, multiply,
  positionAtTime, project3D, projectOnto, sum, subtract, torque, unit,
  vector3, velocityAtTime
} from "./vector-core.mjs";

const $ = (id) => document.getElementById(id);
const quantityInfo = {
  abstract: { label: "Vetor abstrato", unit: "", dimension: "abstract" },
  position: { label: "Posição", unit: "m", dimension: "length" },
  displacement: { label: "Deslocamento", unit: "m", dimension: "length" },
  velocity: { label: "Velocidade", unit: "m/s", dimension: "velocity" },
  acceleration: { label: "Aceleração", unit: "m/s²", dimension: "acceleration" },
  force: { label: "Força", unit: "N", dimension: "force" },
  momentum: { label: "Quantidade de movimento", unit: "kg·m/s", dimension: "momentum" },
  impulse: { label: "Impulso", unit: "N·s", dimension: "impulse" },
  "electric-field": { label: "Campo elétrico", unit: "N/C", dimension: "electric-field" },
  "magnetic-field": { label: "Campo magnético", unit: "T", dimension: "magnetic-field" },
  torque: { label: "Torque", unit: "N·m", dimension: "torque" },
  "angular-velocity": { label: "Velocidade angular", unit: "rad/s", dimension: "angular-velocity" },
  "angular-momentum": { label: "Momento angular", unit: "kg·m²/s", dimension: "angular-momentum" }
};
const colors = ["#55a4ff","#ff7d78","#62d2a2","#ce91ff","#ffc45d","#56dce0","#ff8dc0","#b5dc61"];
const storageKey = "diario-bns-vector-lab-v1";
const defaultMotion = { r0:{x:0,y:0,z:0},v0:{x:4,y:8,z:0},a:{x:0,y:-9.80665,z:0},time:0,playing:false,speed:1,maxTime:5,trajectory:true,showVelocity:true,showAcceleration:true };

function makeVector(data = {}) {
  const raw = {
    id: data.id || crypto.randomUUID(),
    name: String(data.name || "Vetor"),
    color: /^#[0-9a-f]{6}$/i.test(data.color || "") ? data.color : colors[0],
    quantity: quantityInfo[data.quantity] ? data.quantity : "abstract",
    origin: vector3(data.origin || {}),
    components: vector3(data.components || {}),
    visible: data.visible !== false,
    include: data.include !== false,
    locked: Boolean(data.locked),
    lockOrigin: Boolean(data.lockOrigin),
    lockModule: Boolean(data.lockModule),
    lockAngle: Boolean(data.lockAngle),
    attachedToBody: Boolean(data.attachedToBody)
  };
  if (!raw.name.trim()) raw.name = "Vetor";
  return raw;
}
function freshScene() {
  const first = makeVector({name:"Vetor A",color:colors[0],quantity:"abstract",components:{x:4,y:3}});
  const second = makeVector({name:"Vetor B",color:colors[1],quantity:"abstract",components:{x:-1,y:2}});
  const third = makeVector({name:"Vetor C",color:colors[2],quantity:"abstract",components:{x:1,y:-2},include:false});
  return {
    version:1,dimension:2,tool:"select",vectors:[first,second,third],selectedId:first.id,
    camera:{zoom:48,panX:0,panY:0,yaw:-Math.PI/4,pitch:Math.PI/5},
    showGrid:true,showComponents:false,showAngles:true,snap:false,angleUnit:"deg",angleConvention:"0-360",
    operation:"sum",scale:2,addMethod:"components",showResult:true,connectNext:false,learningMode:"free",experiment:"perpendicular",
    contrast:false,lowStimulus:false,reducedMotion:false,showSteps:true,
    body:{mass:2,position:{x:0,y:0,z:0},pivot:{x:0,y:0,z:0}},
    motion:structuredClone(defaultMotion)
  };
}
function loadScene() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!raw || raw.version !== 1 || !Array.isArray(raw.vectors)) return freshScene();
    const base = freshScene();
    const vectors = raw.vectors.slice(0,300).map(makeVector);
    if (!vectors.length) vectors.push(...base.vectors);
    return {
      ...base,...raw,vectors,
      selectedId:vectors.some((v)=>v.id===raw.selectedId)?raw.selectedId:vectors[0].id,
      camera:{...base.camera,...(raw.camera||{})},
      body:{...base.body,...(raw.body||{}),position:vector3(raw.body?.position||base.body.position),pivot:vector3(raw.body?.pivot||base.body.pivot)},
      motion:{...structuredClone(defaultMotion),...(raw.motion||{}),r0:vector3(raw.motion?.r0||defaultMotion.r0),v0:vector3(raw.motion?.v0||defaultMotion.v0),a:vector3(raw.motion?.a||defaultMotion.a)}
    };
  } catch { return freshScene(); }
}
let state = loadScene();
let undoStack = [], redoStack = [], inputBefore = null, interaction = null, rafId = 0, previousFrame = 0;
const pointers = new Map();
let pinchStart = null;
const canvas = $("vl-canvas");
const ctx = canvas.getContext("2d");
let canvasWidth = 1, canvasHeight = 1, pixelRatio = 1, resizeObserver;
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const clone = (value)=>JSON.parse(JSON.stringify(value));
const esc = (value)=>String(value).replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fmt = (value,digits=3)=>Number(value).toLocaleString("pt-BR",{maximumFractionDigits:digits,minimumFractionDigits:0});
const fmtVector = (v)=>"("+fmt(v.x)+", "+fmt(v.y)+", "+fmt(v.z)+")";
const info = (v)=>quantityInfo[v.quantity] || quantityInfo.abstract;
const selected = ()=>state.vectors.find((v)=>v.id===state.selectedId) || state.vectors[0] || null;
const endOf = (v)=>add(v.origin,v.components);
const startOf = (v)=>v.attachedToBody?vector3(state.body.position):v.origin;
const combinedUnit = (a,b,separator="·") => a&&b?a+separator+b:(a||b);
function saveLocal() {
  try { localStorage.setItem(storageKey,JSON.stringify(state)); $("vl-live-status").textContent="Cena salva neste navegador"; }
  catch { $("vl-live-status").textContent="Não foi possível salvar neste navegador"; }
}
function snapshotUndo(before = clone(state)) {
  undoStack.push(before);
  if (undoStack.length>60) undoStack.shift();
  redoStack.length=0;
}
function notify(message) { $("vl-canvas-message").textContent=message||""; }
function setStatus(message) { $("vl-live-status").textContent=message; window.setTimeout(()=>{ if($("vl-live-status").textContent===message)$("vl-live-status").textContent="Atualizado"; },1800); }

function selectedComponents() {
  const vector=selected();
  if(!vector) return null;
  const origin=startOf(vector), end=add(origin,vector.components);
  return {vector,origin,end,module:magnitude(vector.components),direction:unit(vector.components),angle:Math.atan2(vector.components.y,vector.components.x)};
}
function displayedAngle(angle) {
  if(state.angleConvention==="0-360") angle=(angle+Math.PI*2)%(Math.PI*2);
  else { while(angle>Math.PI)angle-=Math.PI*2; while(angle<=-Math.PI)angle+=Math.PI*2; }
  return state.angleUnit==="deg"?fmt(angle*180/Math.PI,2)+"°":fmt(angle,3)+" rad";
}
function updateEditor(vector=selected()) {
  const form=$("vl-vector-list");
  if(!vector) {
    ["vl-name","vl-quantity","vl-color","vl-ox","vl-oy","vl-oz","vl-vx","vl-vy","vl-vz","vl-lock-origin","vl-lock-module","vl-lock-angle","vl-lock-vector"].forEach((id)=>$(id).disabled=true);
    return;
  }
  ["vl-name","vl-quantity","vl-color","vl-ox","vl-oy","vl-oz","vl-vx","vl-vy","vl-vz","vl-lock-origin","vl-lock-module","vl-lock-angle","vl-lock-vector"].forEach((id)=>$(id).disabled=false);
  $("vl-name").value=vector.name;
  $("vl-quantity").value=vector.quantity;
  $("vl-color").value=vector.color;
  $("vl-ox").value=fmt(vector.origin.x,6); $("vl-oy").value=fmt(vector.origin.y,6); $("vl-oz").value=fmt(vector.origin.z,6);
  $("vl-vx").value=fmt(vector.components.x,6); $("vl-vy").value=fmt(vector.components.y,6); $("vl-vz").value=fmt(vector.components.z,6);
  $("vl-lock-origin").checked=vector.lockOrigin; $("vl-lock-module").checked=vector.lockModule; $("vl-lock-angle").checked=vector.lockAngle; $("vl-lock-vector").checked=vector.locked;
}
function renderVectorList() {
  const list=$("vl-vector-list");
  list.innerHTML=state.vectors.map((v)=>"<div class=\"vl-vector-item"+(v.id===state.selectedId?" is-selected":"")+"\" data-vector-item=\""+esc(v.id)+"\">"+
    "<input type=\"checkbox\" data-visible=\""+esc(v.id)+"\" aria-label=\"Mostrar "+esc(v.name)+"\" "+(v.visible?"checked":"")+">"+
    "<button type=\"button\" data-select=\""+esc(v.id)+"\" aria-pressed=\""+(v.id===state.selectedId)+"\">"+esc(v.name)+" <span class=\"vl-vector-vector\">("+fmt(v.components.x)+", "+fmt(v.components.y)+(state.dimension===3?", "+fmt(v.components.z):"")+") "+esc(info(v).unit)+"</span></button>"+
    "<input type=\"color\" data-color=\""+esc(v.id)+"\" value=\""+esc(v.color)+"\" aria-label=\"Cor de "+esc(v.name)+"\">"+
    "<input type=\"checkbox\" data-include=\""+esc(v.id)+"\" aria-label=\"Incluir "+esc(v.name)+" na operação\" "+(v.include?"checked":"")+">"+
    "</div>").join("");
}
function compatibleVectors(vectors) {
  if(!vectors.length) return {ok:false,message:"Selecione ou inclua pelo menos um vetor."};
  const first=info(vectors[0]).dimension;
  if(vectors.some((v)=>info(v).dimension!==first)) return {ok:false,message:"A operação de soma exige vetores da mesma grandeza. Altere a categoria ou a seleção."};
  return {ok:true,dimension:first,unit:info(vectors[0]).unit};
}
function operationResult() {
  const included=state.vectors.filter((v)=>v.visible&&v.include);
  const chosen=state.vectors.filter((v)=>v.visible&&v.include);
  const op=state.operation;
  if(op==="sum") {
    const compatible=compatibleVectors(included);
    if(!compatible.ok)return {error:compatible.message};
    return {kind:"vector",value:sum(included.map((v)=>v.components)),unit:compatible.unit,caption:"R = Σ Aᵢ",steps:included.map((v)=>v.name+" = "+fmtVector(v.components)).join("\n")+" \nR = "+fmtVector(sum(included.map((v)=>v.components)))};
  }
  const pair=chosen.slice(0,2);
  if(op!=="scale"&&pair.length<2)return {error:"Inclua dois vetores na lista para esta operação."};
  if(op==="subtract") {
    const c=compatibleVectors(pair);if(!c.ok)return {error:c.message};
    return {kind:"vector",value:subtract(pair[0].components,pair[1].components),unit:c.unit,caption:"R = A − B",steps:"A − B = "+fmtVector(pair[0].components)+" − "+fmtVector(pair[1].components)+"\nR = "+fmtVector(subtract(pair[0].components,pair[1].components))};
  }
  if(op==="scale") {
    const v=chosen[0]||selected();if(!v)return {error:"Crie ou selecione um vetor."};
    const k=Number($("vl-scale").value);if(!Number.isFinite(k))return {error:"Informe um escalar finito."};
    const value=multiply(v.components,k);
    return {kind:"vector",value,unit:info(v).unit,caption:"R = kA",steps:"k = "+fmt(k)+"\nR = "+fmt(k)+" × "+fmtVector(v.components)+" = "+fmtVector(value)};
  }
  if(op==="dot") {
    const value=dot(pair[0].components,pair[1].components);
    const angle=angleBetween(pair[0].components,pair[1].components);
    return {kind:"scalar",value,unit:combinedUnit(info(pair[0]).unit,info(pair[1]).unit),caption:"A · B",angle,steps:"A · B = AxBx + AyBy + AzBz\nA · B = "+fmt(value)};
  }
  if(op==="cross") {
    const value=cross(pair[0].components,pair[1].components);
    if(state.dimension===2) return {kind:"scalar",value:value.z,unit:combinedUnit(info(pair[0]).unit,info(pair[1]).unit,"×"),caption:"(A × B)z · k̂",outOfPlane:value.z,steps:"A × B = (AyBz − AzBy, AzBx − AxBz, AxBy − AyBx)\nNo plano xy: (A × B)z = AxBy − AyBx = "+fmt(value.z)+". O sinal indica o sentido perpendicular ao plano (regra da mão direita)."};
    return {kind:"vector",value,unit:combinedUnit(info(pair[0]).unit,info(pair[1]).unit,"×"),caption:"R = A × B",steps:"A × B = (AyBz − AzBy, AzBx − AxBz, AxBy − AyBx)\nR = "+fmtVector(value)};
  }
  if(op==="projection") {
    const projected=projectOnto(pair[0].components,pair[1].components);
    if(!projected)return {error:"A projeção sobre o vetor nulo não está definida."};
    return {kind:"vector",value:projected.vector,unit:info(pair[0]).unit,caption:"projB(A)",scalar:projected.scalar,perpendicular:projected.perpendicular,steps:"projB(A) = [(A · B)/|B|²] B\nprojB(A) = "+fmtVector(projected.vector)+"\nComponente perpendicular = "+fmtVector(projected.perpendicular)};
  }
  return {error:"Escolha uma operação."};
}
function renderOperation() {
  const result=operationResult(), output=$("vl-operation-result");
  $("vl-add-method-row").hidden=state.operation!=="sum";
  if(result.error) {
    output.innerHTML="<span class=\"vl-error\">"+esc(result.error)+"</span>";
    state.resultVector=null;
    return;
  }
  const selectedUnit=result.unit&&result.unit!=="1"?" "+esc(result.unit):"";
  if(result.kind==="vector") {
    output.innerHTML="<strong>"+esc(result.caption)+"</strong> = "+esc(fmtVector(result.value))+selectedUnit+"<br>|R| = "+fmt(magnitude(result.value))+(selectedUnit?" "+esc(result.unit):"");
    state.resultVector={components:vector3(result.value),color:"#f4d36e",name:"Resultante"};
  } else {
    const angleText=result.angle===undefined?"":result.angle===null?"<br>Ângulo não definido.":"<br>Ângulo = "+displayedAngle(result.angle);
    output.innerHTML="<strong>"+esc(result.caption)+"</strong> = "+fmt(result.value)+(result.unit?" "+esc(result.unit):"")+angleText;
    state.resultVector=null;
  }
  if(state.showSteps) output.innerHTML+="<div class=\"vl-equation-steps\">"+esc(result.steps).replace(/\n/g,"<br>")+"</div>";
}

function renderReadouts() {
  const data=selectedComponents();
  if(!data) {
    $("vl-selected-readout").textContent="Nenhum vetor selecionado.";
    $("vl-components-readout").textContent="—"; $("vl-equation-readout").textContent="—"; $("vl-physics-readout").textContent="—";
    renderProperties();
    return;
  }
  const v=data.vector, unitLabel=info(v).unit, unitSuffix=unitLabel?" "+unitLabel:"";
  const angleText=state.dimension===2?displayedAngle(data.angle):"θXY = "+displayedAngle(data.angle);
  const directorAngles=data.module>1e-10?"\nαx = "+displayedAngle(Math.acos(clamp(v.components.x/data.module,-1,1)))+" · αy = "+displayedAngle(Math.acos(clamp(v.components.y/data.module,-1,1)))+" · αz = "+displayedAngle(Math.acos(clamp(v.components.z/data.module,-1,1))):"\nÂngulos diretores indefinidos para o vetor nulo.";
  $("vl-selected-readout").innerHTML="<strong>"+esc(v.name)+"</strong> · "+esc(info(v).label)+"\nA = "+esc(fmtVector(v.components))+esc(unitSuffix)+"\n|A| = "+fmt(data.module)+esc(unitSuffix)+"\nDireção = "+(data.direction?angleText:"indefinida")+" · sentido indicado pela seta."+(state.dimension===3?directorAngles:"");
  $("vl-components-readout").innerHTML="Ax = "+fmt(v.components.x)+esc(unitSuffix)+"\nAy = "+fmt(v.components.y)+esc(unitSuffix)+"\nAz = "+fmt(v.components.z)+esc(unitSuffix)+(data.direction?"\nÂ = "+fmtVector(data.direction):"\nVetor unitário não definido para A = 0.");
  const result=operationResult();
  $("vl-equation-readout").innerHTML=result.error?esc(result.error):"<strong>"+esc(result.caption||"Operação")+"</strong>\n"+esc(result.kind==="vector"?fmtVector(result.value):fmt(result.value))+(result.unit?" "+esc(result.unit):"")+(result.steps?"\n"+esc(result.steps):"");
  renderProperties();
  updatePhysicsReadout();
}

function renderProperties() {
  const vectors=state.vectors.filter((v)=>v.include&&v.visible).map((v)=>v.components);
  const a=vectors[0]||vector3(), b=vectors[1]||vector3(), c=vectors[2]||vector3(), zero=vector3();
  const equal=(x,y)=>magnitude(subtract(x,y))<1e-9;
  const k=Number($("vl-scale").value)||0;
  const rows=[
    "A + B = B + A: "+(equal(add(a,b),add(b,a))?"válido":"—"),
    "(A + B) + C = A + (B + C): "+(vectors.length>=3&&equal(add(add(a,b),c),add(a,add(b,c)))?"válido":"inclua 3 vetores"),
    "k(A + B) = kA + kB: "+(equal(multiply(add(a,b),k),add(multiply(a,k),multiply(b,k)))?"válido":"—"),
    "A + (−A) = 0: "+(equal(add(a,multiply(a,-1)),zero)?"válido":"—"),
    "A + 0 = A: "+(equal(add(a,zero),a)?"válido":"—")
  ];
  $("vl-properties-result").innerHTML=rows.map(esc).join("<br>");
}

function updatePhysicsReadout() {
  const forceVectors=state.vectors.filter((v)=>v.quantity==="force"&&v.visible&&v.include);
  const total=forceVectors.length?sum(forceVectors.map((v)=>v.components)):vector3();
  const mass=Number($("vl-mass").value);
  let acceleration;
  try { acceleration=accelerationFromForce(total,mass); }
  catch { acceleration=null; }
  let torqueTotal=vector3();
  for(const v of forceVectors) {
    const point=v.attachedToBody?state.body.position:v.origin;
    torqueTotal=add(torqueTotal,torque(point,v.components,state.body.pivot));
  }
  $("vl-force-result").innerHTML="<strong>Força resultante:</strong> "+esc(fmtVector(total))+" N"+
    (acceleration?"<br><strong>Aceleração (ΣF/m):</strong> "+esc(fmtVector(acceleration))+" m/s²":"<br><span class=\"vl-error\">Informe uma massa positiva.</span>")+
    "<br><strong>Torque resultante em torno do pivô:</strong> "+esc(fmtVector(torqueTotal))+" N·m";
  const t=Number($("vl-time").value), r=positionAtTime(state.motion.r0,state.motion.v0,state.motion.a,t), vel=velocityAtTime(state.motion.v0,state.motion.a,t);
  $("vl-motion-result").innerHTML="<strong>t = "+fmt(t,2)+" s</strong><br>r(t) = "+esc(fmtVector(r))+" m<br>v(t) = "+esc(fmtVector(vel))+" m/s<br>a = "+esc(fmtVector(state.motion.a))+" m/s²";
  $("vl-physics-readout").innerHTML="<strong>ΣF = ma</strong>\nΣF = "+esc(fmtVector(total))+" N\n"+(acceleration?"a = ΣF/m = "+esc(fmtVector(acceleration))+" m/s²":"Massa precisa ser maior que zero.")+"\nΣτ = "+esc(fmtVector(torqueTotal))+" N·m\nA aceleração translacional e o torque são calculados separadamente.";
}
function renderAll() {
  renderVectorList(); renderOperation(); renderReadouts(); draw();
  $("vl-zoom-label").textContent=Math.round(state.camera.zoom/48*100)+"%";
  $("vl-grid-toggle").checked=state.showGrid; $("vl-components-toggle").checked=state.showComponents;
  $("vl-angle-toggle").checked=state.showAngles; $("vl-snap-toggle").checked=state.snap;
  $("vl-operation").value=state.operation; $("vl-scale-row").hidden=state.operation!=="scale"; $("vl-scale").value=state.scale;
  $("vl-scale-range").value=clamp(state.scale,-5,5); $("vl-add-method").value=state.addMethod;
  $("vl-3d-view").hidden=state.dimension!==3; $("vl-connect-next").checked=state.connectNext;
  $("vl-angle-unit").value=state.angleUnit; $("vl-show-result").checked=state.showResult;
  $("vl-learning-mode").value=state.learningMode; $("vl-experiment").value=state.experiment;
  document.documentElement.classList.toggle("high-contrast",state.contrast);
  document.documentElement.classList.toggle("low-stimulation",state.lowStimulus);
  document.documentElement.classList.toggle("reduce-motion",state.reducedMotion);
  $("vl-contrast-toggle").checked=state.contrast; $("vl-low-stimulus-toggle").checked=state.lowStimulus;
  $("vl-reduced-motion-toggle").checked=state.reducedMotion; $("vl-steps-toggle").checked=state.showSteps;
  $("vl-stage-title").textContent=state.dimension===3?"Espaço vetorial 3D · projeção ortográfica":"Espaço cartesiano";
  $("vl-stage-status").textContent=state.dimension===3?"3D · coordenadas físicas preservadas ao orbitar":"2D · unidades em escala consistente";
  $("vl-canvas-hint").textContent=state.tool==="pan"?"Arraste para mover a câmera · scroll ou pinça para zoom":state.dimension===3&&state.tool==="orbit"?"Arraste para orbitar · scroll ou pinça para zoom":"Arraste a ponta para alterar o vetor · arraste o corpo para transladá-lo · scroll para zoom";
  document.querySelectorAll("[data-dimension]").forEach((b)=>{const active=Number(b.dataset.dimension)===state.dimension;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});
  document.querySelectorAll("[data-tool]").forEach((b)=>{const active=b.dataset.tool===state.tool;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));b.hidden=b.dataset.tool==="orbit"&&state.dimension!==3;});
  document.querySelectorAll(".vl-z-field").forEach((e)=>e.hidden=state.dimension!==3);
  $("vl-challenge").hidden=state.learningMode!=="challenge";
  syncMotionControls(); saveLocal();
}
function syncMotionControls() {
  $("vl-time").value=state.motion.time; $("vl-time").max=state.motion.maxTime;
  $("vl-time-output").textContent=fmt(state.motion.time,2)+" s";
  $("vl-playback-output").textContent=fmt(state.motion.speed,2)+"×";
  $("vl-playback").value=state.motion.speed;
}

function setCanvasSize() {
  const box=canvas.getBoundingClientRect();
  canvasWidth=Math.max(1,box.width||480); canvasHeight=Math.max(1,box.height||340);
  pixelRatio=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(canvasWidth*pixelRatio), h=Math.round(canvasHeight*pixelRatio);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  draw();
}
resizeObserver=new ResizeObserver(setCanvasSize); resizeObserver.observe(canvas);
function pointScreen(p) {
  if(state.dimension===3) {
    const projected=project3D(p,state.camera);
    return {x:canvasWidth/2+state.camera.panX+projected.x*state.camera.zoom,y:canvasHeight/2+state.camera.panY-projected.y*state.camera.zoom};
  }
  return {x:canvasWidth/2+state.camera.panX+p.x*state.camera.zoom,y:canvasHeight/2+state.camera.panY-p.y*state.camera.zoom};
}
function pointWorld(screen,z=0) {
  const u=(screen.x-canvasWidth/2-state.camera.panX)/state.camera.zoom;
  const v=-(screen.y-canvasHeight/2-state.camera.panY)/state.camera.zoom;
  if(state.dimension!==3)return {x:u,y:v,z};
  const yaw=state.camera.yaw,pitch=clamp(state.camera.pitch,.08,Math.PI/2-.08);
  const cy=Math.cos(yaw),sy=Math.sin(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
  const yrot=(v-cp*z)/sp;
  return {x:cy*u+sy*yrot,y:-sy*u+cy*yrot,z};
}
function niceSpacing(target) {
  const power=Math.pow(10,Math.floor(Math.log10(Math.max(target,1e-12))));
  const r=target/power;
  return (r<1.5?1:r<3.5?2:r<7.5?5:10)*power;
}
function line(x1,y1,x2,y2,color,width=1,dash=[]) {
  ctx.beginPath();ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);
}
function drawGrid() {
  if(!state.showGrid)return;
  const spacing=niceSpacing(62/state.camera.zoom), px=spacing*state.camera.zoom;
  ctx.save();
  if(state.dimension===2) {
    const left=-state.camera.panX, top=-state.camera.panY;
    const startX=Math.floor((left-canvasWidth/2)/px)-1,endX=Math.ceil((canvasWidth/2-left)/px)+1;
    const startY=Math.floor((top-canvasHeight/2)/px)-1,endY=Math.ceil((canvasHeight/2-top)/px)+1;
    for(let i=startX;i<=endX;i++){const x=canvasWidth/2+state.camera.panX+i*px;line(x,0,x,canvasHeight,i%5===0?"rgba(157,181,214,.16)":"rgba(157,181,214,.075)",i%5===0?1:.65);}
    for(let j=startY;j<=endY;j++){const y=canvasHeight/2+state.camera.panY+j*px;line(0,y,canvasWidth,y,j%5===0?"rgba(157,181,214,.16)":"rgba(157,181,214,.075)",j%5===0?1:.65);}
  } else {
    const span=niceSpacing(Math.max(canvasWidth,canvasHeight)/(state.camera.zoom*8));
    const extent=clamp(Math.ceil(Math.max(canvasWidth,canvasHeight)/(state.camera.zoom*span))*span+span,8,400);
    for(let n=-extent;n<=extent;n+=span) {
      const ax=pointScreen({x:n,y:-extent,z:0}),bx=pointScreen({x:n,y:extent,z:0});
      const ay=pointScreen({x:-extent,y:n,z:0}),by=pointScreen({x:extent,y:n,z:0});
      line(ax.x,ax.y,bx.x,bx.y,n===0?"rgba(230,196,119,.4)":"rgba(157,181,214,.1)",n===0?1.4:.6);
      line(ay.x,ay.y,by.x,by.y,n===0?"rgba(230,196,119,.4)":"rgba(157,181,214,.1)",n===0?1.4:.6);
    }
    const zAxisA=pointScreen({x:0,y:0,z:-extent}),zAxisB=pointScreen({x:0,y:0,z:extent});
    line(zAxisA.x,zAxisA.y,zAxisB.x,zAxisB.y,"rgba(157,181,214,.12)",.7);
  }
  ctx.restore();
}
function drawAxes() {
  const origin=pointScreen({x:0,y:0,z:0});
  const axisLength=Math.max(canvasWidth,canvasHeight);
  const axes=state.dimension===2?[
    [{x:-axisLength/state.camera.zoom,y:0,z:0},{x:axisLength/state.camera.zoom,y:0,z:0},"#e2a96f","X"],
    [{x:0,y:-axisLength/state.camera.zoom,z:0},{x:0,y:axisLength/state.camera.zoom,z:0},"#7bb9ff","Y"]
  ]:[
    [{x:-axisLength/state.camera.zoom,y:0,z:0},{x:axisLength/state.camera.zoom,y:0,z:0},"#e2a96f","X"],
    [{x:0,y:-axisLength/state.camera.zoom,z:0},{x:0,y:axisLength/state.camera.zoom,z:0},"#7bb9ff","Y"],
    [{x:0,y:0,z:-axisLength/state.camera.zoom},{x:0,y:0,z:axisLength/state.camera.zoom},"#7ad2a2","Z"]
  ];
  axes.forEach((a)=>{const p=pointScreen(a[0]),q=pointScreen(a[1]);line(p.x,p.y,q.x,q.y,a[2],1.3);ctx.fillStyle=a[2];ctx.font="bold 11px sans-serif";ctx.fillText(a[3],clamp(q.x-8,8,canvasWidth-16),clamp(q.y+14,12,canvasHeight-6));});
  ctx.beginPath();ctx.arc(origin.x,origin.y,3.5,0,Math.PI*2);ctx.fillStyle="#f4f5f8";ctx.fill();
  if(state.dimension===2) {
    const major=niceSpacing(62/state.camera.zoom), px=major*state.camera.zoom, labelStep=px<38?major*2:major;
    ctx.font="9px sans-serif";ctx.fillStyle="rgba(202,216,237,.65)";
    for(let x=major;x*state.camera.zoom<canvasWidth;x+=labelStep){const p=pointScreen({x,y:0,z:0});if(p.x>25&&p.x<canvasWidth-20)ctx.fillText(fmt(x,2),p.x+3,origin.y+12);}
    for(let y=major;y*state.camera.zoom<canvasHeight;y+=labelStep){const p=pointScreen({x:0,y,z:0});if(p.y>16&&p.y<canvasHeight-16)ctx.fillText(fmt(y,2),origin.x+5,p.y-3);const q=pointScreen({x:0,y:-y,z:0});if(q.y>16&&q.y<canvasHeight-16)ctx.fillText(fmt(-y,2),origin.x+5,q.y-3);}
  }
}
function drawArrow(from,to,color,label,width=2.4,selectedArrow=false) {
  const a=pointScreen(from),b=pointScreen(to),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(!Number.isFinite(len)||len<.5)return;
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=selectedArrow?3:width;
  ctx.globalAlpha=selectedArrow?1:.93;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  const angle=Math.atan2(dy,dx),head=clamp(8+state.camera.zoom*.035,8,13);
  ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(angle-.42),b.y-head*Math.sin(angle-.42));ctx.lineTo(b.x-head*Math.cos(angle+.42),b.y-head*Math.sin(angle+.42));ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(a.x,a.y,3,0,2*Math.PI);ctx.fill();
  if(label){ctx.font=(selectedArrow?"bold ":"")+"11px sans-serif";ctx.lineWidth=3;ctx.strokeStyle="rgba(5,10,18,.88)";ctx.strokeText(label,b.x+7,b.y-7);ctx.fillStyle=color;ctx.fillText(label,b.x+7,b.y-7);}
  ctx.restore();
}
function drawOperationConstruction(result) {
  if(!state.showResult||result.error)return;
  const included=state.vectors.filter((v)=>v.visible&&v.include);
  if(state.operation==="subtract"&&included.length>=2) {
    drawArrow({x:0,y:0,z:0},multiply(included[1].components,-1),"rgba(210,220,238,.72)","−B",1.5);
  }
  if(state.operation!=="sum"||included.length<2||state.addMethod==="components")return;
  if(state.addMethod==="parallelogram"&&included.length===2) {
    const a=included[0].components,b=included[1].components,ab=add(a,b);
    drawArrow(a,ab,"rgba(210,220,238,.64)","B transladado",1.3);
    drawArrow(b,ab,"rgba(210,220,238,.48)","A transladado",1.2);
    return;
  }
  if((state.addMethod==="triangle"&&included.length===2)||state.addMethod==="polygon") {
    let current=vector3();
    included.forEach((v)=>{const next=add(current,v.components);drawArrow(current,next,v.color,v.name+" (polígono)",1.8);current=next;});
  }
}
function drawComponents(v) {
  const origin=startOf(v),end=add(origin,v.components);
  const xPoint={x:end.x,y:origin.y,z:origin.z},yPoint={x:origin.x,y:end.y,z:origin.z};
  if(state.dimension===2) {
    const a=pointScreen(end),b=pointScreen(xPoint),c=pointScreen(origin);
    line(a.x,a.y,b.x,b.y,"rgba(244,211,110,.82)",1.2,[5,4]);
    line(b.x,b.y,c.x,c.y,"rgba(244,211,110,.66)",1.2,[5,4]);
    ctx.fillStyle="#f4d36e";ctx.font="10px sans-serif";
    ctx.fillText("Ay = "+fmt(v.components.y),b.x+4,(a.y+b.y)/2);
    ctx.fillText("Ax = "+fmt(v.components.x),(b.x+c.x)/2,c.y-5);
  } else {
    const axisPoints=[{x:end.x,y:origin.y,z:origin.z},{x:end.x,y:end.y,z:origin.z},end];
    let previous=origin;
    axisPoints.forEach((p)=>{const a=pointScreen(previous),b=pointScreen(p);line(a.x,a.y,b.x,b.y,"rgba(244,211,110,.72)",1,[5,4]);previous=p;});
  }
}
function drawAngle(v) {
  if(state.dimension!==2||magnitude(v.components)<1e-10)return;
  const origin=startOf(v),end=add(origin,v.components),a=pointScreen(origin),b=pointScreen(end);
  const angle=Math.atan2(b.y-a.y,b.x-a.x),radius=clamp(state.camera.zoom*.36,13,30);
  ctx.beginPath();ctx.arc(a.x,a.y,radius,-angle,0,angle<0);ctx.strokeStyle="#f4d36e";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle="#f4d36e";ctx.font="10px sans-serif";ctx.fillText(displayedAngle(Math.atan2(v.components.y,v.components.x)),a.x+radius+3,a.y-5);
}
function bodyPoint() {
  const p=pointScreen(state.body.position);
  ctx.save();ctx.fillStyle="#e8ebf1";ctx.strokeStyle="#e6c477";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(p.x-10,p.y-8,20,16,3);ctx.fill();ctx.stroke();
  ctx.fillStyle="#08101f";ctx.font="bold 8px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("m",p.x,p.y);ctx.restore();
}
function drawMotion() {
  if(state.motion.trajectory) {
    const steps=100, max=state.motion.time;
    if(max>0){ctx.beginPath();for(let i=0;i<=steps;i++){const t=max*i/steps,p=pointAtTime(t),s=pointScreen(p);if(i===0)ctx.moveTo(s.x,s.y);else ctx.lineTo(s.x,s.y);}ctx.strokeStyle="rgba(220,226,239,.65)";ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);}
  }
  const p=positionAtTime(state.motion.r0,state.motion.v0,state.motion.a,state.motion.time),sp=pointScreen(p);
  ctx.beginPath();ctx.arc(sp.x,sp.y,6,0,2*Math.PI);ctx.fillStyle="#f6d374";ctx.fill();ctx.strokeStyle="#fff3c0";ctx.lineWidth=1.3;ctx.stroke();
  if(state.motion.showVelocity){const v=velocityAtTime(state.motion.v0,state.motion.a,state.motion.time);drawArrow(p,add(p,multiply(v,.16)),"#68d59d","v",2);}
  if(state.motion.showAcceleration)drawArrow(p,add(p,multiply(state.motion.a,.12)),"#ff8b70","a",2);
}
function drawOutOfPlane(result) {
  if(!state.showResult||state.dimension!==2||state.operation!=="cross"||!result||result.error||!result.outOfPlane)return;
  const origin=pointScreen({x:0,y:0,z:0}),x=origin.x+24,y=origin.y-23,r=8;
  ctx.save();ctx.strokeStyle="#f4d36e";ctx.fillStyle="#f4d36e";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  if(result.outOfPlane>0){ctx.beginPath();ctx.arc(x,y,2.7,0,Math.PI*2);ctx.fill();}
  else {line(x-r*.55,y-r*.55,x+r*.55,y+r*.55,"#f4d36e",1.6);line(x+r*.55,y-r*.55,x-r*.55,y+r*.55,"#f4d36e",1.6);}
  ctx.font="10px sans-serif";ctx.fillText(result.outOfPlane>0?"+z":"−z",x+11,y+3);ctx.restore();
}
function pointAtTime(t){return positionAtTime(state.motion.r0,state.motion.v0,state.motion.a,t);}
function draw() {
  if(!ctx||!canvasWidth||!canvasHeight)return;
  ctx.save();ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,canvasWidth,canvasHeight);
  const gradient=ctx.createLinearGradient(0,0,canvasWidth,canvasHeight);gradient.addColorStop(0,"#111f33");gradient.addColorStop(1,"#0b1525");ctx.fillStyle=state.lowStimulus?"#101724":gradient;ctx.fillRect(0,0,canvasWidth,canvasHeight);
  drawGrid();drawAxes();
  if(state.vectors.some((v)=>v.quantity==="force"&&v.visible))bodyPoint();
  state.vectors.filter((v)=>v.visible).forEach((v)=>{
    if(state.showComponents)drawComponents(v);
    const origin=startOf(v),end=add(origin,v.components);
    drawArrow(origin,end,v.color,v.name,2.4,v.id===state.selectedId);
    if(state.showAngles&&v.id===state.selectedId)drawAngle(v);
  });
  const operation=operationResult();
  drawOperationConstruction(operation);
  drawOutOfPlane(operation);
  if(state.showResult&&operation.kind==="vector"&&!operation.error)drawArrow({x:0,y:0,z:0},operation.value,"#f4d36e",operation.caption||"R",3,true);
  if(state.motion.trajectory||state.motion.time>0)drawMotion();
  if(!state.vectors.length){ctx.fillStyle="#cfdaeb";ctx.textAlign="center";ctx.font="14px sans-serif";ctx.fillText("Adicione um vetor para começar",canvasWidth/2,canvasHeight/2);}
  ctx.restore();
}

function distanceToSegment(point,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
  const t=den?clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/den,0,1):0;
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function hitTest(p) {
  let best=null,bestDistance=Infinity;
  const forceVector=state.vectors.find((v)=>v.visible&&v.quantity==="force");
  if(forceVector) {
    const body=pointScreen(state.body.position);
    if(Math.hypot(p.x-body.x,p.y-body.y)<14)return {vector:forceVector,type:"body"};
  }
  for(const v of [...state.vectors].reverse()) {
    if(!v.visible)continue;
    const origin=startOf(v),end=add(origin,v.components),s=pointScreen(origin),e=pointScreen(end);
    const tipDistance=Math.hypot(p.x-e.x,p.y-e.y);
    const originDistance=Math.hypot(p.x-s.x,p.y-s.y);
    const bodyDistance=distanceToSegment(p,s,e);
    const candidateDistance=Math.min(tipDistance,originDistance,bodyDistance);
    if(candidateDistance<bestDistance&&candidateDistance<15) {
      bestDistance=candidateDistance;
      best={vector:v,type:tipDistance<=originDistance&&tipDistance<=bodyDistance?"tip":originDistance<=bodyDistance?"origin":"body"};
    }
  }
  return best;
}
function pointerPosition(event) {
  const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};
}
function zoomAround(next,focus) {
  next=clamp(next,8,260);
  const world=pointWorld(focus,0);
  state.camera.zoom=next;
  const screen=pointScreen(world);
  state.camera.panX+=focus.x-screen.x;
  state.camera.panY+=focus.y-screen.y;
  $("vl-zoom-label").textContent=Math.round(next/48*100)+"%";
}
function onPointerDown(event) {
  canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  const p=pointerPosition(event);pointers.set(event.pointerId,p);
  if(pointers.size>=2) {
    const list=[...pointers.values()],mid={x:(list[0].x+list[1].x)/2,y:(list[0].y+list[1].y)/2};
    pinchStart={distance:Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y),zoom:state.camera.zoom,panX:state.camera.panX,panY:state.camera.panY,mid,world:pointWorld(mid,0)};
    interaction=null;return;
  }
  if(state.tool==="pan"||state.tool==="orbit"||event.button===1||event.button===2) {
    interaction={type:state.dimension===3&&state.tool==="orbit"?"orbit":"pan",start:p,panX:state.camera.panX,panY:state.camera.panY,yaw:state.camera.yaw,pitch:state.camera.pitch};event.preventDefault();return;
  }
  const hit=hitTest(p);
  if(hit) {
    state.selectedId=hit.vector.id;updateEditor(hit.vector);
    interaction={type:"vector",dragType:hit.type,id:hit.vector.id,start:p,before:clone(state),origin:clone(hit.vector.origin),components:clone(hit.vector.components),body:clone(state.body.position)};
    renderVectorList();renderReadouts();draw();event.preventDefault();return;
  }
  interaction={type:"pan",start:p,panX:state.camera.panX,panY:state.camera.panY};
  draw();
}
function applyDrag(p) {
  if(!interaction)return;
  if(interaction.type==="pan") {
    state.camera.panX=interaction.panX+(p.x-interaction.start.x);state.camera.panY=interaction.panY+(p.y-interaction.start.y);draw();return;
  }
  if(interaction.type==="orbit") {
    state.camera.yaw=interaction.yaw+(p.x-interaction.start.x)*.008;
    state.camera.pitch=clamp(interaction.pitch-(p.y-interaction.start.y)*.008,.1,Math.PI/2-.1);draw();return;
  }
  if(interaction.type!=="vector")return;
  const v=state.vectors.find((x)=>x.id===interaction.id);if(!v||v.locked)return;
  const z=interaction.dragType==="tip"?v.origin.z+v.components.z:v.origin.z;
  const world=pointWorld(p,z);
  if(interaction.dragType==="body") {
    if(v.attachedToBody) {
      state.body.position={x:world.x,y:world.y,z:state.body.position.z};
      $("vl-body-x").value=fmt(state.body.position.x,6);$("vl-body-y").value=fmt(state.body.position.y,6);
    } else if(!v.lockOrigin) {
      const delta={x:world.x-interaction.startWorldX,y:world.y-interaction.startWorldY,z:0};
      v.origin=add(interaction.origin,delta);
    }
  } else if(interaction.dragType==="origin") {
    if(!v.lockOrigin&&!v.attachedToBody) {
      const originalEnd=add(interaction.origin,interaction.components);
      v.origin=world;v.components=subtract(originalEnd,world);
    }
  } else {
    let components=subtract(world,startOf(v));
    if(state.dimension===2)components.z=v.components.z;
    if(v.lockModule) {
      const oldLength=magnitude(interaction.components),newUnit=unit(components);
      components=newUnit?multiply(newUnit,oldLength):interaction.components;
    } else if(v.lockAngle&&state.dimension===2) {
      const length=magnitude(components),oldAngle=Math.atan2(interaction.components.y,interaction.components.x);
      components={x:length*Math.cos(oldAngle),y:length*Math.sin(oldAngle),z:interaction.components.z};
    }
    if(state.snap) {
      const snap=1;
      components={x:Math.round(components.x/snap)*snap,y:Math.round(components.y/snap)*snap,z:state.dimension===3?Math.round(components.z/snap)*snap:components.z};
    }
    v.components=vector3(components);
    $("vl-vx").value=fmt(v.components.x,6);$("vl-vy").value=fmt(v.components.y,6);$("vl-vz").value=fmt(v.components.z,6);
  }
  renderVectorList();renderReadouts();draw();
}
function onPointerMove(event) {
  const p=pointerPosition(event);if(pointers.has(event.pointerId))pointers.set(event.pointerId,p);
  if(pointers.size>=2) {
    const values=[...pointers.values()],mid={x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2};
    const distance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
    if(pinchStart&&pinchStart.distance>0) {
      const next=clamp(pinchStart.zoom*distance/pinchStart.distance,8,260);
      state.camera.zoom=next;state.camera.panX=pinchStart.panX;state.camera.panY=pinchStart.panY;
      const s=pointScreen(pinchStart.world);state.camera.panX+=mid.x-s.x;state.camera.panY+=mid.y-s.y;
      $("vl-zoom-label").textContent=Math.round(next/48*100)+"%";draw();
    }
    return;
  }
  if(interaction?.type==="vector"&&interaction.startWorldX==null){const v=state.vectors.find((x)=>x.id===interaction.id);const w=v?pointWorld(interaction.start,v.origin.z):{x:0,y:0};interaction.startWorldX=w.x;interaction.startWorldY=w.y;}
  applyDrag(p);
}
function onPointerUp(event) {
  pointers.delete(event.pointerId);
  if(pointers.size<2)pinchStart=null;
  if(interaction?.type==="vector") {
    const v=state.vectors.find((x)=>x.id===interaction.id);
    if(v&&JSON.stringify(interaction.before)!==JSON.stringify(state))snapshotUndo(interaction.before);
    saveLocal();renderReadouts();
  }
  interaction=null;
}
canvas.addEventListener("pointerdown",onPointerDown);
canvas.addEventListener("pointermove",onPointerMove);
canvas.addEventListener("pointerup",onPointerUp);
canvas.addEventListener("pointercancel",onPointerUp);
canvas.addEventListener("contextmenu",(e)=>e.preventDefault());
canvas.addEventListener("wheel",(event)=>{
  event.preventDefault();
  const p=pointerPosition(event),factor=Math.exp(-event.deltaY*.0015);
  zoomAround(state.camera.zoom*factor,p);
},{passive:false});
canvas.addEventListener("keydown",(event)=>{
  const v=selected();if(!v)return;
  const step=event.shiftKey?.1:.25;
  let dx=0,dy=0,dz=0;
  if(event.key==="ArrowLeft")dx=-step;else if(event.key==="ArrowRight")dx=step;else if(event.key==="ArrowUp")dy=step;else if(event.key==="ArrowDown")dy=-step;else return;
  if(v.locked)return;
  event.preventDefault();snapshotUndo();v.components=add(v.components,{x:dx,y:dy,z:dz});updateEditor(v);renderAll();
});

function getNumber(id) {
  const input=$(id),value=input.value.trim();
  if(value==="")throw new Error("Preencha o campo "+(input.labels?.[0]?.textContent||id)+".");
  const n=Number(value);if(!Number.isFinite(n))throw new Error("Use um valor numérico finito.");return n;
}
function beginFormEdit(){if(!inputBefore)inputBefore=clone(state);}
function commitFormEdit(){if(inputBefore){snapshotUndo(inputBefore);inputBefore=null;saveLocal();}}
function applyEditorForm() {
  const v=selected();if(!v)return;
  try {
    v.name=$("vl-name").value.trim()||"Vetor";
    v.color=$("vl-color").value;
    v.quantity=$("vl-quantity").value;
    v.origin={x:getNumber("vl-ox"),y:getNumber("vl-oy"),z:getNumber("vl-oz")};
    v.components={x:getNumber("vl-vx"),y:getNumber("vl-vy"),z:getNumber("vl-vz")};
    v.lockOrigin=$("vl-lock-origin").checked;v.lockModule=$("vl-lock-module").checked;v.lockAngle=$("vl-lock-angle").checked;v.locked=$("vl-lock-vector").checked;
    notify("");renderVectorList();renderReadouts();draw();saveLocal();
  } catch(error) { notify(error.message); }
}
["vl-name","vl-quantity","vl-color","vl-ox","vl-oy","vl-oz","vl-vx","vl-vy","vl-vz","vl-lock-origin","vl-lock-module","vl-lock-angle","vl-lock-vector"].forEach((id)=>{
  const input=$(id);input.addEventListener("focus",beginFormEdit);input.addEventListener("input",applyEditorForm);input.addEventListener("change",()=>{applyEditorForm();commitFormEdit();});
});
$("vl-vector-list").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-select]");if(!button)return;
  state.selectedId=button.dataset.select;updateEditor(selected());renderAll();
});
$("vl-vector-list").addEventListener("change",(event)=>{
  const id=event.target.dataset.visible||event.target.dataset.include||event.target.dataset.color;
  if(!id)return;snapshotUndo();
  const v=state.vectors.find((x)=>x.id===id);if(!v)return;
  if(event.target.dataset.visible)v.visible=event.target.checked;
  else if(event.target.dataset.include)v.include=event.target.checked;
  else v.color=event.target.value;
  renderAll();
});

$("vl-add").addEventListener("click",()=>{
  try {
    snapshotUndo();
    const quantity=$("vl-quantity").value;
    const previous=selected();
    const origin=state.connectNext&&previous?endOf(previous):{x:getNumber("vl-ox"),y:getNumber("vl-oy"),z:getNumber("vl-oz")};
    const vector=makeVector({name:$("vl-name").value.trim()||"Vetor "+String.fromCharCode(65+state.vectors.length%26),color:$("vl-color").value,quantity,origin,components:{x:getNumber("vl-vx"),y:getNumber("vl-vy"),z:getNumber("vl-vz")},attachedToBody:quantity==="force"&&!state.connectNext});
    if(state.vectors.length>=300)throw new Error("A cena chegou ao limite prático de 300 vetores.");
    state.vectors.push(vector);state.selectedId=vector.id;updateEditor(vector);notify("");renderAll();setStatus("Vetor adicionado");
  } catch(error) { notify(error.message); }
});
$("vl-duplicate").addEventListener("click",()=>{
  const v=selected();if(!v)return;
  snapshotUndo();const copy=makeVector({...v,id:crypto.randomUUID(),name:v.name+" (cópia)",color:colors[state.vectors.length%colors.length],origin:add(v.origin,{x:.5,y:.5,z:0})});
  state.vectors.push(copy);state.selectedId=copy.id;updateEditor(copy);renderAll();
});
$("vl-delete").addEventListener("click",()=>{
  const v=selected();if(!v)return;
  snapshotUndo();state.vectors=state.vectors.filter((item)=>item.id!==v.id);state.selectedId=state.vectors[0]?.id||null;updateEditor(selected());renderAll();
});
$("vl-align-x").addEventListener("click",()=>{const v=selected();if(!v||v.locked)return;snapshotUndo();v.components.y=0;updateEditor(v);renderAll();});
$("vl-align-y").addEventListener("click",()=>{const v=selected();if(!v||v.locked)return;snapshotUndo();v.components.x=0;updateEditor(v);renderAll();});

function bindCheck(id,key) { $(id).addEventListener("change",()=>{snapshotUndo();state[key]=$(id).checked;renderAll();}); }
bindCheck("vl-grid-toggle","showGrid");bindCheck("vl-components-toggle","showComponents");bindCheck("vl-angle-toggle","showAngles");bindCheck("vl-snap-toggle","snap");bindCheck("vl-show-result","showResult");
bindCheck("vl-contrast-toggle","contrast");bindCheck("vl-low-stimulus-toggle","lowStimulus");bindCheck("vl-reduced-motion-toggle","reducedMotion");bindCheck("vl-steps-toggle","showSteps");
$("vl-operation").addEventListener("change",()=>{snapshotUndo();state.operation=$("vl-operation").value;renderAll();});
$("vl-scale").addEventListener("input",()=>{state.scale=Number($("vl-scale").value);renderOperation();renderReadouts();draw();});
$("vl-scale-range").addEventListener("input",()=>{$("vl-scale").value=$("vl-scale-range").value;state.scale=Number($("vl-scale-range").value);renderOperation();renderReadouts();draw();});
$("vl-scale").addEventListener("change",()=>{if(Number.isFinite(Number($("vl-scale").value)))$("vl-scale-range").value=clamp(Number($("vl-scale").value),-5,5);});
$("vl-add-method").addEventListener("change",()=>{snapshotUndo();state.addMethod=$("vl-add-method").value;renderAll();});
$("vl-connect-next").addEventListener("change",()=>{state.connectNext=$("vl-connect-next").checked;saveLocal();});
$("vl-angle-unit").addEventListener("change",()=>{snapshotUndo();state.angleUnit=$("vl-angle-unit").value;renderAll();});
$("vl-learning-mode").addEventListener("change",()=>{state.learningMode=$("vl-learning-mode").value;updateGuided();renderAll();});
$("vl-experiment").addEventListener("change",()=>state.experiment=$("vl-experiment").value);
function updateGuided() {
  const messages={
    free:"Arraste a ponta do vetor ou altere suas componentes. Observe como o módulo e o ângulo mudam.",
    guided:"Comece lendo Ax e Ay no painel inferior. Depois compare o módulo √(Ax² + Ay²) e o ângulo medido a partir do eixo +X.",
    experiment:"Escolha um arranjo e carregue-o. Altere os vetores e observe como muda a soma, o produto ou a projeção.",
    challenge:"Ajuste um ou mais vetores para atingir o módulo-alvo. O painel verifica o resultado numérico."
  };
  $("vl-guided-card").textContent=messages[state.learningMode]||messages.free;
}

const preset=(name,quantity,components,origin={x:0,y:0,z:0},attached=false)=>makeVector({name,quantity,components,origin,attachedToBody:attached});
const experiments={
  perpendicular:{dimension:2,vectors:[preset("A","abstract",{x:4,y:0}),preset("B","abstract",{x:0,y:3})],operation:"sum"},
  parallel:{dimension:2,vectors:[preset("A","abstract",{x:3,y:0}),preset("B","abstract",{x:2,y:0})],operation:"sum"},
  opposite:{dimension:2,vectors:[preset("A","abstract",{x:4,y:0}),preset("B","abstract",{x:-4,y:0})],operation:"sum"},
  equilibrium:{dimension:2,vectors:[preset("F₁","force",{x:5,y:0},{x:0,y:0},true),preset("F₂","force",{x:-2.5,y:4.330127}),preset("F₃","force",{x:-2.5,y:-4.330127})],operation:"sum"},
  decompose:{dimension:2,vectors:[preset("Força F","force",{x:17.320508,y:10},{x:0,y:0},true)],operation:"sum",components:true},
  displacement:{dimension:2,vectors:[preset("Δr₁","displacement",{x:3,y:2}),preset("Δr₂","displacement",{x:-1,y:4}),preset("Δr₃","displacement",{x:2,y:-1})],operation:"sum"},
  relative:{dimension:2,vectors:[preset("v(A/B)","velocity",{x:3,y:0}),preset("v(B/C)","velocity",{x:0,y:2})],operation:"sum"},
  torque:{dimension:3,vectors:[preset("F","force",{x:0,y:5,z:0},{x:2,y:0,z:0})],operation:"sum"},
  cross3d:{dimension:3,vectors:[preset("A","abstract",{x:1,y:0,z:0}),preset("B","abstract",{x:0,y:1,z:0})],operation:"cross"}
};
$("vl-load-experiment").addEventListener("click",()=>{
  const item=experiments[$("vl-experiment").value];if(!item)return;snapshotUndo();
  state.dimension=item.dimension;state.vectors=item.vectors.map((v,i)=>({...v,color:colors[i%colors.length],include:true}));
  state.selectedId=state.vectors[0]?.id||null;state.operation=item.operation;state.tool=state.dimension===3?"orbit":"select";state.showComponents=Boolean(item.components);state.camera.panX=0;state.camera.panY=0;
  updateEditor(selected());renderAll();setStatus("Experimento carregado");
});
$("vl-check-challenge").addEventListener("click",()=>{
  const target=Number($("vl-target-module").value),res=operationResult();
  if(!Number.isFinite(target)||target<0){$("vl-challenge-feedback").textContent="Informe um módulo-alvo não negativo.";return;}
  if(res.error||res.kind!=="vector"){$("vl-challenge-feedback").textContent="Escolha uma operação vetorial válida antes de conferir.";return;}
  const difference=Math.abs(magnitude(res.value)-target);
  $("vl-challenge-feedback").textContent=difference<1e-3?"Correto: a resultante atingiu o módulo-alvo.":"Ainda não. A resultante atual tem módulo "+fmt(magnitude(res.value))+".";
});

function setDimension(dimension) {
  state.dimension=dimension;state.tool=dimension===3?"orbit":"select";renderAll();
}
document.querySelectorAll("[data-dimension]").forEach((button)=>button.addEventListener("click",()=>setDimension(Number(button.dataset.dimension))));
document.querySelectorAll("[data-tool]").forEach((button)=>button.addEventListener("click",()=>{state.tool=button.dataset.tool;renderAll();}));
$("vl-zoom-in").addEventListener("click",()=>{zoomAround(state.camera.zoom*1.2,{x:canvasWidth/2,y:canvasHeight/2});draw();});
$("vl-zoom-out").addEventListener("click",()=>{zoomAround(state.camera.zoom/1.2,{x:canvasWidth/2,y:canvasHeight/2});draw();});
$("vl-center").addEventListener("click",()=>{state.camera.panX=0;state.camera.panY=0;draw();});
$("vl-reset-camera").addEventListener("click",()=>{state.camera={zoom:48,panX:0,panY:0,yaw:-Math.PI/4,pitch:Math.PI/5};draw();});
$("vl-3d-view").addEventListener("change",()=>{
  const views={iso:{yaw:-Math.PI/4,pitch:Math.PI/5},front:{yaw:0,pitch:.12},top:{yaw:0,pitch:Math.PI/2-.12},side:{yaw:Math.PI/2,pitch:.12}};
  Object.assign(state.camera,views[$("vl-3d-view").value]||views.iso);draw();
});
$("vl-fit").addEventListener("click",()=>{
  if(!state.vectors.length){$("vl-center").click();return;}
  const points=[];state.vectors.filter((v)=>v.visible).forEach((v)=>{const o=startOf(v);points.push(o,add(o,v.components));});
  const xs=points.map((p)=>p.x),ys=points.map((p)=>p.y);
  const spanX=Math.max(...xs)-Math.min(...xs)||1,spanY=Math.max(...ys)-Math.min(...ys)||1;
  state.camera.zoom=clamp(Math.min((canvasWidth-100)/spanX,(canvasHeight-100)/spanY),8,180);
  state.camera.panX=-(Math.min(...xs)+Math.max(...xs))*state.camera.zoom/2;
  state.camera.panY=(Math.min(...ys)+Math.max(...ys))*state.camera.zoom/2;
  draw();$("vl-zoom-label").textContent=Math.round(state.camera.zoom/48*100)+"%";
});
$("vl-fullscreen").addEventListener("click",async()=>{try{if(!document.fullscreenElement)await $("vl-app").requestFullscreen();else await document.exitFullscreen();}catch{setStatus("Tela cheia não disponível neste navegador.");}});
document.addEventListener("fullscreenchange",()=>{$("vl-fullscreen").textContent=document.fullscreenElement?"Sair da tela cheia":"Tela cheia";setCanvasSize();});
$("vl-angle-convention")?.addEventListener("change",()=>{snapshotUndo();state.angleConvention=$("vl-angle-convention").value;renderAll();});

function updateBodyControls() {
  state.body.position={x:Number($("vl-body-x").value)||0,y:Number($("vl-body-y").value)||0,z:0};
  state.body.mass=Number($("vl-mass").value);
  state.body.pivot={x:Number($("vl-px").value)||0,y:Number($("vl-py").value)||0,z:Number($("vl-pz").value)||0};
  renderReadouts();draw();saveLocal();
}
["vl-mass","vl-body-x","vl-body-y","vl-px","vl-py","vl-pz"].forEach((id)=>$(id).addEventListener("input",updateBodyControls));
function updateMotionControls() {
  state.motion.r0={x:Number($("vl-r0x").value)||0,y:Number($("vl-r0y").value)||0,z:0};
  state.motion.v0={x:Number($("vl-v0x").value)||0,y:Number($("vl-v0y").value)||0,z:0};
  state.motion.a={x:Number($("vl-ax").value)||0,y:Number($("vl-ay").value)||0,z:0};
  renderReadouts();draw();saveLocal();
}
["vl-r0x","vl-r0y","vl-v0x","vl-v0y","vl-ax","vl-ay"].forEach((id)=>$(id).addEventListener("input",updateMotionControls));
function motionTick(time) {
  if(!state.motion.playing){rafId=0;return;}
  if(!previousFrame)previousFrame=time;
  const dt=Math.min((time-previousFrame)/1000,.05);previousFrame=time;
  state.motion.time+=dt*state.motion.speed;
  if(state.motion.time>=state.motion.maxTime){state.motion.time=state.motion.maxTime;state.motion.playing=false;}
  syncMotionControls();renderReadouts();draw();
  if(state.motion.playing)rafId=requestAnimationFrame(motionTick);else{rafId=0;previousFrame=0;saveLocal();}
}
$("vl-motion-play").addEventListener("click",()=>{if(state.motion.time>=state.motion.maxTime)state.motion.time=0;state.motion.playing=true;previousFrame=0;if(!rafId)rafId=requestAnimationFrame(motionTick);});
$("vl-motion-pause").addEventListener("click",()=>{state.motion.playing=false;previousFrame=0;syncMotionControls();saveLocal();});
$("vl-motion-reset").addEventListener("click",()=>{state.motion.playing=false;state.motion.time=0;previousFrame=0;syncMotionControls();renderReadouts();draw();});
$("vl-time").addEventListener("input",()=>{state.motion.playing=false;state.motion.time=Number($("vl-time").value);previousFrame=0;syncMotionControls();renderReadouts();draw();});
$("vl-playback").addEventListener("input",()=>{state.motion.speed=Number($("vl-playback").value);syncMotionControls();});
["vl-trajectory-toggle","vl-velocity-toggle","vl-acceleration-toggle"].forEach((id)=>$(id).addEventListener("change",()=>{
  state.motion.trajectory=$("vl-trajectory-toggle").checked;state.motion.showVelocity=$("vl-velocity-toggle").checked;state.motion.showAcceleration=$("vl-acceleration-toggle").checked;draw();
}));

function download(name,content,type) {
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement("a");
  link.href=url;link.download=name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("vl-save").addEventListener("click",()=>{saveLocal();setStatus("Cena guardada neste navegador");});
$("vl-export-json").addEventListener("click",()=>download("experimento-vetores.json",JSON.stringify(state,null,2),"application/json"));
$("vl-export-csv").addEventListener("click",()=>{
  const header="nome,grandeza,unidade,origem_x,origem_y,origem_z,componente_x,componente_y,componente_z,modulo";
  const rows=state.vectors.map((v)=>[v.name,info(v).label,info(v).unit,v.origin.x,v.origin.y,v.origin.z,v.components.x,v.components.y,v.components.z,magnitude(v.components)].map((cell)=>"\""+String(cell).replace(/"/g,"\"\"")+"\"").join(","));
  download("vetores.csv",[header,...rows].join("\r\n"),"text/csv;charset=utf-8");
});
$("vl-export-png").addEventListener("click",()=>{const a=document.createElement("a");a.download="laboratorio-vetores.png";a.href=canvas.toDataURL("image/png");a.click();});
$("vl-import").addEventListener("click",()=>$("vl-import-file").click());
$("vl-import-file").addEventListener("change",async()=>{
  const file=$("vl-import-file").files?.[0];if(!file)return;
  try {
    const parsed=JSON.parse(await file.text());if(parsed.version!==1||!Array.isArray(parsed.vectors)||parsed.vectors.length>300)throw new Error("O arquivo não tem um formato de experimento válido.");
    const validated=parsed.vectors.map(makeVector);if(!validated.length)throw new Error("O arquivo não contém vetores.");
    snapshotUndo();state={...state,...parsed,vectors:validated,selectedId:validated.some((v)=>v.id===parsed.selectedId)?parsed.selectedId:validated[0].id};
    updateEditor(selected());renderAll();setStatus("Experimento importado");
  }catch(error){notify(error.message||"Não foi possível importar esse arquivo.");}
  $("vl-import-file").value="";
});
$("vl-restore").addEventListener("click",()=>{snapshotUndo();state=freshScene();updateEditor(selected());renderAll();setStatus("Cena inicial restaurada");});
$("vl-undo").addEventListener("click",()=>{
  const previous=undoStack.pop();if(!previous)return;redoStack.push(clone(state));state=previous;updateEditor(selected());renderAll();
});
$("vl-redo").addEventListener("click",()=>{
  const next=redoStack.pop();if(!next)return;undoStack.push(clone(state));state=next;updateEditor(selected());renderAll();
});
document.addEventListener("keydown",(event)=>{
  const editing=["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName);
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"&&!editing){event.preventDefault();(event.shiftKey?$("vl-redo"):$("vl-undo")).click();}
});
window.addEventListener("beforeunload",()=>{state.motion.playing=false;saveLocal();});

function syncEditorDimension() {
  const vector=selected();if(!vector)return;
  updateEditor(vector);renderAll();
}
function syncAllInputs() {
  $("vl-body-x").value=fmt(state.body.position.x,6);$("vl-body-y").value=fmt(state.body.position.y,6);$("vl-mass").value=state.body.mass||2;
  $("vl-px").value=fmt(state.body.pivot.x,6);$("vl-py").value=fmt(state.body.pivot.y,6);$("vl-pz").value=fmt(state.body.pivot.z,6);
  $("vl-r0x").value=fmt(state.motion.r0.x,6);$("vl-r0y").value=fmt(state.motion.r0.y,6);
  $("vl-v0x").value=fmt(state.motion.v0.x,6);$("vl-v0y").value=fmt(state.motion.v0.y,6);
  $("vl-ax").value=fmt(state.motion.a.x,6);$("vl-ay").value=fmt(state.motion.a.y,6);
  $("vl-trajectory-toggle").checked=state.motion.trajectory;$("vl-velocity-toggle").checked=state.motion.showVelocity;$("vl-acceleration-toggle").checked=state.motion.showAcceleration;
  $("vl-angle-convention").value=state.angleConvention;
}
window.addEventListener("resize",setCanvasSize);
updateEditor(selected());updateGuided();syncAllInputs();renderAll();setStatus("Laboratório de vetores pronto");
