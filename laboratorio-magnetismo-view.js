import { clampZoom } from "./laboratorio-camera.js?v=lab-camera-20261023-1";

export function magnetViewScale(viewport, zoom = 1) {
  const width = Number(viewport?.width), height = Number(viewport?.height);
  if (!(width > 0) || !(height > 0)) return 1;
  const baseScale = Math.max(1, Math.min((width - 58) / 0.82, (height - 56) / 0.52));
  return baseScale * clampZoom(zoom);
}

export function magnetWorldToScreen(point, viewport, camera) {
  const scale = magnetViewScale(viewport, camera.zoom);
  return {
    x: viewport.width / 2 + camera.x + point.x * scale,
    y: viewport.height / 2 + camera.y - point.y * scale
  };
}

export function magnetScreenToWorld(point, viewport, camera) {
  const scale = magnetViewScale(viewport, camera.zoom);
  return {
    x: (point.x - viewport.width / 2 - camera.x) / scale,
    y: (viewport.height / 2 + camera.y - point.y) / scale
  };
}

export function zoomMagnetCameraAt(camera, factor, screenPoint, viewport) {
  const amount = Number(factor);
  if (!Number.isFinite(amount) || amount <= 0 || !(viewport?.width > 0) || !(viewport?.height > 0)) return camera;
  const anchor = magnetScreenToWorld(screenPoint, viewport, camera);
  camera.zoom = clampZoom(camera.zoom * amount);
  const scale = magnetViewScale(viewport, camera.zoom);
  camera.x = screenPoint.x - viewport.width / 2 - anchor.x * scale;
  camera.y = screenPoint.y - viewport.height / 2 + anchor.y * scale;
  return camera;
}
