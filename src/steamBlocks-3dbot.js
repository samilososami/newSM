import * as Blockly from "blockly";
import { Order, pythonGenerator } from "blockly/python";

// Imagina 3DBot shield on ESP32 Plus STEAMakers 32-WROOM.
// The shield follows STEAMakers D/A labels; GPIOs use the confirmed ESP32
// Plus mapping from this project.
export const DBOT_PINS = {
  BUTTON: 12, // D2, shared with ultrasonic echo in the original shield
  LED_GREEN: 13, // D3
  SONAR_TRIG: 5, // D4
  LINE_LEFT: 23, // D5, shared with yellow LED
  LINE_RIGHT: 19, // D6, shared with red LED
  MOT_A_DIR1: 18, // D7
  MOT_A_DIR2: 26, // D8
  MOT_A_PWM: 25, // D9
  MOT_B_PWM: 17, // D10
  IR_RX: 16, // D11
  MOT_B_DIR1: 27, // D12
  MOT_B_DIR2: 14, // D13
  BUZZER_A0: 36, // A0, input-only on ESP32-WROOM-32
  LDR: 33, // A2
  NTC: 15, // A3
};

const setGen = (type, fn) => {
  pythonGenerator.forBlock[type] = fn;
};

const val = (block, gen, name, fallback = "0") =>
  gen.valueToCode(block, name, Order.NONE) || fallback;

const speedDuty = (speed) => `int(max(0, min(1023, float(${speed}) * 10.23)))`;

export function defineDbotBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: "dbot_avanzar",
      message0: "3DBot avanzar velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_retroceder",
      message0: "3DBot retroceder velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_girar_derecha",
      message0: "3DBot girar derecha velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_girar_izquierda",
      message0: "3DBot girar izquierda velocidad %1",
      args0: [{ type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_parar",
      message0: "3DBot parar motores",
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_motor_izquierdo",
      message0: "3DBot motor izquierdo %1 velocidad %2",
      args0: [
        { type: "field_dropdown", name: "DIR", options: [["adelante", "fwd"], ["atras", "bwd"], ["parar", "stop"]] },
        { type: "input_value", name: "SPEED", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_motor_derecho",
      message0: "3DBot motor derecho %1 velocidad %2",
      args0: [
        { type: "field_dropdown", name: "DIR", options: [["adelante", "fwd"], ["atras", "bwd"], ["parar", "stop"]] },
        { type: "input_value", name: "SPEED", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_distancia",
      message0: "3DBot distancia cm",
      output: "Number",
      colour: 160,
      tooltip: "Ultrasonidos 3DBot: TRIG D4/GPIO5 y ECHO D2/GPIO12.",
    },
    {
      type: "dbot_siguelineas_izq",
      message0: "3DBot linea izquierda detectada",
      output: "Boolean",
      colour: 160,
    },
    {
      type: "dbot_siguelineas_der",
      message0: "3DBot linea derecha detectada",
      output: "Boolean",
      colour: 160,
    },
    {
      type: "dbot_pulsador",
      message0: "3DBot pulsador pulsado",
      output: "Boolean",
      colour: 210,
    },
    {
      type: "dbot_ldr",
      message0: "3DBot luz 0-100 %",
      output: "Number",
      colour: 160,
    },
    {
      type: "dbot_temperatura",
      message0: "3DBot temperatura NTC C",
      output: "Number",
      colour: 160,
    },
    {
      type: "dbot_led_verde",
      message0: "3DBot LED verde %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON", "1"], ["OFF", "0"]] }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: "dbot_led_amarillo",
      message0: "3DBot LED amarillo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON", "1"], ["OFF", "0"]] }],
      previousStatement: null,
      nextStatement: null,
      colour: 50,
    },
    {
      type: "dbot_led_rojo",
      message0: "3DBot LED rojo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON", "1"], ["OFF", "0"]] }],
      previousStatement: null,
      nextStatement: null,
      colour: 0,
    },
    {
      type: "dbot_buzzer_note",
      message0: "3DBot zumbador A0 %1",
      args0: [{ type: "field_input", name: "TEXT", text: "A0/GPIO36 es solo entrada en ESP32-WROOM" }],
      previousStatement: null,
      nextStatement: null,
      colour: 50,
      tooltip: "En Arduino el 3DBot usa A0 para buzzer. En ESP32 Plus STEAMakers A0 es GPIO36, solo entrada, por eso no se genera PWM falso.",
    },
  ]);
}

export function defineDbotGenerators() {
  setGen("dbot_avanzar", (block, gen) => {
    const s = val(block, gen, "SPEED", "80");
    return `__dbot_motor(1, 1, ${speedDuty(s)}, ${speedDuty(s)})\n`;
  });
  setGen("dbot_retroceder", (block, gen) => {
    const s = val(block, gen, "SPEED", "80");
    return `__dbot_motor(-1, -1, ${speedDuty(s)}, ${speedDuty(s)})\n`;
  });
  setGen("dbot_girar_derecha", (block, gen) => {
    const s = val(block, gen, "SPEED", "60");
    return `__dbot_motor(1, -1, ${speedDuty(s)}, ${speedDuty(s)})\n`;
  });
  setGen("dbot_girar_izquierda", (block, gen) => {
    const s = val(block, gen, "SPEED", "60");
    return `__dbot_motor(-1, 1, ${speedDuty(s)}, ${speedDuty(s)})\n`;
  });
  setGen("dbot_parar", () => "__dbot_motor(0, 0, 0, 0)\n");
  setGen("dbot_motor_izquierdo", (block, gen) => {
    const dir = block.getFieldValue("DIR");
    const d = dir === "fwd" ? 1 : dir === "bwd" ? -1 : 0;
    return `__dbot_motor_a(${d}, ${speedDuty(val(block, gen, "SPEED", "80"))})\n`;
  });
  setGen("dbot_motor_derecho", (block, gen) => {
    const dir = block.getFieldValue("DIR");
    const d = dir === "fwd" ? 1 : dir === "bwd" ? -1 : 0;
    return `__dbot_motor_b(${d}, ${speedDuty(val(block, gen, "SPEED", "80"))})\n`;
  });
  setGen("dbot_distancia", () => ["__dbot_ultrasonic_cm()", Order.FUNCTION_CALL]);
  setGen("dbot_siguelineas_izq", () => [`machine.Pin(${DBOT_PINS.LINE_LEFT}, machine.Pin.IN).value() == 0`, Order.RELATIONAL]);
  setGen("dbot_siguelineas_der", () => [`machine.Pin(${DBOT_PINS.LINE_RIGHT}, machine.Pin.IN).value() == 0`, Order.RELATIONAL]);
  setGen("dbot_pulsador", () => [`machine.Pin(${DBOT_PINS.BUTTON}, machine.Pin.IN, machine.Pin.PULL_UP).value() == 0`, Order.RELATIONAL]);
  setGen("dbot_ldr", () => [`__dbot_adc_percent(${DBOT_PINS.LDR})`, Order.FUNCTION_CALL]);
  setGen("dbot_temperatura", () => [`__dbot_ntc_celsius(${DBOT_PINS.NTC})`, Order.FUNCTION_CALL]);
  setGen("dbot_led_verde", (block) => `machine.Pin(${DBOT_PINS.LED_GREEN}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`);
  setGen("dbot_led_amarillo", (block) => `machine.Pin(${DBOT_PINS.LINE_LEFT}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`);
  setGen("dbot_led_rojo", (block) => `machine.Pin(${DBOT_PINS.LINE_RIGHT}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`);
  setGen("dbot_buzzer_note", (block) => `# 3DBot buzzer: ${block.getFieldValue("TEXT")}\n`);
}

export const DBOT_HELPERS = `
import machine, time

__dbot_pwm_a = machine.PWM(machine.Pin(${DBOT_PINS.MOT_A_PWM}), freq=1000)
__dbot_pwm_b = machine.PWM(machine.Pin(${DBOT_PINS.MOT_B_PWM}), freq=1000)
__dbot_ma1 = machine.Pin(${DBOT_PINS.MOT_A_DIR1}, machine.Pin.OUT)
__dbot_ma2 = machine.Pin(${DBOT_PINS.MOT_A_DIR2}, machine.Pin.OUT)
__dbot_mb1 = machine.Pin(${DBOT_PINS.MOT_B_DIR1}, machine.Pin.OUT)
__dbot_mb2 = machine.Pin(${DBOT_PINS.MOT_B_DIR2}, machine.Pin.OUT)

def __dbot_motor_a(direction, duty):
    if direction > 0:
        __dbot_ma1.value(1); __dbot_ma2.value(0)
    elif direction < 0:
        __dbot_ma1.value(0); __dbot_ma2.value(1)
    else:
        __dbot_ma1.value(0); __dbot_ma2.value(0)
    __dbot_pwm_a.duty(int(max(0, min(1023, duty))))

def __dbot_motor_b(direction, duty):
    if direction > 0:
        __dbot_mb1.value(1); __dbot_mb2.value(0)
    elif direction < 0:
        __dbot_mb1.value(0); __dbot_mb2.value(1)
    else:
        __dbot_mb1.value(0); __dbot_mb2.value(0)
    __dbot_pwm_b.duty(int(max(0, min(1023, duty))))

def __dbot_motor(dir_a, dir_b, duty_a, duty_b):
    __dbot_motor_a(dir_a, duty_a)
    __dbot_motor_b(dir_b, duty_b)

def __dbot_ultrasonic_cm():
    trig = machine.Pin(${DBOT_PINS.SONAR_TRIG}, machine.Pin.OUT)
    echo = machine.Pin(${DBOT_PINS.BUTTON}, machine.Pin.IN)
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
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
    if raw <= 0 or raw >= 4095:
        return 0
    r = 10000.0 * raw / (4095 - raw)
    return round(1.0 / (1.0 / 298.15 + math.log(r / 10000.0) / float(beta)) - 273.15, 1)
`;

export const DBOT_BLOCK_TYPES = [
  "dbot_avanzar",
  "dbot_retroceder",
  "dbot_girar_derecha",
  "dbot_girar_izquierda",
  "dbot_parar",
  "dbot_motor_izquierdo",
  "dbot_motor_derecho",
  "dbot_distancia",
  "dbot_siguelineas_izq",
  "dbot_siguelineas_der",
  "dbot_pulsador",
  "dbot_ldr",
  "dbot_temperatura",
  "dbot_led_verde",
  "dbot_led_amarillo",
  "dbot_led_rojo",
  "dbot_buzzer_note",
];

const block = (type, inputs = {}) => ({ kind: "block", type, inputs });
const shadowNumber = (value) => ({ shadow: { type: "math_number", fields: { NUM: String(value) } } });

export const DBOT_TOOLBOX_CATEGORY = {
  kind: "category",
  name: "3DBot",
  colour: "#3f9b42",
  contents: [
    { kind: "label", text: "Movimiento" },
    block("dbot_avanzar", { SPEED: shadowNumber(80) }),
    block("dbot_retroceder", { SPEED: shadowNumber(80) }),
    block("dbot_girar_derecha", { SPEED: shadowNumber(60) }),
    block("dbot_girar_izquierda", { SPEED: shadowNumber(60) }),
    block("dbot_parar"),
    block("dbot_motor_izquierdo", { SPEED: shadowNumber(80) }),
    block("dbot_motor_derecho", { SPEED: shadowNumber(80) }),
    { kind: "label", text: "Sensores" },
    block("dbot_distancia"),
    block("dbot_siguelineas_izq"),
    block("dbot_siguelineas_der"),
    block("dbot_pulsador"),
    block("dbot_ldr"),
    block("dbot_temperatura"),
    { kind: "label", text: "LEDs" },
    block("dbot_led_verde"),
    block("dbot_led_amarillo"),
    block("dbot_led_rojo"),
    { kind: "label", text: "Compatibilidad" },
    block("dbot_buzzer_note"),
  ],
};
