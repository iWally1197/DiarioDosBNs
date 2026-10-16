(() => {
  "use strict";

  const STYLE = `
    .lab-standard-fullscreen-toolbar {
      box-sizing: border-box; z-index: 110; display: flex; flex-wrap: wrap; align-items: center;
      gap: 8px; padding: 8px 10px; border: 1px solid rgba(228,196,119,.72); border-radius: 12px;
      background: rgba(7,15,29,.96); color: #f3f5fb; box-shadow: 0 8px 28px rgba(0,0,0,.24);
      font: 500 14px/1.2 system-ui, sans-serif; pointer-events: auto;
    }
    .lab-standard-fullscreen-toolbar > button {
      box-sizing: border-box; min-height: 42px; padding: 9px 13px; border: 1px solid rgba(228,196,119,.52);
      border-radius: 7px; background: #111c2d; color: #f4f5fa; font: inherit; white-space: nowrap; cursor: pointer;
    }
    .lab-standard-fullscreen-toolbar > button:hover:not(:disabled) { background: #1b2a40; border-color: #e4c477; }
    .lab-standard-fullscreen-toolbar > button:focus-visible,
    .lab-standard-fullscreen-time-picker input:focus-visible { outline: 2px solid #f0cc79; outline-offset: 2px; }
    .lab-standard-fullscreen-toolbar > button:disabled { opacity: .52; cursor: not-allowed; }
    .lab-standard-fullscreen-toolbar > .lab-standard-play { background: #326d58; border-color: #68bd91; }
    .lab-standard-fullscreen-toolbar > .lab-standard-time {
      display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 8px 14px;
      border: 1px solid rgba(228,196,119,.65); border-radius: 999px; background: #0c1627; color: #fff;
      font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .lab-standard-fullscreen-time-picker {
      position: absolute; top: calc(100% + 8px); left: 8px; z-index: 2; display: flex; align-items: end;
      flex-wrap: wrap; gap: 8px; width: min(360px, calc(100vw - 36px)); padding: 12px;
      border: 1px solid rgba(228,196,119,.65); border-radius: 10px; background: #0c1627; color: #f4f5fa;
      box-shadow: 0 12px 34px rgba(0,0,0,.42);
    }
    .lab-standard-fullscreen-time-picker[hidden] { display: none !important; }
    .lab-standard-fullscreen-time-picker label { display: grid; gap: 5px; color: #aab8cc; font-size: 12px; }
    .lab-standard-fullscreen-time-picker input { box-sizing: border-box; width: 130px; min-height: 40px; padding: 8px;
      border: 1px solid rgba(206,218,240,.3); border-radius: 7px; background: #08101f; color: #fff; font: inherit; }
    .lab-standard-fullscreen-time-picker > button { min-height:40px; padding:8px 11px; border:1px solid rgba(228,196,119,.52); border-radius:7px; background:#111c2d; color:#f4f5fa; font:inherit; cursor:pointer; }
    .lab-standard-fullscreen-time-picker > .lab-standard-picker-go { background:#326d58; border-color:#68bd91; }
    .lab-standard-fullscreen-toolbar .lab-standard-extra { border-color: rgba(129,179,255,.6); }
    #lab-workspace.lab-standard-fullscreen-active > .lab-standard-fullscreen-toolbar {
      position: relative; inset: auto; flex: 0 0 auto; align-self: stretch; margin: 0 0 7px;
    }
    .lab-standard-fullscreen-active:not(#lab-workspace) > .lab-standard-fullscreen-toolbar {
      position: absolute; top: 10px; left: 10px; right: 10px;
    }
    .lab-standard-fullscreen-active #mru-fullscreen-tools,
    .lab-standard-fullscreen-active #mruv-fullscreen-tools { display: flex !important; }
    .lab-standard-fullscreen-active #workspace-fullscreen,
    .lab-standard-fullscreen-active #workspace-controls-toggle,
    .lab-standard-fullscreen-active #workspace-play,
    .lab-standard-fullscreen-active #mirror-mode-toggle { display:none!important; }
    .priority-lab.lab-standard-fullscreen-active .priority-header-actions,
    .priority-lab.lab-standard-fullscreen-active .priority-stage-toolbar,
    .magnet-workspace.lab-standard-fullscreen-active .magnet-scene-toolbar,
    #faraday-lab.lab-standard-fullscreen-active .faraday-toolbar,
    .freefall-lab.lab-standard-fullscreen-active .freefall-toolbar { display:none!important; }
    .lab-standard-fullscreen-active #fullscreen-toggle,
    .lab-standard-fullscreen-active #faraday-panel-toggle { display:none!important; }
    .lab-standard-fullscreen-toolbar > .mru-fullscreen-time,
    .lab-standard-fullscreen-toolbar > .mruv-fullscreen-time,
    .lab-standard-fullscreen-toolbar > output:not(.lab-standard-time) {
      display:inline-flex; align-items:center; justify-content:center; min-height:42px; padding:8px 14px;
      border:1px solid rgba(228,196,119,.65); border-radius:999px; background:#0c1627; color:#fff;
      font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap;
    }
    .lab-standard-fullscreen-toolbar > .mru-fullscreen-time-picker,
    .lab-standard-fullscreen-toolbar > .mruv-fullscreen-time-picker { position:absolute; top:calc(100% + 8px); left:8px; z-index:2; }
    @media (max-width: 680px) {
      .lab-standard-fullscreen-toolbar { gap: 5px; padding: 6px; }
      .lab-standard-fullscreen-toolbar > button { min-height: 38px; padding: 7px 9px; font-size: 12px; }
      .lab-standard-fullscreen-toolbar > .lab-standard-time { min-height: 38px; padding: 7px 10px; font-size: 12px; }
      .lab-standard-fullscreen-active:not(#lab-workspace) > .lab-standard-fullscreen-toolbar { top: 7px; left: 7px; right: 7px; }
    }
  `;

  const style = document.createElement("style");
  style.dataset.labFullscreenToolbar = "true";
  style.textContent = STYLE;
  document.head.append(style);

  const q = (root, selector) => selector ? root.querySelector(selector) : null;
  const byId = (id) => document.getElementById(id);
  const attr = (node, name) => node?.getAttribute(name) || "";
  const profiles = [
    {
      selector: "#lab-workspace", kind: "workspace", play: "#workspace-play", time: "#workspace-time-out",
      seek: "#workspace-time", controls: "#workspace-controls-toggle",
      zoomIn: '.lab-view-control-button[aria-label="Aproximar a perspectiva"]',
      zoomOut: '.lab-view-control-button[aria-label="Afastar a perspectiva"]',
      extra: "#mirror-mode-toggle", extraLabel: "Modo de luz"
    },
    {
      selector: ".priority-lab", kind: "priority", play: "#play-toggle", time: "#time-output",
      controls: "#panel-toggle", step: "#step-button", reset: "#reset-button"
    },
    {
      selector: ".mru-stage", kind: "mru", play: "#mru-fullscreen-play", time: "#mru-fullscreen-time",
      controls: "#mru-fullscreen-menu", timeToggle: "#mru-fullscreen-time-toggle",
      timePicker: "#mru-fullscreen-time-picker", zoomIn: "#mru-fullscreen-zoom-in",
      zoomOut: "#mru-fullscreen-zoom-out", exit: "#mru-fullscreen-exit", extra: "#mru-step-forward",
      extraLabel: "Avançar passo", bar: "#mru-fullscreen-tools"
    },
    {
      selector: ".mruv-stage", kind: "mruv", play: "#mruv-fullscreen-play", time: "#mruv-fullscreen-time",
      controls: "#mruv-fullscreen-menu", timeToggle: "#mruv-fullscreen-time-toggle",
      timePicker: "#mruv-fullscreen-time-picker", zoomIn: "#mruv-fullscreen-zoom-in",
      zoomOut: "#mruv-fullscreen-zoom-out", exit: "#mruv-fullscreen-exit", extra: "#mruv-step-forward",
      extraLabel: "Avançar passo", bar: "#mruv-fullscreen-tools"
    },
    {
      selector: ".magnet-workspace", kind: "magnet", play: "#simulation-pause", controls: "#fullscreen-menu-toggle",
      zoomEvent: true, extra: "#interaction-motion-toggle", extraLabel: "Simular movimento do ímã livre"
    },
    {
      selector: "#faraday-lab", kind: "faraday", play: "[data-play]", time: "#faraday-time",
      controls: "#faraday-panel-toggle", zoomEvent: true, modeButtons: true
    },
    {
      selector: ".freefall-lab", kind: "freefall", play: "[data-play]", time: "#freefall-time",
      controls: "#freefall-panel-toggle", step: "[data-step=\"0.1\"]", reset: "[data-reset]", zoomEvent: true
    }
  ];

  function findProfile(root) {
    return profiles.find((item) => root.matches(item.selector));
  }

  function button(label, className, action) {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.className = className || "";
    node.addEventListener("click", action);
    return node;
  }

  function playIsRunning(profile) {
    const source = q(profile.root, profile.play);
    if (!source) return false;
    if (profile.kind === "magnet") return attr(source, "aria-pressed") !== "true";
    if (profile.kind === "faraday") return source.textContent.trim().toLowerCase() === "pausar";
    return attr(source, "aria-pressed") === "true" || source.textContent.trim().toLowerCase() === "pausar";
  }

  function unitOf(text) {
    const match = String(text || "").match(/\b(ms|ns|s)\b/i);
    return match ? match[1] : "s";
  }

  function makeTimePicker(profile, bar, chooseButton) {
    const form = document.createElement("form");
    form.className = "lab-standard-fullscreen-time-picker";
    form.hidden = true;
    form.innerHTML = '<label>Instante (<span data-time-unit>s</span>)<input type="number" step="any" inputmode="decimal" required></label><button class="lab-standard-picker-go" type="submit">Ir para</button><button class="lab-standard-picker-close" type="button">Fechar</button>';
    const input = form.querySelector("input");
    const unit = form.querySelector("[data-time-unit]");
    chooseButton.addEventListener("click", () => {
      if (form.hidden) {
        if (playIsRunning(profile)) q(profile.root, profile.play)?.click();
        const range = profile.seek ? q(profile.root, profile.seek) : null;
        if (range) {
          input.min = range.min || "0";
          input.max = range.max || "0";
          input.step = range.step && range.step !== "any" ? range.step : "any";
          input.value = String(Number(range.value) || 0);
          input.disabled = range.disabled || Number(range.max) === Number(range.min);
        } else {
          const duration = profile.kind === "priority"
            ? Number(profile.root.dataset.simulationDuration)
            : profile.kind === "faraday"
              ? (Number(byId("faraday-frequency")?.value) > 0 ? 1 / Number(byId("faraday-frequency").value) : 0)
              : profile.kind === "freefall"
                ? Number(profile.root.dataset.simulationDuration)
                : 0;
          input.min = "0";
          input.max = String(Number.isFinite(duration) ? duration : 0);
          input.step = "any";
          input.value = "0";
          input.disabled = !duration;
        }
        unit.textContent = profile.kind === "workspace" ? unitOf(q(profile.root, profile.time)?.textContent) : "s";
        form.hidden = false;
        chooseButton.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => input.focus());
      } else close();
    });
    function close() {
      form.hidden = true;
      chooseButton.setAttribute("aria-expanded", "false");
    }
    form.querySelector(".lab-standard-picker-close").addEventListener("click", close);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!input.reportValidity()) return;
      const value = input.valueAsNumber;
      if (!Number.isFinite(value)) return;
      if (profile.kind === "workspace") {
        const range = q(profile.root, profile.seek);
        if (!range || range.disabled) return;
        range.value = String(Math.max(Number(range.min) || 0, Math.min(Number(range.max), value)));
        range.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        window.dispatchEvent(new CustomEvent("diario-lab-seek", { detail: { time: value } }));
      }
      close();
    });
    bar.append(form);
    return form;
  }

  function setCommonButtonState(node, label, pressed) {
    if (!node) return;
    if (node.textContent !== label) node.textContent = label;
    if (pressed !== undefined) node.setAttribute("aria-pressed", String(pressed));
  }

  function configureExtras(profile, bar) {
    if (profile.extra) {
      const source = q(profile.root, profile.extra);
      if (source && !source.hidden) {
        const extra = button(profile.extraLabel || source.textContent.trim(), "lab-standard-extra", () => source.click());
        extra.dataset.labStandardExtra = "true";
        extra.setAttribute("aria-pressed", attr(source, "aria-pressed") || "false");
        bar.insertBefore(extra, bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit") || null);
        profile.extraButton = extra;
        profile.extraSource = source;
      }
    }
    if (profile.kind === "faraday" && profile.modeButtons) {
      ["2d", "3d"].forEach((mode) => {
        const source = q(profile.root, '[data-mode="' + mode + '"]');
        if (!source) return;
        const extra = button("Vista " + mode.toUpperCase(), "lab-standard-extra", () => source.click());
        extra.dataset.labStandardExtra = "true";
        bar.insertBefore(extra, bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit") || null);
        extra.dataset.modeSource = mode;
      });
    }
    if (profile.step) {
      const source = q(profile.root, profile.step);
      if (source) {
        const extra = button("Avançar", "lab-standard-extra", () => source.click());
        extra.dataset.labStandardExtra = "true";
        bar.insertBefore(extra, bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit") || null);
      }
    }
    if (profile.reset) {
      const source = q(profile.root, profile.reset);
      if (source) {
        const extra = button("Reiniciar", "lab-standard-extra", () => source.click());
        extra.dataset.labStandardExtra = "true";
        bar.insertBefore(extra, bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit") || null);
      }
    }
  }

  function mount(root, profile) {
    profile.root = root;
    root.classList.add("lab-standard-fullscreen-active");
    let bar = profile.bar ? q(root, profile.bar) : null;
    if (bar) {
      bar.classList.add("lab-standard-fullscreen-toolbar");
      if (!bar.querySelector("[data-lab-standard-extra]")) configureExtras(profile, bar);
      return { bar, profile, owned: false };
    }

    bar = document.createElement("div");
    bar.className = "lab-standard-fullscreen-toolbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Controles da animação em tela cheia");
    const play = button("Iniciar", "lab-standard-play", () => q(root, profile.play)?.click());
    play.dataset.labStandardPlay = "true";
    const time = document.createElement("output");
    time.className = "lab-standard-time";
    time.setAttribute("aria-label", "Tempo da simulação");
    time.setAttribute("aria-live", "off");
    const choose = button("⏱ Escolher tempo", "lab-standard-choose", () => {});
    choose.setAttribute("aria-expanded", "false");
    const form = makeTimePicker(profile, bar, choose);
    bar.append(play, time, choose);

    const zoomOut = button("− Zoom", "", () => zoom(profile, .84));
    zoomOut.setAttribute("aria-label", "Afastar a animação");
    const zoomIn = button("+ Zoom", "", () => zoom(profile, 1.19));
    zoomIn.setAttribute("aria-label", "Aproximar a animação");
    bar.append(zoomOut, zoomIn);

    const controls = button("☰ Controles", "", () => q(root, profile.controls)?.click());
    controls.setAttribute("aria-expanded", "false");
    controls.dataset.labStandardControls = "true";
    bar.append(controls);

    const exit = button("Sair da tela cheia", "lab-standard-exit", () => {
      if (document.fullscreenElement) document.exitFullscreen();
    });
    bar.append(exit);
    configureExtras(profile, bar);
    root.insertBefore(bar, root.firstChild);
    return { bar, profile, owned: true, play, time, choose, form, controls };
  }

  function zoom(profile, factor) {
    const selector = factor > 1 ? profile.zoomIn : profile.zoomOut;
    const source = selector ? q(profile.root, selector) : null;
    if (source) source.click();
    else if (profile.zoomEvent) window.dispatchEvent(new CustomEvent("diario-lab-zoom", { detail: { factor } }));
  }

  let current = null;
  let timer = 0;
  function update() {
    if (!current) return;
    const { profile, bar } = current;
    const source = q(profile.root, profile.play);
    const running = playIsRunning(profile);
    if (current.play) {
      let label = running ? "Pausar" : "Continuar";
      if (profile.kind === "magnet") label = running ? "Pausar" : "Continuar";
      else if (!running && source?.textContent.trim().toLowerCase() === "iniciar") label = "Iniciar";
      setCommonButtonState(current.play, label, running);
      current.play.disabled = source?.disabled || false;
    }
    if (current.time) {
      const readout = q(profile.root, profile.time);
      const text = readout?.textContent.trim();
      if (text) current.time.textContent = profile.kind === "faraday" ? "t = " + text : text;
      else if (profile.kind === "magnet") current.time.textContent = "Interação magnética";
      else current.time.textContent = "—";
    }
    if (current.choose) {
      const range = profile.seek ? q(profile.root, profile.seek) : null;
      let available = !!range && !range.disabled && Number(range.max) > Number(range.min);
      if (profile.kind === "priority") available = Number(profile.root.dataset.simulationDuration) > 0;
      if (profile.kind === "faraday") available = Number(byId("faraday-frequency")?.value) > 0;
      if (profile.kind === "freefall") available = Number(profile.root.dataset.simulationDuration) > 0;
      current.choose.disabled = !available;
      current.choose.title = available ? "Escolher instante da animação" : "Este experimento não oferece uma linha do tempo ajustável.";
    }
    if (current.controls) {
      const sourceControls = q(profile.root, profile.controls);
      const expanded = attr(sourceControls, "aria-expanded") === "true";
      setCommonButtonState(current.controls, expanded ? "Fechar controles" : "☰ Controles", expanded);
    }
    if (profile.extraButton && profile.extraSource) {
      const active = attr(profile.extraSource, "aria-pressed") === "true";
      let label = profile.extraLabel || profile.extraSource.textContent.trim();
      if (profile.kind === "magnet") label = active ? "Parar movimento do ímã" : "Simular movimento do ímã livre";
      if (profile.kind === "workspace") label = profile.extraSource.textContent.trim();
      setCommonButtonState(profile.extraButton, label, active);
    }
    bar.querySelectorAll("[data-mode-source]").forEach((node) => {
      const active = attr(q(profile.root, '[data-mode="' + node.dataset.modeSource + '"]'), "aria-pressed") === "true";
      node.setAttribute("aria-pressed", String(active));
    });
  }

  function onFullscreenChange() {
    if (timer) { clearInterval(timer); timer = 0; }
    if (current?.owned) current.bar.remove();
    if (current) current.profile.root.classList.remove("lab-standard-fullscreen-active");
    current = null;
    const root = document.fullscreenElement;
    if (!root) return;
    const profile = findProfile(root);
    if (!profile) return;
    current = mount(root, profile);
    update();
    timer = window.setInterval(update, 180);
  }

  document.addEventListener("fullscreenchange", onFullscreenChange);
  window.addEventListener("diario-lab-fullscreen-refresh", update);
})();