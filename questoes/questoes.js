import {filterQuestions,filterByView,sortQuestions as sortQuestionList,recordAnswer,toggleFavorite,summarizeProgress,normalizeQuestionList,loadProgress,saveProgress} from "./questoes-core.mjs";
import {supabasePromise} from "/src-supabase.js";
import "./questoes-data.js";

(() => {
  "use strict";

  let allQuestions = Array.isArray(window.DIARIO_QUESTIONS) ? window.DIARIO_QUESTIONS : [];
  const allowedLabs = new Set(["/laboratorio-mru/","/laboratorio-mruv/","/laboratorio-espelhos/","/laboratorio-magnetismo/"]);
  const pageSize = 6;
  const storageKey = "diario-bns-questoes-v1";
  const filterConfig = [
    {key:"disciplina",label:"Disciplina",field:"discipline"},
    {key:"assunto",label:"Assunto",field:"subject"},
    {key:"banca",label:"Banca",field:"bank"},
    {key:"instituicao",label:"Instituição",field:"institution"},
    {key:"ano",label:"Ano",field:"year"},
    {key:"dificuldade",label:"Dificuldade",field:"difficulty"}
  ];
  const filterSets = Object.fromEntries(filterConfig.map(item => [item.key,new Set()]));
  const el = id => document.getElementById(id);
  const questionList = el("question-list");
  const filtersRoot = el("question-filters");
  const searchInput = el("question-search");
  const questionCount = el("question-count");
  const pagination = el("question-pagination");
  const emptyPanel = el("question-empty");
  const imageDialog = el("question-image-dialog");
  const progressBar = document.querySelector(".q-progress-bar");
  let progressStorage = null;
  try { progressStorage = window.localStorage; } catch {}
  let state = loadProgress(progressStorage,storageKey);
  let activeView = "all";
  let currentPage = 1;
  let searchTimer = 0;
  let quizSession = null;
  let quizTimer = 0;
  const simulations = allowedLabs;

  function saveState() {
    if (!saveProgress(progressStorage,storageKey,state)) setStatus("O navegador não permitiu salvar o progresso local.");
  }
  function setStatus(message) { questionCount.textContent = message; }
  function questionRecord(question) {
    const value = state.answers[question.id];
    if (!value || typeof value !== "object") return {attempts:0,correct:0,lastCorrect:null};
    return {
      attempts:Number.isFinite(value.attempts) ? Math.max(0,value.attempts) : 0,
      correct:Number.isFinite(value.correct) ? Math.max(0,value.correct) : 0,
      lastCorrect:typeof value.lastCorrect === "boolean" ? value.lastCorrect : null
    };
  }
  let validation = normalizeQuestionList(allQuestions);
  let questions = validation.questions;

  function uniqueOptions(field) {
    return [...new Set(questions.map(question => question[field]).filter(value => value !== null && value !== undefined && String(value).trim() !== "").map(String))]
      .sort((a,b) => {
        if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(b)-Number(a);
        return a.localeCompare(b,"pt-BR",{numeric:true,sensitivity:"base"});
      });
  }
  function readUrlFilters() {
    const params = new URLSearchParams(location.search);
    searchInput.value = params.get("q") || "";
    for (const item of filterConfig) {
      filterSets[item.key].clear();
      (params.get(item.key) || "").split(",").filter(Boolean).forEach(value => filterSets[item.key].add(value));
    }
  }
  function updateUrl() {
    const url = new URL(location.href);
    url.search = "";
    const query = searchInput.value.trim();
    if (query) url.searchParams.set("q",query);
    for (const item of filterConfig) {
      const selected = [...filterSets[item.key]];
      if (selected.length) url.searchParams.set(item.key,selected.join(","));
    }
    history.replaceState(history.state,"",url.pathname + url.search + url.hash);
  }
  function renderFilters() {
    filtersRoot.replaceChildren();
    for (const item of filterConfig) {
      const details = document.createElement("details");
      details.className = "q-filter";
      details.dataset.filterKey = item.key;
      const summary = document.createElement("summary");
      const label = document.createElement("span");
      label.className = "q-filter-label";
      label.textContent = item.label;
      const selectedCount = document.createElement("span");
      selectedCount.className = "q-filter-selected";
      selectedCount.dataset.selectedCount = item.key;
      summary.append(label,selectedCount);
      const menu = document.createElement("div");
      menu.className = "q-filter-menu";
      menu.addEventListener("click",event => event.stopPropagation());
      const optionSearch = document.createElement("input");
      optionSearch.type = "search";
      optionSearch.className = "q-filter-option-search";
      optionSearch.placeholder = "Buscar " + item.label.toLocaleLowerCase("pt-BR") + "…";
      optionSearch.setAttribute("aria-label","Buscar opções de " + item.label.toLocaleLowerCase("pt-BR"));
      const options = document.createElement("div");
      options.className = "q-filter-options";
      options.setAttribute("role","group");
      options.setAttribute("aria-label",item.label);
      for (const value of uniqueOptions(item.field)) {
        const optionLabel = document.createElement("label");
        optionLabel.className = "q-filter-option";
        optionLabel.dataset.optionText = value.toLocaleLowerCase("pt-BR");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.checked = filterSets[item.key].has(value);
        checkbox.addEventListener("change",() => {
          if (checkbox.checked) filterSets[item.key].add(value);
          else filterSets[item.key].delete(value);
          currentPage = 1;
          updateFilterCount();
          updateUrl();
          renderQuestions();
        });
        const text = document.createElement("span");
        text.textContent = value;
        optionLabel.append(checkbox,text);
        options.append(optionLabel);
      }
      if (!options.children.length) {
        const note = document.createElement("p");
        note.className = "q-filter-empty";
        note.textContent = "Nenhuma opção cadastrada.";
        options.append(note);
      }
      optionSearch.addEventListener("input",() => {
        const query = optionSearch.value.trim().toLocaleLowerCase("pt-BR");
        for (const option of options.querySelectorAll(".q-filter-option")) option.hidden = !option.dataset.optionText.includes(query);
      });
      menu.append(optionSearch,options);
      details.append(summary,menu);
      details.addEventListener("toggle",() => {
        if (details.open) {
          for (const other of filtersRoot.querySelectorAll(".q-filter[open]")) if (other !== details) other.open = false;
          optionSearch.focus({preventScroll:true});
        }
      });
      filtersRoot.append(details);
    }
    updateFilterCount();
  }
  function updateFilterCount() {
    let count = searchInput.value.trim() ? 1 : 0;
    for (const item of filterConfig) {
      const selected = filterSets[item.key];
      count += selected.size;
      const badge = document.querySelector('[data-selected-count="' + item.key + '"]');
      if (badge) badge.textContent = selected.size ? selected.size + " selecionado" + (selected.size === 1 ? "" : "s") : "";
      const details = filtersRoot.querySelector('[data-filter-key="' + item.key + '"]');
      if (details) details.querySelector("summary").setAttribute("aria-label",item.label + (selected.size ? ", " + selected.size + " selecionados" : ""));
    }
    el("active-filter-count").textContent = count + " filtro" + (count === 1 ? "" : "s") + " ativo" + (count === 1 ? "" : "s");
  }
  function baseMatches() {
    const selectedFilters = Object.fromEntries(filterConfig.map(item => [item.field,filterSets[item.key]]));
    return filterQuestions(questions,selectedFilters,searchInput.value);
  }
  function sortedQuestions(list) {
    return sortQuestionList(list,el("question-sort").value);
  }
  function getVisibleQuestions() {
    if (quizSession) return quizSession.ids.map(id => questions.find(question => question.id === id)).filter(Boolean);
    let result = baseMatches();
    return sortedQuestions(filterByView(result,activeView,state.favorites,state.answers));
  }
  function makeChip(text,extraClass) {
    const chip = document.createElement("span");
    chip.className = "q-chip" + (extraClass ? " " + extraClass : "");
    chip.textContent = text;
    return chip;
  }
  function renderCard(question,position) {
    const card = document.createElement("article");
    card.className = "q-card";
    card.id = "questao-" + question.id;
    const head = document.createElement("header");
    head.className = "q-card-head";
    const titleBlock = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "q-card-title";
    title.textContent = "Questão " + String(position).padStart(3,"0") + " · " + question.title;
    titleBlock.append(title);
    const meta = document.createElement("div");
    meta.className = "q-card-meta";
    if (question.discipline) meta.append(makeChip(question.discipline));
    meta.append(makeChip(question.subject));
    if (question.subtopic) meta.append(makeChip(question.subtopic));
    if (question.bank) meta.append(makeChip(question.bank + (question.year ? " " + question.year : "")));
    if (question.institution && question.institution !== question.bank) meta.append(makeChip(question.institution));
    meta.append(makeChip(question.difficulty,"difficulty"));
    titleBlock.append(meta);
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "q-favorite";
    favorite.setAttribute("aria-pressed",String(state.favorites.includes(question.id)));
    favorite.setAttribute("aria-label",state.favorites.includes(question.id) ? "Remover questão dos favoritos" : "Salvar questão nos favoritos");
    favorite.title = state.favorites.includes(question.id) ? "Remover dos favoritos" : "Salvar nos favoritos";
    favorite.textContent = state.favorites.includes(question.id) ? "★" : "☆";
    favorite.addEventListener("click",() => {
      state.favorites = toggleFavorite(state.favorites,question.id);
      saveState();
      updateProgress();
      renderQuestions();
    });
    head.append(titleBlock,favorite);

    const body = document.createElement("div");
    body.className = "q-card-body";
    const statement = document.createElement("p");
    statement.className = "q-statement";
    statement.textContent = question.statement;
    body.append(statement);
    const questionImages = Array.isArray(question.images) && question.images.length
      ? question.images
      : question.image ? [{src:question.image,alt:question.imageAlt || "Figura da questão"}] : [];
    for (const item of questionImages) {
      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.className = "q-diagram-button";
      imageButton.setAttribute("aria-label","Ampliar figura: " + (item.alt || question.title));
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt || "Figura da questão";
      image.loading = "lazy";
      imageButton.append(image);
      imageButton.addEventListener("click",() => {
        el("question-image-large").src = item.src;
        el("question-image-large").alt = item.alt || "Figura da questão";
        el("question-image-caption").textContent = item.alt || question.title;
        if (typeof imageDialog.showModal === "function") imageDialog.showModal();
      });
      body.append(imageButton);
    }
    const choices = document.createElement("fieldset");
    choices.className = "q-choice-group";
    const legend = document.createElement("legend");
    legend.textContent = "Selecione uma alternativa";
    choices.append(legend);
    const feedback = document.createElement("div");
    feedback.className = "q-answer-feedback";
    feedback.hidden = true;
    feedback.setAttribute("role","status");
    let checked = false;
    for (const choice of question.choices) {
      const label = document.createElement("label");
      label.className = "q-choice";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answer-" + question.id;
      radio.value = choice.letter;
      radio.addEventListener("change",() => {
        for (const other of choices.querySelectorAll(".q-choice")) other.classList.toggle("is-selected",other.querySelector("input").checked);
      });
      const text = document.createElement("span");
      text.textContent = "(" + choice.letter + ") " + choice.text;
      label.append(radio,text);
      choices.append(label);
    }
    const actions = document.createElement("div");
    actions.className = "q-card-actions";
    const verify = document.createElement("button");
    verify.type = "button";
    verify.className = "q-button q-button-save";
    verify.textContent = "Verificar resposta";
    verify.addEventListener("click",() => {
      if (checked) return;
      const chosen = choices.querySelector('input[type="radio"]:checked');
      if (!chosen) {
        feedback.hidden = false;
        feedback.className = "q-answer-feedback";
        feedback.textContent = "Escolha uma alternativa antes de conferir.";
        return;
      }
      checked = true;
      choices.disabled = true;
      const correct = chosen.value === question.correct;
      const answerUpdate = recordAnswer(state.answers,question.id,chosen.value,question.correct);
      state.answers = answerUpdate.answers;
      saveState();
      for (const label of choices.querySelectorAll(".q-choice")) {
        const radio = label.querySelector("input");
        if (radio.value === question.correct) label.classList.add("is-correct");
        else if (radio.checked) label.classList.add("is-wrong");
      }
      feedback.hidden = false;
      feedback.className = "q-answer-feedback " + (correct ? "is-correct" : "is-wrong");
      const heading = document.createElement("strong");
      heading.textContent = correct ? "Resposta correta." : "Ainda não. A alternativa correta é " + question.correct + ".";
      const note = document.createElement("span");
      note.textContent = correct ? " Confira a resolução se quiser revisar o raciocínio." : " Você pode ler a resolução e tentar novamente.";
      feedback.replaceChildren(heading,note);
      verify.disabled = true;
      retry.hidden = false;
      updateProgress();
      if (quizSession && quizSession.ids.includes(question.id) && !quizSession.checked.has(question.id)) {
        quizSession.checked.set(question.id,correct);
        updateQuizBanner();
        if (quizSession.checked.size >= quizSession.ids.length) finishQuiz();
      }
    });
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "q-button q-button-outline";
    retry.textContent = "Tentar novamente";
    retry.hidden = true;
    retry.addEventListener("click",() => {
      checked = false;
      choices.disabled = false;
      choices.querySelectorAll("input").forEach(input => { input.checked = false; });
      choices.querySelectorAll(".q-choice").forEach(label => label.classList.remove("is-selected","is-wrong","is-correct"));
      feedback.hidden = true;
      verify.disabled = false;
      retry.hidden = true;
    });
    const solutionButton = document.createElement("button");
    solutionButton.type = "button";
    solutionButton.className = "q-button q-button-outline";
    solutionButton.textContent = "Ver resolução";
    const solution = document.createElement("div");
    solution.className = "q-solution";
    solution.hidden = true;
    const solutionTitle = document.createElement("strong");
    solutionTitle.textContent = "Resolução passo a passo";
    const solutionText = document.createElement("div");
    solutionText.textContent = question.solution;
    solution.append(solutionTitle,solutionText);
    solutionButton.setAttribute("aria-expanded","false");
    solutionButton.addEventListener("click",() => {
      solution.hidden = !solution.hidden;
      solutionButton.textContent = solution.hidden ? "Ver resolução" : "Ocultar resolução";
      solutionButton.setAttribute("aria-expanded",String(!solution.hidden));
    });
    actions.append(verify,retry,solutionButton);
    const footer = document.createElement("div");
    footer.className = "q-card-footer";
    if (question.simulation && simulations.has(question.simulation)) {
      const simulation = document.createElement("a");
      simulation.className = "q-simulation";
      simulation.href = question.simulation;
      simulation.textContent = "Explorar em uma simulação →";
      footer.append(simulation);
    } else {
      const empty = document.createElement("span");
      empty.className = "q-card-id";
      empty.textContent = "Questão " + question.id;
      footer.append(empty);
    }
    if (question.source) {
      const source = document.createElement("p");
      source.className = "q-source";
      source.textContent = "Fonte: " + question.source + (question.license ? " " + question.license : "");
      footer.append(source);
    }
    body.append(choices,actions,feedback,solution,footer);
    card.append(head,body);
    return card;
  }
  function renderPagination(total) {
    pagination.replaceChildren();
    const pages = Math.ceil(total/pageSize);
    if (pages <= 1) return;
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "‹";
    previous.setAttribute("aria-label","Página anterior");
    previous.disabled = currentPage <= 1;
    previous.addEventListener("click",() => { currentPage--; renderQuestions(); });
    pagination.append(previous);
    for (let page=1; page<=pages; page++) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(page);
      if (page === currentPage) button.setAttribute("aria-current","page");
      button.setAttribute("aria-label","Página " + page);
      button.addEventListener("click",() => { currentPage=page; renderQuestions(); });
      pagination.append(button);
    }
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "›";
    next.setAttribute("aria-label","Próxima página");
    next.disabled = currentPage >= pages;
    next.addEventListener("click",() => { currentPage++; renderQuestions(); });
    pagination.append(next);
  }
  function renderQuestions() {
    const visible = getVisibleQuestions();
    if (currentPage > Math.max(1,Math.ceil(visible.length/pageSize))) currentPage = Math.max(1,Math.ceil(visible.length/pageSize));
    const start = (currentPage-1)*pageSize;
    const pageItems = visible.slice(start,start+pageSize);
    questionList.replaceChildren();
    pageItems.forEach((question,index) => questionList.append(renderCard(question,start+index+1)));
    emptyPanel.hidden = visible.length > 0;
    questionList.hidden = visible.length === 0;
    const prefix = quizSession ? "Simulado · " : "";
    const questionWord = visible.length === 1 ? "questão" : "questões";
    const foundWord = visible.length === 1 ? "encontrada" : "encontradas";
    questionCount.textContent = prefix + visible.length + " " + questionWord + " " + foundWord + (visible.length > pageSize ? " · mostrando " + (start+1) + "–" + Math.min(start+pageSize,visible.length) : "") + ".";
    renderPagination(visible.length);
    updateFilterCount();
    updateQuizBanner();
  }
  function updateProgress() {
    const progress = summarizeProgress(questions,state.answers);
    el("progress-accuracy").textContent = progress.accuracy + "%";
    el("progress-answered").textContent = String(progress.answered);
    el("progress-correct").textContent = String(progress.correct);
    el("progress-attempts").textContent = String(progress.attempts);
    progressBar.setAttribute("aria-valuenow",String(progress.accuracy));
    el("progress-bar-fill").style.width = progress.accuracy + "%";
    el("favorite-count").textContent = String(state.favorites.length);
  }
  function shuffle(list) {
    const copy = [...list];
    for (let index=copy.length-1; index>0; index--) {
      const target = Math.floor(Math.random()*(index+1));
      [copy[index],copy[target]] = [copy[target],copy[index]];
    }
    return copy;
  }
  function updateQuizBanner() {
    const banner = el("quiz-banner");
    if (!quizSession) { banner.hidden = true; return; }
    banner.hidden = false;
    const completed = quizSession.checked.size;
    el("quiz-progress").textContent = "Questão " + Math.min(completed+1,quizSession.ids.length) + " de " + quizSession.ids.length + " · " + completed + " respondida" + (completed === 1 ? "" : "s") + (quizSession.shortage ? " · quantidade ajustada aos filtros" : "");
    if (quizSession.secondsLeft !== null) {
      const minutes = Math.floor(quizSession.secondsLeft/60).toString().padStart(2,"0");
      const seconds = (quizSession.secondsLeft%60).toString().padStart(2,"0");
      el("quiz-timer").textContent = "Tempo restante: " + minutes + ":" + seconds;
    } else el("quiz-timer").textContent = "Sem cronômetro";
  }
  function finishQuiz() {
    if (!quizSession) return;
    if (quizTimer) window.clearInterval(quizTimer);
    quizTimer = 0;
    const session = quizSession;
    quizSession = null;
    currentPage = 1;
    const attempted = session.checked.size;
    const correct = [...session.checked.values()].filter(Boolean).length;
    const wrongIds = [...session.checked.entries()].filter(([,isCorrect]) => !isCorrect).map(([id]) => id);
    const summary = document.createElement("section");
    summary.className = "q-answer-feedback " + (correct === attempted && attempted > 0 ? "is-correct" : "is-wrong");
    summary.setAttribute("role","status");
    const heading = document.createElement("strong");
    heading.textContent = "Simulado encerrado: " + correct + " acerto" + (correct === 1 ? "" : "s") + " em " + attempted + " respondida" + (attempted === 1 ? "" : "s") + ".";
    const note = document.createElement("span");
    note.textContent = attempted < session.ids.length ? " " + (session.ids.length-attempted) + " questão(ões) ficaram sem resposta. " : " ";
    summary.append(heading,note);
    if (wrongIds.length) {
      const review = document.createElement("button");
      review.type = "button";
      review.className = "q-button q-button-outline";
      review.textContent = "Revisar erros";
      review.addEventListener("click",() => {
        activeView = "wrong";
        el("question-list").scrollIntoView({behavior:"smooth",block:"start"});
        document.querySelector('[data-view="wrong"]').click();
      });
      summary.append(review);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "q-button q-button-outline";
    close.textContent = "Fechar resultado";
    close.addEventListener("click",() => summary.remove());
    summary.append(close);
    const previous = el("quiz-summary");
    if (previous) previous.remove();
    summary.id = "quiz-summary";
    el("quiz-banner").after(summary);
    el("quiz-banner").hidden = true;
    activeView = "all";
    renderQuestions();
  }
  function startQuiz(event) {
    event.preventDefault();
    if (quizTimer) window.clearInterval(quizTimer);
    const candidates = baseMatches();
    if (!candidates.length) {
      setStatus("Nenhuma questão corresponde aos filtros atuais. Ajuste a busca para começar o simulado.");
      document.querySelector(".q-study-details").open = false;
      return;
    }
    const wanted = Number(el("quiz-amount").value) || 5;
    const ids = shuffle(candidates).slice(0,Math.min(wanted,candidates.length)).map(question => question.id);
    quizSession = {ids,checked:new Map(),secondsLeft:el("quiz-timer-enabled").checked ? Number(el("quiz-time").value)*60 : null,shortage:candidates.length<wanted};
    const previous = el("quiz-summary");
    if (previous) previous.remove();
    activeView = "all";
    currentPage = 1;
    document.querySelector(".q-study-details").open = false;
    renderQuestions();
    if (quizSession.secondsLeft !== null) {
      quizTimer = window.setInterval(() => {
        if (!quizSession) return;
        quizSession.secondsLeft--;
        updateQuizBanner();
        if (quizSession.secondsLeft <= 0) finishQuiz();
      },1000);
    }
    el("quiz-banner").scrollIntoView({behavior:"smooth",block:"center"});
  }
  function clearFilters() {
    searchInput.value = "";
    for (const item of filterConfig) filterSets[item.key].clear();
    activeView = "all";
    currentPage = 1;
    renderFilters();
    updateUrl();
    renderQuestions();
  }

  readUrlFilters();
  renderFilters();
  searchInput.addEventListener("input",() => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      currentPage = 1;
      updateFilterCount();
      updateUrl();
      renderQuestions();
    },180);
  });
  searchInput.addEventListener("keydown",event => { if (event.key === "Enter") { window.clearTimeout(searchTimer); currentPage=1; updateUrl(); renderQuestions(); } });
  el("clear-filters").addEventListener("click",clearFilters);
  el("empty-clear").addEventListener("click",clearFilters);
  el("question-sort").addEventListener("change",() => { currentPage=1; renderQuestions(); });
  for (const button of document.querySelectorAll("[data-view]")) {
    button.addEventListener("click",() => {
      activeView = button.dataset.view;
      currentPage = 1;
      for (const other of document.querySelectorAll("[data-view]")) other.setAttribute("aria-pressed",String(other === button));
      renderQuestions();
    });
  }
  el("quiz-timer-enabled").addEventListener("change",event => { el("quiz-time-label").hidden = !event.target.checked; });
  el("quiz-form").addEventListener("submit",startQuiz);
  el("end-quiz").addEventListener("click",finishQuiz);
  el("reset-progress").addEventListener("click",() => {
    if (!window.confirm("Apagar as tentativas e o progresso salvo neste navegador? As questões favoritas serão mantidas.")) return;
    state.answers = {};
    saveState();
    updateProgress();
    currentPage=1;
    renderQuestions();
  });
  el("share-search").addEventListener("click",() => {
    updateUrl();
    el("share-search-url").value = location.href;
    el("share-search-panel").hidden = false;
    el("share-search-url").focus();
    el("share-search-url").select();
  });
  el("copy-search-url").addEventListener("click",async () => {
    const input = el("share-search-url");
    try {
      await navigator.clipboard.writeText(input.value);
      el("share-search-status").textContent = "Link copiado.";
    } catch {
      input.focus(); input.select();
      el("share-search-status").textContent = "Selecione e copie o link.";
    }
  });
  window.addEventListener("popstate",() => {
    readUrlFilters();
    renderFilters();
    currentPage=1;
    renderQuestions();
  });
  imageDialog.addEventListener("click",event => {
    if (event.target === imageDialog) imageDialog.close();
  });
  window.addEventListener("keydown",event => {
    if (event.key === "Escape") for (const details of filtersRoot.querySelectorAll(".q-filter[open]")) details.open = false;
  });
  updateProgress();
  renderQuestions();
  if (validation.invalidCount > 0) setStatus("A página carregou " + questions.length + " questões válidas; " + validation.invalidCount + " registros foram ignorados por estarem incompletos.");

  async function loadPublishedQuestions() {
    const database = await supabasePromise;
    if (!database) return;
    const {data,error} = await database.from("physics_questions").select("*").eq("status","published").order("created_at",{ascending:false}).limit(500);
    if (error) return;
    const databaseQuestions = (data || []).map(record => {
      const paths = [record.cover_image_path,...(record.illustration_image_paths || [])].filter(Boolean);
      const images = paths.map((path,index) => ({
        src:database.storage.from("question-images").getPublicUrl(path).data.publicUrl,
        alt:index === 0 && record.display_format === "image" ? "Imagem completa do enunciado" : `Imagem ilustrativa ${index + 1}`
      }));
      return {
        id:"admin-" + record.id,
        title:record.title,
        discipline:record.discipline,
        subject:record.subject,
        subtopic:"",
        bank:record.bank || "",
        institution:record.institution || "",
        year:record.year == null ? null : Number(record.year),
        difficulty:record.difficulty,
        statement:record.statement?.trim() || "Analise a imagem completa da questão.",
        image:images[0]?.src || "",
        imageAlt:images[0]?.alt || "",
        images,
        choices:Array.isArray(record.choices) ? record.choices : [],
        correct:record.correct_option,
        solution:record.resolution || "",
        source:"",
        license:"",
        tags:[]
      };
    });
    allQuestions = [...databaseQuestions,...(Array.isArray(window.DIARIO_QUESTIONS) ? window.DIARIO_QUESTIONS : [])];
    validation = normalizeQuestionList(allQuestions);
    questions = validation.questions;
    currentPage = 1;
    renderFilters();
    updateProgress();
    renderQuestions();
    const adminLink = el("question-admin-link");
    if (adminLink) {
      const {data:authData} = await database.auth.getUser();
      if (authData?.user) {
        const {data:role} = await database.from("user_roles").select("role,status").eq("user_id",authData.user.id).maybeSingle();
        if (role?.role === "admin" && role?.status === "active") adminLink.hidden = false;
      }
    }
  }

  loadPublishedQuestions().catch(() => {});
})();
