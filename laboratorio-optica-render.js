import { opticalDistance, opticalViewFor, wavelengthColor } from "./laboratorio-optica-core.js?v=concave-spherical-20261016-1";

// Velocidade-base arbitrária da animação; a velocidade visual não altera o valor físico de c.
const VISUAL_METERS_PER_NS = 0.3;

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

function pointOnPath(path, distanceAlong) {
  let remaining = distanceAlong;
  for (const segment of path) {
    const length = opticalDistance(segment.start, segment.end);
    if (remaining <= length) return { point: pointOnSegment(segment.start, segment.end, remaining), segment };
    remaining -= length;
  }
  const last = path.at(-1);
  return { point: last?.end || { x: 0, y: 0 }, segment: last };
}

function drawParticles(context, geometry, p, time, view) {
  if (geometry.mode !== "lantern" || !geometry.flashlight?.showParticles) return;
  const wavelengthNm = Number(p.wavelengthNm);
  const color = wavelengthColor(wavelengthNm);
  const paths = geometry.particlePaths || [geometry.segments];
  const speed = VISUAL_METERS_PER_NS * geometry.flashlight.visualSpeed;
  const travelledAtTime = Math.max(0, time) * speed;
  for (const path of paths) {
    const pathLength = path.reduce((sum, segment) => sum + opticalDistance(segment.start, segment.end), 0);
    if (!(pathLength > 0)) continue;
    const count = Math.max(1, Math.min(32, Math.round(Number(p.particleCount ?? geometry.flashlight.particleCount ?? 8))));
    for (let index = 0; index < count; index += 1) {
      const distanceAlong = ((travelledAtTime + index * pathLength / count) % pathLength + pathLength) % pathLength;
      const { point: worldPoint, segment } = pointOnPath(path, distanceAlong);
      const point = view.toScreen(worldPoint);
      if (geometry.flashlight.showTrails && segment) {
        const length = opticalDistance(segment.start, segment.end);
        if (length > 0) {
          const trailStart = view.toScreen(pointOnSegment(worldPoint, segment.start, Math.min(0.14, distanceAlong)));
          const trailEnd = point;
          context.save(); context.globalAlpha = geometry.flashlight.intensity;
          line(context, trailStart, trailEnd, color, 2);
          context.restore();
        }
      }
      context.save();
      context.shadowColor = color;
      context.shadowBlur = 9 * geometry.flashlight.intensity;
      context.fillStyle = color;
      context.globalAlpha = 0.25 + 0.7 * geometry.flashlight.intensity;
      context.beginPath();
      context.arc(point.x, point.y, 3.4, 0, 2 * Math.PI);
      context.fill();
      context.restore();
    }
  }
}

function drawHuman(context, base, tip, color, virtual = false) {
  const height = opticalDistance(base, tip);
  if (!(height > 0.02)) return;
  const up = { x: (tip.x - base.x) / height, y: (tip.y - base.y) / height };
  const side = { x: up.y, y: -up.x };
  const at = (fraction, lateral = 0) => ({ x: base.x + up.x * height * fraction + side.x * height * lateral, y: base.y + up.y * height * fraction + side.y * height * lateral });
  const shape = (points, fill, stroke = "rgba(8, 16, 31, .72)") => {
    context.beginPath();
    points.forEach((point, index) => {
      const screen = at(point[0], point[1]);
      if (index === 0) context.moveTo(screen.x, screen.y); else context.lineTo(screen.x, screen.y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = Math.max(0.8, height * 0.006);
    context.stroke();
  };
  const line = (points, width, color) => {
    context.beginPath();
    points.forEach((point, index) => {
      const screen = at(point[0], point[1]);
      if (index === 0) context.moveTo(screen.x, screen.y); else context.lineTo(screen.x, screen.y);
    });
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.5, height * width);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  };
  const dot = (fraction, lateral, radius, color) => {
    const point = at(fraction, lateral);
    context.beginPath();
    context.arc(point.x, point.y, Math.max(1.2, height * radius), 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
  };
  const skin = "#e8b992";
  const skinShade = "#c98c68";
  const hair = "#263047";
  const pants = virtual ? "#536b91" : "#344765";
  const shirt = color;
  const shirtShade = virtual ? "#6389bb" : "#bb9651";
  const outline = "rgba(8, 16, 31, .72)";
  const foot = "#202b3d";
  const headCenter = at(0.91, 0.005);
  const headRadius = Math.max(4.2, Math.min(11.5, height * 0.057));
  context.save();
  context.globalAlpha = virtual ? 0.76 : 1;
  context.shadowColor = virtual ? "transparent" : "rgba(0, 0, 0, .23)";
  context.shadowBlur = height * 0.018;
  // Calças, pernas e sapatos: volumes preenchidos deixam a figura legível mesmo pequena.
  shape([[0.48,-0.085],[0.43,-0.012],[0.25,-0.015],[0.10,-0.082],[0.055,-0.078],[0.045,-0.018],[0.10,0.005],[0.30,0.055],[0.47,0.018]], pants);
  shape([[0.48,0.085],[0.43,0.012],[0.25,0.015],[0.10,0.082],[0.055,0.078],[0.045,0.018],[0.10,-0.005],[0.30,-0.055],[0.47,-0.018]], pants);
  shape([[0.055,-0.078],[0.025,-0.11],[0.012,-0.035],[0.04,0.015],[0.08,0.006]], foot, outline);
  shape([[0.055,0.078],[0.025,0.11],[0.012,0.035],[0.04,-0.015],[0.08,-0.006]], foot, outline);
  // Braços ao lado do tronco, com mangas, antebraços e mãos.
  line([[0.73,-0.105],[0.61,-0.15],[0.48,-0.16]], 0.075, shirtShade);
  line([[0.48,-0.16],[0.34,-0.18]], 0.045, skin);
  line([[0.73,0.105],[0.61,0.15],[0.48,0.16]], 0.075, shirtShade);
  line([[0.48,0.16],[0.34,0.18]], 0.045, skin);
  dot(0.33,-0.18,0.022,skinShade); dot(0.33,0.18,0.022,skinShade);
  // Tronco com ombros e cintura definidos.
  shape([[0.81,-0.045],[0.78,-0.09],[0.72,-0.13],[0.63,-0.12],[0.49,-0.075],[0.46,0],[0.49,0.075],[0.63,0.12],[0.72,0.13],[0.78,0.09],[0.81,0.045]], shirt, outline);
  shape([[0.78,-0.045],[0.75,0],[0.78,0.045],[0.81,0.02],[0.81,-0.02]], shirtShade, "transparent");
  // Pescoço e cabeça com cabelo, rosto, olho e nariz orientados para a frente.
  shape([[0.82,-0.027],[0.87,-0.024],[0.88,0.024],[0.82,0.027]], skin);
  context.save();
  context.translate(headCenter.x, headCenter.y);
  context.rotate(Math.atan2(up.y, up.x) + Math.PI / 2);
  context.fillStyle = skin;
  context.strokeStyle = outline;
  context.lineWidth = Math.max(0.8, height * 0.006);
  context.beginPath(); context.ellipse(0, 0, headRadius * 0.78, headRadius, 0, 0, 2 * Math.PI); context.fill(); context.stroke();
  context.fillStyle = hair;
  context.beginPath(); context.ellipse(-headRadius * 0.08, -headRadius * 0.38, headRadius * 0.76, headRadius * 0.58, 0, Math.PI, 2 * Math.PI); context.fill();
  context.beginPath(); context.ellipse(-headRadius * 0.48, headRadius * 0.05, headRadius * 0.25, headRadius * 0.52, 0, Math.PI * 0.6, Math.PI * 1.6); context.fill();
  context.fillStyle = outline;
  context.beginPath(); context.arc(headRadius * 0.27, -headRadius * 0.02, Math.max(0.8, headRadius * 0.065), 0, 2 * Math.PI); context.fill();
  context.beginPath(); context.moveTo(headRadius * 0.56, headRadius * 0.08); context.lineTo(headRadius * 0.72, headRadius * 0.15); context.lineTo(headRadius * 0.54, headRadius * 0.2); context.stroke();
  context.beginPath(); context.arc(headRadius * 0.39, headRadius * 0.38, headRadius * 0.16, 0.1 * Math.PI, 0.55 * Math.PI); context.stroke();
  context.restore();
  line([[0.79,-0.026],[0.75,0],[0.79,0.026]], 0.009, virtual ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.68)");
  context.restore();
}

function drawLantern(context, geometry, view, palette) {
  const flashlight = geometry.flashlight;
  if (!flashlight) return;
  const origin = view.toScreen(flashlight.source);
  const direction = { x: flashlight.direction.x, y: -flashlight.direction.y };
  const angle = Math.atan2(direction.y, direction.x);
  context.save();
  context.translate(origin.x, origin.y);
  context.rotate(angle);
  context.fillStyle = palette.gold;
  context.strokeStyle = palette.text;
  context.lineWidth = 1.5;
  context.globalAlpha = flashlight.intensity;
  context.shadowColor = palette.gold;
  context.shadowBlur = 12;
  context.beginPath(); context.roundRect(-23, -7, 34, 14, 4); context.fill(); context.stroke();
  context.beginPath(); context.moveTo(-8, 6); context.lineTo(2, 6); context.lineTo(7, 16); context.lineTo(-6, 16); context.closePath(); context.fill(); context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = palette.text;
  context.beginPath(); context.moveTo(10, -6); context.lineTo(19, -10); context.lineTo(19, 10); context.lineTo(10, 6); context.closePath(); context.fill(); context.stroke();
  context.fillStyle = palette.gold;
  context.beginPath(); context.ellipse(19, 0, 2.5, 7.5, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  const tip = { x: flashlight.source.x + flashlight.direction.x * 0.3, y: flashlight.source.y + flashlight.direction.y * 0.3 };
  drawArrow(context, origin, view.toScreen(tip), palette.gold, "lanterna", palette.text);
}

function drawLanternImage(context, geometry, view, palette) {
  if (!geometry.flashlight?.showImage || !geometry.image) return;
  const point = view.toScreen(geometry.image);
  const virtual = geometry.imageType === "virtual";
  context.save();
  context.strokeStyle = palette.blue;
  context.fillStyle = palette.blue;
  context.globalAlpha = 0.82;
  context.lineWidth = 2;
  context.setLineDash(virtual ? [4, 3] : []);
  context.beginPath(); context.arc(point.x, point.y, 8, 0, 2 * Math.PI); context.stroke();
  context.setLineDash([]);
  context.beginPath(); context.arc(point.x, point.y, 3, 0, 2 * Math.PI); context.fill();
  context.font = "10px system-ui";
  context.fillText("imagem " + (virtual ? "virtual" : "real") + " da fonte", point.x + 10, point.y - 8);
  context.restore();
}

function drawMirrorSurface(context, geometry, view, palette) {
  const mirrorA = view.toScreen({ x: geometry.center.x - geometry.tangent.x * 1.08, y: geometry.center.y - geometry.tangent.y * 1.08 });
  const mirrorB = view.toScreen({ x: geometry.center.x + geometry.tangent.x * 1.08, y: geometry.center.y + geometry.tangent.y * 1.08 });
  line(context, mirrorA, mirrorB, "#dce7f7", 7);
  line(context, mirrorA, mirrorB, palette.blue, 2);
}

function drawDistance(context, a, b, label, color, view) {
  const from = view.toScreen(a);
  const to = view.toScreen(b);
  line(context, from, to, color, 1.3, [4, 3]);
  context.save();
  context.fillStyle = color;
  context.font = "10px system-ui";
  context.textAlign = "center";
  context.fillText(label, (from.x + to.x) / 2, (from.y + to.y) / 2 - 6);
  context.restore();
}

function drawPlaneHuman(context, geometry, values, p, view, palette) {
  drawMirrorSurface(context, geometry, view, palette);
  if (p.showReferences !== false) {
    line(context, view.toScreen({ x: geometry.bounds.xMin, y: geometry.center.y }), view.toScreen({ x: geometry.bounds.xMax, y: geometry.center.y }), palette.muted, 1.1, [5, 4]);
    for (const ray of geometry.rays) {
      const points = ray.points.map((point) => view.toScreen(point));
      const virtual = ray.role.includes("virtual");
      drawArrow(context, points[0], points[1], virtual ? palette.muted : palette.blue, ray.role, palette.muted);
    }
  }
  drawHuman(context, view.toScreen(geometry.objectBase), view.toScreen(geometry.object), palette.gold);
  if (geometry.image && p.showImage !== false) drawHuman(context, view.toScreen(geometry.imageBase), view.toScreen(geometry.image), palette.blue, true);
  if (p.showMeasures !== false) {
    drawDistance(context, geometry.objectBase, geometry.center, "p = " + values.objectDistance.toFixed(2) + " m", palette.gold, view);
    drawDistance(context, geometry.center, geometry.imageBase, "p′ = " + values.imageDistance.toFixed(2) + " m", palette.blue, view);
    drawDistance(context, geometry.objectBase, geometry.imageBase, "objeto ↔ imagem = " + values.objectImageSeparation.toFixed(2) + " m", palette.text, view);
  }
  context.fillStyle = palette.text;
  context.font = "12px system-ui";
  context.fillText("Espelho plano · imagem virtual, direita e do mesmo tamanho", 12, 20);
  context.fillStyle = palette.muted;
  context.font = "11px system-ui";
  context.fillText("p′ = p · h′ = h · m = 1 · h = " + values.objectHeight.toFixed(2) + " m", 12, 39);
}

function drawPlaneLantern(context, geometry, values, p, view, palette) {
  drawMirrorSurface(context, geometry, view, palette);
  const flashlight = geometry.flashlight;
  const interaction = flashlight.primaryInteraction;
  if (flashlight.showRays) {
    let incidentLabeled = false, reflectedLabeled = false, virtualLabeled = false;
    for (const ray of geometry.rays) {
      const points = ray.points.map((point) => view.toScreen(point));
      const virtual = ray.role.includes("virtual");
      const incident = ray.role.includes("incidente");
      const label = virtual ? (virtualLabeled ? "" : "prolongamento virtual") : incident ? (incidentLabeled ? "" : "incidente") : (reflectedLabeled ? "" : "refletido");
      if (virtual) virtualLabeled = true;
      else if (incident) incidentLabeled = true;
      else reflectedLabeled = true;
      context.save(); context.globalAlpha = flashlight.intensity;
      drawArrow(context, points[0], points[1], virtual ? palette.muted : wavelengthColor(Number(p.wavelengthNm)), label, palette.muted);
      context.restore();
    }
  }
  if (interaction && flashlight.showNormal) {
    const end = { x: interaction.hit.x + interaction.normal.x * 0.66, y: interaction.hit.y + interaction.normal.y * 0.66 };
    const screenEnd = view.toScreen(end);
    line(context, view.toScreen(interaction.hit), screenEnd, palette.text, 1.3, [5, 4]);
    context.fillStyle = palette.text; context.font = "10px system-ui";
    context.fillText("normal local", screenEnd.x + 4, screenEnd.y - 4);
  }
  drawParticles(context, geometry, p, values.time, view);
  drawLantern(context, geometry, view, palette);
  drawLanternImage(context, geometry, view, palette);
  context.fillStyle = palette.text; context.font = "12px system-ui";
  context.fillText("Espelho plano · " + (flashlight.parallel ? "feixe aproximadamente paralelo" : "feixe divergente") + " · " + values.rayCount + " raios válidos", 12, 20);
  context.fillStyle = palette.muted; context.font = "11px system-ui";
  if (interaction && flashlight.showAngles) {
    const hit = view.toScreen(interaction.hit);
    context.fillText("θᵢ = " + values.angleIncident.toFixed(1) + "° · θᵣ = " + values.angleReflected.toFixed(1) + "° · medidos pela normal", hit.x + 8, hit.y - 8);
  }
  context.fillText("A reflexão plana conserva o módulo da velocidade; as linhas tracejadas mostram prolongamentos aparentes.", 12, 39);
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
  if (geometry.mode === "human") return drawPlaneHuman(context, geometry, values, p, view, palette);
  if (geometry.mode === "lantern") return drawPlaneLantern(context, geometry, values, p, view, palette);
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
  if (geometry.mode === "human") return drawSphericalHuman(context, geometry, values, p, view, palette);
  if (geometry.mode === "lantern") return drawSphericalLantern(context, geometry, values, p, view, palette);
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

function drawSphericalSurface(context, geometry, view, palette) {
  const axisA = view.toScreen({ x: geometry.bounds.xMin, y: 0 });
  const axisB = view.toScreen({ x: geometry.bounds.xMax, y: 0 });
  line(context, axisA, axisB, palette.muted, 1.2, [5, 4]);
  context.beginPath();
  geometry.surfacePoints.forEach((point, index) => {
    const screen = view.toScreen(point);
    if (index === 0) context.moveTo(screen.x, screen.y); else context.lineTo(screen.x, screen.y);
  });
  context.strokeStyle = "#dce7f7"; context.lineWidth = 4; context.stroke();
  context.strokeStyle = palette.blue; context.lineWidth = 1.5; context.stroke();
}

function drawSphericalLandmarks(context, geometry, values, view, palette, label) {
  const center = view.toScreen(geometry.center);
  const focus = view.toScreen({ x: -geometry.focalLength, y: 0 });
  const vertex = view.toScreen({ x: 0, y: 0 });
  for (const [point, text, isFocus] of [[center, "C", false], [focus, "F", true], [vertex, "V", false]]) {
    context.beginPath(); context.arc(point.x, point.y, isFocus ? 7 : 3.5, 0, 2 * Math.PI);
    if (isFocus) {
      context.strokeStyle = palette.gold; context.lineWidth = 2; context.stroke();
      context.fillStyle = palette.gold; context.beginPath(); context.arc(point.x, point.y, 2.4, 0, 2 * Math.PI); context.fill();
    } else {
      context.fillStyle = palette.text; context.fill();
    }
    context.fillStyle = isFocus ? palette.gold : palette.text;
    context.font = isFocus ? "700 12px system-ui" : "10px system-ui";
    context.fillText(text, point.x + 7, point.y + 14);
  }
  const apertureEdge = geometry.surfacePoints[geometry.surfacePoints.length - 1];
  if (apertureEdge) {
    const edge = view.toScreen(apertureEdge);
    context.fillStyle = palette.gold;
    context.beginPath(); context.arc(edge.x, edge.y, 3, 0, 2 * Math.PI); context.fill();
    context.font = "10px system-ui";
    context.fillText("a", edge.x + 5, edge.y - 3);
  }
  if (geometry.rayModel === "exact" && geometry.exactFocus?.point && Number.isFinite(geometry.exactFocus.rms)) {
    const spot = view.toScreen(geometry.exactFocus.point);
    const rim = view.toScreen({ x: geometry.exactFocus.point.x + geometry.exactFocus.rms, y: geometry.exactFocus.point.y });
    const radiusPixels = Math.max(2.5, Math.abs(rim.x - spot.x));
    context.save();
    context.beginPath(); context.arc(spot.x, spot.y, radiusPixels, 0, 2 * Math.PI);
    context.strokeStyle = palette.gold; context.lineWidth = 1.5; context.setLineDash([3, 3]); context.stroke();
    context.restore();
  }
  context.fillStyle = palette.text; context.font = "12px system-ui";
  context.fillText(label + " · superfície esférica · f = " + values.focalLength.toFixed(2) + " m · R = " + Math.abs(values.radius).toFixed(2) + " m · a = " + geometry.aperture.toFixed(2) + " m", 12, 20, Math.max(80, context.canvas.width - 24));
  context.fillStyle = palette.muted; context.font = "11px system-ui";
  const paraxialLine = "Paraxial: q = " + (Number.isFinite(values.paraxialImageDistance) ? values.paraxialImageDistance.toFixed(2) : "∞") + " m · m = " + (Number.isFinite(values.paraxialMagnification) ? values.paraxialMagnification.toFixed(2) : "∞");
  context.fillText(paraxialLine, 12, 39, Math.max(80, context.canvas.width - 24));
  const modelLine = geometry.rayModel === "exact"
    ? "Traçado exato: menor dispersão RMS = " + (Number.isFinite(values.exactImageBlurRadius) ? values.exactImageBlurRadius.toFixed(4) : "—") + " m"
    : "Trajetórias paraxiais · aproximação para raios próximos do eixo e pequenos ângulos";
  context.fillText(modelLine, 12, 58, Math.max(80, context.canvas.width - 24));
}

function drawSphericalHuman(context, geometry, values, p, view, palette) {
  drawSphericalSurface(context, geometry, view, palette);
  if (p.showReferences !== false) {
    let incidentLabeled = false, reflectedLabeled = false, virtualLabeled = false;
    for (const ray of geometry.rays) {
      const points = ray.points.map((point) => view.toScreen(point));
      const virtual = ray.role.includes("virtual");
      const reflected = ray.role.includes("refletido");
      const label = virtual ? (virtualLabeled ? "" : "prolongamento virtual") : reflected ? (reflectedLabeled ? "" : "raio refletido") : (incidentLabeled ? "" : "raio incidente");
      if (virtual) virtualLabeled = true;
      else if (reflected) reflectedLabeled = true;
      else incidentLabeled = true;
      drawArrow(context, points[0], points[1], virtual ? palette.muted : wavelengthColor(Number(p.wavelengthNm)), label, palette.muted);
    }
  }
  drawHuman(context, view.toScreen(geometry.objectBase), view.toScreen(geometry.object), palette.gold);
  if (geometry.image && p.showImage !== false) drawHuman(context, view.toScreen(geometry.imageBase), view.toScreen(geometry.image), palette.blue, geometry.imageType === "virtual");
  if (p.showMeasures !== false) {
    drawDistance(context, geometry.objectBase, { x: 0, y: 0 }, "p = " + values.objectDistance.toFixed(2) + " m", palette.gold, view);
    if (geometry.imageBase) {
      drawDistance(context, { x: 0, y: 0 }, geometry.imageBase, "|p′| = " + Math.abs(values.imageDistance).toFixed(2) + " m", palette.blue, view);
      drawDistance(context, geometry.objectBase, geometry.imageBase, "objeto ↔ imagem = " + values.objectImageSeparation.toFixed(2) + " m", palette.text, view);
    }
  }
  drawSphericalLandmarks(context, geometry, values, view, palette, geometry.sign > 0 ? "Côncavo · imagem " + values.image : "Convexo · imagem virtual reduzida");
  if (geometry.imageDistance !== Infinity && !geometry.image && p.showImage !== false) {
    context.fillStyle = palette.muted; context.font = "10px system-ui";
    context.fillText("Imagem calculada fora do limite de escala; aproxime o objeto do foco.", 12, 58);
  }
}

function drawSphericalLantern(context, geometry, values, p, view, palette) {
  const flashlight = geometry.flashlight;
  drawSphericalSurface(context, geometry, view, palette);
  if (flashlight.showRays && flashlight.interactions?.length > 1) {
    context.save();
    context.beginPath();
    const source = view.toScreen(flashlight.source);
    context.moveTo(source.x, source.y);
    for (const interaction of flashlight.interactions) {
      const hit = view.toScreen(interaction.hit);
      context.lineTo(hit.x, hit.y);
    }
    context.closePath();
    context.fillStyle = wavelengthColor(Number(p.wavelengthNm));
    context.globalAlpha = 0.08 * flashlight.intensity;
    context.fill();
    context.restore();
  }
  if (flashlight.showRays) {
    let incidentLabeled = false, reflectedLabeled = false, virtualLabeled = false;
    for (const ray of geometry.rays) {
      const points = ray.points.map((point) => view.toScreen(point));
      const virtual = ray.role.includes("virtual");
      const incident = ray.role.includes("incidente") || ray.role.includes("principal");
      const label = virtual ? (virtualLabeled ? "" : "prolongamento virtual")
        : incident ? (incidentLabeled ? "" : "raio incidente")
          : (reflectedLabeled ? "" : "raio refletido");
      if (virtual) virtualLabeled = true;
      else if (incident) incidentLabeled = true;
      else reflectedLabeled = true;
      context.save(); context.globalAlpha = flashlight.intensity;
      drawArrow(context, points[0], points[1], virtual ? palette.muted : wavelengthColor(Number(p.wavelengthNm)), label, palette.muted);
      context.restore();
    }
  }
  drawParticles(context, geometry, p, values.time, view);
  drawLantern(context, geometry, view, palette);
  if (flashlight.showImage !== false) drawLanternImage(context, geometry, view, palette);
  const interaction = flashlight.primaryInteraction;
  if (interaction && flashlight.showNormal) {
    const end = { x: interaction.hit.x + interaction.normal.x * 0.66, y: interaction.hit.y + interaction.normal.y * 0.66 };
    const hit = view.toScreen(interaction.hit), normalEnd = view.toScreen(end);
    line(context, hit, normalEnd, palette.text, 1.3, [5, 4]);
    context.fillStyle = palette.text; context.font = "10px system-ui";
    context.fillText("normal local", normalEnd.x + 4, normalEnd.y - 4);
  }
  if (interaction && flashlight.showAngles) {
    const hit = view.toScreen(interaction.hit);
    context.fillStyle = palette.text; context.font = "10px system-ui";
    context.fillText("θᵢ = " + values.angleIncident.toFixed(1) + "° · θᵣ = " + values.angleReflected.toFixed(1) + "°", hit.x + 7, hit.y - 8);
  }
  const beamLabel = (geometry.sign > 0 ? "Espelho côncavo esférico" : "Espelho convexo esférico")
    + " · feixe " + (flashlight.parallel ? "colimado" : "divergente");
  drawSphericalLandmarks(context, geometry, values, view, palette, beamLabel);
  context.fillStyle = palette.muted; context.font = "10px system-ui";
  const explanation = geometry.rayModel === "exact"
    ? "Cada raio cruza a esfera e reflete pela normal local; a separação focal mostra aberração esférica."
    : "Modelo paraxial próximo ao eixo; a esfera continua sendo a superfície física do espelho.";
  context.fillText(explanation, 12, 78, Math.max(80, context.canvas.width - 24));
}

function drawOpticalBackgroundGrid(context, width, height, color, spacing = 44) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.globalAlpha = 0.34;
  context.beginPath();
  const centerX = Math.round(width / 2 / spacing) * spacing;
  const centerY = Math.round(height / 2 / spacing) * spacing;
  for (let x = centerX; x >= 0; x -= spacing) { context.moveTo(x + 0.5, 0); context.lineTo(x + 0.5, height); }
  for (let x = centerX + spacing; x <= width; x += spacing) { context.moveTo(x + 0.5, 0); context.lineTo(x + 0.5, height); }
  for (let y = centerY; y >= 0; y -= spacing) { context.moveTo(0, y + 0.5); context.lineTo(width, y + 0.5); }
  for (let y = centerY + spacing; y <= height; y += spacing) { context.moveTo(0, y + 0.5); context.lineTo(width, y + 0.5); }
  context.stroke();
  context.restore();
}

export function drawOpticalScene(context, width, height, id, parameters, model, palette, viewOverride = null) {
  const geometry = model.geometry;
  const view = viewOverride?.toScreen ? viewOverride : opticalViewFor(viewOverride || geometry.bounds, width, height);
  geometry.view = view;
  context.save();
  context.fillStyle = palette.bg;
  context.fillRect(0, 0, width, height);
  drawOpticalBackgroundGrid(context, width, height, palette.line);
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
