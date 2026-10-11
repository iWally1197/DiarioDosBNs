import test from "node:test";
import assert from "node:assert/strict";
import { faradayState, normalizeFaradayParameters } from "./physics-faraday-model.js";
import { readFile } from "node:fs/promises";

const p={turns:20,magneticField:0.3,area:0.25,frequency:0.5,phaseDegrees:0};

test("lei de Faraday: fluxo concatenado máximo e fem nula no alinhamento",()=>{
  const s=faradayState(p,0);
  assert.ok(Math.abs(s.fluxLinkage-1.5)<1e-12);
  assert.ok(Math.abs(s.emf)<1e-12);
});

test("um quarto de período zera o fluxo e maximiza a fem induzida",()=>{
  const s=faradayState(p,0.5);
  assert.ok(Math.abs(s.fluxLinkage)<1e-12);
  assert.ok(Math.abs(s.emf-20*0.3*0.25*2*Math.PI*0.5)<1e-12);
});

test("fase inicial determina o sinal da fem no instante inicial",()=>{
  const positive=faradayState({...p,phaseDegrees:90},0);
  const negative=faradayState({...p,phaseDegrees:-90},0);
  assert.ok(positive.emf>0);
  assert.ok(negative.emf<0);
  assert.ok(Math.abs(positive.emf+negative.emf)<1e-12);
});

test("frequência nula não induz tensão no modelo",()=>{
  assert.equal(faradayState({...p,frequency:0},100).emf,0);
});

test("validação rejeita parâmetros impossíveis ou não finitos",()=>{
  assert.throws(()=>normalizeFaradayParameters({...p,turns:1.5}),RangeError);
  assert.throws(()=>normalizeFaradayParameters({...p,magneticField:-0.1}),RangeError);
  assert.throws(()=>faradayState(p,Number.NaN),RangeError);
});

test("página do piloto oferece modos 2D/3D, parâmetros e tela cheia",async()=>{
  const page=await readFile(new URL("./laboratorio-faraday.html",import.meta.url),"utf8");
  assert.match(page,/data-mode="2d"/);
  assert.match(page,/data-mode="3d"/);
  assert.match(page,/data-fullscreen/);
  assert.match(page,/data-step="-0.1"/);
  assert.match(page,/Restaurar início e parâmetros/);
  assert.match(page,/data-param="turns"/);
  assert.match(page,/id="faraday-chart"/);
  assert.match(page,/Modelo e limitações/);
});
