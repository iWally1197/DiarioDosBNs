import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experiments } from "./laboratorio-catalogo.js";
import { experimentPageUrl } from "./laboratorio-catalogo-ui.js";

const [catalogHtml, detailHtml, catalogScript, detailScript, physicsScript] = await Promise.all([
  readFile(new URL("./laboratorio.html", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-experimento.html", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-catalogo-ui.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-workspace.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio.js", import.meta.url), "utf8")
]);

test("catálogo lista links para páginas individuais e não hospeda animações", () => {
  assert.match(catalogHtml, /laboratorio-catalogo-ui\.js/);
  assert.doesNotMatch(catalogHtml, /workspace-canvas|projectile-canvas|pendulum-canvas/);
  assert.match(catalogScript, /laboratorio-experimento\.html\?topico=/);
  assert.match(catalogScript, /<a class="lab-card" href=/);
});

test("cada tópico do catálogo possui rota de página individual reconhecida pelo detalhe", () => {
  assert.equal(new Set(experiments.map((item) => item.id)).size, experiments.length);
  assert.match(detailHtml, /data-lab-experiment-page/);
  assert.match(detailScript, /new URLSearchParams\(location\.search\)\.get\("topico"\)/);
  assert.match(detailScript, /experimentById\.has\(topicId\)/);
  const urls = experiments.map((experiment) => experimentPageUrl(experiment.id));
  assert.equal(new Set(urls).size, experiments.length);
  assert.ok(urls.every((url) => url.startsWith("laboratorio-experimento.html?topico=")));
});

test("páginas individuais mostram as simulações legadas só quando o tópico corresponde", () => {
  assert.match(detailHtml, /data-lab-special="projectile"[^>]*hidden/);
  assert.match(detailHtml, /data-lab-special="pendulum"[^>]*hidden/);
  assert.match(physicsScript, /section\.hidden = section\.dataset\.labSpecial !== activeTopic/);
  assert.match(physicsScript, /if \(activeTopic === "projectile"\) drawProjectile\(\)/);
  assert.match(physicsScript, /if \(activeTopic === "pendulum"\) resetPendulum\(\)/);
});

test("a explicação do pêndulo identifica o integrador numérico realmente usado", () => {
  assert.match(detailHtml, /Velocity-Verlet/);
  assert.doesNotMatch(detailHtml, /Euler semi-implícito/);
});

