import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [workspace, topic, magnet, magnetView, freefall, magnetPage, magnetCss, freefallPage, freefallCss] = await Promise.all([
  readFile(new URL("./laboratorio-workspace.js", import.meta.url), "utf8"),
  readFile(new URL("./physics-topic-labs.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-magnetismo.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-magnetismo-view.js", import.meta.url), "utf8"),
  readFile(new URL("./physics-freefall.js", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-magnetismo.html", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-magnetismo.css", import.meta.url), "utf8"),
  readFile(new URL("./laboratorio-queda-livre.html", import.meta.url), "utf8"),
  readFile(new URL("./physics-freefall.css", import.meta.url), "utf8")
]);

test("cenários compartilhados oferecem ferramenta de mover, zoom e gestos de dois dedos", () => {
  assert.match(workspace, /wrapper\.style\.position = wrapper\.style\.position \|\| "relative"/);
  assert.match(workspace, /initializeCanvasViewControls/);
  assert.match(workspace, /zoomCameraAtPoint/);
  assert.match(workspace, /touchGesture/);
  assert.match(workspace, /zoomCameraAtPoint\(camera, factor, point, canvasOrigin\(\)\)/);
  assert.match(workspace, /Enquadrar todos os objetos/);
});

test("laboratórios de tópicos ampliam em torno do cursor usando origem central", () => {
  assert.match(topic, /zoomCameraAtPoint\(state\.camera,factor,point,\{x:scene\.clientWidth\/2,y:scene\.clientHeight\/2\}\)/);
  assert.match(topic, /distance\/pinch\.distance,pinch\.origin,\{x:scene\.clientWidth\/2,y:scene\.clientHeight\/2\}/);
});

test("a vista magnética usa a mesma câmera para desenho e posição de arraste", () => {
  assert.match(magnet, /const camera = createCamera\(\)/);
  assert.match(magnetView, /magnetScreenToWorld/);
  assert.match(magnetView, /zoomMagnetCameraAt/);
  assert.match(magnet, /magnetWorldToScreen/);
  assert.match(magnet, /function installMagnetViewControls\(\)/);
  assert.doesNotMatch(magnet, /let magnetZoom/);
  assert.match(magnetPage, /laboratorio-magnetismo\.js\?v=camera-20261023-1/);
  assert.match(magnetPage, /laboratorio-magnetismo\.css\?v=camera-20261023-1/);
  assert.match(magnetCss, /\.magnet-view-controls/);
});

test("queda livre preserva a pegada no ponto segurado e o contato geométrico com o chão", () => {
  assert.match(freefall, /offsetY: heldWorldPoint\.y - objectCenterY/);
  assert.match(freefall, /world\.y - \(drag\.offsetY \|\| 0\)/);
  assert.match(freefall, /floorY - radius - at\.height \* scale/);
  assert.match(freefall, /if \(!state\.running && body && event\.button === 0/);
  assert.match(freefall, /ctx\.translate\(state\.camera\.x, state\.camera\.y\)/);
  assert.match(freefallPage, /physics-freefall\.js\?v=camera-20261023-1/);
  assert.match(freefallPage, /physics-freefall\.css\?v=camera-20261023-1/);
  assert.match(freefallCss, /\.lab-view-controls-overlay/);
});
