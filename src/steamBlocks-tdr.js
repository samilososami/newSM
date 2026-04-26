import * as Blockly from "blockly";
import { Order, pythonGenerator } from "blockly/python";

// Imagina TdR STEAM shield on ESP32 Plus STEAMakers 32-WROOM.
// Component positions follow STEAMakers D/A labels; GPIOs use the confirmed
// ESP32 Plus STEAMakers mapping from this project.
export const TDR_PINS = {
  LED_RED: 14, // D13
  LED_BLUE: 27, // D12
  RGB_R: 19, // D6
  RGB_G: 25, // D9
  RGB_B: 17, // D10
  SW1: 12, // D2
  SW2: 18, // D7
  BUZZER: 26, // D8
  DHT11: 5, // D4
  POT: 36, // A0
  LDR: 39, // A1
  LM35: 33, // A2
};

const setGen = (type, fn) => {
  pythonGenerator.forBlock[type] = fn;
};

const val = (block, gen, name, fallback = "0") =>
  gen.valueToCode(block, name, Order.NONE) || fallback;

export function defineTdrBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: "tdr_led_rojo",
      message0: "TdR LED rojo %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON", "1"], ["OFF", "0"]] }],
      previousStatement: null,
      nextStatement: null,
      colour: 0,
      tooltip: "LED rojo LED4 de TdR STEAM, D13/GPIO14.",
    },
    {
      type: "tdr_led_azul",
      message0: "TdR LED azul %1",
      args0: [{ type: "field_dropdown", name: "STATE", options: [["ON", "1"], ["OFF", "0"]] }],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: "LED azul LED3 de TdR STEAM, D12/GPIO27.",
    },
    {
      type: "tdr_led_rgb",
      message0: "TdR LED RGB rojo %1 verde %2 azul %3",
      args0: [
        { type: "input_value", name: "R", check: "Number" },
        { type: "input_value", name: "G", check: "Number" },
        { type: "input_value", name: "B", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 50,
      tooltip: "RGB TdR STEAM en D6/D9/D10. Valores 0-255.",
    },
    {
      type: "tdr_pulsador_sw1",
      message0: "TdR pulsador SW1 pulsado",
      output: "Boolean",
      colour: 210,
      tooltip: "SW1 en D2/GPIO12, activo a nivel bajo.",
    },
    {
      type: "tdr_pulsador_sw2",
      message0: "TdR pulsador SW2 pulsado",
      output: "Boolean",
      colour: 210,
      tooltip: "SW2 en D7/GPIO18, activo a nivel bajo.",
    },
    {
      type: "tdr_buzzer_tone",
      message0: "TdR zumbador %1 Hz durante %2 ms",
      args0: [
        { type: "input_value", name: "FREQ", check: "Number" },
        { type: "input_value", name: "MS", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 50,
      tooltip: "Zumbador TdR STEAM en D8/GPIO26.",
    },
    {
      type: "tdr_buzzer_off",
      message0: "TdR zumbador apagar",
      previousStatement: null,
      nextStatement: null,
      colour: 50,
    },
    {
      type: "tdr_dht11_temperatura",
      message0: "TdR temperatura DHT11 C",
      output: "Number",
      colour: 160,
      tooltip: "DHT11 TdR STEAM en D4/GPIO5.",
    },
    {
      type: "tdr_dht11_humedad",
      message0: "TdR humedad DHT11 %",
      output: "Number",
      colour: 160,
    },
    {
      type: "tdr_potenciometro",
      message0: "TdR potenciometro 0-100 %",
      output: "Number",
      colour: 160,
      tooltip: "Potenciometro TdR STEAM en A0/GPIO36.",
    },
    {
      type: "tdr_ldr",
      message0: "TdR sensor luz 0-100 %",
      output: "Number",
      colour: 160,
      tooltip: "LDR TdR STEAM en A1/GPIO39.",
    },
    {
      type: "tdr_lm35",
      message0: "TdR temperatura LM35 C",
      output: "Number",
      colour: 160,
      tooltip: "LM35 TdR STEAM en A2/GPIO33.",
    },
  ]);
}

export function defineTdrGenerators() {
  setGen("tdr_led_rojo", (block) => `machine.Pin(${TDR_PINS.LED_RED}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`);
  setGen("tdr_led_azul", (block) => `machine.Pin(${TDR_PINS.LED_BLUE}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`);
  setGen("tdr_led_rgb", (block, gen) => `__tdr_rgb_write(${val(block, gen, "R")}, ${val(block, gen, "G")}, ${val(block, gen, "B")})\n`);
  setGen("tdr_pulsador_sw1", () => [`machine.Pin(${TDR_PINS.SW1}, machine.Pin.IN, machine.Pin.PULL_UP).value() == 0`, Order.RELATIONAL]);
  setGen("tdr_pulsador_sw2", () => [`machine.Pin(${TDR_PINS.SW2}, machine.Pin.IN, machine.Pin.PULL_UP).value() == 0`, Order.RELATIONAL]);
  setGen("tdr_buzzer_tone", (block, gen) => `__tdr_buzzer_tone(${val(block, gen, "FREQ", "1000")}, ${val(block, gen, "MS", "200")})\n`);
  setGen("tdr_buzzer_off", () => `__tdr_pwm_off(${TDR_PINS.BUZZER})\n`);
  setGen("tdr_dht11_temperatura", () => [`__tdr_dht_read("temperature")`, Order.FUNCTION_CALL]);
  setGen("tdr_dht11_humedad", () => [`__tdr_dht_read("humidity")`, Order.FUNCTION_CALL]);
  setGen("tdr_potenciometro", () => [`__tdr_adc_percent(${TDR_PINS.POT})`, Order.FUNCTION_CALL]);
  setGen("tdr_ldr", () => [`__tdr_adc_percent(${TDR_PINS.LDR})`, Order.FUNCTION_CALL]);
  setGen("tdr_lm35", () => [`__tdr_lm35_celsius(${TDR_PINS.LM35})`, Order.FUNCTION_CALL]);
}

export const TDR_HELPERS = `
import machine, time

__tdr_pwms = {}

def __tdr_pwm(pin, freq=1000):
    pin = int(pin)
    if pin not in __tdr_pwms:
        __tdr_pwms[pin] = machine.PWM(machine.Pin(pin), freq=int(freq))
    pwm = __tdr_pwms[pin]
    pwm.freq(int(freq))
    return pwm

def __tdr_pwm_off(pin):
    pin = int(pin)
    pwm = __tdr_pwms.get(pin)
    if pwm:
        pwm.deinit()
        del __tdr_pwms[pin]

def __tdr_rgb_write(r, g, b):
    __tdr_pwm(${TDR_PINS.RGB_R}).duty(int(max(0, min(1023, float(r) * 4))))
    __tdr_pwm(${TDR_PINS.RGB_G}).duty(int(max(0, min(1023, float(g) * 4))))
    __tdr_pwm(${TDR_PINS.RGB_B}).duty(int(max(0, min(1023, float(b) * 4))))

def __tdr_buzzer_tone(freq, ms):
    pwm = __tdr_pwm(${TDR_PINS.BUZZER}, int(freq))
    pwm.duty(512)
    time.sleep_ms(int(ms))
    __tdr_pwm_off(${TDR_PINS.BUZZER})

def __tdr_dht_read(key="temperature"):
    import dht
    sensor = dht.DHT11(machine.Pin(${TDR_PINS.DHT11}))
    sensor.measure()
    return sensor.humidity() if key == "humidity" else sensor.temperature()

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
    return round((adc.read() * 3300 / 4095) / 10.0, 1)
`;

export const TDR_BLOCK_TYPES = [
  "tdr_led_rojo",
  "tdr_led_azul",
  "tdr_led_rgb",
  "tdr_pulsador_sw1",
  "tdr_pulsador_sw2",
  "tdr_buzzer_tone",
  "tdr_buzzer_off",
  "tdr_dht11_temperatura",
  "tdr_dht11_humedad",
  "tdr_potenciometro",
  "tdr_ldr",
  "tdr_lm35",
];

const block = (type, inputs = {}) => ({ kind: "block", type, inputs });
const shadowNumber = (value) => ({ shadow: { type: "math_number", fields: { NUM: String(value) } } });

export const TDR_TOOLBOX_CATEGORY = {
  kind: "category",
  name: "TdR STEAM",
  colour: "#1f9d78",
  contents: [
    { kind: "label", text: "LEDs" },
    block("tdr_led_rojo"),
    block("tdr_led_azul"),
    block("tdr_led_rgb", { R: shadowNumber(255), G: shadowNumber(0), B: shadowNumber(0) }),
    { kind: "label", text: "Pulsadores" },
    block("tdr_pulsador_sw1"),
    block("tdr_pulsador_sw2"),
    { kind: "label", text: "Zumbador" },
    block("tdr_buzzer_tone", { FREQ: shadowNumber(440), MS: shadowNumber(250) }),
    block("tdr_buzzer_off"),
    { kind: "label", text: "Sensores" },
    block("tdr_dht11_temperatura"),
    block("tdr_dht11_humedad"),
    block("tdr_potenciometro"),
    block("tdr_ldr"),
    block("tdr_lm35"),
  ],
};
