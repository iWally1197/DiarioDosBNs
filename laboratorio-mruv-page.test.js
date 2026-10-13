import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, script, css] = await Promise.all([
  readFile(new URL("./laboratorio-mruv.html", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-mruv.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-mruv.css", import.meta.url), "utf8")
]);

test("a página MRUV usa a página e o modelo próprios, sem substituir MRU", () => {
  assert.match(html, /laboratorio-mruv\.js/);
  assert.match(html, /laboratorio-mruv\.css/);
  assert.match(html, /x\(t\) = x₀ \+ v₀t \+ ½at²/);
  assert.match(html, /v\(t\) = v₀ \+ at/);
  assert.match(script, /laboratorio-mruv-core\.js/);
  assert.match(html, /referencial/i);
});

test("todos os seletores estáticos de ID do controlador existem na página", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const required = new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
  assert.deepEqual([...required].filter((id) => !ids.has(id)), []);
});

test("a página oferece presets, frenagem, previsões, relógio, gráficos, sensores e exportação", () => {
  for (const id of ["mruv-preset", "mruv-load-preset", "mruv-braking-mode", "mruv-play", "mruv-step-back", "mruv-step-forward", "mruv-timeline", "mruv-add-object", "mruv-export-csv", "mruv-export-json", "mruv-chart-position", "mruv-chart-velocity", "mruv-chart-acceleration", "mruv-high-contrast", "mruv-text-size", "mruv-prediction-time", "mruv-prediction", "mruv-prediction-v", "mruv-saved-experiments", "mruv-graphs-fullscreen"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const preset of ["rest", "initial", "brake", "retrograde", "compare", "meeting", "accelerations", "turn", "measure", "challenge"]) assert.match(html, new RegExp('value="' + preset + '"'));
  assert.match(script, /function logCrossings/);
  assert.match(script, /function drawChart/);
  assert.match(script, /function loadPreset/);
  assert.match(css, /prefers-reduced-motion/);
});
