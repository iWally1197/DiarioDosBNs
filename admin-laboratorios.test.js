import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app,migration,page,ui]=await Promise.all([
  readFile(new URL("./src-app.js",import.meta.url),"utf8"),
  readFile(new URL("./supabase/migrations/20261011031216_admin_only_animation_publication.sql",import.meta.url),"utf8"),
  readFile(new URL("./admin-laboratorios.html",import.meta.url),"utf8"),
  readFile(new URL("./laboratorio-catalogo-ui.js",import.meta.url),"utf8")
]);
const panel=app.slice(app.indexOf("async function loadAdminLaboratoryRecords"),app.indexOf("async function loadAdminTools"));
const {laboratoryPublicationRecords}=await import("./laboratorio-publicacao.js");
const {experiments}=await import("./laboratorio-catalogo.js");

test("painel possui rota estática protegida para administradores",()=>{
  assert.match(app,/'admin-laboratorios':'\/admin\/laboratorios'/);
  assert.match(app,/'\/admin\/laboratorios':'admin-laboratorios\.html'/);
  assert.match(app,/const protectedRoutes = \[[^\]]*'\/admin\/laboratorios'/);
  assert.match(app,/route==='\/admin\/laboratorios'\?'admin'/);
  assert.match(page,/src-app\.js\?v=laboratory-publication-sync-20261023-1/);
});

test("painel permite selecionar todos, resultados filtrados e seleção individual",()=>{
  assert.match(panel,/data-select-all/);
  assert.match(panel,/data-select-visible/);
  assert.match(panel,/data-admin-lab-select/);
  assert.match(panel,/selected\.clear\(\)/);
  assert.match(panel,/selected\.add\(slug\)/);
});

test("publicar e retirar do ar pede confirmação e grava o estado no Supabase",()=>{
  assert.match(panel,/window\.confirm\(/);
  assert.match(panel,/update\(\{is_published:publish\}\)/);
  assert.match(panel,/\.in\('slug',batch\)/);
  assert.match(panel,/messageIsError=true/);
  assert.match(app,/retry-admin-labs/);
});

test("banco impede alteração direta por quem não é administrador",()=>{
  assert.match(migration,/before update of is_published on public\.animations/i);
  assert.match(migration,/new\.is_published is distinct from old\.is_published/i);
  assert.match(migration,/not public\.is_admin\(\)/i);
  assert.match(migration,/using errcode = '42501'/i);
  assert.match(migration,/security invoker/i);
});

test("aba Laboratórios conecta todos os nove experimentos gerenciáveis ao Supabase",()=>{
  assert.deepEqual(laboratoryPublicationRecords.map((item)=>item.id),["mru","muv","projectile","optics-reflection","optics-concave-mirror","optics-concave-parabolic-mirror","optics-convex-mirror","lens-diverging","lab-magnetic-field"]);
  assert.deepEqual(experiments.filter((item)=>laboratoryPublicationRecords.some((record)=>record.id===item.id)).map((item)=>item.id),laboratoryPublicationRecords.map((item)=>item.id));
  assert.match(ui,/from\("animations"\)\.select\("slug"\)\.in\("slug", laboratoryPublicationSlugs\)/);
  assert.match(panel,/\.insert\(seeds\)/);
  assert.match(panel,/data-admin-lab-action/);
  assert.match(app,/laboratorio-publicacao\.js\?v=laboratory-publication-sync-20261023-1/);
  assert.match(ui,/laboratorio-publicacao\.js\?v=laboratory-publication-sync-20261023-1/);
});
