(() => {
  "use strict";

  const STYLE = `
    .lab-standard-fullscreen-toolbar {
      box-sizing: border-box; z-index: 110; display: flex; flex-wrap: wrap; align-items: center;
      gap: 8px; padding: 8px 10px; border: 1px solid rgba(228,196,119,.72); border-radius: 12px;
      background: rgba(7,15,29,.96); color: #f3f5fb; box-shadow: 0 8px 28px rgba(0,0,0,.24);
      font: 500 14px/1.2 system-ui, sans-serif; pointer-events: auto;
      max-height: min(34dvh, 190px); overflow-y: auto; overscroll-behavior: contain; align-content: flex-start;
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
    .lab-standard-fullscreen-toolbar > .lab-standard-panel-button { border-color: rgba(129,179,255,.62); }
    .lab-standard-fullscreen-toolbar > .lab-standard-panel-button[aria-pressed="true"] { background:#1c3550; border-color:#e4c477; }
    .lab-standard-fullscreen-active .lab-standard-source-control { display:none!important; }
    .lab-standard-fullscreen-toolbar .magnet-action-menu { position:relative; flex:0 0 auto; z-index:3; }
    .lab-standard-fullscreen-toolbar .magnet-scene-actions { position:fixed; top:70px; right:12px; max-height:calc(100dvh - 82px); }
    #lab-workspace.lab-standard-fullscreen-active > .lab-standard-fullscreen-toolbar {
      position: relative; inset: auto; flex: 0 0 auto; align-self: stretch; margin: 0 0 7px;
    }
    .lab-standard-fullscreen-active:not(#lab-workspace) > .lab-standard-fullscreen-toolbar {
      position: absolute; top: 10px; left: 10px; right: 10px;
    }
    .lab-standard-fullscreen-active:not(.lab-standard-controls-collapsed) #mru-fullscreen-tools,
    .lab-standard-fullscreen-active:not(.lab-standard-controls-collapsed) #mruv-fullscreen-tools { display: flex !important; }
    .lab-standard-fullscreen-active #workspace-fullscreen,
    .lab-standard-fullscreen-active #workspace-controls-toggle,
    .lab-standard-fullscreen-active #workspace-play,
    .lab-standard-fullscreen-active #mirror-mode-toggle,
    .lab-standard-fullscreen-active #mru-fullscreen-menu,
    .lab-standard-fullscreen-active #mruv-fullscreen-menu,
    .lab-standard-fullscreen-active #fullscreen-menu-toggle { display:none!important; }
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
      .lab-standard-fullscreen-toolbar { gap: 5px; padding: 6px; max-height:min(38dvh,220px); }
      .lab-standard-fullscreen-toolbar > button { min-height: 38px; padding: 7px 9px; font-size: 12px; }
      .lab-standard-fullscreen-toolbar > .lab-standard-time { min-height: 38px; padding: 7px 10px; font-size: 12px; }
      .lab-standard-fullscreen-active:not(#lab-workspace) > .lab-standard-fullscreen-toolbar { top: 7px; left: 7px; right: 7px; }
    }

    .lab-standard-collapse-button { margin-left:auto; border-color:rgba(129,179,255,.72)!important; }
    .lab-standard-fullscreen-handle {
      position:fixed; top:max(10px,env(safe-area-inset-top)); right:max(12px,env(safe-area-inset-right));
      z-index:10050; display:none; align-items:center; justify-content:center; gap:8px;
      min-width:48px; min-height:48px; padding:10px 14px; border:1px solid rgba(228,196,119,.82);
      border-radius:999px; background:rgba(7,15,29,.97); color:#f4f5fa; box-shadow:0 8px 24px rgba(0,0,0,.38);
      font:700 13px/1.1 system-ui,sans-serif; cursor:grab; touch-action:none; user-select:none;
    }
    .lab-standard-fullscreen-handle:active { cursor:grabbing; }
    .lab-standard-fullscreen-active.lab-standard-controls-collapsed .lab-standard-fullscreen-toolbar { display:none!important; }
    .lab-standard-fullscreen-active.lab-standard-controls-collapsed .lab-standard-fullscreen-handle { display:inline-flex; }
    .lab-infinite-grid-overlay {
      position:fixed; inset:0; z-index:2; pointer-events:none; opacity:.32; mix-blend-mode:screen;
      background-image:
        linear-gradient(to right,rgba(164,188,220,.18) 1px,transparent 1px),
        linear-gradient(to bottom,rgba(164,188,220,.18) 1px,transparent 1px),
        linear-gradient(to right,rgba(164,188,220,.09) 1px,transparent 1px),
        linear-gradient(to bottom,rgba(164,188,220,.09) 1px,transparent 1px);
      background-size:128px 128px,128px 128px,32px 32px,32px 32px;
      background-position:center center;
    }
    .lab-infinite-grid-overlay[hidden] { display:none!important; }
    @media (max-width: 680px) {
      .lab-standard-fullscreen-handle { min-height:46px; min-width:46px; padding:9px 12px; font-size:12px; }
      .lab-standard-collapse-button { margin-left:0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .lab-standard-fullscreen-toolbar { transition:none!important; }
    }

    .lab-standard-object-palette-toggle { border-color:rgba(129,179,255,.72)!important; }
    .lab-standard-pan-toggle { border-color:rgba(129,179,255,.72)!important; }
    .lab-standard-pan-toggle[aria-pressed="true"] { background:#1c3550!important; border-color:#e4c477!important; }
    .lab-view-pan-mode,.magnet-view-pan-mode { cursor:grab!important; }
    .is-view-dragging,.magnet-view-panning { cursor:grabbing!important; }
    .lab-object-palette {
      position:fixed; top:76px; right:12px; z-index:10040; box-sizing:border-box;
      width:min(320px,calc(100vw - 24px)); max-height:calc(100dvh - 88px); overflow:auto;
      padding:14px; border:1px solid rgba(228,196,119,.72); border-radius:14px;
      background:rgba(7,15,29,.98); color:#f3f5fb; box-shadow:0 18px 50px rgba(0,0,0,.46);
      font:500 13px/1.45 system-ui,sans-serif; overscroll-behavior:contain;
    }
    .lab-object-palette[hidden] { display:none!important; }
    .lab-object-palette-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .lab-object-palette-heading strong { font-size:15px; }
    .lab-object-palette-heading button,
    .lab-object-palette-item {
      min-height:44px; border:1px solid rgba(206,218,240,.22); border-radius:9px;
      background:#111c2d; color:#f4f5fa; font:inherit; cursor:pointer;
    }
    .lab-object-palette-heading button { width:42px; font-size:20px; }
    .lab-object-palette-note { margin:9px 0 12px; color:#aab8cc; font-size:12px; }
    .lab-object-palette-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .lab-object-palette-item { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:9px 5px; text-align:center; touch-action:none; }
    .lab-object-palette-item:hover,.lab-object-palette-item:focus-visible { border-color:#e4c477; background:#1b2a40; }
    .lab-object-palette-item svg,.lab-object-preview svg { display:block; width:35px; height:27px; }
    .lab-object-palette-hint { margin:10px 0 0; color:#8292aa; font-size:10px; }
    .lab-object-drag-preview { position:fixed; z-index:10060; display:grid; place-items:center; width:58px; height:50px; border:1px solid #e4c477; border-radius:10px; background:rgba(8,16,31,.9); pointer-events:none; transform:translate(-50%,-50%); }
    .lab-object-palette button:focus-visible { outline:2px solid #f0cc79; outline-offset:2px; }
    @media (max-width: 680px) {
      .lab-object-palette { top:70px; right:8px; width:min(310px,calc(100vw - 16px)); max-height:calc(100dvh - 78px); }
      .lab-object-palette-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
  `;

  const style = document.createElement("style");
  style.dataset.labFullscreenToolbar = "true";
  style.textContent = STYLE;
  document.head.append(style);

  const simulationWindowMode = new URLSearchParams(window.location.search).get("janela") === "simulacao";
  if (simulationWindowMode) {
    const path = window.location.pathname.toLowerCase();
    const topic = new URLSearchParams(window.location.search).get("topico") || "";
    let kind = "workspace";
    if (path.includes("laboratorio-mruv")) kind = "mruv";
    else if (path.includes("laboratorio-mru")) kind = "mru";
    else if (path.includes("laboratorio-magnetismo")) kind = "magnet";
    else if (path.includes("laboratorio-queda-livre")) kind = "freefall";
    else if (path.includes("laboratorio-faraday")) kind = "faraday";
    else if (path.includes("laboratorio-experimento") && topic.startsWith("lab-")) kind = "topic";
    document.documentElement.dataset.labSimulationWindow = "true";
    document.documentElement.dataset.labSimulationKind = kind;
    const presentationStyles = document.createElement("link");
    presentationStyles.rel = "stylesheet";
    presentationStyles.href = "/laboratorio-apresentacao.css?v=fullscreen-lab-window-20261028-1";
    document.head.append(presentationStyles);
  }

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
      controls: "#mru-fullscreen-menu", drawer: "#mru-fullscreen-drawer", objectEditor: "#mru-editor-details",
      parameterTarget: "#mru-properties", objectTarget: "#mru-add-type", objectFocus: "#mru-add-type", timeToggle: "#mru-fullscreen-time-toggle",
      timePicker: "#mru-fullscreen-time-picker", zoomIn: "#mru-fullscreen-zoom-in",
      zoomOut: "#mru-fullscreen-zoom-out", exit: "#mru-fullscreen-exit", extra: "#mru-step-forward",
      extraLabel: "Avançar passo", bar: "#mru-fullscreen-tools"
    },
    {
      selector: ".mruv-stage", kind: "mruv", play: "#mruv-fullscreen-play", time: "#mruv-fullscreen-time",
      controls: "#mruv-fullscreen-menu", drawer: "#mruv-fullscreen-drawer", objectEditor: "#mruv-editor-details",
      parameterTarget: "#mruv-properties", objectTarget: "#mruv-add-type", objectFocus: "#mruv-add-type", timeToggle: "#mruv-fullscreen-time-toggle",
      timePicker: "#mruv-fullscreen-time-picker", zoomIn: "#mruv-fullscreen-zoom-in",
      zoomOut: "#mruv-fullscreen-zoom-out", exit: "#mruv-fullscreen-exit", extra: "#mruv-step-forward",
      extraLabel: "Avançar passo", bar: "#mruv-fullscreen-tools"
    },
    {
      selector: ".magnet-workspace", kind: "magnet", play: "#simulation-pause", controls: "#fullscreen-menu-toggle",
      objects: "#action-menu-toggle", objectMenu: ".magnet-action-menu", objectInToolbar: true,
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

  function setPanelView(profile, view) {
    const sharedDrawer = Boolean(profile.objectEditor && profile.drawer);
    const source = q(profile.root, sharedDrawer || view === "parameters" ? profile.controls : profile.objects);
    if (!source) return;

    if (sharedDrawer) {
      const isOpen = attr(source, "aria-expanded") === "true";
      if (current.panelView === view && isOpen) {
        source.click();
        current.panelView = null;
        update();
        return;
      }
      if (!isOpen) source.click();
      current.panelView = view;
      focusPanelSection(profile, view);
      update();
      return;
    }

    source.click();
    current.panelView = attr(source, "aria-expanded") === "true" ? view : null;
    update();
  }

  function focusPanelSection(profile, view) {
    const editor = q(profile.root, profile.objectEditor);
    if (editor) editor.open = true;
    const selector = view === "objects" ? profile.objectTarget : profile.parameterTarget;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = q(profile.root, selector);
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
      const focusTarget = view === "objects"
        ? q(profile.root, profile.objectFocus)
        : target?.querySelector("input, select, textarea, button");
      focusTarget?.focus({ preventScroll: true });
    }));
  }

  function configurePanelButtons(profile, bar) {
    let parameters = bar.querySelector('[data-lab-panel-button="parameters"]');
    if (!parameters) {
      parameters = button("Parâmetros", "lab-standard-panel-button", () => setPanelView(profile, "parameters"));
      parameters.dataset.labPanelButton = "parameters";
      parameters.setAttribute("aria-expanded", "false");
      parameters.setAttribute("aria-pressed", "false");
      const controlsId = profile.drawer || attr(q(profile.root, profile.controls), "aria-controls");
      if (controlsId) parameters.setAttribute("aria-controls", controlsId.replace(/^#/, ""));
      const exit = bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit");
      bar.insertBefore(parameters, exit || null);
    }

    let objects = null;
    if (profile.objectEditor) {
      objects = bar.querySelector('[data-lab-panel-button="objects"]');
      if (!objects) {
        objects = button("Objetos", "lab-standard-panel-button", () => setPanelView(profile, "objects"));
        objects.dataset.labPanelButton = "objects";
        objects.setAttribute("aria-expanded", "false");
        objects.setAttribute("aria-pressed", "false");
        if (profile.drawer) objects.setAttribute("aria-controls", profile.drawer.replace(/^#/, ""));
        const exit = bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit");
        bar.insertBefore(objects, exit || null);
      }
    } else if (profile.objectInToolbar) {
      objects = q(profile.root, profile.objects);
      if (objects) {
        objects.classList.add("lab-standard-object-source");
        objects.setAttribute("aria-label", "Abrir controles para adicionar ou remover objetos");
      }
    }

    if (profile.bar) q(profile.root, profile.controls)?.classList.add("lab-standard-source-control");
    return { parameters, objects };
  }

  function dockObjectMenu(profile, bar) {
    if (!profile.objectMenu) return null;
    const node = q(profile.root, profile.objectMenu);
    if (!node || bar.contains(node)) return null;
    const panel = q(profile.root, "#action-menu-panel");
    const location = {
      node, parent: node.parentNode, next: node.nextSibling,
      panel, panelStyle: panel?.getAttribute("style")
    };
    const exit = bar.querySelector(".lab-standard-exit");
    bar.insertBefore(node, exit || null);
    return location;
  }

  function syncDrawerPosition(currentState) {
    const { profile, bar } = currentState;
    const rootRect = profile.root.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    if (profile.drawer) {
      const drawer = q(profile.root, profile.drawer);
      if (drawer && !drawer.hidden) drawer.style.top = Math.max(58, Math.ceil(barRect.bottom - rootRect.top + 10)) + "px";
    }
    const menu = currentState.movedObjectMenu;
    if (menu?.panel && !menu.panel.hidden) {
      const top = Math.min(Math.ceil(barRect.bottom + 8), Math.max(58, window.innerHeight - 150));
      menu.panel.style.position = "fixed";
      menu.panel.style.top = top + "px";
      menu.panel.style.right = "12px";
      menu.panel.style.maxHeight = Math.max(120, window.innerHeight - top - 12) + "px";
    }
  }


  function findGridControl(root) {
    const controls = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    return controls.find((input) => {
      const labels = Array.from(input.labels || []).map((label) => label.textContent || "").join(" ");
      const searchable = [input.id, input.name, input.getAttribute("aria-label"), labels].join(" ");
      return /grid|grade|quadriculado/i.test(searchable) && (!root || root.contains(input) || input.id === "mru-show-grid" || input.id === "mruv-show-grid");
    }) || null;
  }

  function closeFullscreenPanels(state) {
    const selectors = [state.profile.controls, state.profile.objects].filter(Boolean);
    const seen = new Set();
    selectors.forEach((selector) => {
      const source = q(state.root, selector);
      if (source && !seen.has(source) && attr(source, "aria-expanded") === "true") {
        seen.add(source);
        source.click();
      }
    });
    const picker = state.bar.querySelector(".lab-standard-fullscreen-time-picker:not([hidden])");
    picker?.querySelector(".lab-standard-picker-close")?.click();
    if (state.objectPalette && !state.objectPalette.hidden) {
      state.objectPalette.hidden = true;
      state.objectPaletteToggle.setAttribute("aria-expanded", "false");
    }
  }

  function setFullscreenControlsCollapsed(state, collapsed) {
    if (!state || state.root.classList.contains("lab-standard-controls-collapsed") === collapsed) return;
    if (collapsed) closeFullscreenPanels(state);
    state.root.classList.toggle("lab-standard-controls-collapsed", collapsed);
    state.bar.toggleAttribute("inert", collapsed);
    if (collapsed) state.bar.setAttribute("aria-hidden", "true");
    else state.bar.removeAttribute("aria-hidden");
    state.collapseToggle.setAttribute("aria-expanded", String(!collapsed));
    state.collapseToggle.textContent = collapsed ? "☰ Mostrar opções" : "☰ Ocultar opções";
    if (collapsed && state.objectPalette && !state.objectPalette.hidden) {
      state.objectPalette.hidden = true;
      state.objectPaletteToggle.setAttribute("aria-expanded", "false");
    }
    state.handle.setAttribute("aria-expanded", String(!collapsed));
    state.handle.setAttribute("aria-label", collapsed ? "Mostrar controles do laboratório. Puxe para baixo ou toque." : "Recolher controles do laboratório");
    if (collapsed) state.handle.focus({ preventScroll: true });
    else state.collapseToggle.focus({ preventScroll: true });
  }

  function attachFullscreenOptions(root, profile, bar) {
    const exit = bar.querySelector(".lab-standard-exit, #mru-fullscreen-exit, #mruv-fullscreen-exit");
    const objectPaletteToggle = document.createElement("button");
    objectPaletteToggle.type = "button";
    objectPaletteToggle.hidden = paletteItems(profile).length === 0;
    objectPaletteToggle.className = "lab-standard-object-palette-toggle";
    objectPaletteToggle.textContent = "Objetos";
    objectPaletteToggle.setAttribute("aria-expanded", "false");
    objectPaletteToggle.setAttribute("aria-label", "Abrir a bandeja de objetos");
    const panToggle = document.createElement("button");
    panToggle.type = "button";
    panToggle.className = "lab-standard-pan-toggle";
    panToggle.textContent = "Mover vista";
    panToggle.setAttribute("aria-pressed", "false");
    panToggle.setAttribute("aria-label", "Ativar movimento livre da vista");
    const scene = labScene(profile, root);
    const panClass = profile.kind === "magnet" ? "magnet-view-pan-mode" : "lab-view-pan-mode";
    const panSource = () => q(root, profile.kind === "magnet" ? ".magnet-view-pan-toggle" : ".lab-view-pan-toggle");
    const isPanEnabled = () => {
      const source = panSource();
      return source ? attr(source, "aria-pressed") === "true" : Boolean(scene?.classList.contains(panClass));
    };
    const setPanEnabled = (enabled) => {
      const source = panSource();
      if (source) {
        if ((attr(source, "aria-pressed") === "true") !== enabled) source.click();
      } else {
        scene?.classList.toggle(panClass, enabled);
      }
      panToggle.setAttribute("aria-pressed", String(enabled));
      panToggle.textContent = enabled ? "Mover vista: ligado" : "Mover vista";
      panToggle.setAttribute("aria-label", enabled ? "Desativar movimento livre da vista" : "Ativar movimento livre da vista");
      window.dispatchEvent(new CustomEvent("diario-lab-pan-mode", { detail: { labKind: profile.kind, active: enabled } }));
    };
    panToggle.addEventListener("click", () => setPanEnabled(!isPanEnabled()));
    const collapseToggle = document.createElement("button");
    collapseToggle.type = "button";
    collapseToggle.className = "lab-standard-collapse-button";
    collapseToggle.textContent = "☰ Ocultar opções";
    collapseToggle.dataset.labFullscreenCollapse = "true";
    collapseToggle.setAttribute("aria-expanded", "true");
    if (!bar.id) bar.id = "lab-fullscreen-toolbar-" + profile.kind;
    collapseToggle.setAttribute("aria-controls", bar.id);
    bar.insertBefore(collapseToggle, exit || null);
    bar.insertBefore(objectPaletteToggle, collapseToggle);
    bar.insertBefore(panToggle, objectPaletteToggle);
    const panWasEnabled = isPanEnabled();
    setPanEnabled(panWasEnabled);

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "lab-standard-fullscreen-handle";
    handle.textContent = "☰ Opções";
    handle.setAttribute("aria-expanded", "false");
    handle.setAttribute("aria-label", "Mostrar controles do laboratório. Puxe para baixo ou toque.");
    handle.title = "Puxe para baixo ou toque para mostrar as opções";

    const overlay = document.createElement("div");
    overlay.className = "lab-infinite-grid-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const gridControl = findGridControl(root);
    const topic = new URLSearchParams(location.search).get("topico") || "";
    const sceneDrawsItsOwnGrid = profile.kind === "workspace" && topic.startsWith("optics-");
    const onGridChange = () => { overlay.hidden = sceneDrawsItsOwnGrid || Boolean(gridControl && !gridControl.checked); };
    if (gridControl) {
      gridControl.addEventListener("change", onGridChange);
      onGridChange();
    }

    const state = { root, profile, bar, collapseToggle, objectPaletteToggle, panToggle, setPanEnabled, isPanEnabled, panWasEnabled, handle, overlay, gridControl, onGridChange };
    collapseToggle.addEventListener("click", () => setFullscreenControlsCollapsed(state, true));
    let startY = null;
    let ignoreNextClick = false;
    handle.addEventListener("pointerdown", (event) => {
      if (event.isPrimary === false) return;
      startY = event.clientY;
      try { handle.setPointerCapture(event.pointerId); } catch {}
    });
    handle.addEventListener("pointerup", (event) => {
      if (startY === null) return;
      const pullDistance = event.clientY - startY;
      startY = null;
      if (pullDistance > 24) {
        ignoreNextClick = true;
        setFullscreenControlsCollapsed(state, false);
        window.setTimeout(() => { ignoreNextClick = false; }, 0);
      }
    });
    handle.addEventListener("pointercancel", () => { startY = null; });
    handle.addEventListener("click", (event) => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        event.preventDefault();
        return;
      }
      setFullscreenControlsCollapsed(state, !root.classList.contains("lab-standard-controls-collapsed"));
    });

    root.insertBefore(overlay, root.firstChild);
    root.append(handle);
    installObjectPalette(state);
    return state;
  }


  function labScene(profile, root) {
    const selector = {
      workspace: "#workspace-canvas",
      priority: "#lab-scene",
      mru: "svg",
      mruv: "svg",
      magnet: "#magnet-canvas",
      faraday: "#faraday-scene",
      freefall: "#freefall-scene"
    }[profile.kind];
    return selector ? q(root, selector) : null;
  }

  function paletteItems(profile) {
    if (profile.kind === "mru" || profile.kind === "mruv") {
      const select = byId(profile.kind + "-add-type");
      if (!select?.options?.length) return [];
      return Array.from(select.options).filter((option) => !option.disabled).map((option) => ({
        kind: option.value,
        label: option.textContent.trim(),
        icon: /carrinho|cart/i.test(option.textContent) ? "cart" : /bola|esfera/i.test(option.textContent) ? "sphere" : "block",
        physical: true
      }));
    }
    if (profile.kind === "magnet") return [
      { kind: "metal-ball", label: "Esfera de metal", icon: "sphere", physical: true },
      { kind: "compass", label: "Bússola", icon: "compass", physical: true },
      { kind: "permanent-magnet", label: "Ímã permanente", icon: "magnet", physical: true },
      { kind: "coil", label: "Bobina", icon: "coil", physical: true }
    ];
    return [];
  }

  function objectIcon(kind) {
    if (kind === "sphere" || kind === "metal-ball") {
      return '<svg viewBox="0 0 48 36" aria-hidden="true"><circle cx="24" cy="18" r="13" fill="#c99f51" stroke="#f6d792" stroke-width="1.5"/><circle cx="19" cy="13" r="3.5" fill="#fff3c4" opacity=".8"/></svg>';
    }
    if (kind === "cart" || /cart/i.test(kind)) {
      return '<svg viewBox="0 0 48 36" aria-hidden="true"><path d="M7 23h34l-4-11H15l-3-4H6" fill="none" stroke="#d6b87a" stroke-width="3" stroke-linecap="round"/><rect x="13" y="13" width="25" height="10" rx="2" fill="#4f86d9" stroke="#a9c7ff"/><circle cx="19" cy="27" r="3.5" fill="#111c2d" stroke="#d6b87a" stroke-width="2"/><circle cx="33" cy="27" r="3.5" fill="#111c2d" stroke="#d6b87a" stroke-width="2"/></svg>';
    }
    if (kind === "compass") return '<svg viewBox="0 0 48 36" aria-hidden="true"><circle cx="24" cy="18" r="13" fill="#13233b" stroke="#d6b87a" stroke-width="2"/><path d="m28 11-3 8-6 6 3-8z" fill="#f26c6c" stroke="#ffe1a3" stroke-width="1"/></svg>';
    if (kind === "magnet" || kind === "permanent-magnet") return '<svg viewBox="0 0 48 36" aria-hidden="true"><path d="M12 7v12a12 12 0 0 0 24 0V7" fill="none" stroke="#4f86d9" stroke-width="8"/><path d="M12 7v7m24-7v7" stroke="#f0cc79" stroke-width="8"/></svg>';
    if (kind === "coil") return '<svg viewBox="0 0 48 36" aria-hidden="true"><path d="M5 18h6c0-13 8-13 8 0s8 13 8 0 8-13 8 0 8 13 8 0h2" fill="none" stroke="#d6b87a" stroke-width="3"/><path d="M8 8v20m32-20v20" stroke="#9bb1cf" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 48 36" aria-hidden="true"><rect x="9" y="7" width="30" height="22" rx="3" fill="#304665" stroke="#d6b87a" stroke-width="2"/></svg>';
  }

  function addPaletteItemAt(state, item, clientX, clientY) {
    const rect = state.scene?.getBoundingClientRect();
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return false;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
    window.dispatchEvent(new CustomEvent("diario-lab-object-drop", {
      detail: { labKind: state.profile.kind, kind: item.kind, clientX, clientY }
    }));
    return true;
  }

  function installObjectPalette(state) {
    state.scene = labScene(state.profile, state.root);
    const toggle = state.objectPaletteToggle;
    const items = paletteItems(state.profile);
    if (!toggle || !items.length || !state.scene) {
      if (toggle) toggle.hidden = true;
      return;
    }

    const panel = document.createElement("section");
    panel.className = "lab-object-palette";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Bandeja de objetos físicos do laboratório");
    const heading = document.createElement("div");
    heading.className = "lab-object-palette-heading";
    const title = document.createElement("strong");
    title.textContent = "Adicionar objetos à simulação";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Fechar bandeja de objetos");
    heading.append(title, close);
    const note = document.createElement("p");
    note.className = "lab-object-palette-note";
    note.textContent = state.profile.kind === "magnet"
      ? "Cada item inserido participa do modelo magnético e pode ser movido na cena. Ímãs adicionais alteram o campo calculado."
      : "Cada item inserido é criado pelo modelo de movimento e pode ser editado ou removido nos controles do laboratório.";
    const grid = document.createElement("div");
    grid.className = "lab-object-palette-grid";

    items.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "lab-object-palette-item";
      card.setAttribute("aria-label", "Arrastar ou adicionar " + item.label);
      const preview = document.createElement("span");
      preview.className = "lab-object-preview";
      preview.innerHTML = objectIcon(item.icon);
      const label = document.createElement("span");
      label.textContent = item.label;
      card.append(preview, label);
      let pointer = null;
      let ghost = null;
      let dragged = false;
      let suppressClick = false;
      const movePreview = (event) => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const distance = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
        if (!dragged && distance >= 8) {
          dragged = true;
          ghost = document.createElement("div");
          ghost.className = "lab-object-drag-preview";
          ghost.innerHTML = objectIcon(item.icon);
          state.root.append(ghost);
          state.dragPreview = ghost;
        }
        if (ghost) {
          ghost.style.left = event.clientX + "px";
          ghost.style.top = event.clientY + "px";
        }
      };
      const finishPreview = (event) => {
        if (!pointer || pointer.id !== event.pointerId) return;
        if (dragged) {
          suppressClick = true;
          addPaletteItemAt(state, item, event.clientX, event.clientY);
          window.setTimeout(() => { suppressClick = false; }, 0);
        }
        pointer = null;
        if (ghost) ghost.remove();
        ghost = null;
        state.dragPreview = null;
      };
      card.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
        dragged = false;
        try { card.setPointerCapture(event.pointerId); } catch {}
      });
      card.addEventListener("pointermove", movePreview);
      card.addEventListener("pointerup", finishPreview);
      card.addEventListener("pointercancel", finishPreview);
      card.addEventListener("click", (event) => {
        if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
        const rect = state.scene.getBoundingClientRect();
        addPaletteItemAt(state, item, rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
      grid.append(card);
    });
    const hint = document.createElement("p");
    hint.className = "lab-object-palette-hint";
    hint.textContent = "Arraste um objeto para escolher onde colocá-lo ou clique para adicioná-lo ao centro da cena. Use os controles do experimento para removê-lo.";
    panel.append(heading, note, grid, hint);
    close.addEventListener("click", () => { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); });
    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) panel.querySelector(".lab-object-palette-item")?.focus();
    });
    state.objectPalette = panel;
    state.root.append(panel);
  }

  function mount(root, profile) {
    profile.root = root;
    root.classList.add("lab-standard-fullscreen-active");
    let bar = profile.bar ? q(root, profile.bar) : null;
    if (bar) {
      bar.classList.add("lab-standard-fullscreen-toolbar");
      if (!bar.querySelector("[data-lab-standard-extra]")) configureExtras(profile, bar);
      const panels = configurePanelButtons(profile, bar);
      const fullscreenOptions = attachFullscreenOptions(root, profile, bar);
      return { bar, profile, owned: false, ...panels, ...fullscreenOptions };
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

    const exit = button("Sair da tela cheia", "lab-standard-exit", () => {
      if (document.fullscreenElement) document.exitFullscreen();
    });
    bar.append(exit);
    configureExtras(profile, bar);
    const panels = configurePanelButtons(profile, bar);
    root.insertBefore(bar, root.firstChild);
    const movedObjectMenu = dockObjectMenu(profile, bar);
    const fullscreenOptions = attachFullscreenOptions(root, profile, bar);
    return { bar, profile, owned: true, play, time, choose, form, ...panels, movedObjectMenu, ...fullscreenOptions };
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
    const sourceControls = q(profile.root, profile.controls);
    const controlsExpanded = attr(sourceControls, "aria-expanded") === "true";
    if (current.parameters) {
      const active = profile.objectEditor
        ? controlsExpanded && current.panelView === "parameters"
        : controlsExpanded;
      setCommonButtonState(current.parameters, active ? "Fechar parâmetros" : "Parâmetros", active);
      current.parameters.setAttribute("aria-expanded", String(active));
    }
    if (current.objects) {
      const objectExpanded = profile.objectEditor
        ? controlsExpanded && current.panelView === "objects"
        : attr(current.objects, "aria-expanded") === "true";
      setCommonButtonState(current.objects, objectExpanded ? "Fechar objetos" : "Objetos", objectExpanded);
      if (profile.objectEditor) current.objects.setAttribute("aria-expanded", String(objectExpanded));
    }
    syncDrawerPosition(current);
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
    if (current?.movedObjectMenu?.parent) {
      const { node, parent, next, panel, panelStyle } = current.movedObjectMenu;
      parent.insertBefore(node, next?.parentNode === parent ? next : null);
      if (panel) {
        if (panelStyle === null) panel.removeAttribute("style");
        else panel.setAttribute("style", panelStyle);
      }
    }
    if (current?.profile.drawer) {
      const drawer = q(current.profile.root, current.profile.drawer);
      if (drawer) drawer.style.top = "";
    }
    if (current) {
      current.gridControl?.removeEventListener("change", current.onGridChange);
      current.handle.remove();
      current.overlay.remove();
      current.collapseToggle.remove();
      current.objectPaletteToggle.remove();
      current.objectPalette?.remove();
      current.dragPreview?.remove();
      current.bar.toggleAttribute("inert", false);
      current.bar.removeAttribute("aria-hidden");
      current.profile.root.classList.remove("lab-standard-controls-collapsed");
    }
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
  window.addEventListener("resize", () => { if (current) { syncDrawerPosition(current); } });
})();