import { opticalDistance, opticalViewFor, wavelengthColor } from "./laboratorio-optica-core.js";

const C_METERS_PER_NS = 0.299792458;

function line(context, a, b, color, width = 1.5, dash = []) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
  context.restore();
}

function drawArrow(context, a, b, color, label = "", textColor = color) {
  line(context, a, b, color, 2);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(b.x, b.y);
  context.lineTo(b.x - 10 * Math.cos(angle - Math.PI / 6), b.y - 10 * Math.sin(angle - Math.PI / 6));
  context.lineTo(b.x - 10 * Math.cos(angle + Math.PI / 6), b.y - 10 * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
  if (label) {
    context.fillStyle = textColor;
    context.font = "11px system-ui";
    context.fillText(label, (a.x + b.x) / 2 + 7, (a.y + b.y) / 2 - 7);
  }
  context.restore();
}

function pointOnSegment(start, end, distanceAlong) {
  const length = opticalDistance(start, end);
  const ratio = length > 0 ? distanceAlong / length : 0;
  return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
}

function drawParticles(context, geometry, p, time, view) {
  const wavelengthNm = Number(p.wavelengthNm);
  const color = wavelengthColor(wavelengthNm);
  const visualSpacing = 0.78 * wavelengthNm / 550;
  const paths = geometry.particlePaths || [geometry.segments];
  for (const path of paths) {
    for (const segment of path) {
      const length = opticalDistance(segment.start, segment.end);
      if (!(length > 0)) continue;
      const spacing = visualSpacing / segment.index;
      const speed = C_METERS_PER_NS / segment.index;
      const offset = (time * speed) % spacing;
      const count = Math.min(10, Math.ceil(length / spacing) + 1);
      for (let index = -1; index <= count; index += 1) {
        const distanceAlong = index * spacing + offset;
        if (distanceAlong < 0 || distanceAlong > length) continue;
        const point = view.toScreen(pointOnSegment(segment.start, segment.end, distanceAlong));
        context.save();
        context.fillStyle = color;
        context.globalAlpha = 0.92;
        context.beginPath();
        context.arc(point.x, point.y, 2.6, 0, 2 * Math.PI);
        context.fill();
        context.restore();
      }
    }
  }
}

function drawAxes(context, width, height, bounds, view, palette, concise = false) {
  context.save();
  context.strokeStyle = palette.line;
  context.lineWidth = 1;
  const spanX = bounds.xMax - bounds.xMin;
  const spanY = bounds.yMax - bounds.yMin;
  const divisions = concise ? 2 : 4;
  for (let index = 0; index <= divisions; index += 1) {
    const x = bounds.xMin + spanX * index / divisions;
    const y = bounds.yMin + spanY * index / divisions;
    const a = view.toScreen({ x, y: bounds.yMin });
    const b = view.toScreen({ x, y: bounds.yMax });
    line(context, a, b, palette.line, 0.7);
    const c = view.toScreen({ x: bounds.xMin, y });
    const d = view.toScreen({ x: bounds.xMax, y });
    line(context, c, d, palette.line, 0.7);
  }
  context.fillStyle = palette.muted;
  context.font = "9px system-ui";
  context.fillText("Escala geométrica em metros · bolinhas com espaçamento visual ampliado", 12, height - 10);
  context.restore();
}

function drawReflection(context, geometry, values, p, view, palette) {
  const mirrorA = view.toScreen({ x: geometry.center.x - geometry.tangent.x * 1.08, y: geometry.center.y - geometry.tangent.y * 1.08 });
  const mirrorB = view.toScreen({ x: geometry.center.x + geometry.tangent.x * 1.08, y: geometry.center.y + geometry.tangent.y * 1.08 });
  line(context, mirrorA, mirrorB, "#dce7f7", 7);
  line(context, mirrorA, mirrorB, palette.blue, 2);
  const hit = view.toScreen(geometry.hit);
  const source = view.toScreen(geometry.source);
  context.save();
  context.fillStyle = wavelengthColor(Number(p.wavelengthNm));
  context.beginPath(); context.arc(source.x, source.y, 5, 0, 2 * Math.PI); context.fill();
  context.restore();
  context.fillStyle = palette.text;
  context.font = "10px system-ui";
  context.fillText("Fonte", source.x + 9, source.y - 7);
  const normalEnd = view.toScreen({ x: geometry.hit.x + geometry.normal.x * 0.72, y: geometry.hit.y + geometry.normal.y * 0.72 });
  line(context, hit, normalEnd, palette.muted, 1.3, [5, 4]);
  for (const ray of geometry.rays) {
    const points = ray.points.map((point) => view.toScreen(point));
    drawArrow(context, points[0], points[1], wavelengthColor(Number(p.wavelengthNm)), ray.role);
  }
  drawParticles(context, geometry, p, values.time, view);
  context.fillStyle = palette.text;
  context.font = "12px system-ui";
  context.fillText("Espelho e fonte manipuláveis · arraste o centro, as pontas ou a fonte", 12, 20);
  context.fillStyle = palette.muted;
  context.font = "11px system-ui";
  context.fillText(`θᵢ = ${values.angleIncident.toFixed(1)}° · θᵣ = ${values.angleReflected.toFixed(1)}° · medidos em relação à normal`, 12, 39);
  context.fillStyle = palette.gold;
  context.beginPath(); context.arc(hit.x, hit.y, 5.5, 0, 2 * Math.PI); context.fill();
}

function drawRefraction(context, geometry, values, p, view, palette, width) {
  const interfaceY = view.toScreen({ x: 0, y: 1.5 }).y;
  context.save();
  context.fillStyle = "rgba(78, 151, 237, .08)";
  context.fillRect(0, interfaceY, width, view.toScreen({ x: 0, y: 0 }).y - interfaceY);
  context.restore();
  line(context, view.toScreen({ x: geometry.bounds.xMin, y: 1.5 }), view.toScreen({ x: geometry.bounds.xMax, y: 1.5 }), palette.text, 2);
  const hit = view.toScreen(geometry.hit);
  const source = view.toScreen(geometry.source);
  context.save();
  context.fillStyle = wavelengthColor(Number(p.wavelengthNm));
  context.beginPath(); context.arc(source.x, source.y, 5, 0, 2 * Math.PI); context.fill();
  context.restore();
  context.fillStyle = palette.text;
  context.font = "10px system-ui";
  context.fillText("Fonte", source.x + 9, source.y - 7);
  const normalEnd = view.toScreen({ x: geometry.hit.x, y: geometry.hit.y + 0.68 });
  line(context, hit, normalEnd, palette.muted, 1.3, [5, 4]);
  for (const ray of geometry.rays) {
    const points = ray.points.map((point) => view.toScreen(point));
    drawArrow(context, points[0], points[1], wavelengthColor(Number(p.wavelengthNm)), ray.role);
  }
  drawParticles(context, geometry, p, values.time, view);
  context.fillStyle = palette.text;
  context.font = "12px system-ui";
  context.fillText(`Meio 1 · n₁=${values.index1.toFixed(2)} · λ₁=${values.wavelength1Nm.toFixed(0)} nm`, 12, 20);
  context.fillText(`Meio 2 · n₂=${values.index2.toFixed(2)} · λ₂=${values.wavelength2Nm.toFixed(0)} nm`, 12, 40);
  context.fillStyle = palette.muted;
  context.font = "11px system-ui";
  const angle2 = values.totalInternalReflection ? "θ₂ inexistente: reflexão interna total" : `θ₂=${values.angleTransmitted.toFixed(1)}°`;
  context.fillText(`θ₁=${values.angleIncident.toFixed(1)}° · ${angle2}`, 12, 60);
}

function drawSphericalMirror(context, geometry, values, p, view, palette) {
  const axisA = view.toScreen({ x: geometry.bounds.xMin, y: 0 });
  const axisB = view.toScreen({ x: geometry.bounds.xMax, y: 0 });
  line(context, axisA, axisB, palette.muted, 1.2, [5, 4]);
  context.beginPath();
  geometry.surfacePoints.forEach((point, index) => {
    const screen = view.toScreen(point);
    if (index === 0) context.moveTo(screen.x, screen.y); else context.lineTo(screen.x, screen.y);
  });
  context.strokeStyle = "#dce7f7";
  context.lineWidth = 4;
  context.stroke();
  context.strokeStyle = palette.blue;
  context.lineWidth = 1.5;
  context.stroke();
  let incidentLabeled = false;
  let reflectedLabeled = false;
  let virtualLabeled = false;
  for (const ray of geometry.rays) {
    const points = ray.points.map((point) => view.toScreen(point));
    const virtual = ray.role.includes("virtual");
    const label = virtual ? (virtualLabeled ? "" : "prolongamento virtual") : ray.role === "refletido" ? (reflectedLabeled ? "" : "raio refletido") : (incidentLabeled ? "" : "raio incidente");
    if (virtual) virtualLabeled = true;
    else if (ray.role === "refletido") reflectedLabeled = true;
    else incidentLabeled = true;
    drawArrow(context, points[0], points[1], virtual ? palette.muted : wavelengthColor(Number(p.wavelengthNm)), label, palette.muted);
  }
  drawParticles(context, geometry, p, values.time, view);
  const objectBottom = view.toScreen({ x: geometry.object.x, y: 0 });
  const objectTip = view.toScreen(geometry.object);
  drawArrow(context, objectBottom, objectTip, palette.gold, "objeto");
  if (geometry.image) {
    const imageBase = view.toScreen({ x: geometry.image.x, y: 0 });
    const imageTip = view.toScreen(geometry.image);
    drawArrow(context, imageBase, imageTip, palette.blue, `imagem ${geometry.imageType}`);
  }
  const center = view.toScreen(geometry.center);
  const focus = view.toScreen({ x: -geometry.focalLength, y: 0 });
  const vertex = view.toScreen({ x: 0, y: 0 });
  for (const [point, label] of [[center, "C"], [focus, "F"], [vertex, "V"]]) {
    context.fillStyle = palette.text;
    context.beginPath(); context.arc(point.x, point.y, 3.5, 0, 2 * Math.PI); context.fill();
    context.font = "10px system-ui"; context.fillText(label, point.x + 5, point.y + 14);
  }
  context.fillStyle = palette.text;
  context.font = "12px system-ui";
  context.fillText(`${geometry.sign > 0 ? "Côncavo" : "Convexo"} · f=${values.focalLength.toFixed(2)} m · R=${Math.abs(values.radius).toFixed(2)} m`, 12, 20);
  context.fillStyle = palette.muted;
  context.font = "11px system-ui";
  context.fillText(`Equação paraxial: p′=${Number.isFinite(values.imageDistance) ? values.imageDistance.toFixed(2) : "∞"} m · m=${Number.isFinite(values.magnification) ? values.magnification.toFixed(2) : "∞"}`, 12, 39);
}

export function drawOpticalScene(context, width, height, id, parameters, model, palette) {
  const geometry = model.geometry;
  const view = opticalViewFor(geometry.bounds, width, height);
  geometry.view = view;
  context.save();
  context.fillStyle = palette.bg;
  context.fillRect(0, 0, width, height);
  drawAxes(context, width, height, geometry.bounds, view, palette, geometry.kind === "spherical-mirror");
  if (geometry.kind === "plane-mirror") drawReflection(context, geometry, model.values, parameters, view, palette);
  else if (geometry.kind === "interface") drawRefraction(context, geometry, model.values, parameters, view, palette, width);
  else drawSphericalMirror(context, geometry, model.values, parameters, view, palette);
  context.restore();
}

export function opticalPointerToWorld(event, canvas, view) {
  const rect = canvas.getBoundingClientRect();
  return view.toWorld({ x: (event.clientX - rect.left) * view.width / rect.width, y: (event.clientY - rect.top) * view.height / rect.height });
}
