import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app,migration,page]=await Promise.all([
  readFile(new URL("./src-app.js",import.meta.url),"utf8"),
  readFile(new URL("./supabase/migrations/20261011031216_admin_only_animation_publication.sql",import.meta.url),"utf8"),
  readFile(new URL("./admin-laboratorios.html",import.meta.url),"utf8")
]);
const panel=app.slice(app.indexOf("async function loadAdminLaboratoryRecords"),app.indexOf("async function loadAdminTools"));

test("painel possui rota estática protegida para administradores",()=>{
  assert.match(app,/'admin-laboratorios':'\/admin\/laboratorios'/);
  assert.match(app,/'\/admin\/laboratorios':'admin-laboratorios\.html'/);
  assert.match(app,/const protectedRoutes = \[[^\]]*'\/admin\/laboratorios'/);
  assert.match(app,/route==='\/admin\/laboratorios'\?'admin'/);
  assert.match(page,/src-app\.js/);
});

test("painel permite selecionar todos, resultados filtrados e seleção individual",()=>{
  assert.match(panel,/data-select-all/);
  assert.match(panel,/data-select-visible/);
  assert.match(panel,/data-admin-lab-select/);
  assert.match(panel,/selected\.clear\(\)/);
  assert.match(panel,/selected\.add\(item\.id\)/);
});

test("publicar e retirar do ar pede confirmação e grava o estado no Supabase",()=>{
  assert.match(panel,/window\.confirm\(/);
  assert.match(panel,/update\(\{is_published:publish\}\)/);
  assert.match(panel,/\.in\('id',batch\)/);
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
