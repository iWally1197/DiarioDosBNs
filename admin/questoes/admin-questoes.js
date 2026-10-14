import {supabasePromise} from "/src-supabase.js";

(() => {
  "use strict";

  const BUCKET = "question-images";
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const MAX_IMAGE_COUNT = 9;
  const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
  const byId = id => document.getElementById(id);
  const authNotice = byId("question-admin-auth");
  const shell = byId("question-admin-shell");
  const form = byId("question-form");
  const formNotice = byId("question-form-status");
  const listStatus = byId("question-admin-list-status");
  const recordsRoot = byId("question-admin-records");
  const imagePreview = byId("question-image-preview");
  const studentPreview = byId("question-student-preview");
  const coverInput = byId("question-cover");
  const illustrationsInput = byId("question-illustrations");
  let client = null;
  let adminUser = null;
  let records = [];
  let editing = null;
  let existingCoverPath = "";
  let existingIllustrationPaths = [];
  let previewObjectUrls = new Map();

  function previewUrlFor(file) {
    if (!previewObjectUrls.has(file)) previewObjectUrls.set(file, URL.createObjectURL(file));
    return previewObjectUrls.get(file);
  }

  function showNotice(element, message, kind = "info") {
    element.textContent = message;
    element.dataset.kind = kind;
    element.hidden = !message;
  }

  function publicImageUrl(path) {
    if (!path || !client) return "";
    return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function imagePaths(record) {
    return [...new Set([record?.cover_image_path, ...(record?.illustration_image_paths || [])].filter(Boolean))];
  }

  function setField(id, value = "") {
    byId(id).value = value == null ? "" : String(value);
  }

  function updateFormatHelp() {
    const imageMode = byId("question-format").value === "image";
    byId("statement-help").textContent = imageMode
      ? "A imagem principal deve mostrar a questão completa; o texto acima é opcional."
      : "Você também pode anexar uma imagem ilustrativa abaixo.";
  }

  function clearForm() {
    form.reset();
    form.dataset.dirty = "false";
    updateFormatHelp();
    for (const input of document.querySelectorAll("[data-option-letter]")) input.value = "";
    editing = null;
    existingCoverPath = "";
    existingIllustrationPaths = [];
    byId("q-admin-form-title").textContent = "Nova questão";
    byId("question-delete-current").hidden = true;
    showNotice(formNotice, "");
    renderImagePreview();
    renderStudentPreview();
    byId("question-title").focus();
  }

  function fileValidation(file) {
    if (!ALLOWED_TYPES.has(file.type)) return "Use uma imagem PNG, JPG ou WebP.";
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return "Cada imagem deve ter até 8 MB.";
    return "";
  }

  function validateSelectedFiles() {
    const cover = coverInput.files?.[0] || null;
    const illustrations = [...(illustrationsInput.files || [])];
    if (cover) {
      const message = fileValidation(cover);
      if (message) { coverInput.value = ""; showNotice(formNotice, `Imagem principal: ${message}`, "error"); return false; }
    }
    const bad = illustrations.find(file => fileValidation(file));
    if (bad) {
      illustrationsInput.value = "";
      showNotice(formNotice, `Imagem ilustrativa “${bad.name}”: ${fileValidation(bad)}`, "error");
      return false;
    }
    if (existingIllustrationPaths.length + illustrations.length + (existingCoverPath || cover ? 1 : 0) > MAX_IMAGE_COUNT) {
      illustrationsInput.value = "";
      showNotice(formNotice, "A questão aceita até 9 imagens no total.", "error");
      return false;
    }
    showNotice(formNotice, "");
    return true;
  }

  function makeImageCard({src, label, kind, index}) {
    const item = document.createElement("div");
    item.className = "q-admin-image-item";
    const image = document.createElement("img");
    image.src = src;
    image.alt = label;
    image.loading = "lazy";
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(image, caption);
    if (kind) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Remover " + label);
      remove.dataset.removeKind = kind;
      if (index !== undefined) remove.dataset.removeIndex = String(index);
      item.append(remove);
    }
    return item;
  }

  function renderImagePreview() {
    for (const url of previewObjectUrls.values()) URL.revokeObjectURL(url);
    previewObjectUrls.clear();
    imagePreview.replaceChildren();
    const coverFile = coverInput.files?.[0];
    if (coverFile) {
      const url = previewUrlFor(coverFile);
      imagePreview.append(makeImageCard({src:url, label:"Imagem principal · " + coverFile.name, kind:"new-cover"}));
    } else if (existingCoverPath) {
      imagePreview.append(makeImageCard({src:publicImageUrl(existingCoverPath), label:"Imagem principal", kind:"old-cover"}));
    }
    existingIllustrationPaths.forEach((path,index) => imagePreview.append(makeImageCard({
      src:publicImageUrl(path), label:`Ilustração ${index + 1}`, kind:"old-illustration", index
    })));
    [...(illustrationsInput.files || [])].forEach((file,index) => {
      const url = previewUrlFor(file);
      imagePreview.append(makeImageCard({src:url, label:"Ilustração · " + file.name, kind:"new-illustration", index}));
    });
    renderStudentPreview();
  }

  function createChip(text, extraClass = "") {
    const chip = document.createElement("span");
    chip.className = "q-chip" + (extraClass ? " " + extraClass : "");
    chip.textContent = text;
    return chip;
  }

  function previewImageSources() {
    const coverFile = coverInput.files?.[0];
    const images = [];
    if (coverFile) {
      images.push({src:previewUrlFor(coverFile), alt:"Imagem principal da questão"});
    } else if (existingCoverPath) images.push({src:publicImageUrl(existingCoverPath), alt:"Imagem principal da questão"});
    existingIllustrationPaths.forEach((path,index) => images.push({src:publicImageUrl(path), alt:`Imagem ilustrativa ${index + 1}`}));
    [...(illustrationsInput.files || [])].forEach((file,index) => {
      images.push({src:previewUrlFor(file), alt:`Imagem ilustrativa ${existingIllustrationPaths.length + index + 1}`});
    });
    return images;
  }

  function renderStudentPreview() {
    studentPreview.replaceChildren();
    const title = byId("question-title").value.trim() || "Título da questão";
    const format = byId("question-format").value;
    const statementValue = byId("question-statement").value.trim();
    const statementText = statementValue || (format === "image" ? "Analise a imagem completa da questão." : "O enunciado digitado aparecerá aqui.");
    const card = document.createElement("article");
    card.className = "q-card";
    const head = document.createElement("header");
    head.className = "q-card-head";
    const titleBlock = document.createElement("div");
    const heading = document.createElement("h3");
    heading.className = "q-card-title";
    heading.textContent = "Questão 001 · " + title;
    const meta = document.createElement("div");
    meta.className = "q-card-meta";
    const discipline = byId("question-discipline").value;
    const subject = byId("question-subject").value.trim();
    const bank = byId("question-bank").value.trim();
    const institution = byId("question-institution").value.trim();
    const year = byId("question-year").value.trim();
    if (discipline) meta.append(createChip(discipline));
    if (subject) meta.append(createChip(subject));
    if (bank) meta.append(createChip(bank + (year ? " " + year : "")));
    if (institution && institution !== bank) meta.append(createChip(institution));
    meta.append(createChip(byId("question-difficulty").value, "difficulty"));
    titleBlock.append(heading, meta);
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "q-favorite";
    favorite.setAttribute("aria-label", "Favoritar questão (prévia)");
    favorite.textContent = "☆";
    head.append(titleBlock, favorite);
    const body = document.createElement("div");
    body.className = "q-card-body";
    const statement = document.createElement("p");
    statement.className = "q-statement";
    statement.textContent = statementText;
    body.append(statement);
    for (const item of previewImageSources()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "q-diagram-button";
      button.setAttribute("aria-label", "Ampliar figura: " + item.alt);
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      image.loading = "lazy";
      button.append(image);
      body.append(button);
    }
    const choices = document.createElement("fieldset");
    choices.className = "q-choice-group";
    const legend = document.createElement("legend");
    legend.textContent = "Selecione uma alternativa";
    choices.append(legend);
    const presentOptions = [...document.querySelectorAll("[data-option-letter]")].map(input => ({letter:input.dataset.optionLetter, text:input.value.trim()})).filter(option => option.text);
    for (const option of presentOptions) {
      const label = document.createElement("label");
      label.className = "q-choice";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "question-preview-answer";
      radio.value = option.letter;
      const text = document.createElement("span");
      text.textContent = `(${option.letter}) ${option.text}`;
      label.append(radio,text);
      choices.append(label);
    }
    if (!presentOptions.length) {
      const note = document.createElement("p");
      note.className = "q-admin-preview-empty";
      note.textContent = "As alternativas digitadas aparecerão aqui.";
      body.append(choices,note);
    } else body.append(choices);
    const actions = document.createElement("div");
    actions.className = "q-card-actions";
    const verify = document.createElement("button");
    verify.type = "button";
    verify.className = "q-button q-button-save";
    verify.textContent = "Verificar resposta";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "q-button q-button-outline";
    retry.textContent = "Tentar novamente";
    retry.hidden = true;
    const solutionButton = document.createElement("button");
    solutionButton.type = "button";
    solutionButton.className = "q-button q-button-outline";
    solutionButton.textContent = "Ver resolução";
    actions.append(verify,retry,solutionButton);
    const feedback = document.createElement("div");
    feedback.className = "q-answer-feedback";
    feedback.hidden = true;
    feedback.setAttribute("role", "status");
    const solution = document.createElement("div");
    solution.className = "q-solution";
    solution.hidden = true;
    const solutionTitle = document.createElement("strong");
    solutionTitle.textContent = "Resolução passo a passo";
    const solutionText = document.createElement("div");
    solutionText.textContent = byId("question-solution").value.trim() || "A resolução detalhada aparecerá aqui.";
    solution.append(solutionTitle,solutionText);
    solutionButton.setAttribute("aria-expanded", "false");
    solutionButton.addEventListener("click", () => {
      solution.hidden = !solution.hidden;
      solutionButton.textContent = solution.hidden ? "Ver resolução" : "Ocultar resolução";
      solutionButton.setAttribute("aria-expanded", String(!solution.hidden));
    });
    verify.addEventListener("click", () => {
      const selected = choices.querySelector("input[type=radio]:checked");
      feedback.hidden = false;
      if (!selected) {
        feedback.textContent = "Escolha uma alternativa antes de conferir.";
        return;
      }
      const correct = selected.value === byId("question-correct").value;
      feedback.className = "q-answer-feedback " + (correct ? "is-correct" : "is-wrong");
      feedback.textContent = correct ? "Resposta correta." : "Ainda não. A alternativa correta é " + byId("question-correct").value + ".";
      retry.hidden = false;
      verify.disabled = true;
      choices.disabled = true;
    });
    retry.addEventListener("click", () => {
      choices.disabled = false;
      choices.querySelectorAll("input").forEach(input => { input.checked = false; });
      feedback.hidden = true;
      verify.disabled = false;
      retry.hidden = true;
    });
    const footer = document.createElement("div");
    footer.className = "q-card-footer";
    const recordId = document.createElement("span");
    recordId.className = "q-card-id";
    recordId.textContent = editing ? "Questão " + editing.id : "Questão (publicação)";
    footer.append(recordId);
    body.append(actions,feedback,solution,footer);
    card.append(head,body);
    studentPreview.append(card);
  }

  function renderRecordList() {
    const query = byId("question-admin-search").value.trim().toLocaleLowerCase("pt-BR");
    const visible = records.filter(record => [record.title,record.subject,record.bank,record.institution].join(" ").toLocaleLowerCase("pt-BR").includes(query));
    listStatus.textContent = `${visible.length} de ${records.length} questão(ões)`;
    recordsRoot.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "q-admin-empty";
      empty.textContent = records.length ? "Nenhuma questão corresponde à busca." : "Nenhuma questão cadastrada. Comece criando uma questão.";
      recordsRoot.append(empty);
      return;
    }
    for (const record of visible) {
      const item = document.createElement("article");
      item.className = "q-admin-record";
      const title = document.createElement("strong");
      title.className = "q-admin-record-title";
      title.textContent = record.title;
      const meta = document.createElement("div");
      meta.className = "q-admin-record-meta";
      const status = document.createElement("span");
      status.className = "q-admin-record-status";
      status.dataset.status = record.status;
      status.textContent = record.status === "published" ? "Publicado" : "Rascunho";
      const subject = document.createElement("span");
      subject.className = "q-admin-record-status";
      subject.textContent = record.subject || "Sem assunto";
      meta.append(status,subject);
      const actions = document.createElement("div");
      actions.className = "q-admin-record-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.dataset.action = "edit";
      edit.dataset.id = record.id;
      edit.textContent = "Editar";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.action = "delete";
      remove.dataset.id = record.id;
      remove.textContent = "Excluir";
      actions.append(edit,remove);
      item.append(title,meta,actions);
      recordsRoot.append(item);
    }
  }

  async function loadRecords() {
    listStatus.textContent = "Carregando registros…";
    const {data,error} = await client.from("physics_questions").select("*").order("updated_at", {ascending:false});
    if (error) {
      records = [];
      renderRecordList();
      listStatus.textContent = /physics_questions|schema cache|does not exist/i.test(error.message || "")
        ? "A estrutura ainda não está disponível. Aplique a migração do painel de questões no projeto Supabase."
        : "Não foi possível carregar as questões. Confira sua autorização e tente novamente.";
      return;
    }
    records = Array.isArray(data) ? data : [];
    renderRecordList();
  }

  function fillEditor(record) {
    editing = record;
    form.dataset.dirty = "false";
    existingCoverPath = record.cover_image_path || "";
    existingIllustrationPaths = [...(record.illustration_image_paths || [])];
    byId("q-admin-form-title").textContent = "Editar questão";
    byId("question-delete-current").hidden = false;
    setField("question-title", record.title);
    setField("question-format", record.display_format);
    updateFormatHelp();
    setField("question-statement", record.statement);
    setField("question-discipline", record.discipline);
    setField("question-subject", record.subject);
    setField("question-difficulty", record.difficulty);
    setField("question-bank", record.bank);
    setField("question-institution", record.institution);
    setField("question-year", record.year);
    setField("question-solution", record.resolution);
    for (const input of document.querySelectorAll("[data-option-letter]")) {
      const choice = (record.choices || []).find(item => item.letter === input.dataset.optionLetter);
      input.value = choice?.text || "";
    }
    setField("question-correct", record.correct_option);
    coverInput.value = "";
    illustrationsInput.value = "";
    showNotice(formNotice, "");
    renderImagePreview();
    renderStudentPreview();
    byId("q-admin-form-title").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function collectChoices() {
    return [...document.querySelectorAll("[data-option-letter]")]
      .map(input => ({letter:input.dataset.optionLetter, text:input.value.trim()}))
      .filter(option => option.text);
  }

  async function uploadFile(file, questionId) {
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const path = `questions/${questionId}/${crypto.randomUUID()}.${extension}`;
    const {error} = await client.storage.from(BUCKET).upload(path, file, {
      cacheControl:"31536000", contentType:file.type, upsert:false
    });
    if (error) throw error;
    return path;
  }

  async function saveQuestion(status) {
    if (!validateSelectedFiles()) return;
    const title = byId("question-title").value.trim();
    const format = byId("question-format").value;
    const statement = byId("question-statement").value.trim();
    const choices = collectChoices();
    const selectedCorrect = byId("question-correct").value;
    const validCorrect = choices.some(choice => choice.letter === selectedCorrect) ? selectedCorrect : null;
    const coverFile = coverInput.files?.[0] || null;
    const illustrationFiles = [...(illustrationsInput.files || [])];
    if (!title) { showNotice(formNotice, "Informe um título para a questão.", "error"); byId("question-title").focus(); return; }
    if (!byId("question-subject").value.trim()) { showNotice(formNotice, "Informe o assunto da questão.", "error"); byId("question-subject").focus(); return; }
    if (status === "published") {
      if (format === "typed" && !statement) { showNotice(formNotice, "Digite o enunciado antes de publicar.", "error"); byId("question-statement").focus(); return; }
      if (format === "image" && !coverFile && !existingCoverPath) { showNotice(formNotice, "Envie a imagem que contém a questão completa antes de publicar.", "error"); coverInput.focus(); return; }
      if (choices.length < 2) { showNotice(formNotice, "Preencha pelo menos duas alternativas antes de publicar.", "error"); document.querySelector("[data-option-letter]").focus(); return; }
      if (!validCorrect) { showNotice(formNotice, "Marque como correta uma alternativa que esteja preenchida.", "error"); byId("question-correct").focus(); return; }
    }
    const yearText = byId("question-year").value.trim();
    const year = yearText ? Number(yearText) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) { showNotice(formNotice, "Informe um ano entre 1900 e 2100.", "error"); byId("question-year").focus(); return; }
    const questionId = editing?.id || crypto.randomUUID();
    const newlyUploaded = [];
    const previousPaths = imagePaths(editing);
    const saveButtons = [...form.querySelectorAll('button[type="submit"]')];
    saveButtons.forEach(button => { button.disabled = true; });
    try {
      showNotice(formNotice, "Enviando imagens e salvando a questão…");
      const coverPath = coverFile ? await uploadFile(coverFile, questionId) : existingCoverPath || null;
      if (coverFile) newlyUploaded.push(coverPath);
      const uploadedIllustrations = [];
      for (const file of illustrationFiles) {
        const path = await uploadFile(file, questionId);
        newlyUploaded.push(path);
        uploadedIllustrations.push(path);
      }
      const finalIllustrations = [...existingIllustrationPaths, ...uploadedIllustrations];
      if (finalIllustrations.length + (coverPath ? 1 : 0) > MAX_IMAGE_COUNT) throw new Error("A questão aceita até 9 imagens no total.");
      const values = {
        title,
        display_format:format,
        statement,
        cover_image_path:coverPath,
        illustration_image_paths:finalIllustrations,
        choices,
        correct_option:validCorrect,
        resolution:byId("question-solution").value.trim(),
        discipline:byId("question-discipline").value,
        subject:byId("question-subject").value.trim(),
        difficulty:byId("question-difficulty").value,
        bank:byId("question-bank").value.trim(),
        institution:byId("question-institution").value.trim(),
        year,
        status,
        published_at:status === "published" ? new Date().toISOString() : null,
        updated_at:new Date().toISOString()
      };
      const result = editing
        ? await client.from("physics_questions").update(values).eq("id", questionId).select("*").single()
        : await client.from("physics_questions").insert({...values, id:questionId, created_by:adminUser.id}).select("*").single();
      if (result.error) throw result.error;
      const savedPaths = imagePaths(result.data);
      const stalePaths = previousPaths.filter(path => !savedPaths.includes(path));
      if (stalePaths.length) {
        const removed = await client.storage.from(BUCKET).remove(stalePaths);
        if (removed.error) showNotice(formNotice, "Questão salva; uma imagem antiga não pôde ser removida do armazenamento.", "error");
      }
      editing = result.data;
      form.dataset.dirty = "false";
      existingCoverPath = result.data.cover_image_path || "";
      existingIllustrationPaths = [...(result.data.illustration_image_paths || [])];
      coverInput.value = "";
      illustrationsInput.value = "";
      await loadRecords();
      showNotice(formNotice, status === "published" ? "Questão publicada e visível na biblioteca." : "Rascunho salvo; ainda não aparece para estudantes.", "success");
      byId("q-admin-form-title").textContent = "Editar questão";
      byId("question-delete-current").hidden = false;
      renderImagePreview();
      renderStudentPreview();
    } catch (error) {
      if (newlyUploaded.length) await client.storage.from(BUCKET).remove(newlyUploaded);
      const detail = error?.message || "Falha ao salvar a questão.";
      showNotice(formNotice, /physics_questions|schema cache/i.test(detail)
        ? "O banco ainda não recebeu a migração deste painel. Aplique-a no projeto Supabase e tente novamente."
        : `Não foi possível salvar. ${detail}`, "error");
    } finally {
      saveButtons.forEach(button => { button.disabled = false; });
    }
  }

  async function deleteQuestion(record) {
    if (!record || !window.confirm(`Excluir “${record.title}”? Esta ação não pode ser desfeita.`)) return;
    showNotice(formNotice, "Excluindo questão…");
    const {error} = await client.from("physics_questions").delete().eq("id", record.id);
    if (error) { showNotice(formNotice, "Não foi possível excluir a questão. " + (error.message || "Confira sua autorização."), "error"); return; }
    const paths = imagePaths(record);
    if (paths.length) {
      const removed = await client.storage.from(BUCKET).remove(paths);
      if (removed.error) showNotice(formNotice, "Questão excluída; uma ou mais imagens antigas permaneceram no armazenamento.", "error");
      else showNotice(formNotice, "Questão e imagens excluídas.", "success");
    } else showNotice(formNotice, "Questão excluída.", "success");
    if (editing?.id === record.id) clearForm();
    await loadRecords();
  }

  function bindImageRemoval() {
    imagePreview.addEventListener("click", event => {
      const button = event.target.closest("button[data-remove-kind]");
      if (!button) return;
      const kind = button.dataset.removeKind;
      if (kind === "new-cover") coverInput.value = "";
      if (kind === "old-cover") existingCoverPath = "";
      if (kind === "old-illustration") existingIllustrationPaths.splice(Number(button.dataset.removeIndex), 1);
      if (kind === "new-illustration") {
        const index = Number(button.dataset.removeIndex);
        const transfer = new DataTransfer();
        [...(illustrationsInput.files || [])].forEach((file,fileIndex) => { if (fileIndex !== index) transfer.items.add(file); });
        illustrationsInput.files = transfer.files;
      }
      renderImagePreview();
    });
  }

  function bindEvents() {
    byId("question-new").addEventListener("click", clearForm);
    byId("question-reset").addEventListener("click", clearForm);
    byId("question-admin-search").addEventListener("input", renderRecordList);
    byId("question-format").addEventListener("change", () => {
      updateFormatHelp();
      renderStudentPreview();
    });
    form.addEventListener("input", renderStudentPreview);
    form.addEventListener("change", renderStudentPreview);
    coverInput.addEventListener("change", () => { if (validateSelectedFiles()) renderImagePreview(); });
    illustrationsInput.addEventListener("change", () => { if (validateSelectedFiles()) renderImagePreview(); });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const mode = event.submitter?.value === "published" ? "published" : "draft";
      saveQuestion(mode);
    });
    byId("question-delete-current").addEventListener("click", () => deleteQuestion(editing));
    recordsRoot.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const record = records.find(item => item.id === button.dataset.id);
      if (!record) return;
      if (button.dataset.action === "edit") fillEditor(record);
      if (button.dataset.action === "delete") deleteQuestion(record);
    });
    bindImageRemoval();
    window.addEventListener("beforeunload", event => {
      if (form && new FormData(form).get("title") && form.dataset.dirty === "true") {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    form.addEventListener("input", () => { form.dataset.dirty = "true"; });
    form.addEventListener("change", () => { form.dataset.dirty = "true"; });
  }

  async function start() {
    try { client = await supabasePromise; }
    catch { client = null; }
    if (!client) {
      showNotice(authNotice, "Não foi possível conectar ao serviço de login. Atualize a página e confira a configuração do Supabase.", "error");
      return;
    }
    const {data:authData,error:authError} = await client.auth.getUser();
    if (authError || !authData?.user) {
      authNotice.replaceChildren(document.createTextNode("Entre na sua conta de administrador para acessar este painel. "));
      const login = document.createElement("a");
      login.href = "/login/";
      login.textContent = "Fazer login";
      authNotice.append(login);
      authNotice.dataset.kind = "info";
      return;
    }
    adminUser = authData.user;
    const {data:role,error:roleError} = await client.from("user_roles").select("role,status").eq("user_id", adminUser.id).maybeSingle();
    if (roleError || role?.role !== "admin" || role?.status !== "active") {
      showNotice(authNotice, "Acesso restrito: somente uma conta de administrador ativa pode gerenciar questões.", "error");
      return;
    }
    authNotice.hidden = true;
    shell.hidden = false;
    bindEvents();
    renderImagePreview();
    renderStudentPreview();
    await loadRecords();
  }

  start().catch(error => showNotice(authNotice, "O painel não conseguiu iniciar. " + (error?.message || "Tente atualizar a página."), "error"));
})();
