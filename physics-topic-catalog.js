const esc=(value="")=>String(value).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const TOPIC_STATUSES=new Set(["implemented-awaiting-validation","planned"]);

export function filterPhysicsTopics(topics,{query="",category="",subcategory="",difficulty="",status=""}={}) {
  const q=String(query).trim().toLocaleLowerCase("pt-BR");
  return topics.filter((topic)=>{
    const matchesText=!q||`${topic.number} ${topic.title} ${topic.category}`.toLocaleLowerCase("pt-BR").includes(q);
    return matchesText&&(!category||topic.category===category)&&(!subcategory||topic.subcategory===subcategory)&&(!difficulty||topic.difficulty===difficulty)&&(!status||topic.implementationStatus===status);
  });
}

export function physicsTopicCardMarkup(topic) {
  const available=topic.implementationStatus==="implemented-awaiting-validation"&&/^[a-z0-9-]+$/.test(topic.linkedExperimentId||"");
  const state=available?"Simulação existente · aguardando validação":"Planejado";
  const cardClass=available?"is-existing":"is-planned";
  const prioritySlug=/^priority-([a-z0-9-]+)$/.exec(topic.linkedExperimentId||"");
  const target=prioritySlug
    ? "laboratorio-prioritario.html?topico="+encodeURIComponent(prioritySlug[1])
    :topic.linkedExperimentId==="faraday-induction"
      ?"laboratorio-faraday.html"
      :topic.linkedExperimentId==="freefall"
        ?"laboratorio-queda-livre.html"
        :"laboratorio-experimento.html?topico="+encodeURIComponent(topic.linkedExperimentId);
  const action=available
    ?`<a class="text-link" href="${target}">Abrir experimento relacionado →</a>`
    :'<span class="physics-topic-pending">Ainda não há um experimento para abrir.</span>';
  const description=available?topic.description:"Modelo, interface e validação serão desenvolvidos em uma etapa futura.";
  return `<article class="physics-topic-card"><div><span class="physics-topic-number">TÓPICO ${String(topic.number).padStart(3,"0")}</span><h3>${esc(topic.title)}</h3><p>${esc(topic.category)} · ${esc(topic.simulationType)}</p><span class="physics-topic-state ${cardClass}">${state}</span><p>${esc(description)}</p></div>${action}</article>`;
}

async function initializePhysicsTopicCatalog(root) {
  const search=root.querySelector("#physics-topic-search");
  const categorySelect=root.querySelector("#physics-topic-category");
  const statusSelect=root.querySelector("#physics-topic-status");
  const subcategorySelect=root.querySelector("#physics-topic-subcategory");
  const difficultySelect=root.querySelector("#physics-topic-difficulty");
  const cards=root.querySelector("#physics-topic-cards");
  const count=root.querySelector("#physics-topic-result-count");
  const empty=root.querySelector("#physics-topic-empty");
  try {
    const response=await fetch(new URL("./physics-topics.json",document.baseURI),{cache:"no-cache"});
    if(!response.ok)throw new Error("O catálogo ainda não foi publicado junto com a página.");
    const topics=await response.json();
    if(!Array.isArray(topics)||topics.length!==480)throw new Error("O catálogo recebido não contém os 480 registros esperados.");
    const categories=[...new Set(topics.map((topic)=>topic.category))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    categorySelect.insertAdjacentHTML("beforeend",categories.map((item)=>`<option value="${esc(item)}">${esc(item)}</option>`).join(""));
    const subcategories=[...new Set(topics.map((topic)=>topic.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const difficulties=[...new Set(topics.map((topic)=>topic.difficulty).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    if(subcategories.length){subcategorySelect.innerHTML=`<option value="">Todas as subáreas</option>${subcategories.map((item)=>`<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;subcategorySelect.disabled=false;}
    if(difficulties.length){difficultySelect.innerHTML=`<option value="">Todos os níveis</option>${difficulties.map((item)=>`<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;difficultySelect.disabled=false;}
    const existing=topics.filter((topic)=>topic.linkedExperimentId).length;
    root.querySelector("#physics-total").textContent=String(topics.length);
    root.querySelector("#physics-existing").textContent=String(existing);
    root.querySelector("#physics-planned").textContent=String(topics.length-existing);
    const draw=()=>{
      const filtered=filterPhysicsTopics(topics,{query:search.value,category:categorySelect.value,subcategory:subcategorySelect.value,difficulty:difficultySelect.value,status:statusSelect.value});
      cards.innerHTML=filtered.map(physicsTopicCardMarkup).join("");
      count.textContent=`${filtered.length} de ${topics.length} tópicos exibidos.`;
      empty.hidden=filtered.length>0;
    };
    search.addEventListener("input",draw);
    categorySelect.addEventListener("change",draw);
    statusSelect.addEventListener("change",draw);
    subcategorySelect.addEventListener("change",draw);
    difficultySelect.addEventListener("change",draw);
    draw();
  } catch(error) {
    cards.replaceChildren();
    count.textContent=error?.message||"Não foi possível carregar o catálogo.";
    count.setAttribute("role","alert");
  }
}

function physicsPriorityGroupMarkup(group,index) {
  const stateLabel={published:"Animação disponível",related:"Simulação relacionada",planned:"Próximo laboratório"};
  const items=group.items.map((item)=> {
    const state=stateLabel[item.state]||"Planejado";
    const links=(item.links||[]).filter((link)=>/^(laboratorio-experimento\.html\?topico=[a-z0-9-]+|laboratorio-prioritario\.html\?topico=[a-z0-9-]+|laboratorio-faraday\.html|laboratorio-queda-livre\.html)$/.test(link.href||""))
      .map((link)=>'<a href="'+esc(link.href)+'">'+esc(link.label)+' →</a>').join("");
    const className=item.state==="published"?"is-published":item.state==="related"?"is-related":"is-planned";
    return '<article class="physics-priority-item '+className+'"><div class="physics-priority-item-head"><span class="physics-priority-rank">TÓPICO '+String(item.number).padStart(2,"0")+'</span><span class="physics-priority-state">'+state+'</span></div><div class="physics-priority-title-line"><h3>'+esc(item.title)+'</h3><span class="physics-priority-mode">FORMATO: '+esc(item.mode||"A definir")+'</span></div><p>'+esc(item.detail)+'</p>'+(links?'<div class="physics-priority-links">'+links+'</div>':"")+'</article>';
  }).join("");
  const published=group.items.filter((item)=>item.state==="published").length;
  const summary=published===5?"5 animações disponíveis":published+" de 5 disponíveis";
  return '<details class="physics-priority-group"'+(index===0?" open":"")+'><summary><span class="physics-priority-group-number">'+(index+1)+'</span><span class="physics-priority-group-title"><strong>'+esc(group.title)+'</strong><small>Grupo '+(index+1)+' de 5 · '+summary+'</small></span></summary><div class="physics-priority-items">'+items+'</div></details>';
}

async function initializePhysicsPriorityGroups() {
  const root=document.querySelector("[data-physics-priority-groups]");
  if(!root)return;
  const status=root.querySelector(".physics-priority-loading");
  const container=root.querySelector(".physics-priority-groups");
  try {
    const response=await fetch(new URL("./physics-priority-groups.json",document.baseURI),{cache:"no-cache"});
    if(!response.ok)throw new Error("Não foi possível carregar os grupos prioritários.");
    const data=await response.json();
    if(!Array.isArray(data.groups)||data.groups.length!==5||data.groups.some((group)=>!Array.isArray(group.items)||group.items.length!==5))throw new Error("O roteiro precisa conter cinco grupos de cinco tópicos.");
    container.innerHTML=data.groups.map(physicsPriorityGroupMarkup).join("");
    status.textContent="25 laboratórios disponíveis em cinco grupos.";
  } catch(error) {
    status.textContent=error?.message||"Os grupos prioritários não puderam ser carregados.";
    status.classList.add("physics-priority-error");
    status.setAttribute("role","alert");
  }
}
initializePhysicsPriorityGroups();

const catalogRoot=globalThis.document?.querySelector("[data-physics-topic-catalog]");
if(catalogRoot)initializePhysicsTopicCatalog(catalogRoot);
