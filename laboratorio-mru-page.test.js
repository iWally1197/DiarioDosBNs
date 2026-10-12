import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, script, css] = await Promise.all([
  readFile(new URL("./laboratorio-mru.html", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-mru.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-mru.css", import.meta.url), "utf8")
]);

test("a página MRU carrega seus módulos locais e identifica o referencial", () => {
  assert.match(html, /laboratorio-mru\.js/);
  assert.match(html, /laboratorio-mru\.css/);
  assert.match(html, /x\(t\) = x₀ \+ vt/);
  assert.match(html, /referencial/i);
});

test("todos os seletores por ID do controlador existem na página", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const required = new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
  const missing = [...required].filter((id) => !ids.has(id));
  assert.deepEqual(missing, []);
});

test("a página oferece pausa, retorno no tempo, sensores, exportação e acessibilidade", () => {
  for (const id of ["mru-play", "mru-step-back", "mru-step-forward", "mru-timeline", "mru-add-object", "mru-export-csv", "mru-export-json", "mru-chart-position", "mru-chart-velocity", "mru-chart-acceleration", "mru-high-contrast", "mru-text-size"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(script, /function logCrossings/);
  assert.match(script, /function drawChart/);
  assert.match(css, /prefers-reduced-motion/);
});

