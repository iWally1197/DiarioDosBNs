import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { filterPhysicsTopics, physicsTopicCardMarkup } from "./physics-topic-catalog.js";

const topics=JSON.parse(await readFile(new URL("./physics-topics.json",import.meta.url),"utf8"));
const categories={"Mecânica":96,"Ondulatória e acústica":42,"Óptica":51,"Termologia e termodinâmica":41,"Eletricidade e eletromagnetismo":90,"Física moderna, relatividade e física quântica":60,"Física nuclear e de partículas":30,"Astronomia e cosmologia":35,"Física experimental e aplicada":35};

test("o catálogo contém os 480 tópicos com identificadores e slugs únicos",()=>{
  assert.equal(topics.length,480);
  assert.equal(new Set(topics.map((item)=>item.id)).size,480);
  assert.equal(new Set(topics.map((item)=>item.slug)).size,480);
  assert.deepEqual(topics.map((item)=>item.number),Array.from({length:480},(_,i)=>i+1));
});

test("as nove áreas preservam os totais definidos no plano",()=>{
  const actual=Object.fromEntries(Object.keys(categories).map((category)=>[category,topics.filter((item)=>item.category===category).length]));
  assert.deepEqual(actual,categories);
});

test("os estados não tratam tópicos planejados como implementados",()=>{
  assert.equal(topics.filter((item)=>item.implementationStatus==="implemented-awaiting-validation").length,17);
  assert.equal(topics.filter((item)=>item.implementationStatus==="planned").length,463);
  assert.ok(topics.filter((item)=>item.implementationStatus==="planned").every((item)=>!item.linkedExperimentId));
  assert.ok(topics.every((item)=>item.implementationStatus!=="validated"));
});

test("busca, área e estado filtram os mesmos registros do catálogo",()=>{
  assert.deepEqual(filterPhysicsTopics(topics,{query:"149"}).map((item)=>item.number),[149]);
  assert.equal(filterPhysicsTopics(topics,{category:"Óptica"}).length,51);
  assert.equal(filterPhysicsTopics(topics,{status:"planned"}).length,463);
});


test("subárea e dificuldade filtram quando os metadados existem",()=>{
  const enriched=[
    {...topics[0],subcategory:"Cinemática",difficulty:"Básico"},
    {...topics[1],subcategory:"Dinâmica",difficulty:"Intermediário"}
  ];
  assert.deepEqual(filterPhysicsTopics(enriched,{subcategory:"Dinâmica"}).map((item)=>item.number),[2]);
  assert.deepEqual(filterPhysicsTopics(enriched,{difficulty:"Básico"}).map((item)=>item.number),[1]);
});

test("apenas tópicos com experimento existente recebem um link",()=>{
  const existing=topics.find((item)=>item.number===8);
  const planned=topics.find((item)=>item.number===7);
  assert.match(physicsTopicCardMarkup(existing),/laboratorio-experimento\.html\?topico=mru/);
  assert.doesNotMatch(physicsTopicCardMarkup(planned),/<a class="text-link"/);
});

