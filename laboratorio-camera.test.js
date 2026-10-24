import test from "node:test";
import assert from "node:assert/strict";
import { cameraScreenPoint, cameraWorldPoint, createCamera, panCameraBy, resetCamera, zoomCameraAtPoint } from "./laboratorio-camera.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

test("zoom mantém fixo o ponto sob o cursor em coordenadas de origem zero", () => {
  const camera = createCamera({ x: 14, y: -8, zoom: 1.3 });
  const cursor = { x: 280, y: 170 };
  const before = cameraWorldPoint(camera, cursor);
  zoomCameraAtPoint(camera, 1.7, cursor);
  const after = cameraWorldPoint(camera, cursor);
  assert.ok(close(before.x, after.x)); assert.ok(close(before.y, after.y));
});

test("zoom mantém fixo o ponto sob o cursor em cenas com origem central", () => {
  const origin = { x: 400, y: 260 }, camera = createCamera({ x: 18, y: -12, zoom: 0.8 });
  const cursor = { x: 235, y: 175 }, before = cameraWorldPoint(camera, cursor, origin);
  zoomCameraAtPoint(camera, 1.6, cursor, origin);
  const after = cameraWorldPoint(camera, cursor, origin);
  assert.ok(close(before.x, after.x)); assert.ok(close(before.y, after.y));
  const projected = cameraScreenPoint(camera, before, origin);
  assert.ok(close(projected.x, cursor.x)); assert.ok(close(projected.y, cursor.y));
});

test("deslocar e ampliar a câmera não altera objetos nem os parâmetros físicos", () => {
  const camera = createCamera(), position = { x: 2, y: -1 }, velocity = 4, acceleration = 0;
  const screen = cameraScreenPoint(camera, position);
  panCameraBy(camera, 33, -16); zoomCameraAtPoint(camera, 1.4, { x: 200, y: 150 });
  assert.deepEqual(position, { x: 2, y: -1 });
  assert.equal(velocity, 4); assert.equal(acceleration, 0);
  assert.notDeepEqual(cameraScreenPoint(camera, position), screen);
});

test("limites de zoom e restaurar apenas o zoom mantêm a posição da câmera", () => {
  const camera = createCamera({ x: 9, y: 11 });
  zoomCameraAtPoint(camera, 100, { x: 5, y: 7 });
  assert.equal(camera.zoom, 3);
  const position = { x: camera.x, y: camera.y };
  resetCamera(camera, { position: false, zoom: true });
  assert.equal(camera.zoom, 1); assert.equal(camera.x, position.x); assert.equal(camera.y, position.y);
});
