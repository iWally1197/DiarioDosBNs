const MIN_ZOOM = 0.55;
const MAX_ZOOM = 3;

export function createCamera(initial = {}) {
  return {
    x: Number.isFinite(initial.x) ? initial.x : 0,
    y: Number.isFinite(initial.y) ? initial.y : 0,
    zoom: clampZoom(initial.zoom ?? 1)
  };
}

export function clampZoom(value, min = MIN_ZOOM, max = MAX_ZOOM) {
  const zoom = Number(value);
  if (!Number.isFinite(zoom)) return 1;
  return Math.max(min, Math.min(max, zoom));
}

export function cameraWorldPoint(camera, screenPoint, origin = { x: 0, y: 0 }) {
  const zoom = clampZoom(camera.zoom);
  return {
    x: origin.x + (screenPoint.x - origin.x - camera.x) / zoom,
    y: origin.y + (screenPoint.y - origin.y - camera.y) / zoom
  };
}

export function cameraScreenPoint(camera, worldPoint, origin = { x: 0, y: 0 }) {
  const zoom = clampZoom(camera.zoom);
  return {
    x: origin.x + camera.x + (worldPoint.x - origin.x) * zoom,
    y: origin.y + camera.y + (worldPoint.y - origin.y) * zoom
  };
}

export function panCameraBy(camera, dx, dy) {
  if (Number.isFinite(dx)) camera.x += dx;
  if (Number.isFinite(dy)) camera.y += dy;
  return camera;
}

export function zoomCameraAtPoint(camera, factor, screenPoint, origin = { x: 0, y: 0 }) {
  const amount = Number(factor);
  if (!Number.isFinite(amount) || amount <= 0) return camera;
  const anchor = cameraWorldPoint(camera, screenPoint, origin);
  camera.zoom = clampZoom(camera.zoom * amount);
  camera.x = screenPoint.x - origin.x - (anchor.x - origin.x) * camera.zoom;
  camera.y = screenPoint.y - origin.y - (anchor.y - origin.y) * camera.zoom;
  return camera;
}

export function resetCamera(camera, { position = true, zoom = true } = {}) {
  if (position) { camera.x = 0; camera.y = 0; }
  if (zoom) camera.zoom = 1;
  return camera;
}
