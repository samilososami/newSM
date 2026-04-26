# NEW STEAMMAKERS — 14-Feature Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 improvements to NEW STEAMMAKERS: modular architecture, TdR STEAM + 3DBot blocks, undo/redo, AI persistent memory, optimized rendering, aesthetics overhaul, and better AI prompt.

**Architecture:** Split monolithic files into modules (steamBlocks-tdr.js, steamBlocks-3dbot.js, ai.js, memory.js). Main.js imports from these modules and stays lean. CSS handles all visual improvements including the new detailed mode look.

**Tech Stack:** Blockly 12.5.1, Vite 8, Vanilla JS (ES modules), MicroPython target, localStorage for persistence, Ollama API (OpenAI-compatible, SSE streaming).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/steamBlocks.js` | Modify | Core blocks, new generic blocks, bug fixes, exports `defineSteamBlocks`, `buildToolbox`, `buildMicroPythonCode` |
| `src/steamBlocks-tdr.js` | Create | TdR STEAM shield blocks + generators |
| `src/steamBlocks-3dbot.js` | Create | 3DBot robot shield blocks + generators |
| `src/ai.js` | Create | sendAiMessage, buildSystemPrompt, block-placement logic, all AI helpers |
| `src/memory.js` | Create | Persistent AI memory via localStorage (tokens, SSID, etc.) |
| `src/main.js` | Modify | Imports from new modules, undo/redo UI, remove auto-console, settings HTML, progress HTML |
| `src/style.css` | Modify | Settings aesthetics, detailed-mode visuals, progress popup redesign |

---

## PIN MAPPING (user's confirmed working mapping for ESP32 Plus STEAMakers)

```
D2 → GPIO12    D3 → GPIO13    D4 → GPIO5     D5 → GPIO23
D6 → GPIO19    D7 → GPIO18    D8 → GPIO26    D9 → GPIO25/DAC1
D10 → GPIO17   D11 → GPIO16   D12 → GPIO27   D13 → GPIO14
A0 → GPIO36    A1 → GPIO39    A2 → GPIO33    A3 → GPIO15
SDA → GPIO21   SCL → GPIO22
```

### TdR STEAM shield — hardcoded GPIOs (using confirmed mapping above)
| Component | D/A pin | GPIO |
|---|---|---|
| LED rojo (LED4) | D13 | 14 |
| LED azul (LED3) | D12 | 27 |
| LED RGB — Rojo | D6 | 19 |
| LED RGB — Verde | D9 | 25 |
| LED RGB — Azul | D10 | 17 |
| Pulsador SW1 | D2 | 12 |
| Pulsador SW2 | D7 | 18 |
| Zumbador | D8 | 26 |
| DHT11 | D4 | 5 |
| Potenciómetro | A0 | 36 |
| LDR (luz) | A1 | 39 |
| LM35 (temperatura) | A2 | 33 |
| Puerto libre digital D3 | D3 | 13 |
| Puerto libre digital D5 | D5 | 23 |
| Puerto libre analógico A3 | A3 | 15 |

### 3DBot shield — hardcoded GPIOs (using confirmed mapping above)
| Component | D/A pin | GPIO |
|---|---|---|
| Pulsador (shared w/ sonar echo) | D2 | 12 |
| LED verde + IR emitter | D3 | 13 |
| Ultrasónico TRIG | D4 | 5 |
| LED amarillo + siguelíneas IZQ | D5 | 23 |
| LED rojo + siguelíneas DER | D6 | 19 |
| Motor A dir1 | D7 | 18 |
| Motor A dir2 | D8 | 26 |
| Motor A velocidad (PWM) | D9 | 25 |
| Motor B velocidad (PWM) | D10 | 17 |
| Receptor IR | D11 | 16 |
| Motor B dir1 | D12 | 27 |
| Motor B dir2 | D13 | 14 |
| Zumbador | A0 | 36 |
| Puerto libre GVS | A1 | 39 |
| LDR (luz) | A2 | 33 |
| Termistor NTC | A3 | 15 |

---

## Task 1 — Audit existing blocks + add new generic blocks

**Files:**
- Modify: `src/steamBlocks.js`

### New blocks to add

Add the following block definitions to `blockDefinitions()` in steamBlocks.js, and their generators to `defineGenerators()`. All verified to work in MicroPython for ESP32.

**Blocks to add:**
- `steam_sleep_us` — `time.sleep_us(n)` (already in machine time module)
- `steam_pin_toggle` — toggle a digital pin value
- `steam_pwm_off` — deinit PWM on a pin
- `steam_i2c_write_reg` — I2C write register
- `steam_i2c_read_reg` — I2C read register
- `steam_esp32_hall` — ESP32 hall sensor (`esp32.hall_sensor()`)
- `steam_ntc_temperature` — NTC thermistor to Celsius (B-parameter formula)
- `steam_list_append` — list.append(item)
- `steam_list_pop` — list.pop()
- `steam_dict_new` — create empty dict `{}`
- `steam_dict_set` — dict[key] = value
- `steam_dict_get` — dict.get(key, default)
- `steam_random_float` — `random.random()`
- `steam_format_float` — `"{:.Xf}".format(val)` with configurable decimals
- `steam_pin_irq` — `pin.irq(handler, trigger)` for hardware interrupts

### Bugs to fix in existing blocks

- [ ] **Audit all blocks listed in AVAILABLE_BLOCK_TYPES**: read full steamBlocks.js and verify every type has a definition AND a generator. Any type missing either is broken.
- [ ] **Fix `steam_blynk_write` / `steam_thingspeak_write`**: confirm they have block definitions and working generators.
- [ ] **Fix `steam_http_param`**: the generator references `__request` which is never passed. Fix: make the route handler pass request via a module-level variable `__steam_http_request`. Update `__steam_start_web_server` helper to set `import builtins; builtins.__steam_http_request = request` before calling the handler.
- [ ] **Verify `steam_lora_note` / `steam_matrix8_note` / `steam_motor_shield_note` / `steam_bluetooth_hid_note` / `steam_keyboard_mouse_note`**: these end with `_note` suggesting they are placeholder/note blocks — verify they generate a Python comment explaining what library is needed, not broken code.

- [ ] **Step 1: Read full steamBlocks.js** (both `blockDefinitions()` and the generator section)

Read the file in chunks starting from line 600 onwards to find all generator definitions.

- [ ] **Step 2: Create list of broken/missing types**

Cross-reference AVAILABLE_BLOCK_TYPES vs definitions vs generators. Any mismatch → fix.

- [ ] **Step 3: Add new block definitions** to `blockDefinitions()` return array

```js
// In blockDefinitions() array, add:
{
  type: "steam_sleep_us",
  message0: "esperar %1 microsegundos",
  args0: [{ type: "input_value", name: "US", check: "Number" }],
  previousStatement: null, nextStatement: null,
  colour: 285,
},
{
  type: "steam_pin_toggle",
  message0: "toggle pin %1",
  args0: [pin()],
  previousStatement: null, nextStatement: null,
  colour: 135,
},
{
  type: "steam_pwm_off",
  message0: "detener PWM pin %1",
  args0: [pin()],
  previousStatement: null, nextStatement: null,
  colour: 135,
},
{
  type: "steam_i2c_write_reg",
  message0: "I2C dirección %1 registro %2 valor %3",
  args0: [
    { type: "input_value", name: "ADDR", check: "Number" },
    { type: "input_value", name: "REG", check: "Number" },
    { type: "input_value", name: "VAL", check: "Number" },
  ],
  previousStatement: null, nextStatement: null,
  colour: 135,
},
{
  type: "steam_i2c_read_reg",
  message0: "I2C dirección %1 registro %2 leer %3 bytes",
  args0: [
    { type: "input_value", name: "ADDR", check: "Number" },
    { type: "input_value", name: "REG", check: "Number" },
    { type: "input_value", name: "LEN", check: "Number" },
  ],
  output: null,
  colour: 135,
},
{
  type: "steam_esp32_hall",
  message0: "sensor hall ESP32",
  output: "Number",
  colour: 135,
},
{
  type: "steam_ntc_temperature",
  message0: "temperatura NTC pin %1 B %2",
  args0: [
    adc(),
    { type: "input_value", name: "BETA", check: "Number" },
  ],
  output: "Number",
  colour: 135,
},
{
  type: "steam_list_append",
  message0: "lista %1 añadir %2",
  args0: [
    { type: "input_value", name: "LIST" },
    { type: "input_value", name: "ITEM" },
  ],
  previousStatement: null, nextStatement: null,
  colour: 260,
},
{
  type: "steam_list_pop",
  message0: "lista %1 extraer último",
  args0: [{ type: "input_value", name: "LIST" }],
  output: null,
  colour: 260,
},
{
  type: "steam_dict_new",
  message0: "diccionario vacío",
  output: null,
  colour: 260,
},
{
  type: "steam_dict_set",
  message0: "diccionario %1 clave %2 valor %3",
  args0: [
    { type: "input_value", name: "DICT" },
    { type: "input_value", name: "KEY" },
    { type: "input_value", name: "VAL" },
  ],
  previousStatement: null, nextStatement: null,
  colour: 260,
},
{
  type: "steam_dict_get",
  message0: "diccionario %1 clave %2 defecto %3",
  args0: [
    { type: "input_value", name: "DICT" },
    { type: "input_value", name: "KEY" },
    { type: "input_value", name: "DEFAULT" },
  ],
  output: null,
  colour: 260,
},
{
  type: "steam_random_float",
  message0: "número aleatorio 0.0–1.0",
  output: "Number",
  colour: 230,
},
{
  type: "steam_format_float",
  message0: "formatear %1 con %2 decimales",
  args0: [
    { type: "input_value", name: "NUM", check: "Number" },
    dropdown("DECIMALS", [["1","1"],["2","2"],["3","3"],["4","4"],["6","6"]]),
  ],
  output: "String",
  colour: 230,
},
{
  type: "steam_pin_irq",
  message0: "interrupción pin %1 cuando %2 ejecutar %3",
  args0: [
    pin(),
    dropdown("TRIGGER", [
      ["flanco subida","rising"],
      ["flanco bajada","falling"],
      ["cualquier cambio","change"],
    ]),
    { type: "input_statement", name: "HANDLER" },
  ],
  previousStatement: null, nextStatement: null,
  colour: 135,
},
```

- [ ] **Step 4: Add generators** for all new blocks inside `defineGenerators()`

```js
// In defineGenerators(), add:
setGenerator("steam_sleep_us", (block, gen) => {
  const us = value(block, gen, "US", "100");
  needImport("import time");
  return `time.sleep_us(${us})\n`;
});

setGenerator("steam_pin_toggle", (block, gen) => {
  const pin = block.getFieldValue("PIN");
  needImport("import machine");
  return `machine.Pin(${pin}).value(not machine.Pin(${pin}).value())\n`;
});

setGenerator("steam_pwm_off", (block, gen) => {
  const pin = block.getFieldValue("PIN");
  needImport("import machine");
  return `machine.PWM(machine.Pin(${pin})).deinit()\n`;
});

setGenerator("steam_i2c_write_reg", (block, gen) => {
  const addr = value(block, gen, "ADDR", "0x68");
  const reg = value(block, gen, "REG", "0x00");
  const val = value(block, gen, "VAL", "0");
  needHelper("i2c");
  return `__steam_i2c_bus().writeto_mem(${addr}, ${reg}, bytes([${val}]))\n`;
});

setGenerator("steam_i2c_read_reg", (block, gen) => {
  const addr = value(block, gen, "ADDR", "0x68");
  const reg = value(block, gen, "REG", "0x00");
  const len = value(block, gen, "LEN", "1");
  needHelper("i2c");
  return [`__steam_i2c_bus().readfrom_mem(${addr}, ${reg}, ${len})`, Order.NONE];
});

setGenerator("steam_esp32_hall", (block, gen) => {
  needImport("import esp32");
  return ["esp32.hall_sensor()", Order.NONE];
});

setGenerator("steam_ntc_temperature", (block, gen) => {
  const pin = block.getFieldValue("PIN");
  const beta = value(block, gen, "BETA", "3950");
  needHelper("ntc");
  return [`__steam_ntc_temperature(${pin}, ${beta})`, Order.NONE];
});

setGenerator("steam_list_append", (block, gen) => {
  const lst = value(block, gen, "LIST", "[]");
  const item = value(block, gen, "ITEM", "None");
  return `${lst}.append(${item})\n`;
});

setGenerator("steam_list_pop", (block, gen) => {
  const lst = value(block, gen, "LIST", "[]");
  return [`${lst}.pop()`, Order.NONE];
});

setGenerator("steam_dict_new", (block, gen) => {
  return ["{}", Order.NONE];
});

setGenerator("steam_dict_set", (block, gen) => {
  const d = value(block, gen, "DICT", "{}");
  const k = value(block, gen, "KEY", '""');
  const v = value(block, gen, "VAL", "None");
  return `${d}[${k}] = ${v}\n`;
});

setGenerator("steam_dict_get", (block, gen) => {
  const d = value(block, gen, "DICT", "{}");
  const k = value(block, gen, "KEY", '""');
  const def = value(block, gen, "DEFAULT", "None");
  return [`${d}.get(${k}, ${def})`, Order.NONE];
});

setGenerator("steam_random_float", (block, gen) => {
  needImport("import random");
  return ["random.random()", Order.NONE];
});

setGenerator("steam_format_float", (block, gen) => {
  const num = value(block, gen, "NUM", "0");
  const dec = block.getFieldValue("DECIMALS") || "2";
  return [`"{:.${dec}f}".format(${num})`, Order.NONE];
});

setGenerator("steam_pin_irq", (block, gen) => {
  const pin = block.getFieldValue("PIN");
  const trig = block.getFieldValue("TRIGGER");
  const body = statements(block, gen, "HANDLER");
  needImport("import machine");
  const trigMap = { rising: "machine.Pin.IRQ_RISING", falling: "machine.Pin.IRQ_FALLING", change: "machine.Pin.IRQ_RISING | machine.Pin.IRQ_FALLING" };
  const sanitizedPin = sanitizeId(`irq_${pin}`);
  return `def __steam_irq_handler_${sanitizedPin}(p):\n${indentCode(body, "    ")}\nmachine.Pin(${pin}, machine.Pin.IN).irq(handler=__steam_irq_handler_${sanitizedPin}, trigger=${trigMap[trig] || "machine.Pin.IRQ_RISING"})\n`;
});
```

- [ ] **Step 5: Add NTC helper snippet** to HELPER_SNIPPETS

```js
// Add to HELPER_SNIPPETS object:
ntc: `
def __steam_ntc_temperature(pin, beta=3950):
    import machine, math
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    raw = adc.read()
    if raw <= 0:
        return 0
    r = 10000.0 * raw / (4095 - raw)
    t = 1.0 / (1.0 / 298.15 + math.log(r / 10000.0) / float(beta)) - 273.15
    return round(t, 2)
`,
```

- [ ] **Step 6: Update AVAILABLE_BLOCK_TYPES array** — append the 15 new types:

```js
// In AVAILABLE_BLOCK_TYPES array, add at end of the existing array:
"steam_sleep_us", "steam_pin_toggle", "steam_pwm_off",
"steam_i2c_write_reg", "steam_i2c_read_reg",
"steam_esp32_hall", "steam_ntc_temperature",
"steam_list_append", "steam_list_pop",
"steam_dict_new", "steam_dict_set", "steam_dict_get",
"steam_random_float", "steam_format_float", "steam_pin_irq",
```

- [ ] **Step 7: Add new blocks to toolbox** in `buildToolbox()` — verify they appear under correct categories.

- [ ] **Step 8: Test** — open dev server (`npm run dev`), open the app, check the new blocks appear and generate valid Python code.

---

## Task 2 — TdR STEAM shield blocks

**Files:**
- Create: `src/steamBlocks-tdr.js`
- Modify: `src/steamBlocks.js` (import and register TdR blocks)

The TdR STEAM blocks use **fixed GPIO numbers** derived from the confirmed user pin mapping. The user does NOT select pins — the blocks are pre-wired.

- [ ] **Step 1: Create `src/steamBlocks-tdr.js`**

```js
import * as Blockly from "blockly";
import { Order, pythonGenerator } from "blockly/python";

// ── Fixed GPIO assignments for Imagina TdR STEAM shield ───────────────────
// These are hardcoded because the shield solders components to fixed headers.
// GPIO numbers use the confirmed ESP32 Plus STEAMakers mapping.
const TDR = {
  LED_ROJO:  14,  // D13
  LED_AZUL:  27,  // D12
  RGB_R:     19,  // D6
  RGB_G:     25,  // D9
  RGB_B:     17,  // D10
  SW1:       12,  // D2
  SW2:       18,  // D7
  BUZZER:    26,  // D8
  DHT11:      5,  // D4
  POT:       36,  // A0
  LDR:       39,  // A1
  LM35:      33,  // A2
  FREE_D3:   13,  // D3
  FREE_D5:   23,  // D5
  FREE_A3:   15,  // A3
};

function setGen(type, fn) {
  pythonGenerator.forBlock[type] = fn;
}

function val(block, gen, name, fallback = "0") {
  return gen.valueToCode(block, name, Order.NONE) || fallback;
}

function stmt(block, gen, name) {
  return gen.statementToCode(block, name) || `${gen.INDENT}pass\n`;
}

export function defineTdrBlocks() {
  const defs = [
    // ─── LEDs ──────────────────────────────────────────────────────────────
    {
      type: "tdr_led_rojo",
      message0: "TdR LED rojo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON","1"],["OFF","0"]] }],
      previousStatement: null, nextStatement: null,
      colour: 0,
      tooltip: "Enciende o apaga el LED rojo de la placa TdR STEAM (D13/GPIO14).",
    },
    {
      type: "tdr_led_azul",
      message0: "TdR LED azul %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON","1"],["OFF","0"]] }],
      previousStatement: null, nextStatement: null,
      colour: 210,
      tooltip: "Enciende o apaga el LED azul de la placa TdR STEAM (D12/GPIO27).",
    },
    {
      type: "tdr_led_rgb",
      message0: "TdR LED RGB R %1 G %2 B %3",
      args0: [
        { type: "input_value", name: "R", check: "Number" },
        { type: "input_value", name: "G", check: "Number" },
        { type: "input_value", name: "B", check: "Number" },
      ],
      previousStatement: null, nextStatement: null,
      colour: 50,
      tooltip: "Controla el LED RGB de la placa TdR STEAM con valores 0–255 para cada canal.",
    },
    // ─── Pulsadores ────────────────────────────────────────────────────────
    {
      type: "tdr_pulsador_sw1",
      message0: "TdR pulsador SW1 pulsado",
      output: "Boolean",
      colour: 210,
      tooltip: "Devuelve True si el pulsador SW1 está pulsado (D2/GPIO12, activo LOW).",
    },
    {
      type: "tdr_pulsador_sw2",
      message0: "TdR pulsador SW2 pulsado",
      output: "Boolean",
      colour: 210,
      tooltip: "Devuelve True si el pulsador SW2 está pulsado (D7/GPIO18, activo LOW).",
    },
    // ─── Zumbador ──────────────────────────────────────────────────────────
    {
      type: "tdr_buzzer_tone",
      message0: "TdR zumbador frecuencia %1 Hz durante %2 ms",
      args0: [
        { type: "input_value", name: "FREQ", check: "Number" },
        { type: "input_value", name: "MS", check: "Number" },
      ],
      previousStatement: null, nextStatement: null,
      colour: 50,
      tooltip: "Emite un tono en el zumbador de la placa TdR STEAM (D8/GPIO26).",
    },
    {
      type: "tdr_buzzer_off",
      message0: "TdR zumbador apagar",
      previousStatement: null, nextStatement: null,
      colour: 50,
    },
    // ─── DHT11 ─────────────────────────────────────────────────────────────
    {
      type: "tdr_dht11_temperatura",
      message0: "TdR temperatura DHT11 °C",
      output: "Number",
      colour: 160,
      tooltip: "Lee la temperatura del sensor DHT11 (D4/GPIO5). Requiere módulo 'dht'.",
    },
    {
      type: "tdr_dht11_humedad",
      message0: "TdR humedad DHT11 %",
      output: "Number",
      colour: 160,
      tooltip: "Lee la humedad del sensor DHT11 (D4/GPIO5). Requiere módulo 'dht'.",
    },
    // ─── Sensores analógicos ───────────────────────────────────────────────
    {
      type: "tdr_potenciometro",
      message0: "TdR potenciómetro (0–100%)",
      output: "Number",
      colour: 160,
      tooltip: "Lee el potenciómetro de la placa TdR STEAM (A0/GPIO36) como porcentaje.",
    },
    {
      type: "tdr_ldr",
      message0: "TdR sensor de luz (0–100%)",
      output: "Number",
      colour: 160,
      tooltip: "Lee el sensor de luz LDR de la placa TdR STEAM (A1/GPIO39) como porcentaje.",
    },
    {
      type: "tdr_lm35",
      message0: "TdR temperatura LM35 °C",
      output: "Number",
      colour: 160,
      tooltip: "Lee el sensor de temperatura LM35 (A2/GPIO33) y convierte a grados Celsius.",
    },
  ];

  if (Blockly.common?.defineBlocksWithJsonArray) {
    Blockly.common.defineBlocksWithJsonArray(defs);
  } else {
    Blockly.defineBlocksWithJsonArray(defs);
  }
}

export function defineTdrGenerators() {
  // ─── LED rojo ─────────────────────────────────────────────────────────────
  setGen("tdr_led_rojo", (block) => {
    const state = block.getFieldValue("STATE");
    return `__import__('machine').Pin(${TDR.LED_ROJO}, __import__('machine').Pin.OUT).value(${state})\n`;
  });

  // ─── LED azul ─────────────────────────────────────────────────────────────
  setGen("tdr_led_azul", (block) => {
    const state = block.getFieldValue("STATE");
    return `__import__('machine').Pin(${TDR.LED_AZUL}, __import__('machine').Pin.OUT).value(${state})\n`;
  });

  // ─── LED RGB ──────────────────────────────────────────────────────────────
  setGen("tdr_led_rgb", (block, gen) => {
    const r = val(block, gen, "R", "0");
    const g = val(block, gen, "G", "0");
    const b = val(block, gen, "B", "0");
    return [
      `__tdr_rgb_write(${r}, ${g}, ${b})\n`,
      `# Helper __tdr_rgb_write must be at top of script (added automatically).\n`,
    ][0];
  });

  // ─── Pulsadores ──────────────────────────────────────────────────────────
  setGen("tdr_pulsador_sw1", () => {
    return [`(__import__('machine').Pin(${TDR.SW1}, __import__('machine').Pin.IN, __import__('machine').Pin.PULL_UP).value() == 0)`, Order.NONE];
  });

  setGen("tdr_pulsador_sw2", () => {
    return [`(__import__('machine').Pin(${TDR.SW2}, __import__('machine').Pin.IN, __import__('machine').Pin.PULL_UP).value() == 0)`, Order.NONE];
  });

  // ─── Zumbador ────────────────────────────────────────────────────────────
  setGen("tdr_buzzer_tone", (block, gen) => {
    const freq = val(block, gen, "FREQ", "1000");
    const ms = val(block, gen, "MS", "200");
    return `__tdr_buzzer_tone(${freq}, ${ms})\n`;
  });

  setGen("tdr_buzzer_off", () => {
    return `__import__('machine').PWM(__import__('machine').Pin(${TDR.BUZZER})).deinit()\n`;
  });

  // ─── DHT11 ───────────────────────────────────────────────────────────────
  setGen("tdr_dht11_temperatura", () => {
    return [`__tdr_dht_read("temperature")`, Order.NONE];
  });

  setGen("tdr_dht11_humedad", () => {
    return [`__tdr_dht_read("humidity")`, Order.NONE];
  });

  // ─── Analógicos ──────────────────────────────────────────────────────────
  setGen("tdr_potenciometro", () => {
    return [`__tdr_adc_percent(${TDR.POT})`, Order.NONE];
  });

  setGen("tdr_ldr", () => {
    return [`__tdr_adc_percent(${TDR.LDR})`, Order.NONE];
  });

  setGen("tdr_lm35", () => {
    return [`__tdr_lm35_celsius(${TDR.LM35})`, Order.NONE];
  });
}

// ── Helper code injected at top of generated script ───────────────────────
export const TDR_HELPERS = `
import machine, time

# ── TdR STEAM helpers ──────────────────────────────────────────────────────
__tdr_pwms = {}

def __tdr_pwm(pin, freq=1000):
    global __tdr_pwms
    if pin not in __tdr_pwms:
        __tdr_pwms[pin] = machine.PWM(machine.Pin(pin), freq=freq)
    p = __tdr_pwms[pin]
    p.freq(int(freq))
    return p

def __tdr_rgb_write(r, g, b):
    __tdr_pwm(${TDR.RGB_R}, 1000).duty(int(max(0, min(1023, r * 4))))\n    __tdr_pwm(${TDR.RGB_G}, 1000).duty(int(max(0, min(1023, g * 4))))\n    __tdr_pwm(${TDR.RGB_B}, 1000).duty(int(max(0, min(1023, b * 4))))

def __tdr_buzzer_tone(freq, ms):
    p = __tdr_pwm(${TDR.BUZZER}, int(freq))
    p.duty(512)
    time.sleep_ms(int(ms))
    p.deinit()
    if ${TDR.BUZZER} in __tdr_pwms:
        del __tdr_pwms[${TDR.BUZZER}]

def __tdr_dht_read(key="temperature"):
    import dht
    _s = dht.DHT11(machine.Pin(${TDR.DHT11}))
    _s.measure()
    return _s.humidity() if key == "humidity" else _s.temperature()

def __tdr_adc_percent(pin):
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    return int(max(0, min(100, adc.read() * 100 / 4095)))

def __tdr_lm35_celsius(pin):
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    mv = adc.read() * 3300 / 4095
    return round(mv / 10.0, 1)
`;

export const TDR_BLOCK_TYPES = [
  "tdr_led_rojo", "tdr_led_azul", "tdr_led_rgb",
  "tdr_pulsador_sw1", "tdr_pulsador_sw2",
  "tdr_buzzer_tone", "tdr_buzzer_off",
  "tdr_dht11_temperatura", "tdr_dht11_humedad",
  "tdr_potenciometro", "tdr_ldr", "tdr_lm35",
];

export const TDR_TOOLBOX_CATEGORY = {
  kind: "category",
  name: "🌡 TdR STEAM",
  colour: "160",
  contents: [
    { kind: "label", text: "LEDs" },
    { kind: "block", type: "tdr_led_rojo" },
    { kind: "block", type: "tdr_led_azul" },
    { kind: "block", type: "tdr_led_rgb" },
    { kind: "label", text: "Pulsadores" },
    { kind: "block", type: "tdr_pulsador_sw1" },
    { kind: "block", type: "tdr_pulsador_sw2" },
    { kind: "label", text: "Zumbador" },
    { kind: "block", type: "tdr_buzzer_tone" },
    { kind: "block", type: "tdr_buzzer_off" },
    { kind: "label", text: "Sensores" },
    { kind: "block", type: "tdr_dht11_temperatura" },
    { kind: "block", type: "tdr_dht11_humedad" },
    { kind: "block", type: "tdr_potenciometro" },
    { kind: "block", type: "tdr_ldr" },
    { kind: "block", type: "tdr_lm35" },
  ],
};
```

- [ ] **Step 2: Import and register TdR in steamBlocks.js**

At the top of steamBlocks.js, add:
```js
import { defineTdrBlocks, defineTdrGenerators, TDR_BLOCK_TYPES, TDR_TOOLBOX_CATEGORY, TDR_HELPERS } from "./steamBlocks-tdr.js";
```

In `defineSteamBlocks()`, at the end, add:
```js
defineTdrBlocks();
defineTdrGenerators();
```

In `AVAILABLE_BLOCK_TYPES` array, spread `TDR_BLOCK_TYPES`.

In `buildToolbox()`, add `TDR_TOOLBOX_CATEGORY` as a new category.

In `buildMicroPythonCode()`, check if any TdR block is used and prepend TDR_HELPERS if so. Add this check before the final code assembly:
```js
const hasTdr = TDR_BLOCK_TYPES.some(t => workspace.getAllBlocks(false).some(b => b.type === t));
```

- [ ] **Step 3: Test** — open app, see "TdR STEAM" category, drag `tdr_led_rojo`, verify generated Python code uses correct GPIO (14) and correct `machine.Pin` syntax.

---

## Task 3 — 3DBot robot blocks

**Files:**
- Create: `src/steamBlocks-3dbot.js`
- Modify: `src/steamBlocks.js` (import and register)

- [ ] **Step 1: Create `src/steamBlocks-3dbot.js`**

```js
import * as Blockly from "blockly";
import { Order, pythonGenerator } from "blockly/python";

// ── Fixed GPIO assignments for Imagina 3DBot shield ───────────────────────
const BOT = {
  BTN:        12,  // D2  (shared w/ sonar echo)
  LED_VERDE:  13,  // D3  (shared w/ IR emitter)
  SONAR_TRIG:  5,  // D4
  LED_AMARI:  23,  // D5  (shared w/ línea IZQ)
  LED_ROJO:   19,  // D6  (shared w/ línea DER)
  MOT_A_DIR1: 18,  // D7
  MOT_A_DIR2: 26,  // D8
  MOT_A_PWM:  25,  // D9
  MOT_B_PWM:  17,  // D10
  IR_RX:      16,  // D11
  MOT_B_DIR1: 27,  // D12
  MOT_B_DIR2: 14,  // D13
  BUZZER:     36,  // A0
  LDR:        33,  // A2
  NTC:        15,  // A3
  SONAR_ECHO: 12,  // D2  same as BTN (shared)
  LINE_IZQ:   23,  // D5  same as LED_AMARI (shared)
  LINE_DER:   19,  // D6  same as LED_ROJO (shared)
};

function setGen(type, fn) {
  pythonGenerator.forBlock[type] = fn;
}

function val(block, gen, name, fallback = "0") {
  return gen.valueToCode(block, name, Order.NONE) || fallback;
}

function stmt(block, gen, name) {
  return gen.statementToCode(block, name) || `${gen.INDENT}pass\n`;
}

export function defineDbotBlocks() {
  const defs = [
    // ─── Motores ───────────────────────────────────────────────────────────
    {
      type: "dbot_avanzar",
      message0: "3DBot avanzar velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null, nextStatement: null,
      colour: 120,
      tooltip: "Mueve el robot 3DBot hacia adelante. Velocidad 0–100.",
    },
    {
      type: "dbot_retroceder",
      message0: "3DBot retroceder velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_girar_derecha",
      message0: "3DBot girar derecha velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_girar_izquierda",
      message0: "3DBot girar izquierda velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_parar",
      message0: "3DBot parar motores",
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_motor_izquierdo",
      message0: "3DBot motor izquierdo %1 velocidad %2",
      args0: [
        { type: "field_dropdown", name: "DIR", options: [["adelante","fwd"],["atrás","bwd"],["parar","stop"]] },
        { type: "input_value", name: "SPEED", check: "Number" },
      ],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_motor_derecho",
      message0: "3DBot motor derecho %1 velocidad %2",
      args0: [
        { type: "field_dropdown", name: "DIR", options: [["adelante","fwd"],["atrás","bwd"],["parar","stop"]] },
        { type: "input_value", name: "SPEED", check: "Number" },
      ],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    // ─── Sensores ──────────────────────────────────────────────────────────
    {
      type: "dbot_distancia",
      message0: "3DBot distancia cm",
      output: "Number",
      colour: 160,
      tooltip: "Lee la distancia en cm del sensor ultrasónico HC-SR04 (TRIG=D4/GPIO5, ECHO=D2/GPIO12).",
    },
    {
      type: "dbot_siguelineas_izq",
      message0: "3DBot línea izquierda detectada",
      output: "Boolean",
      colour: 160,
      tooltip: "Devuelve True si el sensor izquierdo detecta línea negra (D5/GPIO23).",
    },
    {
      type: "dbot_siguelineas_der",
      message0: "3DBot línea derecha detectada",
      output: "Boolean",
      colour: 160,
      tooltip: "Devuelve True si el sensor derecho detecta línea negra (D6/GPIO19).",
    },
    {
      type: "dbot_pulsador",
      message0: "3DBot pulsador pulsado",
      output: "Boolean",
      colour: 210,
      tooltip: "Devuelve True si el pulsador está pulsado (D2/GPIO12, activo LOW).",
    },
    {
      type: "dbot_ldr",
      message0: "3DBot sensor de luz (0–100%)",
      output: "Number",
      colour: 160,
      tooltip: "Lee el sensor LDR del 3DBot (A2/GPIO33).",
    },
    {
      type: "dbot_temperatura",
      message0: "3DBot temperatura NTC °C",
      output: "Number",
      colour: 160,
      tooltip: "Lee el termistor NTC del 3DBot (A3/GPIO15) y devuelve temperatura en °C.",
    },
    // ─── LEDs semáforo ─────────────────────────────────────────────────────
    {
      type: "dbot_led_verde",
      message0: "3DBot LED verde %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON","1"],["OFF","0"]] }],
      previousStatement: null, nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_led_amarillo",
      message0: "3DBot LED amarillo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON","1"],["OFF","0"]] }],
      previousStatement: null, nextStatement: null,
      colour: 50,
    },
    {
      type: "dbot_led_rojo",
      message0: "3DBot LED rojo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON","1"],["OFF","0"]] }],
      previousStatement: null, nextStatement: null,
      colour: 0,
    },
    // ─── Zumbador ──────────────────────────────────────────────────────────
    {
      type: "dbot_buzzer",
      message0: "3DBot zumbador %1 Hz durante %2 ms",
      args0: [
        { type: "input_value", name: "FREQ", check: "Number" },
        { type: "input_value", name: "MS", check: "Number" },
      ],
      previousStatement: null, nextStatement: null,
      colour: 50,
    },
  ];

  if (Blockly.common?.defineBlocksWithJsonArray) {
    Blockly.common.defineBlocksWithJsonArray(defs);
  } else {
    Blockly.defineBlocksWithJsonArray(defs);
  }
}

export function defineDbotGenerators() {
  // Speed conversion: 0–100 → 0–1023 PWM duty
  const speedToDuty = (s) => `int(max(0, min(1023, ${s} * 10.23)))`;

  setGen("dbot_avanzar", (block, gen) => {
    const s = val(block, gen, "SPEED", "80");
    return `__dbot_motor(1, 1, ${speedToDuty(s)}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_retroceder", (block, gen) => {
    const s = val(block, gen, "SPEED", "80");
    return `__dbot_motor(-1, -1, ${speedToDuty(s)}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_girar_derecha", (block, gen) => {
    const s = val(block, gen, "SPEED", "60");
    return `__dbot_motor(1, -1, ${speedToDuty(s)}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_girar_izquierda", (block, gen) => {
    const s = val(block, gen, "SPEED", "60");
    return `__dbot_motor(-1, 1, ${speedToDuty(s)}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_parar", () => `__dbot_motor(0, 0, 0, 0)\n`);

  setGen("dbot_motor_izquierdo", (block, gen) => {
    const dir = block.getFieldValue("DIR");
    const s = val(block, gen, "SPEED", "80");
    const d = dir === "fwd" ? 1 : dir === "bwd" ? -1 : 0;
    return `__dbot_motor_a(${d}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_motor_derecho", (block, gen) => {
    const dir = block.getFieldValue("DIR");
    const s = val(block, gen, "SPEED", "80");
    const d = dir === "fwd" ? 1 : dir === "bwd" ? -1 : 0;
    return `__dbot_motor_b(${d}, ${speedToDuty(s)})\n`;
  });

  setGen("dbot_distancia", () => {
    return [`__dbot_ultrasonic()`, Order.NONE];
  });

  setGen("dbot_siguelineas_izq", () => {
    return [`(machine.Pin(${BOT.LINE_IZQ}, machine.Pin.IN).value() == 0)`, Order.NONE];
  });

  setGen("dbot_siguelineas_der", () => {
    return [`(machine.Pin(${BOT.LINE_DER}, machine.Pin.IN).value() == 0)`, Order.NONE];
  });

  setGen("dbot_pulsador", () => {
    return [`(machine.Pin(${BOT.BTN}, machine.Pin.IN, machine.Pin.PULL_UP).value() == 0)`, Order.NONE];
  });

  setGen("dbot_ldr", () => {
    return [`__dbot_adc_percent(${BOT.LDR})`, Order.NONE];
  });

  setGen("dbot_temperatura", () => {
    return [`__dbot_ntc_celsius(${BOT.NTC})`, Order.NONE];
  });

  setGen("dbot_led_verde", (block) => {
    const s = block.getFieldValue("STATE");
    return `machine.Pin(${BOT.LED_VERDE}, machine.Pin.OUT).value(${s})\n`;
  });

  setGen("dbot_led_amarillo", (block) => {
    const s = block.getFieldValue("STATE");
    return `machine.Pin(${BOT.LED_AMARI}, machine.Pin.OUT).value(${s})\n`;
  });

  setGen("dbot_led_rojo", (block) => {
    const s = block.getFieldValue("STATE");
    return `machine.Pin(${BOT.LED_ROJO}, machine.Pin.OUT).value(${s})\n`;
  });

  setGen("dbot_buzzer", (block, gen) => {
    const freq = val(block, gen, "FREQ", "1000");
    const ms = val(block, gen, "MS", "200");
    return `__dbot_buzzer_tone(${freq}, ${ms})\n`;
  });
}

export const DBOT_HELPERS = `
import machine, time

# ── 3DBot helpers ─────────────────────────────────────────────────────────
__dbot_pwm_a = machine.PWM(machine.Pin(${BOT.MOT_A_PWM}), freq=1000)
__dbot_pwm_b = machine.PWM(machine.Pin(${BOT.MOT_B_PWM}), freq=1000)
__dbot_ma1 = machine.Pin(${BOT.MOT_A_DIR1}, machine.Pin.OUT)
__dbot_ma2 = machine.Pin(${BOT.MOT_A_DIR2}, machine.Pin.OUT)
__dbot_mb1 = machine.Pin(${BOT.MOT_B_DIR1}, machine.Pin.OUT)
__dbot_mb2 = machine.Pin(${BOT.MOT_B_DIR2}, machine.Pin.OUT)

def __dbot_motor_a(direction, duty):
    if direction > 0:
        __dbot_ma1.value(1); __dbot_ma2.value(0)
    elif direction < 0:
        __dbot_ma1.value(0); __dbot_ma2.value(1)
    else:
        __dbot_ma1.value(0); __dbot_ma2.value(0)
    __dbot_pwm_a.duty(int(duty))

def __dbot_motor_b(direction, duty):
    if direction > 0:
        __dbot_mb1.value(1); __dbot_mb2.value(0)
    elif direction < 0:
        __dbot_mb1.value(0); __dbot_mb2.value(1)
    else:
        __dbot_mb1.value(0); __dbot_mb2.value(0)
    __dbot_pwm_b.duty(int(duty))

def __dbot_motor(dir_a, dir_b, duty_a, duty_b):
    __dbot_motor_a(dir_a, duty_a)
    __dbot_motor_b(dir_b, duty_b)

def __dbot_ultrasonic():
    trig = machine.Pin(${BOT.SONAR_TRIG}, machine.Pin.OUT)
    echo = machine.Pin(${BOT.SONAR_ECHO}, machine.Pin.IN)
    trig.value(0); time.sleep_us(2)
    trig.value(1); time.sleep_us(10)
    trig.value(0)
    pulse = machine.time_pulse_us(echo, 1, 30000)
    return round(pulse / 58.0, 1) if pulse > 0 else -1

def __dbot_adc_percent(pin):
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    return int(max(0, min(100, adc.read() * 100 / 4095)))

def __dbot_ntc_celsius(pin, beta=3950):
    import math
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    raw = adc.read()
    if raw <= 0:
        return 0
    r = 10000.0 * raw / (4095 - raw)
    return round(1.0 / (1.0 / 298.15 + math.log(r / 10000.0) / beta) - 273.15, 1)

def __dbot_buzzer_tone(freq, ms):
    buz = machine.PWM(machine.Pin(${BOT.BUZZER}), freq=int(freq))
    buz.duty(512)
    time.sleep_ms(int(ms))
    buz.deinit()
`;

export const DBOT_BLOCK_TYPES = [
  "dbot_avanzar", "dbot_retroceder", "dbot_girar_derecha", "dbot_girar_izquierda",
  "dbot_parar", "dbot_motor_izquierdo", "dbot_motor_derecho",
  "dbot_distancia", "dbot_siguelineas_izq", "dbot_siguelineas_der",
  "dbot_pulsador", "dbot_ldr", "dbot_temperatura",
  "dbot_led_verde", "dbot_led_amarillo", "dbot_led_rojo", "dbot_buzzer",
];

export const DBOT_TOOLBOX_CATEGORY = {
  kind: "category",
  name: "🤖 3DBot",
  colour: "120",
  contents: [
    { kind: "label", text: "Movimiento" },
    { kind: "block", type: "dbot_avanzar" },
    { kind: "block", type: "dbot_retroceder" },
    { kind: "block", type: "dbot_girar_derecha" },
    { kind: "block", type: "dbot_girar_izquierda" },
    { kind: "block", type: "dbot_parar" },
    { kind: "block", type: "dbot_motor_izquierdo" },
    { kind: "block", type: "dbot_motor_derecho" },
    { kind: "label", text: "Sensores" },
    { kind: "block", type: "dbot_distancia" },
    { kind: "block", type: "dbot_siguelineas_izq" },
    { kind: "block", type: "dbot_siguelineas_der" },
    { kind: "block", type: "dbot_pulsador" },
    { kind: "block", type: "dbot_ldr" },
    { kind: "block", type: "dbot_temperatura" },
    { kind: "label", text: "LEDs semáforo" },
    { kind: "block", type: "dbot_led_verde" },
    { kind: "block", type: "dbot_led_amarillo" },
    { kind: "block", type: "dbot_led_rojo" },
    { kind: "label", text: "Zumbador" },
    { kind: "block", type: "dbot_buzzer" },
  ],
};
```

- [ ] **Step 2: Import and register 3DBot in steamBlocks.js** (same pattern as TdR STEAM)

```js
import { defineDbotBlocks, defineDbotGenerators, DBOT_BLOCK_TYPES, DBOT_TOOLBOX_CATEGORY, DBOT_HELPERS } from "./steamBlocks-3dbot.js";
```

In `defineSteamBlocks()`, at the end:
```js
defineDbotBlocks();
defineDbotGenerators();
```

In `buildMicroPythonCode()`, prepend DBOT_HELPERS if any dbot block is used:
```js
const hasDbot = DBOT_BLOCK_TYPES.some(t => workspace.getAllBlocks(false).some(b => b.type === t));
if (hasDbot) headerLines.push(DBOT_HELPERS.trim());
```

- [ ] **Step 3: Test** — drag `dbot_avanzar`, verify generated Python has `__dbot_motor(1, 1, ...)` and the helper definitions at the top. Test `dbot_distancia` generates correct TRIG/ECHO pins.

---

## Task 4 — Undo/Redo UI + No auto-console on actions

**Files:**
- Modify: `src/main.js`

**Undo/redo** — Blockly has built-in undo stack (`workspace.undo(false)` = redo, `workspace.undo(true)` = undo). We just need to expose it in the UI.

**No auto-console** — `runAction()` calls `setTab("console")` at line ~632. `stopScript()` also calls `setTab("console")`. Remove these calls.

- [ ] **Step 1: Remove auto-console tab switch from `runAction()`**

In `runAction()`, find and remove `setTab("console")` (it appears near line 632).

The function currently has:
```js
async function runAction(kind) {
  const isSave = kind === "save";
  try {
    sound.play("tap");
    setTab("console");      // ← REMOVE THIS LINE
    setProgress({ ... });
```

Change to:
```js
async function runAction(kind) {
  const isSave = kind === "save";
  try {
    sound.play("tap");
    setProgress({ ... });
```

- [ ] **Step 2: Remove auto-console from `stopScript()`**

```js
async function stopScript() {
  try {
    sound.play("stop");
    await ensureConnected();
    appendConsole("Parando script…\n", "host");
    await serial.stopCurrentProgram();
    appendConsole("Script detenido. REPL listo.\n", "host");
    setTab("console");   // ← REMOVE THIS LINE
  } catch ...
```

- [ ] **Step 3: Add undo/redo buttons to the topbar HTML**

In the `top-actions` div HTML (inside `app.innerHTML`), after the `run-group` div, add:

```html
<div class="undo-group" role="group" aria-label="Historial">
  <button class="topbar-icon-btn" id="undoButton" type="button" title="Deshacer (Ctrl+Z)"><i data-lucide="undo-2"></i></button>
  <button class="topbar-icon-btn" id="redoButton" type="button" title="Rehacer (Ctrl+Y)"><i data-lucide="redo-2"></i></button>
</div>
```

- [ ] **Step 4: Add undo/redo element refs**

In the `els` object, add:
```js
undoButton: document.querySelector("#undoButton"),
redoButton: document.querySelector("#redoButton"),
```

- [ ] **Step 5: Add event listeners for undo/redo**

```js
els.undoButton.addEventListener("click", () => {
  if (workspace) { workspace.undo(true); refreshCode(); sound.play("tap"); }
});
els.redoButton.addEventListener("click", () => {
  if (workspace) { workspace.undo(false); refreshCode(); sound.play("tap"); }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (!workspace) return;
  // Only trigger when not in an input/textarea
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    workspace.undo(true);
    refreshCode();
    sound.play("tap");
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
    e.preventDefault();
    workspace.undo(false);
    refreshCode();
    sound.play("tap");
  }
});
```

- [ ] **Step 6: Test** — make some block changes, click undo button, verify blocks revert. Press Ctrl+Z, same. Verify run/save/stop no longer jumps to console tab.

---

## Task 5 — Performance optimization for all 3 modes

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

The "detailed" mode is slow because:
1. `Blockly.svgResize(workspace)` is called on every change event — debounce it.
2. `refreshCode()` runs on every UI event — add an `isUiEvent` check (already there) but also debounce the code refresh.
3. CSS transitions on block SVGs in detailed mode cause layout thrash.

- [ ] **Step 1: Debounce `svgResize` and add RAF-based refresh**

At the top of main.js (after imports), add:
```js
let svgResizeTimer;
function scheduleSvgResize() {
  clearTimeout(svgResizeTimer);
  svgResizeTimer = setTimeout(() => {
    if (workspace) Blockly.svgResize(workspace);
  }, settings.visualMode === "detailed" ? 80 : 30);
}
```

Replace all calls to `Blockly.svgResize(workspace)` in event handlers and change listeners with `scheduleSvgResize()`. (Keep the setTimeout calls in `setTab` and `injectWorkspace` as-is since those are one-time transitions.)

- [ ] **Step 2: Debounce `refreshCode()` inside the change listener**

In `injectWorkspace()`, change:
```js
workspace.addChangeListener((event) => {
  if (event.isUiEvent) return;
  refreshCode();
  scheduleSave();
```
to:
```js
let refreshTimer;
workspace.addChangeListener((event) => {
  if (event.isUiEvent) return;
  scheduleSave();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshCode(), settings.visualMode === "detailed" ? 120 : 60);
```

- [ ] **Step 3: Add CSS containment and GPU hints for block canvas**

In `style.css`, add:
```css
/* ─────────────────────────────────────────────
   PERFORMANCE — Block canvas
───────────────────────────────────────────── */
#blocklyDiv {
  contain: strict;
  will-change: transform;
}

/* Detailed mode: GPU-accelerate SVG blocks */
html[data-visual-mode="detailed"] .blocklyDraggable {
  will-change: transform;
}

/* Simple mode: disable all transitions */
html[data-visual-mode="simple"] * {
  transition: none !important;
  animation: none !important;
}
```

- [ ] **Step 4: Reduce animation delays in detailed mode for block placement**

In `main.js` in `applySteamStepAction()`, the wait time for detailed is currently 180ms. Change to 120ms:
```js
await wait(settings.visualMode === "simple" ? 45 : settings.visualMode === "detailed" ? 120 : 110);
```

In `hydrateAiBlock()`, change detailed wait from 170ms to 100ms:
```js
await wait(settings.visualMode === "simple" ? 45 : settings.visualMode === "detailed" ? 100 : 105);
```

- [ ] **Step 5: Test** — switch to detailed mode, drag 20+ blocks. Should be noticeably smoother. AI block placement should be faster.

---

## Task 6 — Settings aesthetics + Detailed mode visuals + Progress popup

**Files:**
- Modify: `src/main.js` (HTML for settings and progress)
- Modify: `src/style.css`

### 6a — Settings panel redesign

Replace the existing drawer settings HTML in `app.innerHTML` with a more polished version using grouped cards, better typography, and visual separators.

- [ ] **Step 1: Redesign settings HTML in `app.innerHTML`**

Replace the `<section class="drawer-page drawer-screen" id="drawerSettings">` block with:

```html
<section class="drawer-page drawer-screen" id="drawerSettings">
  <div class="settings-topbar">
    <button class="back-button drawer-tab" data-drawer-tab="playground" type="button">
      <i data-lucide="arrow-left"></i><span>Volver</span>
    </button>
    <button class="icon-button" data-drawer-close type="button" title="Cerrar"><i data-lucide="x"></i></button>
  </div>

  <div class="settings-hero">
    <span class="settings-hero-icon"><i data-lucide="settings-2"></i></span>
    <div>
      <h2>Ajustes</h2>
      <p>Personaliza el entorno de trabajo.</p>
    </div>
  </div>

  <div class="settings-section-label">Apariencia</div>
  <div class="settings-card">
    <div class="card-heading"><i data-lucide="sun-moon"></i><h2>Tema</h2></div>
    <div class="theme-toggle-row">
      <label class="theme-pill light-pill">
        <input type="radio" name="theme" value="light" />
        <span class="theme-pill-icon"><i data-lucide="sun"></i></span>
        <span>Claro</span>
      </label>
      <label class="theme-pill dark-pill">
        <input type="radio" name="theme" value="dark" />
        <span class="theme-pill-icon"><i data-lucide="moon"></i></span>
        <span>Oscuro</span>
      </label>
    </div>
  </div>

  <div class="settings-card">
    <div class="card-heading"><i data-lucide="layers"></i><h2>Calidad de bloques</h2></div>
    <div class="visual-mode-pills" role="radiogroup" aria-label="Calidad visual">
      <label class="mode-pill" data-mode="simple">
        <input type="radio" name="visualMode" value="simple" />
        <div class="mode-pill-icon"><i data-lucide="zap"></i></div>
        <div class="mode-pill-body">
          <strong>Simple</strong>
          <small>Máximo rendimiento</small>
        </div>
      </label>
      <label class="mode-pill" data-mode="standard">
        <input type="radio" name="visualMode" value="standard" />
        <div class="mode-pill-icon"><i data-lucide="layout-grid"></i></div>
        <div class="mode-pill-body">
          <strong>Estándar</strong>
          <small>Equilibrio recomendado</small>
        </div>
      </label>
      <label class="mode-pill" data-mode="detailed">
        <input type="radio" name="visualMode" value="detailed" />
        <div class="mode-pill-icon"><i data-lucide="sparkles"></i></div>
        <div class="mode-pill-body">
          <strong>Detallado</strong>
          <small>Máxima calidad visual</small>
        </div>
      </label>
    </div>
  </div>

  <div class="settings-section-label">Sonido</div>
  <div class="settings-card">
    <div class="card-heading"><i data-lucide="volume-2"></i><h2>Efectos de sonido</h2></div>
    <label class="toggle-row setting-option">
      <span>Silenciar efectos</span>
      <div class="toggle-switch">
        <input id="soundMuted" type="checkbox" />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </div>
    </label>
    <div class="slider-row">
      <i data-lucide="volume-1"></i>
      <input id="soundVolume" type="range" min="0" max="1" step="0.01" />
      <i data-lucide="volume-2"></i>
    </div>
    <button class="soft-button test-sound-button" id="testSoundButton" type="button">
      <i data-lucide="music-2"></i><span>Probar sonido</span>
    </button>
  </div>

  <div class="settings-section-label">Inteligencia artificial</div>
  <div class="settings-card ai-settings-card">
    <div class="card-heading"><i data-lucide="bot"></i><h2>SteamBot · Ollama</h2></div>
    <div class="ai-model-hint">
      <i data-lucide="info"></i>
      <span>Modelos recomendados: <code>qwen2.5-coder:32b:cloud</code> (calidad) · <code>qwen2.5-coder:7b:cloud</code> (velocidad)</span>
    </div>
    <div class="input-field">
      <label for="ollamaApiKey"><i data-lucide="key"></i> API Key</label>
      <div class="input-with-icon">
        <input id="ollamaApiKey" type="password" placeholder="sk-…" autocomplete="off" spellcheck="false" />
        <button class="input-reveal-btn" id="toggleApiKey" type="button" title="Mostrar/ocultar"><i data-lucide="eye"></i></button>
      </div>
    </div>
    <div class="input-field">
      <label for="ollamaModel"><i data-lucide="cpu"></i> Modelo</label>
      <input id="ollamaModel" type="text" placeholder="qwen2.5-coder:32b:cloud" spellcheck="false" />
    </div>
    <div class="input-field">
      <label for="ollamaEndpoint"><i data-lucide="globe"></i> Endpoint</label>
      <input id="ollamaEndpoint" type="text" placeholder="https://ollama.com/v1" spellcheck="false" />
    </div>
    <p class="settings-hint">Consigue tu API key en <strong>ollama.com</strong>. Se almacena solo en tu navegador.</p>
  </div>

  <div class="settings-section-label">Placa</div>
  <div class="settings-card">
    <div class="card-heading"><i data-lucide="cpu"></i><h2>Placa objetivo</h2></div>
    <div class="board-badge">
      <div class="board-badge-icon"><i data-lucide="cpu"></i></div>
      <div class="board-badge-info">
        <strong>ESP32 Plus STEAMakers</strong>
        <span>MicroPython · WebSerial · 115200 baud · ESP32-WROOM-32</span>
      </div>
      <div class="board-badge-dot"></div>
    </div>
  </div>

  <div class="settings-bottom-space"></div>
</section>
```

- [ ] **Step 2: Add reveal button logic for API key**

In the event listeners section of main.js, after the Ollama settings listeners, add:
```js
const toggleApiKeyBtn = document.querySelector("#toggleApiKey");
if (toggleApiKeyBtn) {
  toggleApiKeyBtn.addEventListener("click", () => {
    const input = els.ollamaApiKey;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggleApiKeyBtn.innerHTML = `<i data-lucide="${isHidden ? "eye-off" : "eye"}"></i>`;
    createIcons({ icons });
  });
}
```

- [ ] **Step 3: Add settings CSS** to style.css

Add the following CSS sections (full rules, not summaries):

```css
/* ─────────────────────────────────────────────
   SETTINGS — Section labels
───────────────────────────────────────────── */
.settings-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 18px 20px 6px;
  opacity: 0.85;
}

/* ─────────────────────────────────────────────
   SETTINGS — Theme toggle pills
───────────────────────────────────────────── */
.theme-toggle-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
}

.theme-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius);
  border: 1.5px solid var(--line);
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  font-size: 13px;
  font-weight: 600;
  background: var(--surface-2);
}
.theme-pill input { display: none; }
.theme-pill:has(input:checked) {
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 8%, var(--surface));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 15%, transparent);
}
.theme-pill-icon {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--line);
  color: var(--muted);
  transition: background 180ms, color 180ms;
}
.theme-pill:has(input:checked) .theme-pill-icon {
  background: var(--blue);
  color: #fff;
}

/* ─────────────────────────────────────────────
   SETTINGS — Visual mode pills
───────────────────────────────────────────── */
.visual-mode-pills {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  border: 1.5px solid var(--line);
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  background: var(--surface-2);
}
.mode-pill input { display: none; }
.mode-pill:has(input:checked) {
  border-color: var(--blue);
  background: color-mix(in srgb, var(--blue) 8%, var(--surface));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--blue) 15%, transparent);
}
.mode-pill-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--line);
  color: var(--muted);
  flex-shrink: 0;
  transition: background 180ms, color 180ms;
}
.mode-pill:has(input:checked) .mode-pill-icon {
  background: var(--blue);
  color: #fff;
}
.mode-pill-body { flex: 1; }
.mode-pill-body strong { display: block; font-size: 13px; font-weight: 600; }
.mode-pill-body small { font-size: 11px; color: var(--muted); }
[data-mode="detailed"] .mode-pill-icon { background: color-mix(in srgb, var(--purple) 15%, var(--line)); color: var(--purple); }
[data-mode="detailed"]:has(input:checked) .mode-pill-icon { background: var(--purple); color: #fff; }
[data-mode="detailed"]:has(input:checked) { border-color: var(--purple); box-shadow: 0 0 0 3px color-mix(in srgb, var(--purple) 15%, transparent); }
[data-mode="simple"] .mode-pill-icon { background: color-mix(in srgb, var(--green) 15%, var(--line)); color: var(--green); }
[data-mode="simple"]:has(input:checked) .mode-pill-icon { background: var(--green); color: #fff; }
[data-mode="simple"]:has(input:checked) { border-color: var(--green); box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 15%, transparent); }

/* ─────────────────────────────────────────────
   SETTINGS — Toggle switch
───────────────────────────────────────────── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}
.toggle-switch { position: relative; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  display: block;
  width: 44px; height: 24px;
  background: var(--line-strong);
  border-radius: 12px;
  cursor: pointer;
  transition: background 200ms ease;
  position: relative;
}
.toggle-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle-switch input:checked + .toggle-track { background: var(--blue); }
.toggle-switch input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); }

/* ─────────────────────────────────────────────
   SETTINGS — Slider row
───────────────────────────────────────────── */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0 12px;
  color: var(--muted);
}
.slider-row input[type="range"] {
  flex: 1;
  accent-color: var(--blue);
  height: 4px;
  cursor: pointer;
}

/* ─────────────────────────────────────────────
   SETTINGS — AI section
───────────────────────────────────────────── */
.ai-model-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--blue) 8%, var(--surface-2));
  border: 1px solid color-mix(in srgb, var(--blue) 20%, var(--line));
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--muted);
  margin-bottom: 12px;
}
.ai-model-hint i { flex-shrink: 0; margin-top: 1px; color: var(--blue); }
.ai-model-hint code {
  background: var(--line);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--text);
}
.input-with-icon {
  position: relative;
  display: flex;
}
.input-with-icon input { flex: 1; padding-right: 36px; }
.input-reveal-btn {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 36px;
  display: flex; align-items: center; justify-content: center;
  background: none; color: var(--muted);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: color 150ms;
}
.input-reveal-btn:hover { color: var(--text); }

/* ─────────────────────────────────────────────
   SETTINGS — Board badge
───────────────────────────────────────────── */
.board-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--green) 8%, var(--surface-2));
  border: 1px solid color-mix(in srgb, var(--green) 20%, var(--line));
  border-radius: var(--radius);
}
.board-badge-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--green);
  color: #fff;
  flex-shrink: 0;
}
.board-badge-info { flex: 1; }
.board-badge-info strong { display: block; font-size: 13px; font-weight: 600; }
.board-badge-info span { font-size: 11px; color: var(--muted); }
.board-badge-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 25%, transparent);
  flex-shrink: 0;
}
.settings-bottom-space { height: 32px; }
```

### 6b — Detailed mode visual improvements

- [ ] **Step 4: Add CSS for detailed mode blocks**

```css
/* ─────────────────────────────────────────────
   DETAILED MODE — Rich block visuals
───────────────────────────────────────────── */
html[data-visual-mode="detailed"] .blocklyBlockCanvas {
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.10));
}

html[data-visual-mode="detailed"] .blocklyDraggable:not(.blocklyDragging) {
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.12));
  transition: filter 180ms ease;
}

html[data-visual-mode="detailed"] .blocklyDraggable:hover {
  filter: drop-shadow(0 3px 12px rgba(59,130,246,0.25));
}

html[data-visual-mode="detailed"] .blocklySelected > .blocklyPath {
  stroke-width: 2.5px !important;
}

html[data-visual-mode="detailed"] .blocklyZoom > image,
html[data-visual-mode="detailed"] .blocklyTrash > image {
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
}

/* Detailed grid — more visible */
html[data-visual-mode="detailed"] .blocklyMainBackground {
  background-image:
    radial-gradient(circle, var(--blue) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.4;
}
```

- [ ] **Step 5: Add `data-visual-mode` attribute synchronization in `applySettings()`**

Currently the code sets `document.documentElement.dataset.visualMode`. Verify this is being set on `<html>`. If it's set on `<body>` or missing, the CSS selectors above won't work.

In `applySettings()`:
```js
document.documentElement.dataset.visualMode = settings.visualMode;
```
(This should already be present — just verify.)

### 6c — Progress popup redesign

- [ ] **Step 6: Redesign progress overlay HTML in `app.innerHTML`**

Replace:
```html
<div class="progress-overlay" id="progressOverlay" hidden>
  <section class="progress-card" role="status" aria-live="polite">
    <div class="progress-icon" id="progressIcon"><i data-lucide="upload-cloud"></i></div>
    <h2 id="progressTitle">Subiendo a la placa...</h2>
    <p id="progressText">Preparando conexión WebSerial.</p>
    <div class="progress-track"><span id="progressBar"></span></div>
  </section>
</div>
```

With:
```html
<div class="progress-overlay" id="progressOverlay" hidden>
  <div class="progress-backdrop"></div>
  <section class="progress-card" role="status" aria-live="polite">
    <div class="progress-header">
      <div class="progress-icon-wrap" id="progressIcon">
        <i data-lucide="upload-cloud"></i>
      </div>
      <div class="progress-text-wrap">
        <h2 id="progressTitle">Subiendo a la placa...</h2>
        <p id="progressText">Preparando conexión WebSerial.</p>
      </div>
    </div>
    <div class="progress-track-wrap">
      <div class="progress-track"><span id="progressBar"></span></div>
      <span class="progress-pct" id="progressPct">0%</span>
    </div>
  </section>
</div>
```

- [ ] **Step 7: Update `setProgress()` in main.js** to also update the percentage label:

```js
function setProgress({ title, text, value, state = "busy", icon = "upload-cloud" }) {
  progressValue = value;
  els.progressOverlay.hidden = false;
  els.progressOverlay.dataset.state = state;
  els.progressTitle.textContent = title;
  els.progressText.textContent = text;
  const pct = Math.max(0, Math.min(100, value));
  els.progressBar.style.width = `${pct}%`;
  const pctEl = document.querySelector("#progressPct");
  if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  els.progressIcon.innerHTML = `<i data-lucide="${icon}"></i>`;
  createIcons({ icons });
}
```

- [ ] **Step 8: Add progress popup CSS**

```css
/* ─────────────────────────────────────────────
   PROGRESS OVERLAY — redesigned
───────────────────────────────────────────── */
.progress-overlay {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.progress-overlay[hidden] { display: none; }

.progress-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.progress-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  padding: 28px 28px 24px;
  min-width: 320px;
  max-width: 400px;
  width: 90vw;
  box-shadow: var(--shadow-lg);
  animation: progress-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes progress-in {
  from { transform: scale(0.88) translateY(16px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.progress-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--blue) 12%, var(--surface-2));
  color: var(--blue);
  flex-shrink: 0;
  transition: background 300ms, color 300ms;
}
.progress-icon-wrap svg { width: 24px; height: 24px; }

.progress-overlay[data-state="success"] .progress-icon-wrap {
  background: color-mix(in srgb, var(--green) 12%, var(--surface-2));
  color: var(--green);
}
.progress-overlay[data-state="error"] .progress-icon-wrap {
  background: color-mix(in srgb, var(--red) 12%, var(--surface-2));
  color: var(--red);
}

.progress-text-wrap h2 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
.progress-text-wrap p {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.4;
}

.progress-track-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
}

.progress-track > span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--blue);
  transition: width 160ms ease;
  width: 0%;
}

.progress-overlay[data-state="success"] .progress-track > span { background: var(--green); }
.progress-overlay[data-state="error"] .progress-track > span { background: var(--red); }

.progress-pct {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  min-width: 30px;
  text-align: right;
}
```

---

## Task 7 — AI module extraction + improved prompt + persistent memory

**Files:**
- Create: `src/memory.js`
- Create: `src/ai.js`
- Modify: `src/main.js` (remove AI logic, import from ai.js)

### 7a — Persistent memory module (`memory.js`)

- [ ] **Step 1: Create `src/memory.js`**

```js
const MEMORY_KEY = "new-steammakers:ai-memory:v1";

// Stores key-value pairs that persist across sessions.
// The AI reads these and injects them into the system prompt.
// Users can override by mentioning new values in conversation.

const DEFAULT_MEMORY = {};

let _memory = null;

function load() {
  if (_memory) return _memory;
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    _memory = raw ? JSON.parse(raw) : { ...DEFAULT_MEMORY };
  } catch {
    _memory = { ...DEFAULT_MEMORY };
  }
  return _memory;
}

function save() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(_memory || {}));
}

export function memoryGet(key, fallback = null) {
  return load()[key] ?? fallback;
}

export function memorySet(key, value) {
  load()[key] = value;
  save();
}

export function memoryDelete(key) {
  const m = load();
  delete m[key];
  save();
}

export function memoryClear() {
  _memory = {};
  save();
}

export function memoryGetAll() {
  return { ...load() };
}

// ── Auto-extract values from user messages ─────────────────────────────────
// Called after each user message. Detects and stores credentials/tokens.

const TOKEN_PATTERN = /\b(\d{8,12}:[A-Za-z0-9_-]{20,})\b/;
const SSID_PATTERNS = [
  /wifi\s+["']?([^\s"',.;]{2,32})["']?/i,
  /ssid\s+["']?([^\s"',.;]{2,32})["']?/i,
  /red\s+["']?([^\s"',.;]{2,32})["']?/i,
];
const PASS_PATTERNS = [
  /contrase[ñn]a\s+["']?([^\s"',.;]{1,64})["']?/i,
  /clave\s+(wifi\s+)?["']?([^\s"',.;]{1,64})["']?/i,
  /password\s+["']?([^\s"',.;]{1,64})["']?/i,
];
const CHAT_ID_PATTERN = /chat\s+id\s+[-]?\d+|mi\s+(?:chat|id)\s+(?:es\s+)?[-]?\d+/i;

export function autoExtractMemory(text) {
  const changes = [];

  // Telegram token
  const tokenMatch = text.match(TOKEN_PATTERN);
  if (tokenMatch) {
    memorySet("telegram_token", tokenMatch[1]);
    changes.push(`token de Telegram guardado`);
  }

  // WiFi SSID
  for (const pat of SSID_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      const ssid = m[1];
      if (ssid && ssid.length > 1) {
        memorySet("wifi_ssid", ssid);
        changes.push(`SSID WiFi guardado: "${ssid}"`);
        break;
      }
    }
  }

  // WiFi password
  for (const pat of PASS_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      const pass = m[2] || m[1];
      if (pass && pass.length > 0) {
        memorySet("wifi_password", pass);
        changes.push(`contraseña WiFi guardada`);
        break;
      }
    }
  }

  // Telegram chat ID (numeric after "chat id")
  const chatIdM = text.match(/\b(-?\d{6,12})\b/);
  if (chatIdM && (text.toLowerCase().includes("chat") || text.toLowerCase().includes("telegram"))) {
    memorySet("telegram_chat_id", chatIdM[1]);
    changes.push(`chat ID de Telegram guardado`);
  }

  return changes;
}

export function buildMemoryContext() {
  const m = load();
  const lines = [];
  if (m.telegram_token) lines.push(`Token Telegram: ${m.telegram_token}`);
  if (m.telegram_chat_id) lines.push(`Chat ID Telegram: ${m.telegram_chat_id}`);
  if (m.wifi_ssid) lines.push(`SSID WiFi: ${m.wifi_ssid}`);
  if (m.wifi_password) lines.push(`Contraseña WiFi: ${m.wifi_password}`);
  // Add any other keys dynamically
  const knownKeys = new Set(["telegram_token", "telegram_chat_id", "wifi_ssid", "wifi_password"]);
  Object.entries(m).forEach(([k, v]) => {
    if (!knownKeys.has(k)) lines.push(`${k}: ${v}`);
  });
  return lines.length > 0
    ? `MEMORIA PERSISTENTE DEL USUARIO (usa estos valores cuando construyas bloques):\n${lines.join("\n")}`
    : "";
}
```

### 7b — AI module (`ai.js`)

- [ ] **Step 2: Create `src/ai.js`**

Move ALL AI-related functions from main.js into this file. The functions to move are:
- `buildSystemPrompt()`
- `sendAiMessage()`
- `readStreamingChatResponse()`
- `fetchOllamaProxy()`
- `localOllamaProxyCandidates()`
- `normalizeOllamaEndpoint()`
- `runCodeFromAi()`
- `loadCodeFromAi()`
- `stripEmojis()`, `stripSteamBlockPlans()`, `stripPythonCodeBlocks()`
- `escHtml()`
- `renderAiContent()`
- `appendAiMessage()`
- `createStreamingAiMessage()`
- `updateAiMessage()`
- `addAiUndoButton()`
- `clearAiChat()`
- `createSteamStepState()`
- `extractSteamBlockPlan()`, `extractSteamStepActions()`
- `normalizeAiBlockSpec()`, `validateAiBlockSpec()`
- `planToStepActions()`, `applySteamStepAction()`, `processSteamSteps()`
- `connectStepBlockToStatement()`, `connectChain()`
- `createAiBlock()`, `hydrateAiBlock()`, `valueBlockFromPrimitive()`
- `applySteamBlockPlan()`, `applyPlanAsAnimatedSteps()`
- `blockActionMessage()`
- `animateWorkspace()`, `animateAiBlock()`, `restartClassAnimation()`
- `parseWifiCredentials()`, `parseTelegramToken()`
- `getWorkspaceBlock()`, `hasWorkspaceBlock()`
- `getOrCreateProgramBlock()`, `appendSpecToProgram()`
- `telegramCommandIntent()`, `telegramCommandBlocks()`, `ensureTelegramCommandHandler()`
- `auditAndCompleteWorkspace()`
- `showAiThinking()`

The module needs access to: `workspace`, `settings`, `sound`, `els`, `serial`, `getActiveCode()`, `refreshCode()`, `scheduleSave()`, `setTab()`, `Blockly`, `createIcons()`, `icons`, `AVAILABLE_BLOCK_TYPES`, `TDR_BLOCK_TYPES`, `DBOT_BLOCK_TYPES`.

Use a pattern where main.js initializes the AI module with a context object:

```js
// ai.js exports:
export function initAi(context) { /* stores context */ }
export function sendAiMessage(text) { /* ... */ }
export function setAiPanel(open) { /* ... */ }
export function clearAiChat() { /* ... */ }
export let aiTyping = false;
export let aiOpen = false;
```

The `context` object passed from main.js:
```js
const aiContext = {
  getWorkspace: () => workspace,
  getSettings: () => settings,
  sound,
  els,
  serial,
  getActiveCode,
  refreshCode,
  scheduleSave,
  setTab,
  Blockly,
  createIcons,
  icons,
  AVAILABLE_BLOCK_TYPES: [...AVAILABLE_BLOCK_TYPES, ...TDR_BLOCK_TYPES, ...DBOT_BLOCK_TYPES],
};
initAi(aiContext);
```

### 7c — Improved system prompt

The new `buildSystemPrompt()` in ai.js must:
1. Include memory context from `buildMemoryContext()` 
2. Tell the AI to **self-verify** before responding
3. Include the TdR STEAM and 3DBot block types in the available blocks list
4. Give clearer examples for common mistakes

- [ ] **Step 3: Rewrite `buildSystemPrompt()` in ai.js**

```js
function buildSystemPrompt() {
  const ctx = _ctx; // module-level context from initAi()
  const code = ctx.getActiveCode();
  const consoleText = Array.from(ctx.els.consoleOutput.childNodes)
    .map((n) => n.textContent).join("").slice(-1800);
  const boardStatus = ctx.serial.connected
    ? "CONECTADA — ESP32 Plus STEAMakers via WebSerial USB 115200 baud, MicroPython v1.28+"
    : "SIN PLACA — ningún dispositivo conectado";

  const allBlocks = ctx.AVAILABLE_BLOCK_TYPES.join(", ");
  const memCtx = buildMemoryContext();

  return `Eres SteamBot, asistente experto integrado en el IDE NEW STEAMMAKERS (Blockly + MicroPython + WebSerial para ESP32 Plus STEAMakers, también compatible con las placas shield Imagina TdR STEAM e Imagina 3DBot).

ESTADO PLACA: ${boardStatus}

${memCtx ? memCtx + "\n" : ""}CÓDIGO ACTIVO (MicroPython generado por los bloques):
\`\`\`python
${code.trim() || "# editor vacío"}
\`\`\`

CONSOLA REPL (últimas líneas):
\`\`\`
${consoleText.trim() || "(vacía)"}
\`\`\`

CATEGORÍAS DE BLOQUES:
- General: lógica, control, matemáticas, texto, variables, listas, funciones.
- GPIO: entrada/salida digital, analógica, PWM, DAC, touch, interrupciones.
- Tiempo: sleep ms/s/us, ticks, deep sleep.
- Serie: print, UART.
- WiFi/IoT: connect, AP, scan, HTTP, MQTT, Blynk, ThingSpeak.
- Telegram Bot: token, enviar, recibir, comandos.
- BLE/Bluetooth: UART BLE, escaneo.
- ESP-NOW / LoRa.
- Sensores: DHT, ultrasónico, DS18B20, MPU6050, PIR, LDR, gas, RFID.
- Actuadores: servo, buzzer, relay, RGB, motor DC, NeoPixel.
- Pantallas: OLED, LCD I2C, MP3.
- Almacenamiento: SD, ficheros, DS3231 RTC.
- Datos: JSON, CSV, mapa, conversión de tipos, diccionarios, listas.
- Sistema: NTP, reset, ID único, memoria, frecuencia.
- Hilos: thread, mutex.
- TdR STEAM: LEDs, pulsadores SW1/SW2, zumbador, DHT11, potenciómetro, LDR, LM35, RGB.
- 3DBot: motores, avanzar/retroceder/girar/parar, distancia, siguelíneas, semáforo LED, buzzer, LDR, NTC.

TIPOS DE BLOQUE DISPONIBLES (usa SOLO estos nombres exactos en steam_blocks/steam_steps):
${allBlocks}

NORMAS OBLIGATORIAS:
1. Usa EXCLUSIVAMENTE tipos de bloque de la lista anterior. Nunca inventes nombres.
2. Cuando construyas bloques, primero comprueba que TODOS los bloques que vas a usar están en la lista. Si un bloque que necesitas no existe, reemplázalo por una alternativa válida.
3. AUTOVERIFICACIÓN OBLIGATORIA: Antes de devolver tu respuesta final, repasa mentalmente: ¿He incluido todo lo que el usuario ha pedido? ¿Faltan inicializaciones (WiFi, token, etc.)? ¿El código/bloques funcionarían tal como están? Si no, corrígelo antes de responder.
4. Si el usuario menciona credenciales (token Telegram, SSID WiFi, contraseña) y ya las tienes en la memoria persistente, úsalas en los bloques directamente sin pedirlas de nuevo.
5. Si el usuario pide algo que necesita credenciales que NO tienes, pídelas de forma clara y concisa.
6. La forma principal de trabajar es con bloques (\`\`\`steam_steps\`\`\` o \`\`\`steam_blocks\`\`\`). Solo genera Python si el usuario lo pide explícitamente o si es imprescindible.
7. Para colocar bloques en tiempo real usa \`\`\`steam_steps\`\`\` (una acción JSON por línea, sin comas entre líneas). Para entregar el plan completo de una vez usa \`\`\`steam_blocks\`\`\` con JSON completo.
8. No uses emojis ni pictogramas.
9. Responde en español de España, conciso y práctico.
10. Al terminar de colocar bloques, escribe una frase de confirmación visible (ej: "Listo. He colocado el programa en el playground.").

EJEMPLOS DE USO CORRECTO:

WiFi + Telegram Bot básico:
\`\`\`steam_blocks
{"replace":true,"blocks":[{"type":"steam_program","statements":{"SETUP":[{"type":"steam_wifi_connect","inputs":{"SSID":"MiRed","PASSWORD":"MiClave","TIMEOUT":20}},{"type":"steam_telegram_token","inputs":{"TOKEN":"123456789:ABCdef..."}}],"LOOP":[{"type":"steam_telegram_on_message","statements":{"DO":[{"type":"controls_if","inputs":{"IF0":{"type":"logic_compare","fields":{"OP":"EQ"},"inputs":{"A":{"type":"steam_telegram_text"},"B":"/ip"}}},"statements":{"DO0":[{"type":"steam_telegram_send","fields":{"MODE":"none"},"inputs":{"CHAT":{"type":"steam_telegram_chat"},"TEXT":{"type":"steam_wifi_ifconfig","fields":{"PART":"0"}}}}]}}]}}]}}]}
\`\`\`

TdR STEAM — encender LED rojo y leer temperatura:
\`\`\`steam_blocks
{"replace":true,"blocks":[{"type":"steam_program","statements":{"SETUP":[{"type":"tdr_led_rojo","fields":{"STATE":"1"}}],"LOOP":[{"type":"steam_print","inputs":{"TEXT":{"type":"tdr_dht11_temperatura"}}},{"type":"steam_sleep_ms","inputs":{"MS":1000}}]}}]}
\`\`\`

3DBot — siguelíneas básico:
\`\`\`steam_blocks
{"replace":true,"blocks":[{"type":"steam_program","statements":{"LOOP":[{"type":"controls_if","inputs":{"IF0":{"type":"dbot_siguelineas_izq"}},"statements":{"DO0":[{"type":"dbot_girar_derecha","inputs":{"SPEED":60}}]}},{"type":"controls_if","inputs":{"IF0":{"type":"dbot_siguelineas_der"}},"statements":{"DO0":[{"type":"dbot_girar_izquierda","inputs":{"SPEED":60}}]}},{"type":"dbot_avanzar","inputs":{"SPEED":80}}]}}]}
\`\`\``;
}
```

- [ ] **Step 4: Wire up memory auto-extraction in `sendAiMessage()`**

At the top of `sendAiMessage()`, after appending the user message, add:
```js
const memChanges = autoExtractMemory(userText);
if (memChanges.length > 0) {
  // Silently store; optionally show a small indicator
  console.debug("[SteamBot memory]", memChanges);
}
```

- [ ] **Step 5: Test memory persistence**

Open app → chat: "conectar al wifi llamado MiCasa con clave abc123" → verify `localStorage.getItem("new-steammakers:ai-memory:v1")` contains `{"wifi_ssid":"MiCasa","wifi_password":"abc123"}`. Close tab. Reopen. Ask AI to "hacer un bot de Telegram" — verify the AI prompt includes the wifi credentials.

---

## Task 8 — Final wiring, integration tests, and cleanup

**Files:**
- Modify: `src/main.js` (import ai.js, remove moved functions, keep only coordination)

- [ ] **Step 1: Update main.js imports**

```js
import { initAi, sendAiMessage, setAiPanel, clearAiChat } from "./ai.js";
import { memoryGet, memorySet } from "./memory.js";
import { defineTdrBlocks } from "./steamBlocks-tdr.js"; // already done via steamBlocks.js
import { defineDbotBlocks } from "./steamBlocks-3dbot.js"; // same
```

- [ ] **Step 2: Remove all moved functions from main.js** (the AI functions listed in Task 7b)

- [ ] **Step 3: Initialize AI module after workspace is created**

```js
// After injectWorkspace(initialState?.workspace):
initAi({
  getWorkspace: () => workspace,
  getSettings: () => settings,
  sound,
  els,
  serial,
  getActiveCode,
  refreshCode,
  scheduleSave,
  setTab,
  Blockly,
  createIcons,
  icons,
  AVAILABLE_BLOCK_TYPES: [...AVAILABLE_BLOCK_TYPES, ...TDR_BLOCK_TYPES, ...DBOT_BLOCK_TYPES],
});
```

- [ ] **Step 4: Update AI panel event listeners to use imported functions**

```js
document.querySelector("#aiPanelToggle").addEventListener("click", () => {
  sound.play("tap");
  setAiPanel(!aiOpen); // aiOpen is exported from ai.js
});
els.aiClearButton.addEventListener("click", () => { if (!aiTyping) clearAiChat(); });
els.aiSendBtn.addEventListener("click", () => {
  const text = els.aiInput.value.trim();
  if (text) { sendAiMessage(text); els.aiInput.value = ""; }
});
```

- [ ] **Step 5: Full integration test**
  1. Open app, verify all block categories appear (including TdR STEAM and 3DBot)
  2. Drag `dbot_avanzar` block, verify Python helper code appears at top
  3. Drag `tdr_led_rojo` block, verify GPIO 14 in generated code
  4. Click undo — block should disappear
  5. Click redo — block should reappear
  6. Click run — progress popup appears, console tab does NOT switch automatically
  7. Chat: "haz parpadear el LED rojo de la TdR STEAM" — AI should use `tdr_led_rojo` blocks
  8. Chat: "mi wifi es MiCasa, clave MiPass123" — verify memory stored in localStorage
  9. Chat: "haz un bot" — AI should use stored WiFi credentials without asking
  10. Settings drawer: verify theme pills, mode pills, toggle switch, board badge all look correct

---

## Ollama Model Recommendation (task 12)

For this task (Spanish + MicroPython code generation + block JSON generation), the recommended models on Ollama cloud are:

| Model | Speed | Quality | Notes |
|---|---|---|---|
| `qwen2.5-coder:32b:cloud` | Medium | ★★★★★ | Best overall for code+JSON+Spanish |
| `qwen2.5-coder:7b:cloud` | Fast | ★★★★ | Good for simple tasks, very fast |
| `llama3.3:70b:cloud` | Slow | ★★★★★ | Best for complex reasoning, slower |
| `gemma3:27b:cloud` | Medium | ★★★★ | Good Spanish support |

**Recommendation:** `qwen2.5-coder:32b:cloud` — best balance of speed and quality for mixed code/JSON/Spanish tasks. Update DEFAULT_SETTINGS in main.js:

```js
const DEFAULT_SETTINGS = {
  ...
  ollamaModel: "qwen2.5-coder:32b:cloud",
  ...
};
```

---

## Self-Review

**Spec coverage check:**
- ✅ Task 1 — Settings aesthetics (Task 6a)
- ✅ Task 2 — Performance optimization (Task 5)
- ✅ Task 3 — Detailed mode more visual (Task 6b)
- ✅ Task 4 — More blocks (Task 1)
- ✅ Task 5 — TdR STEAM blocks (Task 2)
- ✅ Task 6 — 3DBot blocks (Task 3)
- ✅ Task 7 — Undo/redo (Task 4)
- ✅ Task 8 — No auto-console (Task 4)
- ✅ Task 9 — Better progress popup (Task 6c)
- ✅ Task 10 — Better AI prompt (Task 7c)
- ✅ Task 11 — AI persistent memory (Task 7a+7b)
- ✅ Task 12 — Ollama model recommendation (final section)
- ✅ Task 13 — Audit existing blocks (Task 1, step 1-2)
- ✅ Task 14 — Research done (pre-plan)

**Placeholder scan:** No TBD or TODO markers in code blocks.

**Type consistency:** `TDR_BLOCK_TYPES`, `DBOT_BLOCK_TYPES`, `TDR_HELPERS`, `DBOT_HELPERS` exported from their files and imported in `steamBlocks.js`. `initAi()` context object shape matches usage in `ai.js`.
