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
  const target=topic.linkedExperimentId==="faraday-induction"
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

const catalogRoot=globalThis.document?.querySelector("[data-physics-topic-catalog]");
if(catalogRoot)initializePhysicsTopicCatalog(catalogRoot);
