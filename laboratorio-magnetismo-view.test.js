import test from "node:test";
import assert from "node:assert/strict";
import { createCamera, panCameraBy } from "./laboratorio-camera.js";
import { magnetScreenToWorld, magnetViewScale, magnetWorldToScreen, zoomMagnetCameraAt } from "./laboratorio-magnetismo-view.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

test("projeção magnética converte tela e mundo sem perder coordenadas", () => {
  const camera = createCamera({ x: 28, y: -17, zoom: 1.3 });
  const viewport = { width: 940, height: 560 }, world = { x: -0.21, y: 0.14 };
  const screen = magnetWorldToScreen(world, viewport, camera);
  const roundTrip = magnetScreenToWorld(screen, viewport, camera);
  assert.ok(close(roundTrip.x, world.x)); assert.ok(close(roundTrip.y, world.y));
});

test("zoom magnético mantém fixo o ponto físico sob o cursor", () => {
  const camera = createCamera({ x: -31, y: 12, zoom: 0.9 });
  const viewport = { width: 940, height: 560 }, cursor = { x: 215, y: 325 };
  const before = magnetScreenToWorld(cursor, viewport, camera);
  zoomMagnetCameraAt(camera, 1.7, cursor, viewport);
  const after = magnetScreenToWorld(cursor, viewport, camera);
  assert.ok(close(before.x, after.x)); assert.ok(close(before.y, after.y));
  assert.ok(close(magnetWorldToScreen(before, viewport, camera).x, cursor.x));
  assert.ok(close(magnetWorldToScreen(before, viewport, camera).y, cursor.y));
});

test("pinça amplia e move o centro do gesto sem deslocar o ponto físico acompanhado", () => {
  const camera = createCamera({ x: 12, y: -8, zoom: 1.1 });
  const viewport = { width: 900, height: 520 }, start = { x: 320, y: 210 }, end = { x: 355, y: 236 };
  const followed = magnetScreenToWorld(start, viewport, camera);
  zoomMagnetCameraAt(camera, 1.35, start, viewport);
  panCameraBy(camera, end.x - start.x, end.y - start.y);
  const projected = magnetWorldToScreen(followed, viewport, camera);
  assert.ok(close(projected.x, end.x)); assert.ok(close(projected.y, end.y));
});

test("escala mantém o fator de zoom dentro dos limites", () => {
  assert.ok(magnetViewScale({ width: 940, height: 560 }, 0.55) < magnetViewScale({ width: 940, height: 560 }, 3));
});
