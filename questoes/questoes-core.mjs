const EMPTY_STATE = () => ({favorites:[],answers:{}});

export function isValidQuestion(question) {
  if (!question || typeof question.id !== "string" || !question.id.trim() ||
      typeof question.statement !== "string" || !question.statement.trim() ||
      typeof question.discipline !== "string" || typeof question.subject !== "string" ||
      !Array.isArray(question.choices) || question.choices.length < 2) return false;
  const letters = question.choices.map(choice => choice && choice.letter);
  if (letters.some(letter => typeof letter !== "string" || !letter.trim()) || new Set(letters).size !== letters.length) return false;
  return letters.filter(letter => letter === question.correct).length === 1;
}

export function normalizeQuestionList(items) {
  const source = Array.isArray(items) ? items : [];
  const ids = new Set();
  const questions = [];
  for (const item of source) {
    if (!isValidQuestion(item) || ids.has(item.id)) continue;
    ids.add(item.id);
    questions.push(item);
  }
  return {questions,invalidCount:source.length-questions.length};
}

function selectedSet(value) {
  if (value instanceof Set) return value;
  return new Set(Array.isArray(value) ? value.map(String) : value == null || value === "" ? [] : [String(value)]);
}

export function filterQuestions(items,filters={},search="") {
  const query = String(search || "").trim().toLocaleLowerCase("pt-BR");
  return items.filter(question => {
    for (const [field,values] of Object.entries(filters)) {
      const selected = selectedSet(values);
      if (selected.size && !selected.has(String(question[field] ?? ""))) return false;
    }
    if (!query) return true;
    const haystack = [
      question.id,question.title,question.statement,question.discipline,question.subject,
      question.subtopic,question.bank,question.institution,question.year,question.difficulty,
      question.source,...(question.tags || []),...(question.choices || []).map(choice => choice.text)
    ].filter(value => value !== null && value !== undefined).join(" ").toLocaleLowerCase("pt-BR");
    return haystack.includes(query);
  });
}

export function filterByView(items,view="all",favorites=[],answers={}) {
  const favoriteSet = new Set(favorites);
  if (view === "favorites") return items.filter(question => favoriteSet.has(question.id));
  if (view === "unanswered") return items.filter(question => !(Number(answers[question.id]?.attempts) > 0));
  if (view === "wrong") return items.filter(question => answers[question.id]?.lastCorrect === false);
  return [...items];
}

export function sortQuestions(items,mode="recent") {
  const sorted = [...items];
  if (mode === "year-desc") sorted.sort((a,b) => (b.year || 0)-(a.year || 0));
  else if (mode === "year-asc") sorted.sort((a,b) => (a.year || 9999)-(b.year || 9999));
  else if (mode === "difficulty") {
    const order = {Fácil:0,Média:1,Difícil:2};
    sorted.sort((a,b) => (order[a.difficulty] ?? 1)-(order[b.difficulty] ?? 1));
  }
  return sorted;
}

export function recordAnswer(answerMap={},questionId,selectedLetter,correctLetter) {
  const previous = answerMap[questionId] || {};
  if (Number(previous.attempts) > 0) return {answers:answerMap,correct:previous.lastCorrect === true,alreadyAnswered:true};
  const correct = selectedLetter === correctLetter;
  const answers = {...answerMap,[questionId]:{
    attempts:1,
    correct:(Number.isFinite(previous.correct) ? Math.max(0,previous.correct) : 0)+(correct ? 1 : 0),
    lastCorrect:correct,
    selectedLetter:String(selectedLetter || "")
  }};
  return {answers,correct,alreadyAnswered:false};
}
export function toggleFavorite(favorites=[],questionId) {
  return favorites.includes(questionId) ? favorites.filter(id => id !== questionId) : [...favorites,questionId];
}

export function summarizeProgress(questions=[],answers={}) {
  let answered=0,attempts=0,correct=0;
  for (const question of questions) {
    const entry=answers[question.id] || {};
    const questionAttempts=Number.isFinite(entry.attempts) ? Math.max(0,entry.attempts) : 0;
    attempts+=questionAttempts;
    correct+=Number.isFinite(entry.correct) ? Math.max(0,entry.correct) : 0;
    if (questionAttempts>0) answered++;
  }
  return {answered,attempts,correct,accuracy:attempts ? Math.round(correct/attempts*100) : 0};
}

export function loadProgress(storage,key) {
  if (!storage) return EMPTY_STATE();
  try {
    const parsed=JSON.parse(storage.getItem(key) || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_STATE();
    return {
      favorites:Array.isArray(parsed.favorites) ? [...new Set(parsed.favorites.filter(value => typeof value === "string"))] : [],
      answers:parsed.answers && typeof parsed.answers === "object" && !Array.isArray(parsed.answers) ? parsed.answers : {}
    };
  } catch { return EMPTY_STATE(); }
}

export function saveProgress(storage,key,state) {
  if (!storage) return false;
  try {
    storage.setItem(key,JSON.stringify({
      favorites:Array.isArray(state?.favorites) ? state.favorites : [],
      answers:state?.answers && typeof state.answers === "object" ? state.answers : {}
    }));
    return true;
  } catch { return false; }
}

