import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQuestionList,filterQuestions,filterByView,recordAnswer,
  toggleFavorite,summarizeProgress,loadProgress,saveProgress
} from "./questoes-core.mjs";

const sample = (id,subject,bank="") => ({
  id,title:"Teste "+id,statement:"Questão sobre "+subject,discipline:"Física",
  subject,bank,institution:bank,year:bank ? 2007 : null,difficulty:"Média",
  choices:[{letter:"A",text:"Incorreta"},{letter:"B",text:"Correta"}],correct:"B"
});

test("valida questões, exige uma resposta correta e elimina IDs duplicados",() => {
  const result=normalizeQuestionList([sample("a","Óptica"),sample("a","Óptica"),{...sample("b","Óptica"),correct:"Z"}]);
  assert.equal(result.questions.length,1);
  assert.equal(result.invalidCount,2);
});

test("combina pesquisa textual e mais de um filtro",() => {
  const items=[sample("a","Magnetismo","UECE"),sample("b","Óptica","FUVEST"),sample("c","Magnetismo","FUVEST")];
  const matches=filterQuestions(items,{subject:new Set(["Magnetismo"]),bank:new Set(["UECE"])},"magnetismo");
  assert.deepEqual(matches.map(item=>item.id),["a"]);
});

test("registra tentativas corretas e erradas sem apagar o histórico",() => {
  const wrong=recordAnswer({},"a","A","B");
  const right=recordAnswer(wrong.answers,"a","B","B");
  assert.equal(wrong.correct,false);
  assert.equal(right.correct,true);
  assert.deepEqual(right.answers.a,{attempts:2,correct:1,lastCorrect:true});
});

test("filtra favoritos, não respondidas e respostas erradas",() => {
  const items=[sample("a","Óptica"),sample("b","Óptica"),sample("c","Óptica")];
  const answers={b:{attempts:1,correct:0,lastCorrect:false},c:{attempts:1,correct:1,lastCorrect:true}};
  assert.deepEqual(filterByView(items,"favorites",["a"],answers).map(item=>item.id),["a"]);
  assert.deepEqual(filterByView(items,"unanswered",[],answers).map(item=>item.id),["a"]);
  assert.deepEqual(filterByView(items,"wrong",[],answers).map(item=>item.id),["b"]);
});

test("alterna favoritos sem duplicar e calcula progresso por tentativa",() => {
  const one=toggleFavorite([],"a");
  assert.deepEqual(toggleFavorite(one,"a"),[]);
  const progress=summarizeProgress([sample("a","Óptica"),sample("b","Magnetismo")],{
    a:{attempts:2,correct:1,lastCorrect:true},b:{attempts:1,correct:1,lastCorrect:true}
  });
  assert.deepEqual(progress,{answered:2,attempts:3,correct:2,accuracy:67});
});

test("persiste e recupera favoritos e respostas no armazenamento local",() => {
  const memory=new Map();
  const storage={getItem:key=>memory.get(key) || null,setItem:(key,value)=>memory.set(key,value)};
  const state={favorites:["a"],answers:{a:{attempts:1,correct:0,lastCorrect:false}}};
  assert.equal(saveProgress(storage,"progresso",state),true);
  assert.deepEqual(loadProgress(storage,"progresso"),state);
  const invalid={getItem:()=>"{",setItem:()=>{}};
  assert.deepEqual(loadProgress(invalid,"x"),{favorites:[],answers:{}});
});

