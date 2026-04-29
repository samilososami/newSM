import * as Blockly from "blockly";
import "blockly/blocks";
import { createIcons, icons } from "lucide";
import "./style.css";
import {
  buildMicroPythonCode,
  buildToolbox,
  defineSteamBlocks,
  loadStarterWorkspace,
  BLOCK_RESEARCH_SUMMARY,
  AVAILABLE_BLOCK_TYPES,
} from "./steamBlocks.js";
import { MicroPythonSerial } from "./serial.js";
import { autoExtractMemory, buildMemoryContext, memoryGet } from "./memory.js";

const STORAGE_KEY = "new-steammakers:workspace:v2";
const LEGACY_STORAGE_KEY = "new-steammakers:workspace:v1";
const SAVE_DELAY = 250;

const DEFAULT_SETTINGS = {
  theme: "light",
  visualMode: "standard",
  soundMuted: false,
  soundVolume: 0.35,
  ollamaApiKey: "",
  ollamaModel: "gpt-oss:120b-cloud",
  ollamaEndpoint: "https://ollama.com/v1",
};

const SAMI_AUTH_BASE = "https://auth.samilososami.com";
const SAMI_CLIENT_ID = import.meta.env.VITE_SAMI_CLIENT_ID || "newsm";
const SAMI_SESSION_KEY = "new-steammakers:sami-session:v1";
const SAMI_VISITOR_KEY = "new-steammakers:sami-visitor:v1";
const SAMI_STATE_KEY = "new-steammakers:sami-oauth-state:v1";
const SAMI_FULL_MARK = "https://id.samilososami.com/brand/sami-id-full.png";
const SAMI_ICON_MARK = "https://id.samilososami.com/brand/sami-id-icon.png";

let workspace;
let saveTimer;
let activeTab = "blocks";
let drawerOpen = false;
let drawerTab = "settings";
let generatedCode = "";
let manualCode = "";
let codeMode = "blocks";
let settings = { ...DEFAULT_SETTINGS };
let lastBlockSound = 0;
let progressValue = 0;
let progressTimer;
let aiOpen = false;
let aiHistory = [];
let aiTyping = false;
let aiApplyingBlocks = false;
let svgResizeTimer;
let samiSession = loadSamiSession();
let visitorMode = localStorage.getItem(SAMI_VISITOR_KEY) === "1";
let authGateError = "";

function scheduleSvgResize() {
  clearTimeout(svgResizeTimer);
  svgResizeTimer = window.setTimeout(() => {
    if (workspace) Blockly.svgResize(workspace);
  }, settings.visualMode === "detailed" ? 80 : 30);
}

const serial = new MicroPythonSerial();
const app = document.querySelector("#app");

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div class="brand">
        <button class="brand-mark" id="drawerButton" type="button" title="Ajustes">
          <i data-lucide="sliders-horizontal"></i>
        </button>
        <div>
          <strong>NEW STEAMMAKERS</strong>
          <span>ESP32 Plus STEAMakers · MicroPython</span>
        </div>
      </div>

      <div class="tabbar" role="tablist" aria-label="Vistas">
        <button class="tab-button is-active" data-tab="blocks" type="button"><i data-lucide="blocks"></i><span>Bloques</span></button>
        <button class="tab-button" data-tab="code" type="button"><i data-lucide="code-2"></i><span>Código</span></button>
        <button class="tab-button" data-tab="console" type="button"><i data-lucide="terminal"></i><span>Consola</span></button>
      </div>

      <div class="top-actions">
        <div class="run-group" role="group" aria-label="Ejecutar">
          <button class="run-btn-sm" id="runButton" type="button" title="Ejecutar en RAM (sin guardar)"><i data-lucide="play"></i></button>
          <button class="save-btn-sm" id="saveRunButton" type="button" title="Guardar main.py y ejecutar"><i data-lucide="hard-drive-upload"></i></button>
          <button class="stop-btn-sm" id="stopButton" type="button" title="Parar script en la placa"><i data-lucide="square"></i></button>
        </div>
        <div class="undo-group" role="group" aria-label="Historial">
          <button class="topbar-icon-btn" id="undoButton" type="button" title="Deshacer (Ctrl+Z)"><i data-lucide="undo-2"></i></button>
          <button class="topbar-icon-btn" id="redoButton" type="button" title="Rehacer (Ctrl+Y)"><i data-lucide="redo-2"></i></button>
        </div>
        <div class="topbar-sep"></div>
        <div class="status-dot-wrap" id="serialStatus" title="Sin placa" aria-label="Estado de la placa">
          <span class="status-dot-inner"></span>
        </div>
        <button class="topbar-icon-btn" id="exportButton" type="button" title="Exportar proyecto (.json)"><i data-lucide="download"></i></button>
        <label class="topbar-icon-btn" title="Importar proyecto (.json)" style="cursor:pointer;position:relative;">
          <i data-lucide="upload"></i>
          <input id="importInput" type="file" accept="application/json" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;" />
        </label>
        <button class="topbar-icon-btn" id="resetWorkspaceButton" type="button" title="Nuevo lienzo (limpiar bloques)"><i data-lucide="eraser"></i></button>
        <div class="topbar-sep"></div>
        <button class="topbar-icon-btn" id="reconnectButton" type="button" title="Reconectar al último puerto" hidden><i data-lucide="refresh-cw"></i></button>
        <button class="soft-button" id="connectButton" type="button" title="Conectar placa por WebSerial"><i data-lucide="plug-zap"></i><span>Conectar</span></button>
        <button class="sami-account-button" id="samiAccountButton" type="button" title="Cuenta Sami ID">
          <span class="sami-account-logo"><img src="${SAMI_ICON_MARK}" alt="" /></span>
          <span>Visitante</span>
        </button>
        <button class="topbar-icon-btn ai-toggle-btn" id="aiPanelToggle" type="button" title="Asistente IA — SteamBot"><i data-lucide="bot"></i></button>
      </div>
    </header>

    <section class="workspace-grid" id="workspaceGrid">
      <section class="main-stage">
        <div class="panel-view is-active" id="blocksView">
          <div id="blocklyDiv" aria-label="Editor de bloques"></div>
        </div>

        <div class="panel-view" id="codeView">
          <div class="editor-toolbar">
            <div class="segmented" role="radiogroup" aria-label="Modo de codigo">
              <button class="segment is-active" data-code-mode="blocks" type="button">Generado</button>
              <button class="segment" data-code-mode="manual" type="button">Manual</button>
            </div>
            <button class="soft-button" id="syncEditorButton" type="button"><i data-lucide="refresh-cw"></i><span>Actualizar desde bloques</span></button>
          </div>
          <textarea id="codeEditor" spellcheck="false" aria-label="Editor MicroPython"></textarea>
        </div>

        <div class="panel-view" id="consoleView">
          <div class="console-toolbar">
            <button class="soft-button" id="interruptButton" type="button" title="Ctrl-C al REPL"><i data-lucide="circle-stop"></i><span>Ctrl-C</span></button>
            <button class="soft-button" id="resetButton" type="button" title="Soft reset e interrupt"><i data-lucide="rotate-ccw"></i><span>Reset</span></button>
            <button class="soft-button" id="clearConsoleButton" type="button" title="Limpiar consola"><i data-lucide="trash-2"></i><span>Limpiar</span></button>
          </div>
          <section id="terminalPane" class="terminal-pane" aria-label="Consola REPL">
            <pre id="consoleOutput" class="terminal-output"></pre>
            <form id="consoleForm" class="repl-line">
              <span id="replPrompt" class="repl-prompt">&gt;&gt;&gt;</span>
              <input id="consoleCommand" type="text" autocomplete="off" spellcheck="false" placeholder="escribe un comando Python…" aria-label="Entrada REPL" />
            </form>
          </section>
        </div>
      </section>

      <aside class="ai-panel" id="aiPanel" aria-hidden="true">
        <div class="ai-resize-handle" id="aiResizeHandle" title="Arrastra para redimensionar"></div>
        <div class="ai-header">
          <div class="ai-header-title">
            <span class="ai-avatar"><i data-lucide="bot"></i></span>
            <div>
              <strong>SteamBot</strong>
              <small>Asistente para ESP32</small>
            </div>
          </div>
          <div class="ai-header-actions">
            <button class="icon-button" id="aiClearButton" title="Limpiar chat"><i data-lucide="trash-2"></i></button>
            <button class="icon-button" id="aiPanelClose" title="Cerrar panel IA"><i data-lucide="panel-right-close"></i></button>
          </div>
        </div>
        <div class="ai-messages" id="aiMessages">
          <div class="ai-welcome" id="aiWelcome">
            <div class="ai-welcome-icon"><i data-lucide="bot"></i></div>
            <h3>Hola, soy SteamBot</h3>
            <p>Puedo ayudarte a programar tu ESP32. Pregúntame sobre errores, pídeme código o cuéntame qué quieres construir.</p>
            <div class="ai-welcome-chips">
              <button class="ai-chip" data-prompt="Analiza los errores de la consola y explícame qué ha fallado.">Analizar error</button>
              <button class="ai-chip" data-prompt="Haz parpadear el LED interno del pin 2 cada 500 ms.">LED blink</button>
              <button class="ai-chip" data-prompt="Explícame cómo usar los bloques NeoPixel para controlar una tira LED.">NeoPixel</button>
              <button class="ai-chip" data-prompt="¿Qué código tengo activo ahora mismo y qué hace?">Ver código</button>
            </div>
          </div>
        </div>
        <div class="ai-composer">
          <textarea id="aiInput" placeholder="Pregunta sobre tu proyecto, pide código, describe el error…" rows="3"></textarea>
          <button class="ai-send-btn" id="aiSendBtn" title="Enviar (Enter)"><i data-lucide="send"></i></button>
        </div>
      </aside>
    </section>
  </main>

  <div class="drawer-backdrop" id="drawerBackdrop"></div>
  <aside class="app-drawer" id="appDrawer" data-screen="settings" aria-hidden="true">
    <section class="drawer-page drawer-screen" id="drawerPlayground" hidden>
      <div class="drawer-head drawer-hero">
        <div class="drawer-title">
          <span class="drawer-mark"><i data-lucide="cpu"></i></span>
          <div>
            <strong>NEW STEAMMAKERS</strong>
            <span>Panel del entorno</span>
          </div>
        </div>
        <button class="icon-button" data-drawer-close type="button" title="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="drawer-route-grid" aria-label="Navegación">
        <button class="drawer-route is-active drawer-tab" data-drawer-tab="playground" type="button">
          <i data-lucide="blocks"></i>
          <span>Playground</span>
          <small>Bloques, código y REPL</small>
        </button>
        <button class="drawer-route drawer-tab" data-drawer-tab="settings" type="button">
          <i data-lucide="settings-2"></i>
          <span>Ajustes</span>
          <small>Tema, calidad y sonido</small>
        </button>
      </div>
      <div class="settings-card playground-card">
        <h2>Playground</h2>
        <p>Salta rápidamente a la zona de trabajo.</p>
        <div class="drawer-actions">
          <button class="soft-button" data-tab-jump="blocks" type="button"><i data-lucide="blocks"></i><span>Bloques</span></button>
          <button class="soft-button" data-tab-jump="code" type="button"><i data-lucide="code-2"></i><span>Código</span></button>
          <button class="soft-button" data-tab-jump="console" type="button"><i data-lucide="terminal"></i><span>Consola</span></button>
        </div>
      </div>
    </section>

    <section class="drawer-page drawer-screen is-active" id="drawerSettings">
      <div class="settings-topbar">
        <span class="settings-kicker"><i data-lucide="sliders-horizontal"></i> NEW STEAMMAKERS</span>
        <button class="icon-button" data-drawer-close type="button" title="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="settings-hero">
        <span class="settings-hero-icon"><i data-lucide="settings-2"></i></span>
        <div>
          <h2>Ajustes</h2>
          <p>Personaliza el entorno de trabajo.</p>
        </div>
      </div>

      <div class="settings-card sami-account-card">
        <div class="card-heading"><i data-lucide="user-round"></i><h2>Cuenta Sami ID</h2></div>
        <div class="sami-account-brand">
          <img src="${SAMI_FULL_MARK}" alt="Sami ID" />
          <span id="samiSettingsState">Modo visitante</span>
        </div>
        <div class="sami-account-row">
          <img id="samiSettingsAvatar" src="${SAMI_ICON_MARK}" alt="" />
          <div>
            <strong id="samiSettingsName">Visitante</strong>
            <p id="samiSettingsDetail">Trabajando sin cuenta.</p>
          </div>
        </div>
        <div class="drawer-actions">
          <button class="soft-button" id="samiSettingsLoginButton" type="button"><img src="${SAMI_ICON_MARK}" alt="" /><span>Iniciar sesión</span></button>
          <button class="soft-button danger-soft-button" id="samiSettingsLogoutButton" type="button" hidden><i data-lucide="log-out"></i><span>Cerrar sesión</span></button>
        </div>
      </div>

      <div class="settings-card">
        <div class="card-heading"><i data-lucide="layers"></i><h2>Calidad de bloques</h2></div>
        <div class="choice-grid vertical" role="radiogroup" aria-label="Calidad visual">
          <label class="setting-option visual-option">
            <input type="radio" name="visualMode" value="simple" />
            <span>Simple</span>
            <small>Máximo rendimiento. Renderer ligero. Ideal para equipos lentos.</small>
          </label>
          <label class="setting-option visual-option">
            <input type="radio" name="visualMode" value="standard" />
            <span>Estándar</span>
            <small>Equilibrio entre claridad y rendimiento. Recomendado.</small>
          </label>
          <label class="setting-option visual-option">
            <input type="radio" name="visualMode" value="detailed" />
            <span>Detallado</span>
            <small>Máxima calidad visual. Bloques con relieve y animaciones.</small>
          </label>
        </div>
      </div>

      <div class="settings-card">
        <div class="card-heading"><i data-lucide="volume-2"></i><h2>Sonido</h2></div>
        <label class="toggle-line setting-option"><input id="soundMuted" type="checkbox" /><span>Silenciar efectos de sonido</span></label>
        <label class="range-line"><span>Volumen</span><input id="soundVolume" type="range" min="0" max="1" step="0.01" /></label>
        <button class="soft-button test-sound-button" id="testSoundButton" type="button"><i data-lucide="music-2"></i><span>Probar sonido</span></button>
      </div>

      <div class="settings-card">
        <div class="card-heading"><i data-lucide="bot"></i><h2>Asistente IA (Ollama)</h2></div>
        <div class="input-field">
          <label for="ollamaApiKey">API Key</label>
          <input id="ollamaApiKey" type="password" placeholder="Pega tu clave API aquí…" autocomplete="off" spellcheck="false" />
        </div>
        <div class="input-field">
          <label for="ollamaModel">Modelo</label>
          <input id="ollamaModel" type="text" placeholder="gpt-oss:120b-cloud" spellcheck="false" />
        </div>
        <p class="settings-hint">Obtén tu API key en <strong>ollama.com</strong>. Se guarda solo en tu navegador.</p>
      </div>

      <div class="settings-card">
        <div class="card-heading"><i data-lucide="cpu"></i><h2>Placa objetivo</h2></div>
        <div class="board-info-row">
          <div class="board-info-icon"><i data-lucide="cpu"></i></div>
          <div>
            <div class="board-info-name">ESP32 Plus STEAMakers 32-WROOM</div>
            <div class="board-info-sub">MicroPython · WebSerial · 115200 baud</div>
          </div>
        </div>
      </div>
    </section>
  </aside>

  <div class="progress-overlay" id="progressOverlay" hidden>
    <section class="progress-card" role="status" aria-live="polite">
      <div class="progress-icon" id="progressIcon"><i data-lucide="upload-cloud"></i></div>
      <h2 id="progressTitle">Subiendo a la placa...</h2>
      <p id="progressText">Preparando conexión WebSerial.</p>
      <div class="progress-track-wrap">
        <div class="progress-track"><span id="progressBar"></span></div>
        <span class="progress-pct" id="progressPct">0%</span>
      </div>
    </section>
  </div>

  <div class="mp-overlay" id="mpOverlay" hidden>
    <section class="mp-card" role="dialog" aria-modal="true" aria-labelledby="mpTitle">
      <div class="mp-icon"><i data-lucide="badge-alert"></i></div>
      <h2 id="mpTitle">MicroPython no detectado</h2>
      <p>La placa se ha conectado por USB, pero no responde como MicroPython. Para usar NEW STEAMMAKERS necesitas flashear MicroPython en la ESP32.</p>
      <div class="mp-actions">
        <button class="soft-button" id="mpCancelButton" type="button">Cerrar</button>
        <button class="primary-icon mp-install-button" id="mpInstallButton" type="button"><i data-lucide="external-link"></i><span>Instalar MicroPython</span></button>
      </div>
    </section>
  </div>

  <div class="sami-auth-overlay" id="samiAuthOverlay" hidden>
    <section class="sami-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="samiAuthTitle">
      <div class="sami-auth-brandline">
        <span class="sami-auth-icon"><img src="${SAMI_ICON_MARK}" alt="" /></span>
        <img class="sami-auth-full" src="${SAMI_FULL_MARK}" alt="Sami ID" />
      </div>
      <h2 id="samiAuthTitle">Inicia sesión con Sami ID</h2>
      <p>Conecta tu identidad para entrar en NEW STEAMMAKERS. También puedes seguir explorando como visitante.</p>
      <div class="sami-auth-status" id="samiAuthStatus" hidden>
        <span class="sami-auth-spinner"></span>
        <span>Conectando con Sami ID...</span>
      </div>
      <p class="sami-auth-error" id="samiAuthError" hidden></p>
      <div class="sami-auth-actions">
        <button class="sami-login-button" id="samiLoginButton" type="button" aria-label="Iniciar sesión con Sami ID">
          <img src="${SAMI_FULL_MARK}" alt="" />
        </button>
        <button class="soft-button" id="samiVisitorButton" type="button"><i data-lucide="user-round"></i><span>Entrar como visitante</span></button>
      </div>
    </section>
  </div>
`;

createIcons({ icons });

document.querySelector("#ollamaEndpoint")?.closest(".input-field")?.remove();
document.querySelector(".theme-grid")?.closest(".settings-card")?.remove();
document.querySelector(".board-info-row")?.closest(".settings-card")?.remove();
const apiHint = document.querySelector(".settings-hint");
if (apiHint) {
  apiHint.innerHTML = 'Obtén tu API key <a href="https://ollama.com/settings/keys" target="_blank" rel="noreferrer"><strong>aqui</strong></a>. Se guarda solo en tu navegador.';
}

// ─── Element refs ──────────────────────────────────────────────────────────
const els = {
  appShell: document.querySelector(".app-shell"),
  drawerButton: document.querySelector("#drawerButton"),
  drawerBackdrop: document.querySelector("#drawerBackdrop"),
  appDrawer: document.querySelector("#appDrawer"),
  drawerPlayground: document.querySelector("#drawerPlayground"),
  drawerSettings: document.querySelector("#drawerSettings"),
  blocksView: document.querySelector("#blocksView"),
  codeView: document.querySelector("#codeView"),
  consoleView: document.querySelector("#consoleView"),
  blocklyDiv: document.querySelector("#blocklyDiv"),
  codeEditor: document.querySelector("#codeEditor"),
  terminalPane: document.querySelector("#terminalPane"),
  consoleOutput: document.querySelector("#consoleOutput"),
  consoleCommand: document.querySelector("#consoleCommand"),
  replPrompt: document.querySelector("#replPrompt"),
  consoleForm: document.querySelector("#consoleForm"),
  serialStatus: document.querySelector("#serialStatus"),
  connectButton: document.querySelector("#connectButton"),
  reconnectButton: document.querySelector("#reconnectButton"),
  runButton: document.querySelector("#runButton"),
  saveRunButton: document.querySelector("#saveRunButton"),
  stopButton: document.querySelector("#stopButton"),
  undoButton: document.querySelector("#undoButton"),
  redoButton: document.querySelector("#redoButton"),
  interruptButton: document.querySelector("#interruptButton"),
  resetButton: document.querySelector("#resetButton"),
  clearConsoleButton: document.querySelector("#clearConsoleButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetWorkspaceButton: document.querySelector("#resetWorkspaceButton"),
  syncEditorButton: document.querySelector("#syncEditorButton"),
  soundMuted: document.querySelector("#soundMuted"),
  soundVolume: document.querySelector("#soundVolume"),
  testSoundButton: document.querySelector("#testSoundButton"),
  ollamaApiKey: document.querySelector("#ollamaApiKey"),
  ollamaModel: document.querySelector("#ollamaModel"),
  ollamaEndpoint: document.querySelector("#ollamaEndpoint"),
  progressOverlay: document.querySelector("#progressOverlay"),
  progressIcon: document.querySelector("#progressIcon"),
  progressTitle: document.querySelector("#progressTitle"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  progressPct: document.querySelector("#progressPct"),
  mpOverlay: document.querySelector("#mpOverlay"),
  mpCancelButton: document.querySelector("#mpCancelButton"),
  mpInstallButton: document.querySelector("#mpInstallButton"),
  workspaceGrid: document.querySelector("#workspaceGrid"),
  aiPanel: document.querySelector("#aiPanel"),
  aiMessages: document.querySelector("#aiMessages"),
  aiInput: document.querySelector("#aiInput"),
  aiSendBtn: document.querySelector("#aiSendBtn"),
  aiClearButton: document.querySelector("#aiClearButton"),
  aiResizeHandle: document.querySelector("#aiResizeHandle"),
  aiWelcome: document.querySelector("#aiWelcome"),
  samiAccountButton: document.querySelector("#samiAccountButton"),
  samiSettingsAvatar: document.querySelector("#samiSettingsAvatar"),
  samiSettingsState: document.querySelector("#samiSettingsState"),
  samiSettingsName: document.querySelector("#samiSettingsName"),
  samiSettingsDetail: document.querySelector("#samiSettingsDetail"),
  samiSettingsLoginButton: document.querySelector("#samiSettingsLoginButton"),
  samiSettingsLogoutButton: document.querySelector("#samiSettingsLogoutButton"),
  samiAuthOverlay: document.querySelector("#samiAuthOverlay"),
  samiAuthStatus: document.querySelector("#samiAuthStatus"),
  samiAuthError: document.querySelector("#samiAuthError"),
  samiLoginButton: document.querySelector("#samiLoginButton"),
  samiVisitorButton: document.querySelector("#samiVisitorButton"),
};

// ─── Sound ─────────────────────────────────────────────────────────────────
const sound = {
  context: null,
  ensure() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  },
  play(kind = "tap") {
    if (settings.soundMuted || settings.soundVolume <= 0) return;
    const context = this.ensure();
    if (!context) return;
    const now = context.currentTime;
    const gain = context.createGain();
    const primary = context.createOscillator();
    const second = context.createOscillator();
    const presets = {
      tap: [520, 780, 0.045],
      connect: [660, 990, 0.07],
      success: [620, 1240, 0.12],
      error: [180, 120, 0.16],
      stop: [260, 180, 0.09],
    };
    const [a, b, duration] = presets[kind] || presets.tap;
    primary.type = kind === "error" ? "sawtooth" : "sine";
    second.type = "triangle";
    primary.frequency.setValueAtTime(a, now);
    second.frequency.setValueAtTime(b, now + duration * 0.25);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, settings.soundVolume * 0.12), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    primary.connect(gain);
    second.connect(gain);
    gain.connect(context.destination);
    primary.start(now);
    second.start(now + duration * 0.12);
    primary.stop(now + duration);
    second.stop(now + duration);
  },
};

// ─── Sami ID session ────────────────────────────────────────────────────────
function loadSamiSession() {
  try {
    return JSON.parse(localStorage.getItem(SAMI_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSamiSession(session) {
  samiSession = session;
  if (session) {
    localStorage.setItem(SAMI_SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(SAMI_VISITOR_KEY);
    visitorMode = false;
  } else {
    localStorage.removeItem(SAMI_SESSION_KEY);
  }
  renderSamiAccount();
}

function samiRedirectUri() {
  return `${window.location.origin}/auth/callback`;
}

function randomOAuthState() {
  const bytes = new Uint8Array(24);
  if (globalThis.crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function startSamiLogin() {
  setSamiGate(true, "Abriendo Sami ID...");
  const state = randomOAuthState();
  sessionStorage.setItem(SAMI_STATE_KEY, state);
  localStorage.removeItem(SAMI_VISITOR_KEY);
  const params = new URLSearchParams({
    client_id: SAMI_CLIENT_ID,
    redirect_uri: samiRedirectUri(),
    response_type: "code",
    scope: "profile email",
    state,
  });
  window.location.href = `${SAMI_AUTH_BASE}/authorize?${params.toString()}`;
}

function setVisitorMode() {
  visitorMode = true;
  authGateError = "";
  localStorage.setItem(SAMI_VISITOR_KEY, "1");
  setSamiGate(false);
  renderSamiAccount();
}

function setSamiGate(open, error = "") {
  const isWorking = /abriendo|autenticando|conectando/i.test(error);
  authGateError = isWorking ? "" : error;
  els.samiAuthOverlay.hidden = !open;
  els.samiAuthOverlay.classList.toggle("is-working", Boolean(open && isWorking));
  if (els.samiAuthStatus) {
    els.samiAuthStatus.hidden = !open || !isWorking;
    const label = els.samiAuthStatus.querySelector("span:last-child");
    if (label) label.textContent = error || "Conectando con Sami ID...";
  }
  if (els.samiAuthError) {
    els.samiAuthError.textContent = error;
    els.samiAuthError.hidden = !error || isWorking;
  }
}

function displaySamiUser() {
  const user = samiSession?.user;
  if (!user) return "Visitante";
  return user.name || user.username || user.email?.split("@")[0] || "Sami ID";
}

function renderSamiAccount() {
  const signedIn = Boolean(samiSession?.user);
  const name = displaySamiUser();
  const detail = signedIn ? samiSession.user.email : "Trabajando sin cuenta.";

  if (els.samiAccountButton) {
    els.samiAccountButton.classList.toggle("is-signed-in", signedIn);
    els.samiAccountButton.innerHTML = `<span class="sami-account-logo"><img src="${SAMI_ICON_MARK}" alt="" /></span><span>${escHtml(name)}</span>`;
  }
  if (els.samiSettingsAvatar) els.samiSettingsAvatar.src = SAMI_ICON_MARK;
  if (els.samiSettingsState) els.samiSettingsState.textContent = signedIn ? "Cuenta conectada" : "Modo visitante";
  if (els.samiSettingsName) els.samiSettingsName.textContent = name;
  if (els.samiSettingsDetail) els.samiSettingsDetail.textContent = detail;
  if (els.samiSettingsLoginButton) els.samiSettingsLoginButton.hidden = signedIn;
  if (els.samiSettingsLogoutButton) els.samiSettingsLogoutButton.hidden = !signedIn;
  createIcons({ icons });
}

async function handleSamiCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    history.replaceState({}, "", "/");
    setSamiGate(true, "La autorización se ha cancelado.");
    return;
  }

  if (!code || window.location.pathname !== "/auth/callback") return;

  const expectedState = sessionStorage.getItem(SAMI_STATE_KEY);
  sessionStorage.removeItem(SAMI_STATE_KEY);
  history.replaceState({}, "", "/");

  if (!state || state !== expectedState) {
    setSamiGate(true, "La sesión OAuth no coincide. Vuelve a intentarlo.");
    return;
  }

  setSamiGate(true, "Conectando con Sami ID...");

  try {
    const res = await fetch("/api/sami-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: samiRedirectUri() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se ha podido iniciar sesión.");
    saveSamiSession(data);
    setSamiGate(false);
  } catch (err) {
    setSamiGate(true, err.message || "No se ha podido iniciar sesión.");
  }
}

function logoutSami() {
  saveSamiSession(null);
  setVisitorMode();
}

// ─── Console ───────────────────────────────────────────────────────────────
function appendConsole(text, kind = "device") {
  if (kind === "host") {
    const span = document.createElement("span");
    span.className = "con-host";
    span.textContent = "# " + text;
    els.consoleOutput.appendChild(span);
  } else if (kind === "error") {
    const span = document.createElement("span");
    span.className = "con-error";
    span.textContent = text;
    els.consoleOutput.appendChild(span);
  } else {
    els.consoleOutput.appendChild(document.createTextNode(text));
  }
  updatePromptFromDevice(text);
  scrollTerminal();
}

function updatePromptFromDevice(text) {
  if (text.includes("... ") || text.endsWith("...")) els.replPrompt.textContent = "...";
  if (text.includes(">>> ") || text.endsWith(">>>")) els.replPrompt.textContent = ">>>";
}

function scrollTerminal() {
  els.terminalPane.scrollTop = els.terminalPane.scrollHeight;
}

// ─── Status ────────────────────────────────────────────────────────────────
function setStatus(message, connected = serial.connected) {
  els.serialStatus.classList.toggle("is-connected", connected);
  els.serialStatus.title = message;
  els.connectButton.innerHTML = connected
    ? '<i data-lucide="unplug"></i><span>Desconectar</span>'
    : '<i data-lucide="plug-zap"></i><span>Conectar</span>';
  if (els.reconnectButton) els.reconnectButton.hidden = connected;
  createIcons({ icons });
}

function mpFlasherUrl() {
  const redirect = location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "newsm.samilososami.com"
    : location.host;
  return `https://mpflasher.samilososami.com/?redirect=${encodeURIComponent(redirect)}`;
}

function showMicroPythonMissingPopup() {
  els.mpOverlay.hidden = false;
  createIcons({ icons });
}

function hideMicroPythonMissingPopup() {
  els.mpOverlay.hidden = true;
}

async function verifyConnectedMicroPython() {
  setProgress({
    title: "Verificando MicroPython...",
    text: "Comprobando que la placa responde al REPL de MicroPython.",
    value: 35,
    icon: "badge-check",
  });
  const ok = await serial.verifyMicroPython();
  if (ok) {
    setProgress({
      title: "Placa lista",
      text: "MicroPython detectado correctamente.",
      value: 100,
      state: "success",
      icon: "check",
    });
    hideProgressLater(900);
    return true;
  }
  els.progressOverlay.hidden = true;
  showMicroPythonMissingPopup();
  return false;
}

// ─── Code helpers ──────────────────────────────────────────────────────────
function getActiveCode() {
  return codeMode === "manual" ? manualCode : generatedCode;
}

function refreshCode() {
  if (!workspace) return;
  generatedCode = buildMicroPythonCode(workspace);
  if (codeMode === "blocks") els.codeEditor.value = generatedCode;
}

// ─── State persistence ─────────────────────────────────────────────────────
function serializeState() {
  return {
    workspace: workspace ? Blockly.serialization.workspaces.save(workspace) : null,
    manualCode,
    activeTab,
    drawerTab,
    codeMode,
    settings,
    savedAt: new Date().toISOString(),
  };
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  }, SAVE_DELAY);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Workspace ─────────────────────────────────────────────────────────────
function getWorkspaceOptions() {
  const simple = settings.visualMode === "simple";
  const detailed = settings.visualMode === "detailed";
  return {
    toolbox: buildToolbox(),
    renderer: simple ? "geras" : "zelos",
    trashcan: !simple,
    sounds: false,
    zoom: {
      controls: !simple,
      wheel: true,
      startScale: simple ? 0.82 : detailed ? 0.92 : 0.88,
      maxScale: detailed ? 1.7 : 1.5,
      minScale: 0.45,
      scaleSpeed: detailed ? 1.12 : 1.15,
    },
    grid: {
      spacing: detailed ? 20 : 24,
      length: simple ? 0 : detailed ? 3 : 2,
      colour: detailed ? "#cbd7f0" : "#d5dae8",
      snap: true,
    },
    move: { scrollbars: true, drag: true, wheel: true },
  };
}

function injectWorkspace(savedWorkspace) {
  if (workspace) workspace.dispose();
  workspace = Blockly.inject("blocklyDiv", getWorkspaceOptions());
  if (savedWorkspace) {
    try {
      Blockly.serialization.workspaces.load(savedWorkspace, workspace);
    } catch {
      loadStarterWorkspace(workspace);
    }
  } else {
    loadStarterWorkspace(workspace);
  }
  let refreshTimer;
  workspace.addChangeListener((event) => {
    if (event.isUiEvent) return;
    scheduleSave();
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => refreshCode(), settings.visualMode === "detailed" ? 120 : 60);
    if (event.type === Blockly.Events.BLOCK_MOVE && event.newParentId) {
      const now = performance.now();
      if (now - lastBlockSound > 120) {
        sound.play("connect");
        lastBlockSound = now;
      }
    }
  });
  refreshCode();
  setTimeout(() => Blockly.svgResize(workspace), 30);
}

// ─── Tab / view switching ──────────────────────────────────────────────────
function setTab(nextTab) {
  activeTab = nextTab;
  document.querySelectorAll(".tab-button").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.tab === nextTab)
  );
  els.blocksView.classList.toggle("is-active", nextTab === "blocks");
  els.codeView.classList.toggle("is-active", nextTab === "code");
  els.consoleView.classList.toggle("is-active", nextTab === "console");
  if (nextTab === "blocks") setTimeout(() => Blockly.svgResize(workspace), 50);
  if (nextTab === "console") setTimeout(() => els.consoleCommand.focus(), 50);
  scheduleSave();
}

function setCodeMode(nextMode) {
  codeMode = nextMode;
  document.querySelectorAll(".segment").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.codeMode === nextMode)
  );
  els.codeEditor.readOnly = nextMode === "blocks";
  els.codeEditor.value = nextMode === "blocks" ? generatedCode : manualCode;
  scheduleSave();
}

// ─── Drawer ────────────────────────────────────────────────────────────────
function setDrawer(open) {
  drawerOpen = open;
  document.body.classList.toggle("drawer-open", drawerOpen);
  els.appDrawer.setAttribute("aria-hidden", drawerOpen ? "false" : "true");
}

function setDrawerTab(nextTab) {
  drawerTab = "settings";
  els.appDrawer.dataset.screen = "settings";
  document.querySelectorAll(".drawer-route").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.drawerTab === "settings")
  );
  els.drawerPlayground?.classList.toggle("is-active", false);
  els.drawerSettings.classList.toggle("is-active", true);
  scheduleSave();
}

// ─── Settings ──────────────────────────────────────────────────────────────
function applySettings({ rebuild = false } = {}) {
  settings.theme = "light";
  if (!settings.ollamaModel || settings.ollamaModel === "qwen2.5-coder:32b:cloud" || settings.ollamaModel === "minimax-m2.7:cloud" || settings.ollamaModel === "gpt-oss:120b:cloud") {
    settings.ollamaModel = DEFAULT_SETTINGS.ollamaModel;
  }
  document.documentElement.dataset.theme = "light";
  document.documentElement.dataset.visualMode = settings.visualMode;
  els.soundMuted.checked = settings.soundMuted;
  els.soundVolume.value = String(settings.soundVolume);
  document.querySelectorAll('input[name="theme"]').forEach((i) => {
    i.checked = i.value === settings.theme;
  });
  document.querySelectorAll('input[name="visualMode"]').forEach((i) => {
    i.checked = i.value === settings.visualMode;
  });
  if (els.ollamaApiKey) els.ollamaApiKey.value = settings.ollamaApiKey || "";
  if (els.ollamaModel) els.ollamaModel.value = settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel;
  settings.ollamaEndpoint = DEFAULT_SETTINGS.ollamaEndpoint;
  if (rebuild && workspace) {
    const state = Blockly.serialization.workspaces.save(workspace);
    injectWorkspace(state);
  }
  scheduleSave();
}

// ─── Progress overlay ──────────────────────────────────────────────────────
function setProgress({ title, text, value, state = "busy", icon = "upload-cloud" }) {
  progressValue = value;
  els.progressOverlay.hidden = false;
  els.progressOverlay.dataset.state = state;
  els.progressTitle.textContent = title;
  els.progressText.textContent = text;
  const pct = Math.max(0, Math.min(100, value));
  els.progressBar.style.width = `${pct}%`;
  if (els.progressPct) els.progressPct.textContent = `${Math.round(pct)}%`;
  els.progressIcon.innerHTML = `<i data-lucide="${icon}"></i>`;
  createIcons({ icons });
}

function driftProgress(max = 88) {
  clearInterval(progressTimer);
  progressTimer = window.setInterval(() => {
    if (progressValue >= max) { clearInterval(progressTimer); return; }
    progressValue += Math.max(0.5, (max - progressValue) * 0.08);
    const pct = Math.min(max, progressValue);
    els.progressBar.style.width = `${pct}%`;
    if (els.progressPct) els.progressPct.textContent = `${Math.round(pct)}%`;
  }, 160);
}

function stopProgressDrift() { clearInterval(progressTimer); }

function hideProgressLater(ms = 1200) {
  stopProgressDrift();
  window.setTimeout(() => { els.progressOverlay.hidden = true; }, ms);
}

// ─── Serial helpers ────────────────────────────────────────────────────────
async function ensureConnected() {
  if (!serial.connected) {
    setProgress({ title: "Conectando con la placa...", text: "Selecciona el puerto USB del ESP32.", value: 8 });
    await serial.connect(115200);
    const ok = await verifyConnectedMicroPython();
    if (!ok) throw new Error("MicroPython no detectado en la placa.");
  }
}

async function runAction(kind) {
  const isSave = kind === "save";
  try {
    sound.play("tap");
    setProgress({
      title: isSave ? "Guardando en la placa..." : "Subiendo a la placa...",
      text: "Preparando WebSerial y parando el script anterior.",
      value: 12,
    });
    await ensureConnected();
    const code = getActiveCode();
    appendConsole(isSave ? "Guardando main.py y ejecutando…\n" : "Ejecutando en memoria…\n", "host");
    setProgress({
      title: isSave ? "Escribiendo main.py..." : "Ejecutando en RAM...",
      text: isSave ? "Validando código y copiándolo a la flash." : "Pausando main.py y cargando código temporal.",
      value: 42,
    });
    driftProgress(88);
    if (isSave) {
      await serial.saveMainAndRun(code);
    } else {
      await serial.runInMemory(code);
    }
    stopProgressDrift();
    setProgress({
      title: "Ejecutado correctamente",
      text: isSave ? "El programa quedó guardado como main.py." : "El programa está corriendo en memoria.",
      value: 100,
      state: "success",
      icon: "check",
    });
    sound.play("success");
    hideProgressLater(1500);
  } catch (error) {
    stopProgressDrift();
    appendConsole(`Error: ${error.message}\n`, "error");
    setProgress({
      title: "No se pudo completar",
      text: "Revisa la consola para ver el detalle del error.",
      value: 100,
      state: "error",
      icon: "triangle-alert",
    });
    sound.play("error");
    hideProgressLater(2600);
  }
}

async function stopScript() {
  try {
    sound.play("stop");
    await ensureConnected();
    appendConsole("Parando script…\n", "host");
    await serial.stopCurrentProgram();
    appendConsole("Script detenido. REPL listo.\n", "host");
  } catch (error) {
    appendConsole(`Error: ${error.message}\n`, "error");
  }
}

// ─── Project import/export ─────────────────────────────────────────────────
function exportProject() {
  const blob = new Blob([JSON.stringify(serializeState(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "new-steammakers-project.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importProject(file) {
  if (!file) return;
  const text = await file.text();
  const state = JSON.parse(text);
  if (state.settings) settings = { ...DEFAULT_SETTINGS, ...state.settings };
  injectWorkspace(state.workspace);
  manualCode = state.manualCode || "";
  setCodeMode(state.codeMode || "blocks");
  setTab(state.activeTab || "blocks");
  setDrawerTab(state.drawerTab || "playground");
  applySettings();
  refreshCode();
  scheduleSave();
}

function resetWorkspace() {
  workspace.clear();
  loadStarterWorkspace(workspace);
  manualCode = "";
  setCodeMode("blocks");
  refreshCode();
  scheduleSave();
}

// ─── AI Panel ──────────────────────────────────────────────────────────────
function setAiPanel(open) {
  aiOpen = open;
  els.workspaceGrid.classList.toggle("ai-open", open);
  els.aiPanel.setAttribute("aria-hidden", open ? "false" : "true");
  document.querySelector("#aiPanelToggle").classList.toggle("is-active-ai", open);
  if (workspace) setTimeout(() => Blockly.svgResize(workspace), 320);
}

function escHtml(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripEmojis(text) {
  return String(text || "").replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+([.,;:!?])/g, "$1");
}

function stripSteamBlockPlans(text) {
  return String(text || "")
    .replace(/```steam_steps\s*[\s\S]*?```/gi, "")
    .replace(/```steam_blocks\s*[\s\S]*?```/gi, "")
    .replace(/```(?:python|py)?\s*#\s*steam_blocks\s*[\s\S]*?```/gi, "")
    .replace(/```steam_steps[\s\S]*$/i, "")
    .replace(/```steam_blocks[\s\S]*$/i, "")
    .replace(/```(?:python|py)?\s*#\s*steam_blocks[\s\S]*$/i, "")
    .trim();
}

function stripPythonCodeBlocks(text) {
  return String(text || "").replace(/```(?:python|py)\s*[\s\S]*?```/gi, "").trim();
}

function createStreamingAiMessage() {
  if (els.aiWelcome) els.aiWelcome.style.display = "none";
  const msg = document.createElement("div");
  msg.className = "ai-message ai-assistant";
  els.aiMessages.appendChild(msg);
  return msg;
}

function updateAiMessage(msg, text) {
  const raw = stripEmojis(text);
  const clean = stripSteamBlockPlans(raw);
  const visible = clean || (/```steam_(?:steps|blocks)/i.test(raw) ? "Colocando bloques en el playground..." : "");
  msg.replaceChildren(renderAiContent(visible));
  msg.classList.toggle("is-streaming", Boolean(text));
  els.aiMessages.scrollTop = els.aiMessages.scrollHeight;
}

function addAiUndoButton(msg, snapshot) {
  if (!snapshot || !workspace) return;
  const button = document.createElement("button");
  button.className = "ai-undo-btn";
  button.type = "button";
  button.title = "Deshacer cambios de SteamBot";
  button.innerHTML = '<i data-lucide="undo-2"></i>';
  button.addEventListener("click", () => {
    Blockly.serialization.workspaces.load(snapshot, workspace);
    refreshCode();
    scheduleSave();
    button.disabled = true;
    button.classList.add("is-used");
    sound.play("stop");
  });
  msg.appendChild(button);
  createIcons({ icons });
}

function renderAiContent(text) {
  const wrap = document.createElement("div");
  wrap.className = "ai-msg-content";
  const parts = text.split(/(```[\s\S]*?```)/g);
  parts.forEach((part) => {
    const m = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (m) {
      const lang = m[1] || "python";
      if (["steam_blocks", "steam_steps"].includes(lang.toLowerCase())) return;
      const code = m[2].trim();
      const block = document.createElement("div");
      block.className = "ai-code-block";
      block.innerHTML = `<div class="ai-code-header"><span class="ai-code-lang">${escHtml(lang)}</span></div><pre class="ai-code-pre"><code>${escHtml(code)}</code></pre>`;
      if (lang === "python" || lang === "py" || lang === "") {
        const acts = document.createElement("div");
        acts.className = "ai-code-actions";
        const runBtn = document.createElement("button");
        runBtn.className = "ai-action-btn ai-run-btn";
        runBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Ejecutar en placa`;
        runBtn.addEventListener("click", () => runCodeFromAi(code));
        acts.appendChild(runBtn);
        block.appendChild(acts);
      }
      wrap.appendChild(block);
    } else if (part.trim()) {
      const d = document.createElement("div");
      d.className = "ai-text-block";
      d.innerHTML = escHtml(part)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>')
        .replace(/\n/g, "<br>");
      wrap.appendChild(d);
    }
  });
  return wrap;
}

function appendAiMessage(role, text, isThinking = false) {
  if (els.aiWelcome) els.aiWelcome.style.display = "none";
  const msg = document.createElement("div");
  msg.className = `ai-message ai-${role}`;
  if (isThinking) {
    msg.innerHTML = '<div class="ai-thinking"><span></span><span></span><span></span></div>';
    msg.id = "ai-thinking-msg";
  } else if (role === "user") {
    const d = document.createElement("div");
    d.className = "ai-msg-content";
    const t = document.createElement("div");
    t.className = "ai-text-block";
    t.textContent = text;
    d.appendChild(t);
    msg.appendChild(d);
  } else if (role === "assistant") {
    msg.appendChild(renderAiContent(stripEmojis(text)));
  } else {
    const d = document.createElement("div");
    d.className = "ai-msg-content ai-system-text";
    d.textContent = stripEmojis(text);
    msg.appendChild(d);
  }
  els.aiMessages.appendChild(msg);
  els.aiMessages.scrollTop = els.aiMessages.scrollHeight;
  return msg;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function restartClassAnimation(el, className, duration = 480) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), duration);
}

function animateWorkspace(kind) {
  restartClassAnimation(els.blocklyDiv, kind === "clear" ? "is-ai-clearing" : "is-ai-placing", kind === "clear" ? 520 : 700);
}

function animateAiBlock(block) {
  const root = block?.getSvgRoot?.();
  restartClassAnimation(root, "ai-block-pop", settings.visualMode === "detailed" ? 620 : 420);
}

function clearAiChat() {
  els.aiMessages.classList.add("is-clearing");
  window.setTimeout(() => {
    aiHistory = [];
    els.aiMessages.querySelectorAll(".ai-message").forEach((node) => node.remove());
    if (els.aiWelcome) {
      els.aiWelcome.style.display = "";
      els.aiWelcome.classList.add("is-returning");
      window.setTimeout(() => els.aiWelcome.classList.remove("is-returning"), 420);
    }
    els.aiMessages.classList.remove("is-clearing");
    sound.play("tap");
  }, settings.visualMode === "simple" ? 80 : 220);
}

function extractSteamBlockPlan(text) {
  const source = String(text || "");
  const candidates = [
    ...source.matchAll(/```steam_blocks\s*([\s\S]*?)```/gi),
    ...source.matchAll(/```(?:python|py)?\s*#\s*steam_blocks\s*([\s\S]*?)```/gi),
  ];

  for (const match of candidates) {
    const raw = match[1].replace(/^#\s*steam_blocks\s*/i, "").trim();
    try {
      const plan = JSON.parse(raw);
      return Array.isArray(plan) ? { blocks: plan } : plan;
    } catch {
      // Try the next candidate.
    }
  }

  const marker = source.match(/#\s*steam_blocks\s*([\s\S]+)/i);
  if (marker) {
    const json = marker[1].slice(marker[1].indexOf("{")).trim();
    try {
      const plan = JSON.parse(json);
      return Array.isArray(plan) ? { blocks: plan } : plan;
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeAiBlockSpec(spec) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) return spec;
  const next = {
    ...spec,
    fields: { ...(spec.fields || {}) },
    inputs: { ...(spec.inputs || {}), ...(spec.values || {}) },
    statements: { ...(spec.statements || {}) },
  };
  const aliases = {
    steam_wifi_print_ip: "steam_wifi_print_status",
    steam_telegram_init: "steam_telegram_token",
    steam_telegram_bot: "steam_telegram_token",
    steam_telegram_set_token: "steam_telegram_token",
    steam_telegram_receive: "steam_telegram_on_message",
    steam_telegram_get_updates: "steam_telegram_on_message",
    steam_telegram_send_message: "steam_telegram_send",
    steam_neopixel_color: "steam_neopixel_fill",
    steam_neopixel_blue: "steam_neopixel_fill",
    steam_neopixel_write: "steam_neopixel_show",
    steam_bluetooth_scan: "steam_ble_scan_names",
    steam_ble_scan: "steam_ble_scan_names",
    steam_bluetooth_scan_send_telegram: "steam_ble_scan_send_telegram",
    steam_ble_scan_telegram: "steam_ble_scan_send_telegram",
  };
  next.type = aliases[next.type] || next.type;

  if (next.type === "steam_wifi_init_client") return null;

  if (next.type === "steam_wifi_print_status") {
    return {
      type: "steam_print",
      inputs: {
        TEXT: {
          type: "text_join",
          extraState: { itemCount: 2 },
          inputs: {
            ADD0: "IP: ",
            ADD1: { type: "steam_wifi_ifconfig", fields: { PART: "0" } },
          },
        },
      },
    };
  }

  if (next.type === "steam_wifi_connect") {
    if (next.fields.SSID !== undefined && next.inputs.SSID === undefined) next.inputs.SSID = next.fields.SSID;
    if (next.fields.PASSWORD !== undefined && next.inputs.PASSWORD === undefined) next.inputs.PASSWORD = next.fields.PASSWORD;
    delete next.fields.SSID;
    delete next.fields.PASSWORD;
  }

  if (next.type === "steam_telegram_token") {
    if (next.fields.TOKEN !== undefined && next.inputs.TOKEN === undefined) next.inputs.TOKEN = next.fields.TOKEN;
    delete next.fields.TOKEN;
  }

  if (next.type === "steam_telegram_send") {
    if (next.fields.CHAT !== undefined && next.inputs.CHAT === undefined) next.inputs.CHAT = next.fields.CHAT;
    if (next.fields.TEXT !== undefined && next.inputs.TEXT === undefined) next.inputs.TEXT = next.fields.TEXT;
    if (next.fields.MODE === undefined) next.fields.MODE = "none";
    delete next.fields.CHAT;
    delete next.fields.TEXT;
  }

  if (next.type === "steam_telegram_send_ip") {
    return {
      type: "steam_telegram_send",
      fields: { MODE: "none" },
      inputs: {
        CHAT: { type: "steam_telegram_chat" },
        TEXT: {
          type: "text_join",
          extraState: { itemCount: 2 },
          inputs: {
            ADD0: "IP: ",
            ADD1: { type: "steam_wifi_ifconfig", fields: { PART: "0" } },
          },
        },
      },
    };
  }

  if (next.type === "steam_telegram_if_command") {
    const command = next.fields.COMMAND ?? next.inputs.COMMAND ?? "/ip";
    const body = next.statements.DO || next.statements.THEN || next.statements.COMMAND || [
      { type: "steam_telegram_send_ip" },
    ];
    return {
      type: "controls_if",
      inputs: {
        IF0: {
          type: "logic_compare",
          fields: { OP: "EQ" },
          inputs: {
            A: { type: "steam_telegram_text" },
            B: String(command),
          },
        },
      },
      statements: { DO0: Array.isArray(body) ? body : [body] },
    };
  }

  if (["steam_neopixel_init", "steam_neopixel_set", "steam_neopixel_fill", "steam_neopixel_show"].includes(next.type)) {
    const fieldToInput = ["COUNT", "INDEX", "R", "G", "B"];
    fieldToInput.forEach((name) => {
      if (next.fields[name] !== undefined && next.inputs[name] === undefined) next.inputs[name] = next.fields[name];
      delete next.fields[name];
    });
    if (next.fields.PIN === undefined && next.inputs.PIN !== undefined) {
      next.fields.PIN = next.inputs.PIN;
      delete next.inputs.PIN;
    }
    if (next.fields.PIN === undefined && next.fields.pin !== undefined) {
      next.fields.PIN = next.fields.pin;
      delete next.fields.pin;
    }
    if (next.type === "steam_neopixel_fill") {
      if (next.inputs.COLOR !== undefined) delete next.inputs.COLOR;
      if (next.inputs.R === undefined) next.inputs.R = 0;
      if (next.inputs.G === undefined) next.inputs.G = 0;
      if (next.inputs.B === undefined) next.inputs.B = 255;
    }
    if (next.type === "steam_neopixel_init" && next.inputs.COUNT === undefined) next.inputs.COUNT = 256;
  }

  if (["steam_ble_scan_names", "steam_ble_scan_send_telegram"].includes(next.type)) {
    if (next.fields.MS !== undefined && next.inputs.MS === undefined) next.inputs.MS = next.fields.MS;
    if (next.inputs.MS === undefined) next.inputs.MS = 5000;
    delete next.fields.MS;
  }

  if (next.type === "steam_digital_write" && next.fields.VALUE !== undefined && next.fields.STATE === undefined) {
    next.fields.STATE = next.fields.VALUE;
  }

  return next;
}

function validateAiBlockSpec(spec, problems = []) {
  if (spec === null || spec === undefined || typeof spec !== "object" || Array.isArray(spec)) return problems;
  const normalized = normalizeAiBlockSpec(spec);
  if (!normalized) return problems;
  if (!AVAILABLE_BLOCK_TYPES.includes(normalized.type)) {
    problems.push(normalized.type || "tipo_desconocido");
  }
  Object.values(normalized.inputs || {}).forEach((child) => validateAiBlockSpec(child, problems));
  Object.values(normalized.statements || {}).flatMap((child) => Array.isArray(child) ? child : [child]).forEach((child) => validateAiBlockSpec(child, problems));
  if (normalized.next) validateAiBlockSpec(normalized.next, problems);
  return problems;
}

function createSteamStepState() {
  return {
    processed: 0,
    undoSnapshot: null,
    refs: new Map(),
    chains: new Map(),
    queue: Promise.resolve(),
    touched: false,
    clearCount: 0,
    blockCount: 0,
  };
}

function extractSteamStepActions(text) {
  const source = String(text || "");
  const start = source.match(/```steam_steps\s*/i);
  if (!start) return [];
  const from = (start.index || 0) + start[0].length;
  const end = source.indexOf("```", from);
  const body = source.slice(from, end === -1 ? source.length : end);
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") && line.endsWith("}"))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function connectStepBlockToStatement(target, inputName, block, stepState) {
  const input = target?.getInput?.(inputName);
  if (!input?.connection || !block?.previousConnection) return false;
  const key = `${target.id}:${inputName}`;
  let previous = stepState.chains.get(key);
  if (!previous) {
    previous = input.connection.targetBlock();
    while (previous?.nextConnection?.targetBlock()) previous = previous.nextConnection.targetBlock();
  }
  if (previous?.nextConnection && !previous.nextConnection.isConnected()) previous.nextConnection.connect(block.previousConnection);
  else if (!input.connection.isConnected()) input.connection.connect(block.previousConnection);
  else return false;
  stepState.chains.set(key, block);
  return true;
}

async function applySteamStepAction(action, stepState) {
  if (!workspace || !action || typeof action !== "object") return;
  if (!stepState.undoSnapshot) stepState.undoSnapshot = Blockly.serialization.workspaces.save(workspace);

  if (action.action === "clear") {
    setTab("blocks");
    animateWorkspace("clear");
    await wait(settings.visualMode === "simple" ? 40 : 180);
    workspace.clear();
    stepState.refs.clear();
    stepState.chains.clear();
    stepState.touched = true;
    stepState.clearCount += 1;
    refreshCode();
    scheduleSave();
    return;
  }

  const blockSpec = action.block || (action.action === "program" ? { type: "steam_program" } : null);
  if (!blockSpec) return;
  const unsupported = validateAiBlockSpec(blockSpec);
  if (unsupported.length) return;

  const block = createAiBlock(blockSpec, { shallow: true });
  if (!block) return;
  if (action.id) stepState.refs.set(action.id, block);

  const target = action.target ? stepState.refs.get(action.target) : null;
  const attached = target && action.input ? connectStepBlockToStatement(target, action.input, block, stepState) : false;
  if (!attached && !block.getParent()) block.moveBy(Number(action.x ?? 36), Number(action.y ?? 36 + stepState.refs.size * 80));

  setTab("blocks");
  animateWorkspace("place");
  block.select();
  animateAiBlock(block);
  sound.play("connect");
  stepState.touched = true;
  stepState.blockCount += 1;
  refreshCode();
  scheduleSave();
  scheduleSvgResize();
  await wait(settings.visualMode === "simple" ? 45 : settings.visualMode === "detailed" ? 120 : 110);
  await hydrateAiBlock(block, blockSpec, stepState);
}

function processSteamSteps(text, stepState) {
  const actions = extractSteamStepActions(text);
  const pending = actions.slice(stepState.processed);
  stepState.processed = actions.length;
  pending.forEach((action) => {
    stepState.queue = stepState.queue.then(() => applySteamStepAction(action, stepState));
  });
}

function planToStepActions(plan) {
  const actions = [];
  if (plan?.replace !== false) actions.push({ action: "clear" });
  const startX = Number(plan?.x ?? 36);
  const startY = Number(plan?.y ?? 36);
  (plan?.blocks || []).forEach((spec, index) => {
    const normalized = normalizeAiBlockSpec(spec);
    if (!normalized) return;
    if (normalized.type === "steam_program") {
      const id = `program_${index}`;
      actions.push({ action: "program", id, x: Number(spec.x ?? startX), y: Number(spec.y ?? startY + index * 120) });
      Object.entries(normalized.statements || {}).forEach(([input, children]) => {
        (Array.isArray(children) ? children : [children]).forEach((child) => {
          actions.push({ action: "append", target: id, input, block: child });
        });
      });
    } else {
      if (AVAILABLE_BLOCK_TYPES.includes(normalized.type)) {
        actions.push({ action: "append", id: `block_${index}`, x: Number(spec.x ?? startX), y: Number(spec.y ?? startY + index * 120), block: spec });
      }
    }
  });
  return actions;
}

function getWorkspaceBlock(type) {
  return workspace?.getAllBlocks(false).find((block) => block.type === type) || null;
}

function hasWorkspaceBlock(type) {
  return Boolean(getWorkspaceBlock(type));
}

function parseWifiCredentials(userText) {
  const text = String(userText || "");
  const ssid = text.match(/\b(?:mi\s+)?(?:wifi|wi-fi|ssid|red)\s*(?:es|se\s+llama|llamada|llamado|:|=)?\s*["']?([^"',.;\n]+?)["']?(?=\s+(?:con\s+)?(?:clave|password|contrasena|contrase\S*a)\b|[.;,\n]|$)/i)?.[1]?.trim();
  const password = text.match(/\b(?:contrasena|contrase\S*a|password|clave)\s+(?:wifi|wi-fi)?\s*(?:es)?\s*["']?([^"',.;\s\n]{1,64})["']?/i)?.[1];
  const rememberedSsid = memoryGet("wifi_ssid");
  const rememberedPassword = memoryGet("wifi_password");
  const cleanSsid = ssid && !/^(es|se|llama|llamada|llamado)$/i.test(ssid) ? ssid : null;
  return (cleanSsid || rememberedSsid) && (password || rememberedPassword)
    ? { ssid: cleanSsid || rememberedSsid, password: password || rememberedPassword }
    : null;
}

function parseTelegramToken(userText) {
  return String(userText || "").match(/\b\d{8,12}:[A-Za-z0-9_-]{20,}\b/)?.[0] || memoryGet("telegram_token");
}

function getOrCreateProgramBlock(stepState) {
  let program = getWorkspaceBlock("steam_program");
  if (program) return program;
  program = createAiBlock({ type: "steam_program" }, { shallow: true });
  program.moveBy(36, 36);
  stepState.refs.set("main", program);
  animateAiBlock(program);
  stepState.touched = true;
  stepState.blockCount += 1;
  return program;
}

async function appendSpecToProgram(inputName, spec, stepState) {
  const program = getOrCreateProgramBlock(stepState);
  const block = createAiBlock(spec, { shallow: true });
  if (!block) return false;
  connectStepBlockToStatement(program, inputName, block, stepState);
  animateAiBlock(block);
  sound.play("connect");
  stepState.touched = true;
  stepState.blockCount += 1;
  refreshCode();
  scheduleSave();
  scheduleSvgResize();
  await wait(settings.visualMode === "simple" ? 45 : 120);
  await hydrateAiBlock(block, spec, stepState);
  return true;
}

function telegramCommandIntent(userText) {
  const text = String(userText || "").toLowerCase();
  if (!text.includes("telegram") && !text.includes("bot")) return null;
  if (text.includes("/led=on") || text.includes("/led=off") || text.includes("enciende") || text.includes("apaga")) {
    const pinMatch = text.match(/pin\s*(\d+)/);
    return { kind: "led_on_off", pin: pinMatch?.[1] || "18" };
  }
  if (text.includes("/ip") || text.includes(" ip")) return { kind: "ip" };
  return null;
}

function telegramCommandBlocks(intent) {
  if (!intent) return [];
  if (intent.kind === "ip") {
    return [{
      type: "steam_telegram_if_command",
      fields: { COMMAND: "/ip" },
      statements: { DO: [{ type: "steam_telegram_send_ip" }] },
    }];
  }
  return [
    {
      type: "steam_telegram_if_command",
      fields: { COMMAND: "/led=ON" },
      statements: { DO: [{ type: "steam_digital_write", fields: { PIN: intent.pin, STATE: "1" } }] },
    },
    {
      type: "steam_telegram_if_command",
      fields: { COMMAND: "/led=OFF" },
      statements: { DO: [{ type: "steam_digital_write", fields: { PIN: intent.pin, STATE: "0" } }] },
    },
  ];
}

async function ensureTelegramCommandHandler(userText, stepState) {
  const intent = telegramCommandIntent(userText);
  if (!intent || getWorkspaceBlock("steam_telegram_on_message")) return false;
  if (!stepState.undoSnapshot) stepState.undoSnapshot = Blockly.serialization.workspaces.save(workspace);
  const program = getOrCreateProgramBlock(stepState);
  const handlerSpec = {
    type: "steam_telegram_on_message",
    statements: { DO: telegramCommandBlocks(intent) },
  };
  const handler = createAiBlock(handlerSpec, { shallow: true });
  connectStepBlockToStatement(program, "LOOP", handler, stepState);
  animateAiBlock(handler);
  sound.play("connect");
  stepState.touched = true;
  stepState.blockCount += 1;
  refreshCode();
  scheduleSave();
  scheduleSvgResize();
  await wait(settings.visualMode === "simple" ? 45 : 130);
  await hydrateAiBlock(handler, handlerSpec, stepState);
  return true;
}

async function auditAndCompleteWorkspace(userText, stepState) {
  let changed = false;
  const lower = String(userText || "").toLowerCase();
  const wifi = parseWifiCredentials(userText);
  const token = parseTelegramToken(userText);

  if (wifi && !hasWorkspaceBlock("steam_wifi_connect")) {
    changed = await appendSpecToProgram("SETUP", {
      type: "steam_wifi_connect",
      inputs: { SSID: wifi.ssid, PASSWORD: wifi.password, TIMEOUT: 20 },
    }, stepState) || changed;
  }

  if ((lower.includes("telegram") || lower.includes("bot")) && token && !hasWorkspaceBlock("steam_telegram_token")) {
    changed = await appendSpecToProgram("SETUP", {
      type: "steam_telegram_token",
      inputs: { TOKEN: token },
    }, stepState) || changed;
  }

  changed = await ensureTelegramCommandHandler(userText, stepState) || changed;

  if (lower.includes("neopixel") && !hasWorkspaceBlock("steam_neopixel_init")) {
    const pin = lower.match(/pin\s*(\d+)/)?.[1] || "18";
    const count = lower.includes("16x16") ? 256 : 8;
    changed = await appendSpecToProgram("SETUP", { type: "steam_neopixel_init", fields: { PIN: pin }, inputs: { COUNT: count } }, stepState) || changed;
    changed = await appendSpecToProgram("LOOP", { type: "steam_neopixel_fill", fields: { PIN: pin }, inputs: { R: 0, G: 0, B: 255 } }, stepState) || changed;
    changed = await appendSpecToProgram("LOOP", { type: "steam_neopixel_show", fields: { PIN: pin } }, stepState) || changed;
  }

  if ((lower.includes("bluetooth") || lower.includes("ble")) && lower.includes("telegram") && !hasWorkspaceBlock("steam_ble_scan_send_telegram")) {
    changed = await appendSpecToProgram("LOOP", {
      type: "steam_telegram_on_message",
      statements: {
        DO: [{
          type: "steam_telegram_if_command",
          fields: { COMMAND: "/bluetooth" },
          statements: { DO: [{ type: "steam_ble_scan_send_telegram", inputs: { MS: 5000 } }] },
        }],
      },
    }, stepState) || changed;
  }

  return changed;
}

function blockActionMessage(text, stepState, plan) {
  const visible = stripPythonCodeBlocks(stripSteamBlockPlans(stripEmojis(text))).trim();
  if (visible && !/^colocando bloques/i.test(visible)) return visible;
  const actions = stepState?.touched ? stepState : {
    clearCount: plan?.replace !== false ? 1 : 0,
    blockCount: plan?.blocks?.length || 0,
  };
  if (actions.clearCount && !actions.blockCount) return "Listo. He borrado todos los bloques.";
  if (actions.clearCount && actions.blockCount) return "Listo. He borrado los bloques anteriores y he colocado el nuevo programa en el playground.";
  if (actions.blockCount) return "Listo. He añadido los bloques al playground.";
  return "Listo. He actualizado el playground.";
}

async function applyPlanAsAnimatedSteps(plan) {
  const stepState = createSteamStepState();
  const actions = planToStepActions(plan);
  for (const action of actions) {
    await applySteamStepAction(action, stepState);
  }
  return stepState.touched ? stepState.undoSnapshot : null;
}

function valueBlockFromPrimitive(value) {
  const numeric = typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value.trim()));
  const block = workspace.newBlock(numeric ? "math_number" : typeof value === "boolean" ? "logic_boolean" : "text");
  if (numeric) block.setFieldValue(String(value), "NUM");
  else if (typeof value === "boolean") block.setFieldValue(value ? "TRUE" : "FALSE", "BOOL");
  else block.setFieldValue(String(value ?? ""), "TEXT");
  block.initSvg();
  block.render();
  return block;
}

function connectChain(blocks, connection) {
  let previous = null;
  blocks.forEach((block) => {
    if (!block) return;
    if (!previous) {
      if (connection && block.previousConnection) connection.connect(block.previousConnection);
    } else if (previous.nextConnection && block.previousConnection) {
      previous.nextConnection.connect(block.previousConnection);
    }
    previous = block;
  });
}

function createAiBlock(spec, options = {}) {
  if (spec === null || spec === undefined) return null;
  if (typeof spec !== "object" || Array.isArray(spec)) return valueBlockFromPrimitive(spec);
  spec = normalizeAiBlockSpec(spec);
  if (!spec) return null;
  const inputs = { ...(spec.inputs || {}), ...(spec.values || {}) };
  const statements = { ...(spec.statements || {}) };
  let block;
  try {
    block = workspace.newBlock(spec.type || "steam_comment");
  } catch {
    return null;
  }
  const fields = { ...(spec.fields || {}) };
  Object.entries(fields).forEach(([name, value]) => {
    if (block.getField(name)) block.setFieldValue(String(value), name);
  });
  if (spec.extraState && typeof block.loadExtraState === "function") block.loadExtraState(spec.extraState);
  block.initSvg();
  block.render();

  if (!options.shallow) {
    Object.entries(inputs).forEach(([name, childSpec]) => {
      const input = block.getInput(name);
      const child = createAiBlock(childSpec);
      if (input?.connection && child?.outputConnection) input.connection.connect(child.outputConnection);
    });

    Object.entries(statements).forEach(([name, childSpecs]) => {
      const input = block.getInput(name);
      const children = (Array.isArray(childSpecs) ? childSpecs : [childSpecs]).map(createAiBlock);
      connectChain(children, input?.connection);
    });

    if (spec.next) {
      const next = createAiBlock(spec.next);
      if (next?.previousConnection && block.nextConnection) block.nextConnection.connect(next.previousConnection);
    }
  }

  return block;
}

async function hydrateAiBlock(block, spec, stepState) {
  if (!block || spec === null || spec === undefined || typeof spec !== "object" || Array.isArray(spec)) return;
  spec = normalizeAiBlockSpec(spec);
  if (!spec) return;
  const inputs = { ...(spec.inputs || {}), ...(spec.values || {}) };
  const statements = { ...(spec.statements || {}) };

  for (const [name, childSpec] of Object.entries(inputs)) {
    const input = block.getInput(name);
    const child = createAiBlock(childSpec, { shallow: true });
    if (input?.connection && child?.outputConnection) {
      input.connection.connect(child.outputConnection);
      animateAiBlock(child);
      refreshCode();
      scheduleSave();
      scheduleSvgResize();
      await wait(settings.visualMode === "simple" ? 30 : 85);
      await hydrateAiBlock(child, childSpec, stepState);
    }
  }

  for (const [name, childSpecs] of Object.entries(statements)) {
    const input = block.getInput(name);
    for (const childSpec of (Array.isArray(childSpecs) ? childSpecs : [childSpecs])) {
      const child = createAiBlock(childSpec, { shallow: true });
      if (!child) continue;
      connectStepBlockToStatement(block, name, child, stepState);
      animateAiBlock(child);
      refreshCode();
      scheduleSave();
      scheduleSvgResize();
      await wait(settings.visualMode === "simple" ? 45 : settings.visualMode === "detailed" ? 100 : 105);
      await hydrateAiBlock(child, childSpec, stepState);
    }
  }
}

async function applySteamBlockPlan(plan) {
  if (!workspace || !plan?.blocks?.length || aiApplyingBlocks) return null;
  const unsupported = [...new Set(plan.blocks.flatMap((block) => validateAiBlockSpec(block)))];
  if (unsupported.length) {
    appendAiMessage("system", `SteamBot intento usar bloques no disponibles: ${unsupported.join(", ")}. No he tocado el lienzo.`);
    return null;
  }
  return applyPlanAsAnimatedSteps(plan);
  aiApplyingBlocks = true;
  const before = Blockly.serialization.workspaces.save(workspace);
  try {
    setTab("blocks");
    if (plan.replace !== false) {
      animateWorkspace("clear");
      await wait(settings.visualMode === "simple" ? 60 : 220);
      workspace.clear();
    }
    const startX = Number(plan.x ?? 36);
    const startY = Number(plan.y ?? 36);
    animateWorkspace("place");
    for (const [index, spec] of plan.blocks.entries()) {
      const block = createAiBlock(spec);
      if (!block) continue;
      if (!block.getParent()) block.moveBy(Number(spec.x ?? startX), Number(spec.y ?? startY + index * 120));
      block.select();
      animateAiBlock(block);
      sound.play("connect");
      refreshCode();
      scheduleSave();
      scheduleSvgResize();
      await wait(settings.visualMode === "simple" ? 80 : settings.visualMode === "detailed" ? 140 : 130);
    }
    refreshCode();
    scheduleSave();
    return before;
  } finally {
    aiApplyingBlocks = false;
  }
}

function buildSystemPrompt() {
  const code = getActiveCode();
  const consoleText = Array.from(els.consoleOutput.childNodes)
    .map((n) => n.textContent)
    .join("")
    .slice(-1800);
  const boardStatus = serial.connected
    ? "CONECTADA — ESP32 Plus STEAMakers via WebSerial USB 115200 baud, MicroPython v1.28+"
    : "SIN PLACA — ningún dispositivo conectado";

  const availableBlocks = AVAILABLE_BLOCK_TYPES.join(", ");
  const memoryContext = buildMemoryContext();

  return `Eres SteamBot, asistente experto integrado en el IDE NEW STEAMMAKERS (Blockly + MicroPython + WebSerial para ESP32 Plus STEAMakers 32-WROOM). Tambien conoces los shields Imagina TdR STEAM e Imagina 3DBot.

ESTADO DE LA PLACA: ${boardStatus}

${memoryContext ? `${memoryContext}\n` : ""}

CÓDIGO ACTIVO EN EL EDITOR (MicroPython generado por los bloques del usuario):
\`\`\`python
${code.trim() || "# editor vacío"}
\`\`\`

ÚLTIMAS LÍNEAS DE LA CONSOLA REPL DE LA PLACA:
\`\`\`
${consoleText.trim() || "(consola vacía)"}
\`\`\`

CATEGORÍAS DE BLOQUES DISPONIBLES EN EL IDE:
${BLOCK_RESEARCH_SUMMARY.join("\n")}

TIPOS DE BLOQUES VALIDOS. Usa solo estos nombres exactos en steam_blocks:
${availableBlocks}

INSTRUCCIONES:
- Placa objetivo real: ESP32 Plus STEAMakers 32-WROOM. Respeta sus etiquetas D0-D13/A0-A3 y el pinout probado del proyecto.
- Para TdR STEAM usa solo bloques tdr_* disponibles: LEDs, RGB, pulsadores SW1/SW2, zumbador, DHT11, potenciometro, LDR y LM35.
- Para 3DBot usa solo bloques dbot_* disponibles: motores, avanzar/retroceder/girar/parar, distancia, siguelineas, pulsador, LDR, NTC y LEDs.
- Autoverificacion obligatoria antes de responder: revisa si has incluido todo lo pedido, si faltan WiFi/token/chat ID, si todos los tipos de bloque existen y si el programa funcionaria en MicroPython. Corrige antes de contestar.
- Si hay credenciales en memoria persistente, usalas directamente. Si falta un dato imprescindible, pidelo de forma clara y no inventes valores.
- Si el usuario ya especifica un pin, token, SSID, clave, comando o duracion, no pidas confirmacion: usalo.
- Para cualquier comando de Telegram debes crear siempre steam_telegram_on_message en LOOP y dentro comparar steam_telegram_text con el comando pedido mediante controls_if + logic_compare.
- No uses emojis ni pictogramas.
- La forma predeterminada de trabajar es con bloques. Si el usuario pide crear, borrar, cambiar, montar o programar algo, responde principalmente con \`\`\`steam_blocks\`\`\`; no des codigo Python salvo que el usuario lo pida explicitamente o sea imprescindible.
- Cuando actues sobre bloques, termina siempre con una frase visible breve, por ejemplo: "Listo. He borrado todos los bloques." o "Listo. He colocado el programa en bloques.".
- Para peticiones de bloques, no incluyas \`\`\`python\`\`\` salvo que el usuario lo pida literalmente.
- Para que el usuario vea los bloques aparecer mientras respondes, usa preferentemente \`\`\`steam_steps\`\`\` antes de tu explicacion. Escribe una accion JSON por linea, sin comas entre lineas.
- Acciones steam_steps: {"action":"clear"} limpia el lienzo. {"action":"program","id":"main","x":36,"y":36} crea el bloque programa. {"action":"append","target":"main","input":"SETUP","block":{...}} anade un bloque a "al iniciar". {"action":"append","target":"main","input":"LOOP","block":{...}} anade un bloque a "repetir siempre".
- Ejemplo steam_steps:
\`\`\`steam_steps
{"action":"clear"}
{"action":"program","id":"main","x":36,"y":36}
{"action":"append","target":"main","input":"SETUP","block":{"type":"steam_wifi_connect","inputs":{"SSID":"MiWiFi","PASSWORD":"clave","TIMEOUT":20}}}
\`\`\`
- Si devuelves \`\`\`steam_blocks\`\`\`, no digas que no hay bloques disponibles si el tipo existe en la lista anterior.
- Usa solo tipos de bloque de la lista "TIPOS DE BLOQUES VALIDOS". Nunca inventes nombres de bloques.
- Si el usuario pide crear, modificar o montar un programa con bloques, debes devolver un bloque \`\`\`steam_blocks\`\`\` con JSON valido. No lo pongas dentro de \`\`\`python\`\`\`.
- Formato steam_blocks: {"replace":true,"blocks":[{"type":"steam_program","statements":{"SETUP":[...],"LOOP":[...]}}]}. Usa "fields" para campos, "inputs" para valores y "statements" para pilas.
- Para valores simples usa numeros, strings o booleanos en "inputs"; la app los convierte en bloques de numero/texto/booleano.
- Para WiFi usa exactamente: {"type":"steam_wifi_connect","inputs":{"SSID":"nombre","PASSWORD":"clave","TIMEOUT":20}}. No inventes steam_wifi_init_client ni steam_wifi_print_status.
- Para imprimir la IP usa: {"type":"steam_print","inputs":{"TEXT":{"type":"steam_wifi_ifconfig","fields":{"PART":"0"}}}}.
- Para Telegram usa: steam_telegram_token en SETUP, steam_telegram_on_message dentro del LOOP, controls_if con logic_compare para comprobar steam_telegram_text == "/ip", y steam_telegram_send con CHAT=steam_telegram_chat y TEXT=steam_wifi_ifconfig PART 0.
- Si el usuario pide comandos Telegram como /led=ON y /led=OFF, es obligatorio crear steam_telegram_on_message en LOOP con dos controls_if: uno compara steam_telegram_text con "/led=ON" y pone el pin en ON; otro compara con "/led=OFF" y lo pone en OFF.
- Si el usuario pide /bluetooth por Telegram, usa steam_ble_scan_send_telegram dentro de un controls_if que compare steam_telegram_text con "/bluetooth". No digas que no existe BLE scan: el bloque valido es steam_ble_scan_send_telegram.
- Para NeoPixel 16x16 azul en pin 18 usa exactamente: steam_neopixel_init con fields {"PIN":"18"} e inputs {"COUNT":256}; luego steam_neopixel_fill con fields {"PIN":"18"} e inputs {"R":0,"G":0,"B":255}; luego steam_neopixel_show con fields {"PIN":"18"}. No pongas COUNT/R/G/B en fields.
- Ejemplo Telegram /ip: {"replace":true,"blocks":[{"type":"steam_program","statements":{"SETUP":[{"type":"steam_wifi_connect","inputs":{"SSID":"MiWiFi","PASSWORD":"clave","TIMEOUT":20}},{"type":"steam_telegram_token","inputs":{"TOKEN":"TOKEN"}}],"LOOP":[{"type":"steam_telegram_on_message","statements":{"DO":[{"type":"controls_if","inputs":{"IF0":{"type":"logic_compare","fields":{"OP":"EQ"},"inputs":{"A":{"type":"steam_telegram_text"},"B":"/ip"}}},"statements":{"DO0":[{"type":"steam_telegram_send","fields":{"MODE":"none"},"inputs":{"CHAT":{"type":"steam_telegram_chat"},"TEXT":{"type":"steam_wifi_ifconfig","fields":{"PART":"0"}}}}]}}]}}]}}]}.
- Ejemplo LED: {"replace":true,"blocks":[{"type":"steam_program","statements":{"LOOP":[{"type":"steam_digital_write","fields":{"PIN":"2","STATE":"1"}},{"type":"steam_sleep_ms","inputs":{"MS":500}},{"type":"steam_digital_write","fields":{"PIN":"2","STATE":"0"}},{"type":"steam_sleep_ms","inputs":{"MS":500}}]}}]}.
- Responde en español de España, de forma concisa y práctica.
- Cuando generes código Python ejecutable, ponlo SIEMPRE en bloques \`\`\`python\`\`\` — el usuario podrá enviarlo directamente a la placa con el botón "Ejecutar en placa" o cargarlo en el editor con "Cargar en editor".
- Analiza los errores de la consola y propón correcciones concretas.
- Si necesitas ejecutar código en la placa para diagnosticar, díselo al usuario y genera el código en un bloque python.
- Si la placa no está conectada y el usuario quiere ejecutar algo, indícaselo.
- Mantén el contexto de la conversación.
- Sé directo: menos texto, más código útil.`;
}

function normalizeOllamaEndpoint(endpoint) {
  const trimmed = String(endpoint || DEFAULT_SETTINGS.ollamaEndpoint).trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_SETTINGS.ollamaEndpoint;
  return trimmed.replace(/\/api\/v1$/i, "/v1");
}

function localOllamaProxyCandidates() {
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1";
  return isLocal
    ? ["/api/ollama", "http://127.0.0.1:3001/api/ollama", "/proxy/ollama/chat/completions"]
    : ["/api/ollama", "/proxy/ollama/chat/completions"];
}

async function fetchOllamaProxy(requestInit) {
  const candidates = localOllamaProxyCandidates();
  const attempts = [];

  for (const url of candidates) {
    try {
      const response = await fetch(url, requestInit);
      if (response.status !== 404 || url === candidates.at(-1)) {
        return { response, proxyUrl: url, attempts };
      }
      attempts.push(`${url}: HTTP 404`);
    } catch (error) {
      attempts.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
      if (url === candidates.at(-1)) throw error;
    }
  }

  throw new Error(`No se pudo alcanzar ningun proxy Ollama.\n${attempts.join("\n")}`);
}

async function readStreamingChatResponse(response, onText) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.body || !contentType.includes("text/event-stream")) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.message?.content || "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const data = JSON.parse(payload);
        const delta =
          data.choices?.[0]?.delta?.content ??
          data.choices?.[0]?.message?.content ??
          data.message?.content ??
          data.response ??
          "";
        if (delta) {
          fullText += delta;
          onText(fullText);
        }
      } catch {
        // Some providers flush keep-alive fragments; ignore those.
      }
    }
  }

  return fullText;
}

function showAiThinking(msg) {
  msg.classList.remove("is-streaming");
  msg.innerHTML = '<div class="ai-thinking"><span></span><span></span><span></span></div>';
}

async function sendAiMessage(userText) {
  if (!userText.trim() || aiTyping) return;
  if (!settings.ollamaApiKey) {
    if (!aiOpen) setAiPanel(true);
    appendAiMessage(
      "assistant",
      "Necesitas configurar tu API key de Ollama. Ve a **Ajustes** (icono ☰ arriba a la izquierda) → **Asistente IA** y pega tu clave. Consíguelas en ollama.com."
    );
    return;
  }
  aiTyping = true;
  els.aiSendBtn.disabled = true;
  els.aiInput.disabled = true;
  appendAiMessage("user", userText);
  const memoryChanges = autoExtractMemory(userText);
  if (memoryChanges.length) console.debug("[SteamBot memory]", memoryChanges);
  aiHistory.push({ role: "user", content: userText });
  const responseEl = createStreamingAiMessage();
  showAiThinking(responseEl);
  const stepState = createSteamStepState();
  const ollamaEndpoint = normalizeOllamaEndpoint(settings.ollamaEndpoint || DEFAULT_SETTINGS.ollamaEndpoint);
  let proxyUrl = "/api/ollama";
  let proxyAttempts = [];
  try {
    const messages = [{ role: "system", content: buildSystemPrompt() }, ...aiHistory];
    const { response: res, proxyUrl: usedProxyUrl, attempts } = await fetchOllamaProxy({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.ollamaApiKey}`,
        "X-Ollama-Endpoint": ollamaEndpoint,
      },
      body: JSON.stringify({
        model: settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel,
        messages,
        stream: true,
        temperature: 0.7,
      }),
    });
    proxyUrl = usedProxyUrl;
    proxyAttempts = attempts;
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status} — ${errText}`);
    }
    let reply = await readStreamingChatResponse(res, (partial) => {
      updateAiMessage(responseEl, partial);
      processSteamSteps(partial, stepState);
    });
    await stepState.queue;
    await auditAndCompleteWorkspace(userText, stepState);
    reply = stripEmojis(reply || "(Sin respuesta del modelo)");
    aiHistory.push({ role: "assistant", content: reply });
    if (aiHistory.length > 40) aiHistory.splice(0, 2);
    const plan = extractSteamBlockPlan(reply);
    let finalText = plan ? stripPythonCodeBlocks(reply) : reply;
    if (stepState.touched) {
      finalText = blockActionMessage(finalText, stepState, plan);
      updateAiMessage(responseEl, finalText);
      responseEl.classList.remove("is-streaming");
      addAiUndoButton(responseEl, stepState.undoSnapshot);
    } else if (plan) {
      const undoSnapshot = await applySteamBlockPlan(plan);
      await auditAndCompleteWorkspace(userText, stepState);
      finalText = blockActionMessage(finalText, null, plan);
      updateAiMessage(responseEl, finalText);
      responseEl.classList.remove("is-streaming");
      addAiUndoButton(responseEl, undoSnapshot);
    } else {
      updateAiMessage(responseEl, finalText);
      responseEl.classList.remove("is-streaming");
    }
  } catch (err) {
    responseEl.remove();
    const isNetwork = err instanceof TypeError;
    const attemptsText = proxyAttempts.length
      ? `\n\nIntentos previos:\n\`\`\`\n${proxyAttempts.join("\n")}\n\`\`\``
      : "";
    const detail = isNetwork
      ? `**Error de red** — no se pudo alcanzar el proxy local.\n\nAsegúrate de que el servidor está corriendo con \`npm run dev\` (o \`node server.js\`).\n\n\`\`\`\n${err.message}\n\`\`\``
      : `**${err.message}**\n\nProxy: \`${proxyUrl}\`\nEndpoint destino: \`${ollamaEndpoint}\`\nModelo: \`${settings.ollamaModel || DEFAULT_SETTINGS.ollamaModel}\``;
    appendAiMessage("assistant", `Error al conectar con Ollama:\n\n${detail}${attemptsText}`);
  } finally {
    aiTyping = false;
    els.aiSendBtn.disabled = false;
    els.aiInput.disabled = false;
    els.aiInput.focus();
  }
}

async function runCodeFromAi(code) {
  try {
    if (!serial.connected) {
      appendAiMessage("system", "No hay placa conectada. Conecta primero la ESP32.");
      return;
    }
    setAiPanel(false);
    appendConsole("# IA: ejecutando código\n", "host");
    await serial.runInMemory(code);
  } catch (e) {
    appendAiMessage("system", `Error al ejecutar: ${e.message}`);
  }
}

function loadCodeFromAi(code) {
  manualCode = code;
  setCodeMode("manual");
  setTab("code");
  appendAiMessage("system", "Código cargado en el editor en modo Manual.");
}

// ─── AI resize handle ──────────────────────────────────────────────────────
function initAiResize() {
  let isResizing = false;
  let startX, startW;
  els.aiResizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startW = els.aiPanel.offsetWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const diff = startX - e.clientX;
    const newW = Math.max(280, Math.min(680, startW + diff));
    document.documentElement.style.setProperty("--ai-panel-w", `${newW}px`);
  });
  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });
}

// ─── Init ──────────────────────────────────────────────────────────────────
defineSteamBlocks();
const initialState = loadState();
if (initialState?.settings) settings = { ...DEFAULT_SETTINGS, ...initialState.settings };
manualCode = initialState?.manualCode || "";
activeTab = initialState?.activeTab || "blocks";
drawerTab = "settings";
codeMode = initialState?.codeMode || "blocks";

applySettings();
injectWorkspace(initialState?.workspace);
refreshCode();
setCodeMode(codeMode);
setTab(activeTab);
setDrawerTab("settings");
initAiResize();
renderSamiAccount();
handleSamiCallback().finally(() => {
  if (!samiSession && !visitorMode && !authGateError && window.location.pathname !== "/auth/callback") {
    setSamiGate(true);
  }
});

// ─── Event listeners ───────────────────────────────────────────────────────
document.querySelectorAll(".tab-button").forEach((b) => {
  b.addEventListener("click", () => { sound.play("tap"); setTab(b.dataset.tab); });
});

document.querySelectorAll(".segment").forEach((b) => {
  b.addEventListener("click", () => { sound.play("tap"); setCodeMode(b.dataset.codeMode); });
});

document.querySelectorAll("[data-drawer-tab]").forEach((b) => {
  b.addEventListener("click", () => { sound.play("tap"); setDrawerTab(b.dataset.drawerTab); });
});

document.querySelectorAll("[data-tab-jump]").forEach((b) => {
  b.addEventListener("click", () => { sound.play("tap"); setTab(b.dataset.tabJump); setDrawer(false); });
});

document.querySelectorAll('input[name="theme"]').forEach((i) => {
  i.addEventListener("change", () => { settings.theme = i.value; applySettings(); sound.play("tap"); });
});

document.querySelectorAll('input[name="visualMode"]').forEach((i) => {
  i.addEventListener("change", () => { settings.visualMode = i.value; applySettings({ rebuild: true }); sound.play("connect"); });
});

els.soundMuted.addEventListener("change", () => {
  settings.soundMuted = els.soundMuted.checked;
  applySettings();
  if (!settings.soundMuted) sound.play("tap");
});

els.soundVolume.addEventListener("input", () => {
  settings.soundVolume = Number(els.soundVolume.value);
  applySettings();
});

els.testSoundButton.addEventListener("click", () => sound.play("success"));

// Ollama settings
["ollamaApiKey", "ollamaModel"].forEach((key) => {
  const el = els[key];
  if (el) el.addEventListener("change", () => { settings[key] = el.value.trim(); scheduleSave(); });
});

document.querySelector("#toggleApiKey")?.addEventListener("click", () => {
  const isHidden = els.ollamaApiKey.type === "password";
  els.ollamaApiKey.type = isHidden ? "text" : "password";
  document.querySelector("#toggleApiKey").innerHTML = `<i data-lucide="${isHidden ? "eye-off" : "eye"}"></i>`;
  createIcons({ icons });
});

// Drawer
els.drawerButton.addEventListener("click", () => { sound.play("tap"); setDrawerTab("settings"); setDrawer(!drawerOpen); });
document.querySelectorAll("[data-drawer-close]").forEach((b) => b.addEventListener("click", () => setDrawer(false)));
els.drawerBackdrop.addEventListener("click", () => setDrawer(false));
els.mpCancelButton.addEventListener("click", hideMicroPythonMissingPopup);
els.mpInstallButton.addEventListener("click", () => {
  location.href = mpFlasherUrl();
});

els.samiLoginButton.addEventListener("click", startSamiLogin);
els.samiVisitorButton.addEventListener("click", setVisitorMode);
els.samiSettingsLoginButton.addEventListener("click", startSamiLogin);
els.samiSettingsLogoutButton.addEventListener("click", logoutSami);
els.samiAccountButton.addEventListener("click", () => {
  sound.play("tap");
  setDrawerTab("settings");
  setDrawer(true);
});

// Code editor
els.codeEditor.addEventListener("input", () => {
  if (codeMode !== "manual") return;
  manualCode = els.codeEditor.value;
  scheduleSave();
});

els.syncEditorButton.addEventListener("click", () => {
  manualCode = generatedCode;
  setCodeMode("manual");
});

// Serial
els.connectButton.addEventListener("click", async () => {
  try {
    sound.play("tap");
    if (serial.connected) {
      await serial.disconnect();
    } else {
      await serial.connect(115200);
      await verifyConnectedMicroPython();
    }
  } catch (error) {
    appendConsole(`Error de conexión: ${error.message}\n`, "error");
  }
});

els.reconnectButton.addEventListener("click", async () => {
  try {
    sound.play("tap");
    setTab("console");
    await serial.reconnect();
    await verifyConnectedMicroPython();
  } catch (error) {
    appendConsole(`Error al reconectar: ${error.message}\n`, "error");
  }
});

// Run actions
els.runButton.addEventListener("click", () => runAction("run"));
els.saveRunButton.addEventListener("click", () => runAction("save"));
els.stopButton.addEventListener("click", stopScript);
els.interruptButton.addEventListener("click", stopScript);
els.undoButton.addEventListener("click", () => {
  if (!workspace) return;
  workspace.undo(true);
  refreshCode();
  sound.play("tap");
});
els.redoButton.addEventListener("click", () => {
  if (!workspace) return;
  workspace.undo(false);
  refreshCode();
  sound.play("tap");
});

els.resetButton.addEventListener("click", async () => {
  try {
    sound.play("tap");
    await ensureConnected();
    appendConsole("Reiniciando placa…\n", "host");
    await serial.softResetAndInterrupt();
  } catch (error) {
    appendConsole(`Error: ${error.message}\n`, "error");
  }
});

els.clearConsoleButton.addEventListener("click", () => {
  els.consoleOutput.textContent = "";
  els.replPrompt.textContent = ">>>";
});

els.consoleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cmd = els.consoleCommand.value;
  if (!cmd.trim()) return;
  try {
    await ensureConnected();
    appendConsole(`${els.replPrompt.textContent} ${cmd}\n`);
    await serial.command(cmd);
    els.consoleCommand.value = "";
  } catch (error) {
    appendConsole(`Error: ${error.message}\n`, "error");
  }
});

els.terminalPane.addEventListener("click", () => els.consoleCommand.focus());

// Project
els.exportButton.addEventListener("click", () => { sound.play("tap"); exportProject(); });
els.importInput.addEventListener("change", (e) => importProject(e.target.files?.[0]));
els.resetWorkspaceButton.addEventListener("click", () => { sound.play("tap"); resetWorkspace(); });

// AI Panel
document.querySelector("#aiPanelToggle").addEventListener("click", () => {
  sound.play("tap");
  setAiPanel(!aiOpen);
});

document.querySelector("#aiPanelClose").addEventListener("click", () => setAiPanel(false));

els.aiClearButton.addEventListener("click", () => {
  if (aiTyping) return;
  clearAiChat();
});

els.aiSendBtn.addEventListener("click", () => {
  const text = els.aiInput.value.trim();
  if (text) { sendAiMessage(text); els.aiInput.value = ""; }
});

els.aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = els.aiInput.value.trim();
    if (text) { sendAiMessage(text); els.aiInput.value = ""; }
  }
});

document.addEventListener("keydown", (e) => {
  if (!workspace || !(e.ctrlKey || e.metaKey)) return;
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if (e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    workspace.undo(true);
    refreshCode();
    sound.play("tap");
  } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
    e.preventDefault();
    workspace.undo(false);
    refreshCode();
    sound.play("tap");
  }
});

// AI quick chips
document.querySelectorAll(".ai-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const prompt = chip.dataset.prompt;
    if (prompt) { sendAiMessage(prompt); }
  });
});

// Serial events
serial.addEventListener("data", (e) => appendConsole(e.detail));
serial.addEventListener("status", (e) => setStatus(e.detail.message, e.detail.connected));
serial.addEventListener("error", (e) => appendConsole(`Serial error: ${e.detail.message}\n`, "error"));

setStatus(serial.isSupported() ? "Sin placa" : "WebSerial no disponible", false);

window.addEventListener("resize", scheduleSvgResize);
