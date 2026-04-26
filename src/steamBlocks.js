import * as Blockly from "blockly";
import { Order, pythonGenerator } from "blockly/python";
import { defineTdrBlocks, defineTdrGenerators, TDR_BLOCK_TYPES, TDR_HELPERS, TDR_TOOLBOX_CATEGORY } from "./steamBlocks-tdr.js";
import { defineDbotBlocks, defineDbotGenerators, DBOT_BLOCK_TYPES, DBOT_HELPERS, DBOT_TOOLBOX_CATEGORY } from "./steamBlocks-3dbot.js";

const PIN_OPTIONS = [
  ["D0 / RX0 / GPIO3", "3"],
  ["D1 / TX0 / GPIO1", "1"],
  ["D2 / GPIO12", "12"],
  ["D3 / GPIO13", "13"],
  ["D4 / GPIO5", "5"],
  ["D5 / GPIO23", "23"],
  ["D6 / GPIO19", "19"],
  ["D7 / GPIO18", "18"],
  ["D8 / GPIO26", "26"],
  ["D9 / GPIO25 / DAC1", "25"],
  ["D10 / GPIO17", "17"],
  ["D11 / GPIO16", "16"],
  ["D12 / GPIO27", "27"],
  ["D13 / GPIO14", "14"],
  ["SDA / GPIO21", "21"],
  ["SCL / GPIO22", "22"],
  ["A0 / GPIO36", "36"],
  ["A1 / GPIO39", "39"],
  ["A2 / GPIO33", "33"],
  ["A3 / GPIO15", "15"],
  ["GPIO2", "2"],
  ["GPIO4", "4"],
  ["GPIO32", "32"],
  ["GPIO34 (solo entrada)", "34"],
  ["GPIO35 (solo entrada)", "35"],
];

const ADC_OPTIONS = [
  ["A0 / GPIO36", "36"],
  ["A1 / GPIO39", "39"],
  ["A2 / GPIO33", "33"],
  ["A3 / GPIO15", "15"],
  ["GPIO32", "32"],
  ["GPIO34", "34"],
  ["GPIO35", "35"],
];

const TOUCH_OPTIONS = [
  ["T0 / GPIO4", "4"],
  ["T2 / GPIO2", "2"],
  ["T3 / GPIO15", "15"],
  ["T4 / GPIO13", "13"],
  ["T5 / GPIO12", "12"],
  ["T6 / GPIO14", "14"],
  ["T7 / GPIO27", "27"],
  ["T8 / GPIO33", "33"],
  ["T9 / GPIO32", "32"],
];

export const BLOCK_RESEARCH_SUMMARY = [
  "General: logica, control, matematicas, texto, variables, listas y funciones.",
  "Arduino/STEAMakers: entrada/salida, tiempo, puerto serie, Bluetooth, sensores, actuadores, LCD/OLED, EEPROM, motores, keypad, RTC, GPS, SD, MQTT, NeoPixel, RFID, matriz LED, MP3, domotica, teclado/raton, Blynk y conectividad ESP32.",
  "ESP32 STEAMakers: WiFi cliente/AP/IP/hostname/scan, HTTP cliente/servidor, WiFi Mesh, ESP-NOW, Telegram Bot, DeepSleep, LoRa/LoRaWAN y multitarea.",
  "ESP32 Plus STEAMakers pinout: D0..D13, A0..A3, buses I2C/SPI/UART, touch, DAC, SD y sensor de consumo.",
];

export const RESEARCH_LINKS = [
  {
    label: "STEAMakersBlocks docs",
    url: "https://www.steamakersblocks.com/web/site/doc",
  },
  {
    label: "ESP32 WiFi IoT Mesh",
    url: "https://www.steamakersblocks.com/web/site/download?relativePath=%2F02+ESP32+STEAMakers+y+micro_STEAMakers+IoT%2FESP32+STEAMakers+WiFi-IoT-Mesh.pdf",
  },
  {
    label: "ESP32 Telegram Bot",
    url: "https://www.steamakersblocks.com/web/site/download?relativePath=%2F02+ESP32+STEAMakers+y+micro_STEAMakers+IoT%2FESP32+STEAMakers+Telegram+Bot.pdf",
  },
  {
    label: "ESP32 ESP-NOW",
    url: "https://www.steamakersblocks.com/web/site/download?relativePath=%2F02+ESP32+STEAMakers+y+micro_STEAMakers+IoT%2FESP32+STEAMakers+ESP-NOW.pdf",
  },
  {
    label: "Pinout ESP32 Plus STEAMakers",
    url: "https://www.steamakersblocks.com/web/site/download?relativePath=%2F09+Pinouts%2FPinout+-+ESP32+Steamakers+A1.pdf",
  },
];

export const AVAILABLE_BLOCK_TYPES = [
  "steam_program", "steam_forever", "steam_every_ms", "steam_comment", "steam_gc_collect",
  "controls_if", "controls_repeat_ext", "controls_whileUntil", "controls_for",
  "steam_digital_write", "steam_digital_read", "steam_pin_pull_read", "steam_analog_read", "steam_analog_percent", "steam_pwm_write", "steam_dac_write", "steam_touch_read", "steam_pulse_in", "steam_i2c_init", "steam_i2c_scan",
  "steam_sleep_ms", "steam_sleep_s", "steam_ticks_ms", "steam_deepsleep",
  "steam_print", "steam_print_csv", "steam_read_line", "steam_uart_init", "steam_uart_write",
  "steam_wifi_connect", "steam_wifi_ap", "steam_wifi_is_connected", "steam_wifi_ifconfig", "steam_wifi_scan", "steam_wifi_hostname", "steam_wifi_rssi", "steam_wifi_mac", "steam_wifi_disconnect", "steam_wifi_wait_connected",
  "steam_http_get", "steam_http_post_json", "steam_http_server", "steam_http_route", "steam_http_param", "steam_mqtt_connect", "steam_mqtt_publish", "steam_mqtt_on_message", "steam_mqtt_message_text", "steam_blynk_write", "steam_thingspeak_write",
  "steam_telegram_token", "steam_telegram_send", "steam_telegram_reply", "steam_telegram_send_ip", "steam_telegram_on_message", "steam_telegram_text", "steam_telegram_chat", "steam_telegram_sender",
  "steam_ble_uart_start", "steam_ble_uart_send", "steam_ble_uart_on_rx", "steam_ble_uart_text", "steam_ble_scan_names", "steam_ble_scan_send_telegram", "steam_bluetooth_hid_note", "steam_keyboard_mouse_note",
  "steam_espnow_init", "steam_espnow_add_peer", "steam_espnow_send", "steam_espnow_on_receive", "steam_espnow_message", "steam_espnow_mac", "steam_udp_broadcast_send", "steam_lora_note",
  "steam_dht_read", "steam_ultrasonic_cm", "steam_ds18b20_read", "steam_mpu6050_read", "steam_button_pressed", "steam_pir_read", "steam_light_percent", "steam_sound_percent", "steam_rain_percent", "steam_gas_raw", "steam_rfid_uid",
  "steam_servo_write", "steam_buzzer_tone", "steam_relay_write", "steam_rgb_write", "steam_motor_dc", "steam_motor_shield_note",
  "steam_neopixel_init", "steam_neopixel_set", "steam_neopixel_fill", "steam_neopixel_show", "steam_oled_init", "steam_oled_text", "steam_oled_fill", "steam_lcd_text", "steam_mp3_play", "steam_matrix8_note",
  "steam_sd_mount", "steam_file_write", "steam_file_read", "steam_file_exists", "steam_file_remove", "steam_file_listdir", "steam_mkdir", "steam_ds3231_now", "steam_gps_read_line", "steam_keypad_read",
  "steam_json_get", "steam_urlencode", "steam_csv", "steam_map_value", "steam_to_int", "steam_to_float", "steam_to_string", "steam_text_contains", "steam_text_startswith", "steam_text_replace", "steam_clamp", "math_number", "math_arithmetic", "math_random_int", "text", "text_join", "logic_compare", "logic_operation", "logic_boolean",
  "steam_ntp_sync", "steam_time_now_tuple", "steam_time_part", "steam_system_reset", "steam_system_unique_id", "steam_system_mem_free", "steam_system_freq", "steam_system_set_freq",
  "lists_create_with", "lists_length", "lists_getIndex", "lists_setIndex", "steam_thread_start", "steam_mutex",
  "steam_sleep_us", "steam_pin_toggle", "steam_pwm_off", "steam_i2c_write_reg", "steam_i2c_read_reg",
  "steam_esp32_hall", "steam_ntc_temperature", "steam_list_append", "steam_list_pop", "steam_dict_new",
  "steam_dict_set", "steam_dict_get", "steam_random_float", "steam_format_float", "steam_pin_irq",
  ...TDR_BLOCK_TYPES,
  ...DBOT_BLOCK_TYPES,
];

export { TDR_BLOCK_TYPES, DBOT_BLOCK_TYPES };

const requiredImports = new Set();
const requiredHelpers = new Set();

const quote = (value) => JSON.stringify(String(value));
const sanitizeId = (id) => id.replace(/[^a-zA-Z0-9_]/g, "_");

function defineBlocks(definitions) {
  if (Blockly.common?.defineBlocksWithJsonArray) {
    Blockly.common.defineBlocksWithJsonArray(definitions);
  } else {
    Blockly.defineBlocksWithJsonArray(definitions);
  }
}

function dropdown(name, options) {
  return { type: "field_dropdown", name, options };
}

function value(block, generator, name, fallback = "0", order = Order.NONE) {
  return generator.valueToCode(block, name, order) || fallback;
}

function statements(block, generator, name) {
  return generator.statementToCode(block, name) || `${generator.INDENT}pass\n`;
}

function indentCode(code, prefix) {
  return code
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

function outdentCode(code, prefix) {
  return code
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : line))
    .join("\n");
}

function needImport(line) {
  requiredImports.add(line);
}

function needHelper(name) {
  requiredHelpers.add(name);
}

function setGenerator(type, handler) {
  pythonGenerator.forBlock[type] = handler;
}

const HELPER_SNIPPETS = {
  map: `
def __steam_map(value, in_min, in_max, out_min, out_max):
    if in_max == in_min:
        return out_min
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
`,
  adc: `
def __steam_adc_read(pin):
    import machine
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    return adc.read()
`,
  percent: `
def __steam_percent_from_adc(pin):
    return int(max(0, min(100, (__steam_adc_read(pin) * 100) / 4095)))
`,
  pwm: `
def __steam_pwm_write(pin, duty, freq=1000):
    import machine
    global __steam_pwms
    try:
        __steam_pwms
    except NameError:
        __steam_pwms = {}
    key = int(pin)
    if key not in __steam_pwms:
        __steam_pwms[key] = machine.PWM(machine.Pin(key), freq=int(freq))
    pwm = __steam_pwms[key]
    pwm.freq(int(freq))
    duty = int(max(0, min(1023, duty)))
    pwm.duty(duty)
`,
  servo: `
def __steam_servo_write(pin, degrees, min_us=500, max_us=2500):
    degrees = max(0, min(180, float(degrees)))
    us = min_us + (max_us - min_us) * degrees / 180
    duty = int(us * 1023 / 20000)
    __steam_pwm_write(pin, duty, 50)
`,
  pulse: `
def __steam_pulse_in(pin, level=1, timeout=1000000):
    import machine
    return machine.time_pulse_us(machine.Pin(int(pin), machine.Pin.IN), int(level), int(timeout))
`,
  dht: `
def __steam_dht_read(pin, model="DHT11", key="temperature"):
    import dht, machine
    sensor = dht.DHT22(machine.Pin(int(pin))) if model == "DHT22" else dht.DHT11(machine.Pin(int(pin)))
    sensor.measure()
    return sensor.humidity() if key == "humidity" else sensor.temperature()
`,
  ultrasonic: `
def __steam_ultrasonic_cm(trigger_pin, echo_pin, timeout=30000):
    import machine, time
    trigger = machine.Pin(int(trigger_pin), machine.Pin.OUT)
    echo = machine.Pin(int(echo_pin), machine.Pin.IN)
    trigger.value(0)
    time.sleep_us(2)
    trigger.value(1)
    time.sleep_us(10)
    trigger.value(0)
    pulse = machine.time_pulse_us(echo, 1, int(timeout))
    if pulse < 0:
        return -1
    return pulse / 58.0
`,
  ds18b20: `
def __steam_ds18b20_read(pin):
    import machine, onewire, ds18x20, time
    bus = ds18x20.DS18X20(onewire.OneWire(machine.Pin(int(pin))))
    roms = bus.scan()
    if not roms:
        return None
    bus.convert_temp()
    time.sleep_ms(750)
    return bus.read_temp(roms[0])
`,
  i2c: `
def __steam_i2c_init(sda=21, scl=22, freq=400000):
    import machine
    global __steam_i2c
    __steam_i2c = machine.I2C(0, sda=machine.Pin(int(sda)), scl=machine.Pin(int(scl)), freq=int(freq))
    return __steam_i2c

def __steam_i2c_bus():
    global __steam_i2c
    try:
        return __steam_i2c
    except NameError:
        return __steam_i2c_init()
`,
  mpu6050: `
def __steam_mpu6050_read(axis="ax", addr=0x68):
    import struct
    i2c = __steam_i2c_bus()
    i2c.writeto_mem(addr, 0x6B, b"\\x00")
    data = i2c.readfrom_mem(addr, 0x3B, 14)
    ax, ay, az, temp, gx, gy, gz = struct.unpack(">hhhhhhh", data)
    values = {
        "ax": ax / 16384,
        "ay": ay / 16384,
        "az": az / 16384,
        "gx": gx / 131,
        "gy": gy / 131,
        "gz": gz / 131,
        "temp": temp / 340 + 36.53,
    }
    return values.get(axis, 0)
`,
  neopixel: `
__steam_pixels = {}

def __steam_neopixel_init(pin, count):
    import machine, neopixel
    global __steam_pixels
    key = int(pin)
    __steam_pixels[key] = neopixel.NeoPixel(machine.Pin(key), int(count))
    return __steam_pixels[key]

def __steam_neopixel(pin, count=30):
    global __steam_pixels
    key = int(pin)
    if key not in __steam_pixels:
        __steam_neopixel_init(key, count)
    return __steam_pixels[key]
`,
  oled: `
def __steam_oled_init(width=128, height=64, addr=0x3C):
    import ssd1306
    global __steam_oled
    __steam_oled = ssd1306.SSD1306_I2C(int(width), int(height), __steam_i2c_bus(), addr=int(addr))
    return __steam_oled
`,
  lcd: `
def __steam_lcd_i2c_text(text, row=0, col=0, addr=0x27):
    global __steam_lcd
    try:
        __steam_lcd
    except NameError:
        from i2c_lcd import I2cLcd
        __steam_lcd = I2cLcd(__steam_i2c_bus(), int(addr), 2, 16)
    __steam_lcd.move_to(int(col), int(row))
    __steam_lcd.putstr(str(text))
`,
  wifi: `
def __steam_wifi_connect(ssid, password, timeout=15):
    import network, time
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(ssid, password)
        start = time.ticks_ms()
        while not wlan.isconnected() and time.ticks_diff(time.ticks_ms(), start) < int(timeout) * 1000:
            time.sleep_ms(200)
    print("WiFi", wlan.ifconfig() if wlan.isconnected() else "sin conexion")
    return wlan

def __steam_wifi_sta():
    import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    return wlan
`,
  wifi_ap: `
def __steam_wifi_ap(ssid, password="", ip="192.168.4.1", mask="255.255.255.0", gateway="192.168.4.1"):
    import network
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    if password:
        ap.config(essid=ssid, password=password, authmode=network.AUTH_WPA_WPA2_PSK)
    else:
        ap.config(essid=ssid, authmode=network.AUTH_OPEN)
    ap.ifconfig((ip, mask, gateway, gateway))
    print("AP", ap.ifconfig())
    return ap
`,
  http_client: `
def __steam_requests():
    try:
        import urequests as requests
    except ImportError:
        import requests
    return requests

def __steam_http_get(url):
    r = __steam_requests().get(url)
    try:
        return r.text
    finally:
        r.close()

def __steam_http_post_json(url, payload):
    r = __steam_requests().post(url, json=payload)
    try:
        return r.text
    finally:
        r.close()
`,
  http_server: `
def __steam_url_param(request, key, default=""):
    try:
        path = request.split(" ")[1]
        query = path.split("?", 1)[1]
    except Exception:
        return default
    for item in query.split("&"):
        if "=" in item:
            k, v = item.split("=", 1)
            if k == key:
                return v.replace("+", " ")
    return default

def __steam_start_web_server(routes, port=80):
    import socket, builtins
    addr = socket.getaddrinfo("0.0.0.0", int(port))[0][-1]
    server = socket.socket()
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(addr)
    server.listen(1)
    print("HTTP server", addr)
    while True:
        client, remote = server.accept()
        request = client.recv(2048).decode()
        try:
            path = request.split(" ")[1].split("?", 1)[0]
        except Exception:
            path = "/"
        builtins.__steam_http_request = request
        handler = routes.get(path) or routes.get("*")
        status = "200 OK" if handler else "404 Not Found"
        body = handler(request) if handler else "404"
        client.send(("HTTP/1.0 " + status + "\\r\\nContent-Type: text/html\\r\\nConnection: close\\r\\n\\r\\n").encode())
        client.send(str(body).encode())
        client.close()
`,
  mqtt: `
def __steam_mqtt_connect(client_id, broker, port=1883, user="", password=""):
    from umqtt.simple import MQTTClient
    global __steam_mqtt_client
    user_value = None if user == "" else user
    password_value = None if password == "" else password
    __steam_mqtt_client = MQTTClient(str(client_id), str(broker), int(port), user_value, password_value)
    __steam_mqtt_client.connect()
    print("MQTT conectado", broker)
    return __steam_mqtt_client
`,
  telegram: `
def __steam_telegram_send(token, chat_id, text, parse_mode=""):
    data = {"chat_id": str(chat_id), "text": str(text)}
    if parse_mode and parse_mode != "none":
        data["parse_mode"] = parse_mode
    r = __steam_requests().post("https://api.telegram.org/bot" + token + "/sendMessage", json=data)
    try:
        return r.text
    finally:
        r.close()

def __steam_telegram_updates(token):
    global __steam_telegram_offset
    try:
        __steam_telegram_offset
    except NameError:
        __steam_telegram_offset = 0
    url = "https://api.telegram.org/bot" + token + "/getUpdates?timeout=0&offset=" + str(__steam_telegram_offset)
    r = __steam_requests().get(url)
    try:
        payload = r.json()
    finally:
        r.close()
    messages = []
    for item in payload.get("result", []):
        __steam_telegram_offset = max(__steam_telegram_offset, item.get("update_id", 0) + 1)
        msg = item.get("message") or item.get("edited_message") or {}
        chat = msg.get("chat") or {}
        sender = msg.get("from") or {}
        messages.append({
            "text": msg.get("text", ""),
            "chat_id": chat.get("id", ""),
            "from": sender.get("first_name", ""),
        })
    return messages
`,
  espnow: `
def __steam_espnow_init():
    import network, espnow
    sta = network.WLAN(network.STA_IF)
    sta.active(True)
    global __steam_espnow
    __steam_espnow = espnow.ESPNow()
    __steam_espnow.active(True)
    return __steam_espnow

def __steam_mac_bytes(mac):
    if isinstance(mac, bytes):
        return mac
    return bytes(int(part, 16) for part in str(mac).replace("-", ":").split(":"))
`,
  ble_uart: `
def __steam_ble_uart_start(name="STEAMakers"):
    import bluetooth, struct
    from micropython import const

    _IRQ_CENTRAL_CONNECT = const(1)
    _IRQ_CENTRAL_DISCONNECT = const(2)
    _IRQ_GATTS_WRITE = const(3)
    _FLAG_READ = const(0x0002)
    _FLAG_WRITE = const(0x0008)
    _FLAG_NOTIFY = const(0x0010)

    UART_UUID = bluetooth.UUID("6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
    UART_TX = (bluetooth.UUID("6E400003-B5A3-F393-E0A9-E50E24DCCA9E"), _FLAG_READ | _FLAG_NOTIFY)
    UART_RX = (bluetooth.UUID("6E400002-B5A3-F393-E0A9-E50E24DCCA9E"), _FLAG_WRITE)
    UART_SERVICE = (UART_UUID, (UART_TX, UART_RX))

    def advertising_payload(name):
        payload = bytearray()
        payload += struct.pack("BB", 2, 0x01) + b"\\x06"
        name_bytes = name.encode()
        payload += struct.pack("BB", len(name_bytes) + 1, 0x09) + name_bytes
        return payload

    class BLEUART:
        def __init__(self, ble, name):
            self.ble = ble
            self.ble.active(True)
            self.ble.irq(self.irq)
            ((self.tx, self.rx),) = self.ble.gatts_register_services((UART_SERVICE,))
            self.connections = set()
            self.rx_buffer = []
            self.payload = advertising_payload(name)
            self.advertise()

        def irq(self, event, data):
            if event == _IRQ_CENTRAL_CONNECT:
                conn_handle, _, _ = data
                self.connections.add(conn_handle)
            elif event == _IRQ_CENTRAL_DISCONNECT:
                conn_handle, _, _ = data
                self.connections.discard(conn_handle)
                self.advertise()
            elif event == _IRQ_GATTS_WRITE:
                _, value_handle = data
                if value_handle == self.rx:
                    self.rx_buffer.append(self.ble.gatts_read(self.rx).decode().strip())

        def advertise(self):
            self.ble.gap_advertise(100000, adv_data=self.payload)

        def read(self):
            if self.rx_buffer:
                return self.rx_buffer.pop(0)
            return None

        def write(self, text):
            for conn in self.connections:
                self.ble.gatts_notify(conn, self.tx, str(text))

    global __steam_ble_uart
    __steam_ble_uart = BLEUART(bluetooth.BLE(), name)
    print("BLE UART", name)
    return __steam_ble_uart
`,
  json: `
def __steam_json_get(text, key, default=""):
    import json
    try:
        return json.loads(text).get(key, default)
    except Exception:
        return default
`,
  csv: `
def __steam_csv(separator, *values):
    return str(separator).join(str(value) for value in values)
`,
  thread: `
def __steam_thread_start(name, fn):
    import _thread
    _thread.start_new_thread(fn, ())
`,
  rfid: `
def __steam_rfid_uid():
    # Requiere la libreria mfrc522.py copiada en la placa.
    from mfrc522 import MFRC522
    reader = MFRC522()
    stat, _ = reader.request(reader.REQIDL)
    if stat != reader.OK:
        return ""
    stat, uid = reader.anticoll()
    return ":".join("{:02X}".format(x) for x in uid) if stat == reader.OK else ""
`,
  mp3: `
def __steam_mp3_send(command, param=0, uart_id=2, tx=17, rx=16):
    import machine, time
    uart = machine.UART(int(uart_id), baudrate=9600, tx=int(tx), rx=int(rx))
    frame = bytearray([0x7E, 0xFF, 0x06, int(command), 0x00, (int(param) >> 8) & 0xFF, int(param) & 0xFF, 0xEF])
    uart.write(frame)
    time.sleep_ms(40)
`,
  file: `
def __steam_file_write(path, text, mode="w"):
    with open(str(path), mode) as f:
        f.write(str(text))

def __steam_file_read(path):
    with open(str(path), "r") as f:
        return f.read()
`,
  sd: `
def __steam_sd_mount(mount="/sd", slot=2, sck=18, miso=19, mosi=23, cs=5):
    import machine, os
    sd = machine.SDCard(slot=int(slot), sck=machine.Pin(int(sck)), miso=machine.Pin(int(miso)), mosi=machine.Pin(int(mosi)), cs=machine.Pin(int(cs)))
    os.mount(sd, str(mount))
    print("SD montada en", mount)
`,
  rtc_ds3231: `
def __steam_bcd2int(value):
    return (value >> 4) * 10 + (value & 0x0F)

def __steam_ds3231_now(addr=0x68):
    data = __steam_i2c_bus().readfrom_mem(int(addr), 0x00, 7)
    second = __steam_bcd2int(data[0] & 0x7F)
    minute = __steam_bcd2int(data[1])
    hour = __steam_bcd2int(data[2] & 0x3F)
    day = __steam_bcd2int(data[4])
    month = __steam_bcd2int(data[5] & 0x1F)
    year = 2000 + __steam_bcd2int(data[6])
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(year, month, day, hour, minute, second)
`,
  keypad: `
def __steam_int_list(text):
    return [int(item.strip()) for item in str(text).split(",") if item.strip()]

def __steam_keypad_read(row_pins, col_pins, keys):
    import machine, time
    rows = [machine.Pin(pin, machine.Pin.OUT) for pin in __steam_int_list(row_pins)]
    cols = [machine.Pin(pin, machine.Pin.IN, machine.Pin.PULL_UP) for pin in __steam_int_list(col_pins)]
    key_text = str(keys)
    width = len(cols)
    for row_index, row in enumerate(rows):
        for r in rows:
            r.value(1)
        row.value(0)
        time.sleep_ms(2)
        for col_index, col in enumerate(cols):
            if col.value() == 0:
                index = row_index * width + col_index
                return key_text[index] if index < len(key_text) else ""
    return ""
`,
  ble_scan: `
def __steam_ble_scan_names(duration_ms=5000):
    import bluetooth, time
    found = {}
    ble = bluetooth.BLE()
    ble.active(True)

    def irq(event, data):
        if event == 5:
            addr_type, addr, adv_type, rssi, adv_data = data
            name = ""
            payload = bytes(adv_data)
            i = 0
            while i + 1 < len(payload):
                size = payload[i]
                if size == 0:
                    break
                kind = payload[i + 1]
                if kind in (0x08, 0x09):
                    try:
                        name = payload[i + 2:i + 1 + size].decode()
                    except Exception:
                        name = ""
                    break
                i += size + 1
            mac = ":".join("{:02X}".format(x) for x in bytes(addr))
            found[mac] = name or mac

    ble.irq(irq)
    ble.gap_scan(int(duration_ms), 30000, 30000)
    time.sleep_ms(int(duration_ms) + 150)
    ble.gap_scan(None)
    return ", ".join(found.values()) if found else "sin dispositivos"
`,
  sys: `
def __steam_unique_id():
    import machine, ubinascii
    return ubinascii.hexlify(machine.unique_id()).decode()

def __steam_memory_free():
    import gc
    gc.collect()
    return gc.mem_free()
`,
  fs: `
def __steam_listdir(path="/"):
    import os
    return ",".join(os.listdir(str(path)))

def __steam_exists(path):
    import os
    try:
        os.stat(str(path))
        return True
    except OSError:
        return False
`,
  ntp: `
def __steam_ntp_sync(host="pool.ntp.org"):
    import ntptime
    ntptime.host = str(host)
    ntptime.settime()
`,
  ntc: `
def __steam_ntc_temperature(pin, beta=3950):
    import machine, math
    adc = machine.ADC(machine.Pin(int(pin)))
    try:
        adc.atten(machine.ADC.ATTN_11DB)
    except Exception:
        pass
    raw = adc.read()
    if raw <= 0 or raw >= 4095:
        return 0
    r = 10000.0 * raw / (4095 - raw)
    temp = 1.0 / (1.0 / 298.15 + math.log(r / 10000.0) / float(beta)) - 273.15
    return round(temp, 2)
`,
  url: `
def __steam_urlencode(text):
    safe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~"
    out = ""
    for ch in str(text):
        if ch in safe:
            out += ch
        elif ch == " ":
            out += "%20"
        else:
            for b in ch.encode():
                out += "%{:02X}".format(b)
    return out
`,
};

function blockDefinitions() {
  const pin = (name = "PIN") => dropdown(name, PIN_OPTIONS);
  const adc = (name = "PIN") => dropdown(name, ADC_OPTIONS);
  const touch = (name = "PIN") => dropdown(name, TOUCH_OPTIONS);

  return [
    {
      type: "steam_program",
      message0: "programa ESP32 STEAMakers",
      message1: "al iniciar %1",
      args1: [{ type: "input_statement", name: "SETUP" }],
      message2: "repetir siempre %1",
      args2: [{ type: "input_statement", name: "LOOP" }],
      colour: 225,
    },
    {
      type: "steam_forever",
      message0: "repetir siempre %1",
      args0: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 225,
    },
    {
      type: "steam_every_ms",
      message0: "cada %1 ms %2",
      args0: [{ type: "input_value", name: "MS", check: "Number" }, { type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 225,
    },
    {
      type: "steam_comment",
      message0: "comentario %1",
      args0: [{ type: "field_input", name: "TEXT", text: "nota" }],
      previousStatement: null,
      nextStatement: null,
      colour: 225,
    },
    {
      type: "steam_gc_collect",
      message0: "liberar memoria",
      previousStatement: null,
      nextStatement: null,
      colour: 225,
    },
    {
      type: "steam_digital_write",
      message0: "pin %1 poner %2",
      args0: [pin(), dropdown("STATE", [["ON", "1"], ["OFF", "0"]])],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_digital_read",
      message0: "pin %1 esta ON",
      args0: [pin()],
      output: "Boolean",
      colour: 135,
    },
    {
      type: "steam_pin_pull_read",
      message0: "leer pin %1 con %2",
      args0: [pin(), dropdown("PULL", [["pull-up", "up"], ["pull-down", "down"], ["sin pull", "none"]])],
      output: "Number",
      colour: 135,
    },
    {
      type: "steam_analog_read",
      message0: "analogico %1",
      args0: [adc()],
      output: "Number",
      colour: 135,
    },
    {
      type: "steam_analog_percent",
      message0: "analogico %1 en porcentaje",
      args0: [adc()],
      output: "Number",
      colour: 135,
    },
    {
      type: "steam_pwm_write",
      message0: "PWM pin %1 duty %2 frecuencia %3 Hz",
      args0: [pin(), { type: "input_value", name: "DUTY", check: "Number" }, { type: "input_value", name: "FREQ", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_dac_write",
      message0: "DAC pin %1 valor %2",
      args0: [dropdown("PIN", [["D9 / GPIO25 / DAC1", "25"], ["GPIO26 / DAC2", "26"]]), { type: "input_value", name: "VALUE", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_touch_read",
      message0: "touch %1",
      args0: [touch()],
      output: "Number",
      colour: 135,
    },
    {
      type: "steam_pulse_in",
      message0: "pulso pin %1 nivel %2 timeout us %3",
      args0: [pin(), dropdown("LEVEL", [["alto", "1"], ["bajo", "0"]]), { type: "input_value", name: "TIMEOUT", check: "Number" }],
      output: "Number",
      colour: 135,
    },
    {
      type: "steam_i2c_init",
      message0: "iniciar I2C SDA %1 SCL %2 frecuencia %3",
      args0: [pin("SDA"), pin("SCL"), { type: "input_value", name: "FREQ", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_i2c_scan",
      message0: "escanear I2C",
      output: "Array",
      colour: 135,
    },
    {
      type: "steam_sleep_ms",
      message0: "esperar %1 ms",
      args0: [{ type: "input_value", name: "MS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
    },
    {
      type: "steam_sleep_s",
      message0: "esperar %1 segundos",
      args0: [{ type: "input_value", name: "S", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
    },
    {
      type: "steam_ticks_ms",
      message0: "milisegundos desde inicio",
      output: "Number",
      colour: 285,
    },
    {
      type: "steam_deepsleep",
      message0: "deep sleep %1 ms",
      args0: [{ type: "input_value", name: "MS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
    },
    {
      type: "steam_print",
      message0: "consola escribir %1",
      args0: [{ type: "input_value", name: "TEXT" }],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
    },
    {
      type: "steam_print_csv",
      message0: "consola CSV %1 %2 %3 sep %4",
      args0: [
        { type: "input_value", name: "A" },
        { type: "input_value", name: "B" },
        { type: "input_value", name: "C" },
        { type: "input_value", name: "SEP" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
    },
    {
      type: "steam_read_line",
      message0: "leer linea consola",
      output: "String",
      colour: 210,
    },
    {
      type: "steam_uart_init",
      message0: "UART %1 baud %2 TX %3 RX %4",
      args0: [
        dropdown("UART", [["0", "0"], ["1", "1"], ["2", "2"]]),
        { type: "input_value", name: "BAUD", check: "Number" },
        pin("TX"),
        pin("RX"),
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
    },
    {
      type: "steam_uart_write",
      message0: "UART %1 enviar %2",
      args0: [dropdown("UART", [["0", "0"], ["1", "1"], ["2", "2"]]), { type: "input_value", name: "TEXT" }],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
    },
    {
      type: "steam_wifi_connect",
      message0: "WiFi conectar SSID %1 clave %2 timeout %3 s",
      args0: [{ type: "input_value", name: "SSID" }, { type: "input_value", name: "PASSWORD" }, { type: "input_value", name: "TIMEOUT", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 185,
    },
    {
      type: "steam_wifi_ap",
      message0: "WiFi crear AP SSID %1 clave %2 IP %3",
      args0: [{ type: "input_value", name: "SSID" }, { type: "input_value", name: "PASSWORD" }, { type: "input_value", name: "IP" }],
      previousStatement: null,
      nextStatement: null,
      colour: 185,
    },
    {
      type: "steam_wifi_is_connected",
      message0: "WiFi conectado",
      output: "Boolean",
      colour: 185,
    },
    {
      type: "steam_wifi_ifconfig",
      message0: "WiFi dato %1",
      args0: [dropdown("PART", [["IP", "0"], ["mascara", "1"], ["gateway", "2"], ["DNS", "3"]])],
      output: "String",
      colour: 185,
    },
    {
      type: "steam_wifi_scan",
      message0: "WiFi escanear redes",
      output: "Array",
      colour: 185,
    },
    {
      type: "steam_wifi_hostname",
      message0: "WiFi hostname %1",
      args0: [{ type: "input_value", name: "NAME" }],
      previousStatement: null,
      nextStatement: null,
      colour: 185,
    },
    {
      type: "steam_wifi_rssi",
      message0: "WiFi señal RSSI dBm",
      output: "Number",
      colour: 185,
    },
    {
      type: "steam_wifi_mac",
      message0: "WiFi MAC",
      output: "String",
      colour: 185,
    },
    {
      type: "steam_wifi_disconnect",
      message0: "WiFi desconectar",
      previousStatement: null,
      nextStatement: null,
      colour: 185,
    },
    {
      type: "steam_wifi_wait_connected",
      message0: "esperar WiFi conectado timeout %1 s",
      args0: [{ type: "input_value", name: "TIMEOUT", check: "Number" }],
      output: "Boolean",
      colour: 185,
    },
    {
      type: "steam_http_get",
      message0: "HTTP GET %1",
      args0: [{ type: "input_value", name: "URL" }],
      output: "String",
      colour: 170,
    },
    {
      type: "steam_http_post_json",
      message0: "HTTP POST JSON url %1 datos %2",
      args0: [{ type: "input_value", name: "URL" }, { type: "input_value", name: "DATA" }],
      output: "String",
      colour: 170,
    },
    {
      type: "steam_http_server",
      message0: "servidor HTTP puerto %1 rutas %2",
      args0: [{ type: "input_value", name: "PORT", check: "Number" }, { type: "input_statement", name: "ROUTES" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_http_route",
      message0: "ruta %1 hacer %2 responder %3",
      args0: [{ type: "input_value", name: "PATH" }, { type: "input_statement", name: "DO" }, { type: "input_value", name: "RESPONSE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_http_param",
      message0: "parametro URL %1",
      args0: [{ type: "input_value", name: "KEY" }],
      output: "String",
      colour: 170,
    },
    {
      type: "steam_mqtt_connect",
      message0: "MQTT conectar cliente %1 broker %2 puerto %3 usuario %4 clave %5",
      args0: [
        { type: "input_value", name: "CLIENT" },
        { type: "input_value", name: "BROKER" },
        { type: "input_value", name: "PORT", check: "Number" },
        { type: "input_value", name: "USER" },
        { type: "input_value", name: "PASSWORD" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_mqtt_publish",
      message0: "MQTT publicar topic %1 mensaje %2",
      args0: [{ type: "input_value", name: "TOPIC" }, { type: "input_value", name: "MESSAGE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_mqtt_on_message",
      message0: "MQTT al recibir topic %1 hacer %2",
      args0: [{ type: "input_value", name: "TOPIC" }, { type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_mqtt_message_text",
      message0: "MQTT mensaje",
      output: "String",
      colour: 170,
    },
    {
      type: "steam_blynk_write",
      message0: "Blynk token %1 virtual pin %2 valor %3",
      args0: [{ type: "input_value", name: "TOKEN" }, { type: "input_value", name: "VPIN" }, { type: "input_value", name: "VALUE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_thingspeak_write",
      message0: "ThingSpeak API key %1 campo %2 valor %3",
      args0: [{ type: "input_value", name: "KEY" }, { type: "input_value", name: "FIELD" }, { type: "input_value", name: "VALUE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 170,
    },
    {
      type: "steam_telegram_token",
      message0: "Telegram token %1",
      args0: [{ type: "input_value", name: "TOKEN" }],
      previousStatement: null,
      nextStatement: null,
      colour: 195,
    },
    {
      type: "steam_telegram_send",
      message0: "Telegram enviar chat %1 texto %2 formato %3",
      args0: [{ type: "input_value", name: "CHAT" }, { type: "input_value", name: "TEXT" }, dropdown("MODE", [["sin formato", "none"], ["Markdown", "Markdown"], ["MarkdownV2", "MarkdownV2"], ["HTML", "HTML"]])],
      previousStatement: null,
      nextStatement: null,
      colour: 195,
    },
    {
      type: "steam_telegram_reply",
      message0: "Telegram responder texto %1",
      args0: [{ type: "input_value", name: "TEXT" }],
      previousStatement: null,
      nextStatement: null,
      colour: 195,
    },
    {
      type: "steam_telegram_send_ip",
      message0: "Telegram responder IP",
      previousStatement: null,
      nextStatement: null,
      colour: 195,
    },
    {
      type: "steam_telegram_on_message",
      message0: "Telegram al recibir mensaje hacer %1",
      args0: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 195,
    },
    {
      type: "steam_telegram_text",
      message0: "Telegram texto",
      output: "String",
      colour: 195,
    },
    {
      type: "steam_telegram_chat",
      message0: "Telegram chat ID",
      output: "String",
      colour: 195,
    },
    {
      type: "steam_telegram_sender",
      message0: "Telegram remitente",
      output: "String",
      colour: 195,
    },
    {
      type: "steam_ble_uart_start",
      message0: "BLE UART iniciar nombre %1",
      args0: [{ type: "input_value", name: "NAME" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_ble_uart_send",
      message0: "BLE UART enviar %1",
      args0: [{ type: "input_value", name: "TEXT" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_ble_uart_on_rx",
      message0: "BLE UART al recibir hacer %1",
      args0: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_ble_uart_text",
      message0: "BLE UART texto recibido",
      output: "String",
      colour: 230,
    },
    {
      type: "steam_ble_scan_names",
      message0: "BLE escanear nombres durante %1 ms",
      args0: [{ type: "input_value", name: "MS", check: "Number" }],
      output: "String",
      colour: 230,
    },
    {
      type: "steam_ble_scan_send_telegram",
      message0: "BLE escanear %1 ms y enviar por Telegram",
      args0: [{ type: "input_value", name: "MS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_bluetooth_hid_note",
      message0: "Bluetooth HID teclado/raton %1",
      args0: [{ type: "field_input", name: "TEXT", text: "requiere libreria HID externa" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_keyboard_mouse_note",
      message0: "teclado/raton USB-BLE %1",
      args0: [{ type: "field_input", name: "TEXT", text: "HID no viene en MicroPython base" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
    {
      type: "steam_espnow_init",
      message0: "ESP-NOW iniciar",
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_espnow_add_peer",
      message0: "ESP-NOW emparejar MAC %1",
      args0: [{ type: "input_value", name: "MAC" }],
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_espnow_send",
      message0: "ESP-NOW enviar a %1 mensaje %2",
      args0: [{ type: "input_value", name: "MAC" }, { type: "input_value", name: "MESSAGE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_espnow_on_receive",
      message0: "ESP-NOW al recibir hacer %1",
      args0: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_espnow_message",
      message0: "ESP-NOW mensaje",
      output: "String",
      colour: 32,
    },
    {
      type: "steam_espnow_mac",
      message0: "ESP-NOW MAC origen",
      output: "String",
      colour: 32,
    },
    {
      type: "steam_udp_broadcast_send",
      message0: "WiFi mesh/UDP broadcast puerto %1 mensaje %2",
      args0: [{ type: "input_value", name: "PORT", check: "Number" }, { type: "input_value", name: "MESSAGE" }],
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_lora_note",
      message0: "LoRa/LoRaWAN %1",
      args0: [{ type: "field_input", name: "TEXT", text: "requiere driver SX127x/LoRaWAN" }],
      previousStatement: null,
      nextStatement: null,
      colour: 32,
    },
    {
      type: "steam_motor_shield_note",
      message0: "motor-shield %1",
      args0: [{ type: "field_input", name: "TEXT", text: "usar bloques motor DC o driver especifico" }],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_dht_read",
      message0: "%1 pin %2 leer %3",
      args0: [dropdown("MODEL", [["DHT11", "DHT11"], ["DHT22", "DHT22"]]), pin(), dropdown("KEY", [["temperatura C", "temperature"], ["humedad %", "humidity"]])],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_ultrasonic_cm",
      message0: "ultrasonidos trig %1 echo %2 cm",
      args0: [pin("TRIG"), pin("ECHO")],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_ds18b20_read",
      message0: "DS18B20 pin %1 C",
      args0: [pin()],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_mpu6050_read",
      message0: "MPU6050 leer %1",
      args0: [dropdown("AXIS", [["acel X", "ax"], ["acel Y", "ay"], ["acel Z", "az"], ["gyro X", "gx"], ["gyro Y", "gy"], ["gyro Z", "gz"], ["temperatura", "temp"]])],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_button_pressed",
      message0: "pulsador pin %1 con %2 pulsado",
      args0: [pin(), dropdown("MODE", [["pull-up", "up"], ["pull-down", "down"]])],
      output: "Boolean",
      colour: 45,
    },
    {
      type: "steam_pir_read",
      message0: "PIR pin %1 detecta movimiento",
      args0: [pin()],
      output: "Boolean",
      colour: 45,
    },
    {
      type: "steam_light_percent",
      message0: "sensor luz %1 %",
      args0: [adc()],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_sound_percent",
      message0: "sensor sonido %1 %",
      args0: [adc()],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_rain_percent",
      message0: "sensor lluvia/vapor %1 %",
      args0: [adc()],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_gas_raw",
      message0: "sensor gas %1 raw",
      args0: [adc()],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_rfid_uid",
      message0: "RFID UID",
      output: "String",
      colour: 45,
    },
    {
      type: "steam_servo_write",
      message0: "servo pin %1 grados %2",
      args0: [pin(), { type: "input_value", name: "DEGREES", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_buzzer_tone",
      message0: "zumbador pin %1 frecuencia %2 Hz durante %3 ms",
      args0: [pin(), { type: "input_value", name: "FREQ", check: "Number" }, { type: "input_value", name: "MS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_relay_write",
      message0: "rele pin %1 %2",
      args0: [pin(), dropdown("STATE", [["ON", "1"], ["OFF", "0"]])],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_rgb_write",
      message0: "RGB pines R %1 G %2 B %3 color %4 %5 %6",
      args0: [pin("R"), pin("G"), pin("B"), { type: "input_value", name: "RV", check: "Number" }, { type: "input_value", name: "GV", check: "Number" }, { type: "input_value", name: "BV", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_motor_dc",
      message0: "motor DC IN1 %1 IN2 %2 velocidad %3",
      args0: [pin("IN1"), pin("IN2"), { type: "input_value", name: "SPEED", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 340,
    },
    {
      type: "steam_neopixel_init",
      message0: "NeoPixel pin %1 cantidad %2",
      args0: [pin(), { type: "input_value", name: "COUNT", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_neopixel_set",
      message0: "NeoPixel pin %1 pixel %2 RGB %3 %4 %5",
      args0: [pin(), { type: "input_value", name: "INDEX", check: "Number" }, { type: "input_value", name: "R", check: "Number" }, { type: "input_value", name: "G", check: "Number" }, { type: "input_value", name: "B", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_neopixel_fill",
      message0: "NeoPixel pin %1 rellenar RGB %2 %3 %4",
      args0: [pin(), { type: "input_value", name: "R", check: "Number" }, { type: "input_value", name: "G", check: "Number" }, { type: "input_value", name: "B", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_neopixel_show",
      message0: "NeoPixel pin %1 mostrar",
      args0: [pin()],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_oled_init",
      message0: "OLED I2C ancho %1 alto %2 addr %3",
      args0: [{ type: "input_value", name: "WIDTH", check: "Number" }, { type: "input_value", name: "HEIGHT", check: "Number" }, { type: "input_value", name: "ADDR" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_oled_text",
      message0: "OLED texto %1 x %2 y %3",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "X", check: "Number" }, { type: "input_value", name: "Y", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_oled_fill",
      message0: "OLED limpiar color %1",
      args0: [dropdown("COLOR", [["negro", "0"], ["blanco", "1"]])],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_lcd_text",
      message0: "LCD I2C texto %1 fila %2 columna %3",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "ROW", check: "Number" }, { type: "input_value", name: "COL", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_mp3_play",
      message0: "MP3 reproducir pista %1",
      args0: [{ type: "input_value", name: "TRACK", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_matrix8_note",
      message0: "matriz LED 8x8 %1",
      args0: [{ type: "field_input", name: "TEXT", text: "requiere driver max7219.py o HT16K33" }],
      previousStatement: null,
      nextStatement: null,
      colour: 255,
    },
    {
      type: "steam_sd_mount",
      message0: "SD montar en %1 CS %2 SCK %3 MISO %4 MOSI %5",
      args0: [
        { type: "input_value", name: "MOUNT" },
        pin("CS"),
        pin("SCK"),
        pin("MISO"),
        pin("MOSI"),
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 110,
    },
    {
      type: "steam_file_write",
      message0: "archivo escribir ruta %1 texto %2 modo %3",
      args0: [{ type: "input_value", name: "PATH" }, { type: "input_value", name: "TEXT" }, dropdown("MODE", [["sobrescribir", "w"], ["anadir", "a"]])],
      previousStatement: null,
      nextStatement: null,
      colour: 110,
    },
    {
      type: "steam_file_read",
      message0: "archivo leer ruta %1",
      args0: [{ type: "input_value", name: "PATH" }],
      output: "String",
      colour: 110,
    },
    {
      type: "steam_file_exists",
      message0: "archivo existe ruta %1",
      args0: [{ type: "input_value", name: "PATH" }],
      output: "Boolean",
      colour: 110,
    },
    {
      type: "steam_file_remove",
      message0: "archivo borrar ruta %1",
      args0: [{ type: "input_value", name: "PATH" }],
      previousStatement: null,
      nextStatement: null,
      colour: 110,
    },
    {
      type: "steam_file_listdir",
      message0: "carpeta listar ruta %1",
      args0: [{ type: "input_value", name: "PATH" }],
      output: "String",
      colour: 110,
    },
    {
      type: "steam_mkdir",
      message0: "carpeta crear ruta %1",
      args0: [{ type: "input_value", name: "PATH" }],
      previousStatement: null,
      nextStatement: null,
      colour: 110,
    },
    {
      type: "steam_ds3231_now",
      message0: "RTC DS3231 fecha/hora",
      output: "String",
      colour: 110,
    },
    {
      type: "steam_gps_read_line",
      message0: "GPS leer linea UART %1",
      args0: [dropdown("UART", [["1", "1"], ["2", "2"], ["0", "0"]])],
      output: "String",
      colour: 110,
    },
    {
      type: "steam_keypad_read",
      message0: "keypad filas %1 columnas %2 teclas %3",
      args0: [{ type: "input_value", name: "ROWS" }, { type: "input_value", name: "COLS" }, { type: "input_value", name: "KEYS" }],
      output: "String",
      colour: 110,
    },
    {
      type: "steam_json_get",
      message0: "JSON %1 valor clave %2",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "KEY" }],
      output: null,
      colour: 70,
    },
    {
      type: "steam_csv",
      message0: "crear CSV sep %1 valores %2 %3 %4",
      args0: [{ type: "input_value", name: "SEP" }, { type: "input_value", name: "A" }, { type: "input_value", name: "B" }, { type: "input_value", name: "C" }],
      output: "String",
      colour: 70,
    },
    {
      type: "steam_map_value",
      message0: "mapear %1 de %2-%3 a %4-%5",
      args0: [
        { type: "input_value", name: "VALUE", check: "Number" },
        { type: "input_value", name: "IN_MIN", check: "Number" },
        { type: "input_value", name: "IN_MAX", check: "Number" },
        { type: "input_value", name: "OUT_MIN", check: "Number" },
        { type: "input_value", name: "OUT_MAX", check: "Number" },
      ],
      output: "Number",
      colour: 70,
    },
    {
      type: "steam_urlencode",
      message0: "URL encode %1",
      args0: [{ type: "input_value", name: "TEXT" }],
      output: "String",
      colour: 70,
    },
    {
      type: "steam_to_int",
      message0: "convertir a entero %1",
      args0: [{ type: "input_value", name: "VALUE" }],
      output: "Number",
      colour: 70,
    },
    {
      type: "steam_to_float",
      message0: "convertir a decimal %1",
      args0: [{ type: "input_value", name: "VALUE" }],
      output: "Number",
      colour: 70,
    },
    {
      type: "steam_to_string",
      message0: "convertir a texto %1",
      args0: [{ type: "input_value", name: "VALUE" }],
      output: "String",
      colour: 70,
    },
    {
      type: "steam_text_contains",
      message0: "texto %1 contiene %2",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "PART" }],
      output: "Boolean",
      colour: 70,
    },
    {
      type: "steam_text_startswith",
      message0: "texto %1 empieza por %2",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "PART" }],
      output: "Boolean",
      colour: 70,
    },
    {
      type: "steam_text_replace",
      message0: "texto %1 reemplazar %2 por %3",
      args0: [{ type: "input_value", name: "TEXT" }, { type: "input_value", name: "OLD" }, { type: "input_value", name: "NEW" }],
      output: "String",
      colour: 70,
    },
    {
      type: "steam_clamp",
      message0: "limitar %1 min %2 max %3",
      args0: [{ type: "input_value", name: "VALUE", check: "Number" }, { type: "input_value", name: "MIN", check: "Number" }, { type: "input_value", name: "MAX", check: "Number" }],
      output: "Number",
      colour: 70,
    },
    {
      type: "steam_ntp_sync",
      message0: "NTP sincronizar host %1",
      args0: [{ type: "input_value", name: "HOST" }],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
    },
    {
      type: "steam_time_now_tuple",
      message0: "fecha/hora actual tupla",
      output: "Array",
      colour: 285,
    },
    {
      type: "steam_time_part",
      message0: "fecha/hora parte %1",
      args0: [dropdown("PART", [["año", "0"], ["mes", "1"], ["dia", "2"], ["hora", "3"], ["minuto", "4"], ["segundo", "5"]])],
      output: "Number",
      colour: 285,
    },
    {
      type: "steam_system_reset",
      message0: "reiniciar placa",
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: "steam_system_unique_id",
      message0: "ID unico placa",
      output: "String",
      colour: 20,
    },
    {
      type: "steam_system_mem_free",
      message0: "memoria libre bytes",
      output: "Number",
      colour: 20,
    },
    {
      type: "steam_system_freq",
      message0: "CPU frecuencia Hz",
      output: "Number",
      colour: 20,
    },
    {
      type: "steam_system_set_freq",
      message0: "CPU poner frecuencia %1 Hz",
      args0: [{ type: "input_value", name: "FREQ", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: "steam_thread_start",
      message0: "nueva tarea %1 hacer %2",
      args0: [{ type: "field_input", name: "NAME", text: "tarea" }, { type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: "steam_mutex",
      message0: "zona critica %1",
      args0: [{ type: "input_statement", name: "DO" }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: "steam_sleep_us",
      message0: "esperar %1 microsegundos",
      args0: [{ type: "input_value", name: "US", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
    },
    {
      type: "steam_pin_toggle",
      message0: "invertir pin %1",
      args0: [pin()],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_pwm_off",
      message0: "detener PWM pin %1",
      args0: [pin()],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_i2c_write_reg",
      message0: "I2C escribir dir %1 registro %2 valor %3",
      args0: [
        { type: "input_value", name: "ADDR", check: "Number" },
        { type: "input_value", name: "REG", check: "Number" },
        { type: "input_value", name: "VAL", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
    {
      type: "steam_i2c_read_reg",
      message0: "I2C leer dir %1 registro %2 bytes %3",
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
      message0: "temperatura NTC pin %1 beta %2",
      args0: [adc(), { type: "input_value", name: "BETA", check: "Number" }],
      output: "Number",
      colour: 45,
    },
    {
      type: "steam_list_append",
      message0: "lista %1 anadir %2",
      args0: [{ type: "input_value", name: "LIST" }, { type: "input_value", name: "ITEM" }],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: "steam_list_pop",
      message0: "lista %1 extraer ultimo",
      args0: [{ type: "input_value", name: "LIST" }],
      output: null,
      colour: 260,
    },
    {
      type: "steam_dict_new",
      message0: "diccionario vacio",
      output: null,
      colour: 260,
    },
    {
      type: "steam_dict_set",
      message0: "diccionario %1 clave %2 valor %3",
      args0: [{ type: "input_value", name: "DICT" }, { type: "input_value", name: "KEY" }, { type: "input_value", name: "VAL" }],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: "steam_dict_get",
      message0: "diccionario %1 clave %2 defecto %3",
      args0: [{ type: "input_value", name: "DICT" }, { type: "input_value", name: "KEY" }, { type: "input_value", name: "DEFAULT" }],
      output: null,
      colour: 260,
    },
    {
      type: "steam_random_float",
      message0: "aleatorio 0.0 a 1.0",
      output: "Number",
      colour: 230,
    },
    {
      type: "steam_format_float",
      message0: "formatear %1 con %2 decimales",
      args0: [
        { type: "input_value", name: "NUM", check: "Number" },
        dropdown("DECIMALS", [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"]]),
      ],
      output: "String",
      colour: 230,
    },
    {
      type: "steam_pin_irq",
      message0: "interrupcion pin %1 cuando %2 ejecutar %3",
      args0: [
        pin(),
        dropdown("TRIGGER", [["flanco subida", "rising"], ["flanco bajada", "falling"], ["cualquier cambio", "change"]]),
        { type: "input_statement", name: "HANDLER" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 135,
    },
  ];
}

function installGenerators() {
  setGenerator("steam_program", (block, generator) => {
    const setup = outdentCode(generator.statementToCode(block, "SETUP"), generator.INDENT);
    const loop = statements(block, generator, "LOOP");
    return `${setup}\nwhile True:\n${loop}`;
  });

  setGenerator("steam_forever", (block, generator) => `while True:\n${statements(block, generator, "DO")}`);

  setGenerator("steam_every_ms", (block, generator) => {
    needImport("import time");
    const ms = value(block, generator, "MS", "1000");
    const last = `__steam_last_${sanitizeId(block.id)}`;
    requiredImports.add(`${last} = 0`);
    return `__steam_now = time.ticks_ms()\nif time.ticks_diff(__steam_now, ${last}) >= int(${ms}):\n  ${last} = __steam_now\n${statements(block, generator, "DO")}`;
  });

  setGenerator("steam_comment", (block) => `# ${block.getFieldValue("TEXT")}\n`);
  setGenerator("steam_gc_collect", () => {
    needImport("import gc");
    return "gc.collect()\n";
  });

  setGenerator("steam_digital_write", (block) => {
    needImport("import machine");
    return `machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`;
  });
  setGenerator("steam_digital_read", (block) => {
    needImport("import machine");
    return [`machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.IN).value() == 1`, Order.RELATIONAL];
  });
  setGenerator("steam_pin_pull_read", (block) => {
    needImport("import machine");
    const pull = block.getFieldValue("PULL");
    const pullCode = pull === "up" ? ", machine.Pin.PULL_UP" : pull === "down" ? ", machine.Pin.PULL_DOWN" : "";
    return [`machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.IN${pullCode}).value()`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_analog_read", (block) => {
    needHelper("adc");
    return [`__steam_adc_read(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_analog_percent", (block) => {
    needHelper("adc");
    needHelper("percent");
    return [`__steam_percent_from_adc(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_pwm_write", (block, generator) => {
    needHelper("pwm");
    return `__steam_pwm_write(${block.getFieldValue("PIN")}, ${value(block, generator, "DUTY", "512")}, ${value(block, generator, "FREQ", "1000")})\n`;
  });
  setGenerator("steam_dac_write", (block, generator) => {
    needImport("import machine");
    return `machine.DAC(machine.Pin(${block.getFieldValue("PIN")})).write(int(max(0, min(255, ${value(block, generator, "VALUE", "0")}))))\n`;
  });
  setGenerator("steam_touch_read", (block) => {
    needImport("import machine");
    return [`machine.TouchPad(machine.Pin(${block.getFieldValue("PIN")})).read()`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_pulse_in", (block, generator) => {
    needHelper("pulse");
    return [`__steam_pulse_in(${block.getFieldValue("PIN")}, ${block.getFieldValue("LEVEL")}, ${value(block, generator, "TIMEOUT", "1000000")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_i2c_init", (block, generator) => {
    needHelper("i2c");
    return `__steam_i2c_init(${block.getFieldValue("SDA")}, ${block.getFieldValue("SCL")}, ${value(block, generator, "FREQ", "400000")})\n`;
  });
  setGenerator("steam_i2c_scan", () => {
    needHelper("i2c");
    return ["__steam_i2c_bus().scan()", Order.FUNCTION_CALL];
  });

  setGenerator("steam_sleep_ms", (block, generator) => {
    needImport("import time");
    return `time.sleep_ms(int(${value(block, generator, "MS", "1000")}))\n`;
  });
  setGenerator("steam_sleep_s", (block, generator) => {
    needImport("import time");
    return `time.sleep(${value(block, generator, "S", "1")})\n`;
  });
  setGenerator("steam_ticks_ms", () => {
    needImport("import time");
    return ["time.ticks_ms()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_deepsleep", (block, generator) => {
    needImport("import machine");
    return `machine.deepsleep(int(${value(block, generator, "MS", "1000")}))\n`;
  });

  setGenerator("steam_print", (block, generator) => `print(${value(block, generator, "TEXT", "''")})\n`);
  setGenerator("steam_print_csv", (block, generator) => {
    needHelper("csv");
    return `print(__steam_csv(${value(block, generator, "SEP", "','")}, ${value(block, generator, "A", "''")}, ${value(block, generator, "B", "''")}, ${value(block, generator, "C", "''")}))\n`;
  });
  setGenerator("steam_read_line", () => {
    needImport("import sys");
    return ["sys.stdin.readline().strip()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_uart_init", (block, generator) => {
    needImport("import machine");
    return `__steam_uart_${block.getFieldValue("UART")} = machine.UART(${block.getFieldValue("UART")}, baudrate=int(${value(block, generator, "BAUD", "9600")}), tx=${block.getFieldValue("TX")}, rx=${block.getFieldValue("RX")})\n`;
  });
  setGenerator("steam_uart_write", (block, generator) => `__steam_uart_${block.getFieldValue("UART")}.write(str(${value(block, generator, "TEXT", "''")}))\n`);

  setGenerator("steam_wifi_connect", (block, generator) => {
    needHelper("wifi");
    return `__steam_wifi_connect(${value(block, generator, "SSID", "''")}, ${value(block, generator, "PASSWORD", "''")}, ${value(block, generator, "TIMEOUT", "15")})\n`;
  });
  setGenerator("steam_wifi_ap", (block, generator) => {
    needHelper("wifi_ap");
    return `__steam_wifi_ap(${value(block, generator, "SSID", "'STEAMakers'")}, ${value(block, generator, "PASSWORD", "''")}, ${value(block, generator, "IP", "'192.168.4.1'")})\n`;
  });
  setGenerator("steam_wifi_is_connected", () => {
    needHelper("wifi");
    return ["__steam_wifi_sta().isconnected()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_wifi_ifconfig", (block) => {
    needHelper("wifi");
    return [`__steam_wifi_sta().ifconfig()[${block.getFieldValue("PART")}]`, Order.MEMBER];
  });
  setGenerator("steam_wifi_scan", () => {
    needHelper("wifi");
    return ["__steam_wifi_sta().scan()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_wifi_hostname", (block, generator) => {
    needImport("import network");
    return `try:\n  network.hostname(str(${value(block, generator, "NAME", "'esp32-steammakers'")}))\nexcept Exception as exc:\n  print("hostname no disponible", exc)\n`;
  });
  setGenerator("steam_wifi_rssi", () => {
    needHelper("wifi");
    return ["__steam_wifi_sta().status('rssi')", Order.FUNCTION_CALL];
  });
  setGenerator("steam_wifi_mac", () => {
    needImport("import ubinascii");
    needHelper("wifi");
    return ['":".join("{:02X}".format(x) for x in __steam_wifi_sta().config("mac"))', Order.FUNCTION_CALL];
  });
  setGenerator("steam_wifi_disconnect", () => {
    needHelper("wifi");
    return "__steam_wifi_sta().disconnect()\n";
  });
  setGenerator("steam_wifi_wait_connected", (block, generator) => {
    needImport("import time");
    needHelper("wifi");
    return [`(lambda __timeout: (time.sleep_ms(0) or any((__steam_wifi_sta().isconnected() or time.sleep_ms(250)) for _ in range(int(__timeout * 4))) or __steam_wifi_sta().isconnected()))(${value(block, generator, "TIMEOUT", "10")})`, Order.FUNCTION_CALL];
  });

  setGenerator("steam_http_get", (block, generator) => {
    needHelper("http_client");
    return [`__steam_http_get(${value(block, generator, "URL", "''")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_http_post_json", (block, generator) => {
    needHelper("http_client");
    return [`__steam_http_post_json(${value(block, generator, "URL", "''")}, ${value(block, generator, "DATA", "{}")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_http_server", (block, generator) => {
    needHelper("http_server");
    const routes = generator.statementToCode(block, "ROUTES");
    return `__steam_routes = {}\n${routes}__steam_start_web_server(__steam_routes, ${value(block, generator, "PORT", "80")})\n`;
  });
  setGenerator("steam_http_route", (block, generator) => {
    const fn = `__steam_route_${sanitizeId(block.id)}`;
    const body = statements(block, generator, "DO");
    return `def ${fn}(__steam_request):\n${body}  return ${value(block, generator, "RESPONSE", "'OK'")}\n__steam_routes[${value(block, generator, "PATH", "'/'")}] = ${fn}\n`;
  });
  setGenerator("steam_http_param", (block, generator) => {
    needHelper("http_server");
    return [`__steam_url_param(__import__("builtins").__steam_http_request, ${value(block, generator, "KEY", "''")})`, Order.FUNCTION_CALL];
  });

  setGenerator("steam_mqtt_connect", (block, generator) => {
    needHelper("mqtt");
    return `__steam_mqtt_connect(${value(block, generator, "CLIENT", "'esp32'")}, ${value(block, generator, "BROKER", "''")}, ${value(block, generator, "PORT", "1883")}, ${value(block, generator, "USER", "''")}, ${value(block, generator, "PASSWORD", "''")})\n`;
  });
  setGenerator("steam_mqtt_publish", (block, generator) => `__steam_mqtt_client.publish(str(${value(block, generator, "TOPIC", "''")}), str(${value(block, generator, "MESSAGE", "''")}))\n`);
  setGenerator("steam_mqtt_on_message", (block, generator) => {
    needImport("import time");
    const fn = `__steam_mqtt_cb_${sanitizeId(block.id)}`;
    const topic = value(block, generator, "TOPIC", "''");
    const body = statements(block, generator, "DO");
    return `def ${fn}(__topic, __message):\n  global mqtt_topic, mqtt_message\n  mqtt_topic = __topic.decode() if hasattr(__topic, "decode") else str(__topic)\n  mqtt_message = __message.decode() if hasattr(__message, "decode") else str(__message)\n${body}__steam_mqtt_client.set_callback(${fn})\n__steam_mqtt_client.subscribe(str(${topic}))\nwhile True:\n  __steam_mqtt_client.check_msg()\n  time.sleep_ms(50)\n`;
  });
  setGenerator("steam_mqtt_message_text", () => ["mqtt_message", Order.ATOMIC]);
  setGenerator("steam_blynk_write", (block, generator) => {
    needHelper("http_client");
    return `__steam_http_get("https://blynk.cloud/external/api/update?token=" + str(${value(block, generator, "TOKEN", "''")}) + "&V" + str(${value(block, generator, "VPIN", "0")}) + "=" + str(${value(block, generator, "VALUE", "0")}))\n`;
  });
  setGenerator("steam_thingspeak_write", (block, generator) => {
    needHelper("http_client");
    return `__steam_http_get("https://api.thingspeak.com/update?api_key=" + str(${value(block, generator, "KEY", "''")}) + "&field" + str(${value(block, generator, "FIELD", "1")}) + "=" + str(${value(block, generator, "VALUE", "0")}))\n`;
  });

  setGenerator("steam_telegram_token", (block, generator) => `telegram_token = ${value(block, generator, "TOKEN", "''")}\n`);
  setGenerator("steam_telegram_send", (block, generator) => {
    needHelper("http_client");
    needHelper("telegram");
    return `__steam_telegram_send(telegram_token, ${value(block, generator, "CHAT", "''")}, ${value(block, generator, "TEXT", "''")}, ${quote(block.getFieldValue("MODE"))})\n`;
  });
  setGenerator("steam_telegram_reply", (block, generator) => {
    needHelper("http_client");
    needHelper("telegram");
    return `__steam_telegram_send(telegram_token, telegram_chat_id, ${value(block, generator, "TEXT", "''")}, "none")\n`;
  });
  setGenerator("steam_telegram_send_ip", () => {
    needHelper("http_client");
    needHelper("telegram");
    needHelper("wifi");
    return `__steam_telegram_send(telegram_token, telegram_chat_id, __steam_wifi_sta().ifconfig()[0], "none")\n`;
  });
  setGenerator("steam_telegram_on_message", (block, generator) => {
    needHelper("http_client");
    needHelper("telegram");
    const body = statements(block, generator, "DO");
    return `for __steam_msg in __steam_telegram_updates(telegram_token):\n  telegram_text = __steam_msg.get("text", "")\n  telegram_chat_id = __steam_msg.get("chat_id", "")\n  telegram_sender = __steam_msg.get("from", "")\n${body}`;
  });
  setGenerator("steam_telegram_text", () => ["telegram_text", Order.ATOMIC]);
  setGenerator("steam_telegram_chat", () => ["telegram_chat_id", Order.ATOMIC]);
  setGenerator("steam_telegram_sender", () => ["telegram_sender", Order.ATOMIC]);

  setGenerator("steam_ble_uart_start", (block, generator) => {
    needHelper("ble_uart");
    return `__steam_ble_uart_start(${value(block, generator, "NAME", "'STEAMakers'")})\n`;
  });
  setGenerator("steam_ble_uart_send", (block, generator) => `__steam_ble_uart.write(${value(block, generator, "TEXT", "''")})\n`);
  setGenerator("steam_ble_uart_on_rx", (block, generator) => {
    needImport("import time");
    const body = statements(block, generator, "DO");
    return `while True:\n  ble_uart_text = __steam_ble_uart.read()\n  if ble_uart_text is not None:\n${indentCode(body, generator.INDENT)}  time.sleep_ms(20)\n`;
  });
  setGenerator("steam_ble_uart_text", () => ["ble_uart_text", Order.ATOMIC]);
  setGenerator("steam_ble_scan_names", (block, generator) => {
    needHelper("ble_scan");
    return [`__steam_ble_scan_names(${value(block, generator, "MS", "5000")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_ble_scan_send_telegram", (block, generator) => {
    needHelper("ble_scan");
    needHelper("http_client");
    needHelper("telegram");
    return `__steam_telegram_send(telegram_token, telegram_chat_id, __steam_ble_scan_names(${value(block, generator, "MS", "5000")}), "none")\n`;
  });
  setGenerator("steam_bluetooth_hid_note", (block) => `# Bluetooth HID: ${block.getFieldValue("TEXT")}\n`);
  setGenerator("steam_keyboard_mouse_note", (block) => `# Teclado/raton HID: ${block.getFieldValue("TEXT")}\n`);

  setGenerator("steam_espnow_init", () => {
    needHelper("espnow");
    return "__steam_espnow_init()\n";
  });
  setGenerator("steam_espnow_add_peer", (block, generator) => `__steam_espnow.add_peer(__steam_mac_bytes(${value(block, generator, "MAC", "''")}))\n`);
  setGenerator("steam_espnow_send", (block, generator) => `__steam_espnow.send(__steam_mac_bytes(${value(block, generator, "MAC", "''")}), str(${value(block, generator, "MESSAGE", "''")}))\n`);
  setGenerator("steam_espnow_on_receive", (block, generator) => {
    const body = statements(block, generator, "DO");
    return `while True:\n  espnow_mac, espnow_raw = __steam_espnow.recv()\n  espnow_message = espnow_raw.decode() if hasattr(espnow_raw, "decode") else str(espnow_raw)\n${body}`;
  });
  setGenerator("steam_espnow_message", () => ["espnow_message", Order.ATOMIC]);
  setGenerator("steam_espnow_mac", () => ['":".join("{:02X}".format(x) for x in espnow_mac)', Order.FUNCTION_CALL]);
  setGenerator("steam_udp_broadcast_send", (block, generator) => {
    needImport("import socket");
    return `__steam_udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\n__steam_udp.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)\n__steam_udp.sendto(str(${value(block, generator, "MESSAGE", "''")}).encode(), ("255.255.255.255", int(${value(block, generator, "PORT", "4210")})))\n__steam_udp.close()\n`;
  });
  setGenerator("steam_lora_note", (block) => `# LoRa/LoRaWAN: ${block.getFieldValue("TEXT")}\n`);
  setGenerator("steam_motor_shield_note", (block) => `# Motor-shield: ${block.getFieldValue("TEXT")}\n`);

  setGenerator("steam_dht_read", (block) => {
    needHelper("dht");
    return [`__steam_dht_read(${block.getFieldValue("PIN")}, ${quote(block.getFieldValue("MODEL"))}, ${quote(block.getFieldValue("KEY"))})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_ultrasonic_cm", (block) => {
    needHelper("ultrasonic");
    return [`__steam_ultrasonic_cm(${block.getFieldValue("TRIG")}, ${block.getFieldValue("ECHO")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_ds18b20_read", (block) => {
    needHelper("ds18b20");
    return [`__steam_ds18b20_read(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_mpu6050_read", (block) => {
    needHelper("i2c");
    needHelper("mpu6050");
    return [`__steam_mpu6050_read(${quote(block.getFieldValue("AXIS"))})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_button_pressed", (block) => {
    needImport("import machine");
    const pull = block.getFieldValue("MODE") === "up" ? "machine.Pin.PULL_UP" : "machine.Pin.PULL_DOWN";
    const pressed = block.getFieldValue("MODE") === "up" ? "0" : "1";
    return [`machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.IN, ${pull}).value() == ${pressed}`, Order.RELATIONAL];
  });
  setGenerator("steam_pir_read", (block) => {
    needImport("import machine");
    return [`machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.IN).value() == 1`, Order.RELATIONAL];
  });
  setGenerator("steam_light_percent", (block) => {
    needHelper("adc");
    needHelper("percent");
    return [`__steam_percent_from_adc(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_sound_percent", (block) => {
    needHelper("adc");
    needHelper("percent");
    return [`__steam_percent_from_adc(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_rain_percent", (block) => {
    needHelper("adc");
    needHelper("percent");
    return [`__steam_percent_from_adc(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_gas_raw", (block) => {
    needHelper("adc");
    return [`__steam_adc_read(${block.getFieldValue("PIN")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_rfid_uid", () => {
    needHelper("rfid");
    return ["__steam_rfid_uid()", Order.FUNCTION_CALL];
  });

  setGenerator("steam_servo_write", (block, generator) => {
    needHelper("pwm");
    needHelper("servo");
    return `__steam_servo_write(${block.getFieldValue("PIN")}, ${value(block, generator, "DEGREES", "90")})\n`;
  });
  setGenerator("steam_buzzer_tone", (block, generator) => {
    needHelper("pwm");
    needImport("import time");
    return `__steam_pwm_write(${block.getFieldValue("PIN")}, 512, ${value(block, generator, "FREQ", "440")})\ntime.sleep_ms(int(${value(block, generator, "MS", "250")}))\n__steam_pwm_write(${block.getFieldValue("PIN")}, 0, ${value(block, generator, "FREQ", "440")})\n`;
  });
  setGenerator("steam_relay_write", (block) => {
    needImport("import machine");
    return `machine.Pin(${block.getFieldValue("PIN")}, machine.Pin.OUT).value(${block.getFieldValue("STATE")})\n`;
  });
  setGenerator("steam_rgb_write", (block, generator) => {
    needHelper("pwm");
    return `__steam_pwm_write(${block.getFieldValue("R")}, int(${value(block, generator, "RV", "0")} * 4), 1000)\n__steam_pwm_write(${block.getFieldValue("G")}, int(${value(block, generator, "GV", "0")} * 4), 1000)\n__steam_pwm_write(${block.getFieldValue("B")}, int(${value(block, generator, "BV", "0")} * 4), 1000)\n`;
  });
  setGenerator("steam_motor_dc", (block, generator) => {
    needHelper("pwm");
    const speed = value(block, generator, "SPEED", "0");
    return `__steam_speed = int(max(-1023, min(1023, ${speed})))\n__steam_pwm_write(${block.getFieldValue("IN1")}, __steam_speed if __steam_speed > 0 else 0, 1000)\n__steam_pwm_write(${block.getFieldValue("IN2")}, -__steam_speed if __steam_speed < 0 else 0, 1000)\n`;
  });
  setGenerator("steam_neopixel_init", (block, generator) => {
    needHelper("neopixel");
    return `__steam_neopixel_init(${block.getFieldValue("PIN")}, ${value(block, generator, "COUNT", "8")})\n`;
  });
  setGenerator("steam_neopixel_set", (block, generator) => {
    needHelper("neopixel");
    return `__steam_neopixel(${block.getFieldValue("PIN")})[int(${value(block, generator, "INDEX", "0")})] = (int(${value(block, generator, "R", "0")}), int(${value(block, generator, "G", "0")}), int(${value(block, generator, "B", "0")}))\n`;
  });
  setGenerator("steam_neopixel_fill", (block, generator) => {
    needHelper("neopixel");
    return `__steam_neopixel(${block.getFieldValue("PIN")}).fill((int(${value(block, generator, "R", "0")}), int(${value(block, generator, "G", "0")}), int(${value(block, generator, "B", "0")})))\n`;
  });
  setGenerator("steam_neopixel_show", (block) => {
    needHelper("neopixel");
    return `__steam_neopixel(${block.getFieldValue("PIN")}).write()\n`;
  });
  setGenerator("steam_oled_init", (block, generator) => {
    needHelper("i2c");
    needHelper("oled");
    return `__steam_oled_init(${value(block, generator, "WIDTH", "128")}, ${value(block, generator, "HEIGHT", "64")}, ${value(block, generator, "ADDR", "0x3C")})\n`;
  });
  setGenerator("steam_oled_text", (block, generator) => `__steam_oled.text(str(${value(block, generator, "TEXT", "''")}), int(${value(block, generator, "X", "0")}), int(${value(block, generator, "Y", "0")}))\n__steam_oled.show()\n`);
  setGenerator("steam_oled_fill", (block) => `__steam_oled.fill(${block.getFieldValue("COLOR")})\n__steam_oled.show()\n`);
  setGenerator("steam_lcd_text", (block, generator) => {
    needHelper("i2c");
    needHelper("lcd");
    return `__steam_lcd_i2c_text(${value(block, generator, "TEXT", "''")}, ${value(block, generator, "ROW", "0")}, ${value(block, generator, "COL", "0")})\n`;
  });
  setGenerator("steam_mp3_play", (block, generator) => {
    needHelper("mp3");
    return `__steam_mp3_send(0x03, ${value(block, generator, "TRACK", "1")})\n`;
  });
  setGenerator("steam_matrix8_note", (block) => `# Matriz LED 8x8: ${block.getFieldValue("TEXT")}\n`);
  setGenerator("steam_sd_mount", (block, generator) => {
    needHelper("sd");
    return `__steam_sd_mount(${value(block, generator, "MOUNT", "'/sd'")}, 2, ${block.getFieldValue("SCK")}, ${block.getFieldValue("MISO")}, ${block.getFieldValue("MOSI")}, ${block.getFieldValue("CS")})\n`;
  });
  setGenerator("steam_file_write", (block, generator) => {
    needHelper("file");
    return `__steam_file_write(${value(block, generator, "PATH", "'/sd/data.txt'")}, ${value(block, generator, "TEXT", "''")}, ${quote(block.getFieldValue("MODE"))})\n`;
  });
  setGenerator("steam_file_read", (block, generator) => {
    needHelper("file");
    return [`__steam_file_read(${value(block, generator, "PATH", "'/sd/data.txt'")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_file_exists", (block, generator) => {
    needHelper("fs");
    return [`__steam_exists(${value(block, generator, "PATH", "'/data.txt'")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_file_remove", (block, generator) => {
    needImport("import os");
    return `os.remove(str(${value(block, generator, "PATH", "'/data.txt'")}))\n`;
  });
  setGenerator("steam_file_listdir", (block, generator) => {
    needHelper("fs");
    return [`__steam_listdir(${value(block, generator, "PATH", "'/'")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_mkdir", (block, generator) => {
    needImport("import os");
    return `os.mkdir(str(${value(block, generator, "PATH", "'/data'")}))\n`;
  });
  setGenerator("steam_ds3231_now", () => {
    needHelper("i2c");
    needHelper("rtc_ds3231");
    return ["__steam_ds3231_now()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_gps_read_line", (block) => [`__steam_uart_${block.getFieldValue("UART")}.readline().decode().strip()`, Order.FUNCTION_CALL]);
  setGenerator("steam_keypad_read", (block, generator) => {
    needHelper("keypad");
    return [`__steam_keypad_read(${value(block, generator, "ROWS", "'12,14,27,26'")}, ${value(block, generator, "COLS", "'25,33,32,35'")}, ${value(block, generator, "KEYS", "'123A456B789C*0#D'")})`, Order.FUNCTION_CALL];
  });

  setGenerator("steam_json_get", (block, generator) => {
    needHelper("json");
    return [`__steam_json_get(${value(block, generator, "TEXT", "''")}, ${value(block, generator, "KEY", "''")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_csv", (block, generator) => {
    needHelper("csv");
    return [`__steam_csv(${value(block, generator, "SEP", "','")}, ${value(block, generator, "A", "''")}, ${value(block, generator, "B", "''")}, ${value(block, generator, "C", "''")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_map_value", (block, generator) => {
    needHelper("map");
    return [`__steam_map(${value(block, generator, "VALUE", "0")}, ${value(block, generator, "IN_MIN", "0")}, ${value(block, generator, "IN_MAX", "1023")}, ${value(block, generator, "OUT_MIN", "0")}, ${value(block, generator, "OUT_MAX", "100")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_urlencode", (block, generator) => {
    needHelper("url");
    return [`__steam_urlencode(${value(block, generator, "TEXT", "''")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_to_int", (block, generator) => [`int(${value(block, generator, "VALUE", "0")})`, Order.FUNCTION_CALL]);
  setGenerator("steam_to_float", (block, generator) => [`float(${value(block, generator, "VALUE", "0")})`, Order.FUNCTION_CALL]);
  setGenerator("steam_to_string", (block, generator) => [`str(${value(block, generator, "VALUE", "''")})`, Order.FUNCTION_CALL]);
  setGenerator("steam_text_contains", (block, generator) => [`str(${value(block, generator, "PART", "''")}) in str(${value(block, generator, "TEXT", "''")})`, Order.RELATIONAL]);
  setGenerator("steam_text_startswith", (block, generator) => [`str(${value(block, generator, "TEXT", "''")}).startswith(str(${value(block, generator, "PART", "''")}))`, Order.FUNCTION_CALL]);
  setGenerator("steam_text_replace", (block, generator) => [`str(${value(block, generator, "TEXT", "''")}).replace(str(${value(block, generator, "OLD", "''")}), str(${value(block, generator, "NEW", "''")}))`, Order.FUNCTION_CALL]);
  setGenerator("steam_clamp", (block, generator) => [`max(${value(block, generator, "MIN", "0")}, min(${value(block, generator, "MAX", "100")}, ${value(block, generator, "VALUE", "0")}))`, Order.FUNCTION_CALL]);
  setGenerator("steam_ntp_sync", (block, generator) => {
    needHelper("ntp");
    return `__steam_ntp_sync(${value(block, generator, "HOST", "'pool.ntp.org'")})\n`;
  });
  setGenerator("steam_time_now_tuple", () => {
    needImport("import time");
    return ["time.localtime()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_time_part", (block) => {
    needImport("import time");
    return [`time.localtime()[${block.getFieldValue("PART")}]`, Order.MEMBER];
  });
  setGenerator("steam_system_reset", () => {
    needImport("import machine");
    return "machine.reset()\n";
  });
  setGenerator("steam_system_unique_id", () => {
    needHelper("sys");
    return ["__steam_unique_id()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_system_mem_free", () => {
    needHelper("sys");
    return ["__steam_memory_free()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_system_freq", () => {
    needImport("import machine");
    return ["machine.freq()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_system_set_freq", (block, generator) => {
    needImport("import machine");
    return `machine.freq(int(${value(block, generator, "FREQ", "240000000")}))\n`;
  });

  setGenerator("steam_thread_start", (block, generator) => {
    needHelper("thread");
    const fn = `__steam_task_${sanitizeId(block.id)}`;
    return `def ${fn}():\n${statements(block, generator, "DO")}__steam_thread_start(${quote(block.getFieldValue("NAME"))}, ${fn})\n`;
  });
  setGenerator("steam_mutex", (block, generator) => {
    needImport("import _thread");
    requiredImports.add("__steam_lock = _thread.allocate_lock()");
    return `with __steam_lock:\n${statements(block, generator, "DO")}`;
  });

  setGenerator("steam_sleep_us", (block, generator) => {
    needImport("import time");
    return `time.sleep_us(int(${value(block, generator, "US", "100")}))\n`;
  });
  setGenerator("steam_pin_toggle", (block) => {
    needImport("import machine");
    const pin = block.getFieldValue("PIN");
    return `__steam_pin = machine.Pin(${pin}, machine.Pin.OUT)\n__steam_pin.value(0 if __steam_pin.value() else 1)\n`;
  });
  setGenerator("steam_pwm_off", (block) => {
    needHelper("pwm");
    const pin = block.getFieldValue("PIN");
    return `try:\n  __steam_pwms[int(${pin})].deinit()\n  del __steam_pwms[int(${pin})]\nexcept Exception:\n  pass\n`;
  });
  setGenerator("steam_i2c_write_reg", (block, generator) => {
    needHelper("i2c");
    return `__steam_i2c_bus().writeto_mem(int(${value(block, generator, "ADDR", "0x68")}), int(${value(block, generator, "REG", "0")}), bytes([int(${value(block, generator, "VAL", "0")}) & 0xFF]))\n`;
  });
  setGenerator("steam_i2c_read_reg", (block, generator) => {
    needHelper("i2c");
    return [`__steam_i2c_bus().readfrom_mem(int(${value(block, generator, "ADDR", "0x68")}), int(${value(block, generator, "REG", "0")}), int(${value(block, generator, "LEN", "1")}))`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_esp32_hall", () => {
    needImport("import esp32");
    return ["esp32.hall_sensor()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_ntc_temperature", (block, generator) => {
    needHelper("ntc");
    return [`__steam_ntc_temperature(${block.getFieldValue("PIN")}, ${value(block, generator, "BETA", "3950")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_list_append", (block, generator) => `${value(block, generator, "LIST", "[]")}.append(${value(block, generator, "ITEM", "None")})\n`);
  setGenerator("steam_list_pop", (block, generator) => [`${value(block, generator, "LIST", "[]")}.pop()`, Order.FUNCTION_CALL]);
  setGenerator("steam_dict_new", () => ["{}", Order.ATOMIC]);
  setGenerator("steam_dict_set", (block, generator) => `${value(block, generator, "DICT", "{}")}[${value(block, generator, "KEY", "''")}] = ${value(block, generator, "VAL", "None")}\n`);
  setGenerator("steam_dict_get", (block, generator) => [`${value(block, generator, "DICT", "{}")}.get(${value(block, generator, "KEY", "''")}, ${value(block, generator, "DEFAULT", "None")})`, Order.FUNCTION_CALL]);
  setGenerator("steam_random_float", () => {
    needImport("import random");
    return ["random.random()", Order.FUNCTION_CALL];
  });
  setGenerator("steam_format_float", (block, generator) => {
    const dec = block.getFieldValue("DECIMALS") || "2";
    return [`("{:.${dec}f}").format(${value(block, generator, "NUM", "0")})`, Order.FUNCTION_CALL];
  });
  setGenerator("steam_pin_irq", (block, generator) => {
    needImport("import machine");
    const pin = block.getFieldValue("PIN");
    const trigger = block.getFieldValue("TRIGGER");
    const map = {
      rising: "machine.Pin.IRQ_RISING",
      falling: "machine.Pin.IRQ_FALLING",
      change: "machine.Pin.IRQ_RISING | machine.Pin.IRQ_FALLING",
    };
    const name = `__steam_irq_${sanitizeId(block.id)}`;
    return `def ${name}(pin):\n${statements(block, generator, "HANDLER")}machine.Pin(${pin}, machine.Pin.IN).irq(handler=${name}, trigger=${map[trigger] || map.rising})\n`;
  });
}

export function defineSteamBlocks() {
  defineBlocks(blockDefinitions());
  installGenerators();
  defineTdrBlocks();
  defineTdrGenerators();
  defineDbotBlocks();
  defineDbotGenerators();
}

function block(type, inputs = {}, fields = {}) {
  return { kind: "block", type, inputs, fields };
}

function shadowNumber(value) {
  return { shadow: { type: "math_number", fields: { NUM: String(value) } } };
}

function shadowText(value) {
  return { shadow: { type: "text", fields: { TEXT: String(value) } } };
}

function category(name, colour, contents) {
  return { kind: "category", name, colour, contents };
}

export function buildToolbox() {
  return {
    kind: "categoryToolbox",
    contents: [
      category("Programa", "#4d63d9", [
        block("steam_program"),
        block("steam_forever"),
        block("steam_every_ms", { MS: shadowNumber(1000) }),
        block("steam_comment"),
        block("steam_gc_collect"),
        { kind: "sep" },
        block("controls_if"),
        block("controls_repeat_ext", { TIMES: shadowNumber(10) }),
        block("controls_whileUntil"),
        block("controls_for", { FROM: shadowNumber(1), TO: shadowNumber(10), BY: shadowNumber(1) }),
      ]),
      category("Pines", "#2f8f69", [
        block("steam_digital_write"),
        block("steam_digital_read"),
        block("steam_pin_pull_read"),
        block("steam_pin_toggle"),
        block("steam_analog_read"),
        block("steam_analog_percent"),
        block("steam_pwm_write", { DUTY: shadowNumber(512), FREQ: shadowNumber(1000) }),
        block("steam_pwm_off"),
        block("steam_dac_write", { VALUE: shadowNumber(128) }),
        block("steam_touch_read"),
        block("steam_pulse_in", { TIMEOUT: shadowNumber(1000000) }),
        block("steam_i2c_init", { FREQ: shadowNumber(400000) }),
        block("steam_i2c_scan"),
        block("steam_i2c_write_reg", { ADDR: shadowNumber(104), REG: shadowNumber(0), VAL: shadowNumber(0) }),
        block("steam_i2c_read_reg", { ADDR: shadowNumber(104), REG: shadowNumber(0), LEN: shadowNumber(1) }),
        block("steam_pin_irq"),
      ]),
      category("Tiempo", "#8f56bf", [
        block("steam_sleep_ms", { MS: shadowNumber(1000) }),
        block("steam_sleep_us", { US: shadowNumber(100) }),
        block("steam_sleep_s", { S: shadowNumber(1) }),
        block("steam_ticks_ms"),
        block("steam_deepsleep", { MS: shadowNumber(10000) }),
      ]),
      category("Serie", "#3d6fc3", [
        block("steam_print", { TEXT: shadowText("Hola STEAMakers") }),
        block("steam_print_csv", { A: shadowText("dato"), B: shadowNumber(1), C: shadowNumber(2), SEP: shadowText(",") }),
        block("steam_read_line"),
        block("steam_uart_init", { BAUD: shadowNumber(9600) }),
        block("steam_uart_write", { TEXT: shadowText("AT") }),
      ]),
      category("WiFi", "#0b8793", [
        block("steam_wifi_connect", { SSID: shadowText("MiWiFi"), PASSWORD: shadowText("clave"), TIMEOUT: shadowNumber(15) }),
        block("steam_wifi_ap", { SSID: shadowText("STEAMakers"), PASSWORD: shadowText("12345678"), IP: shadowText("192.168.4.1") }),
        block("steam_wifi_is_connected"),
        block("steam_wifi_ifconfig"),
        block("steam_wifi_scan"),
        block("steam_wifi_hostname", { NAME: shadowText("esp32-steammakers") }),
        block("steam_wifi_rssi"),
        block("steam_wifi_mac"),
        block("steam_wifi_wait_connected", { TIMEOUT: shadowNumber(10) }),
        block("steam_wifi_disconnect"),
      ]),
      category("HTTP IoT", "#00876c", [
        block("steam_http_get", { URL: shadowText("https://example.com") }),
        block("steam_http_post_json", { URL: shadowText("https://example.com/api"), DATA: shadowText('{"valor": 1}') }),
        block("steam_http_server", { PORT: shadowNumber(80) }),
        block("steam_http_route", { PATH: shadowText("/"), RESPONSE: shadowText("<h1>Hola</h1>") }),
        block("steam_http_param", { KEY: shadowText("pin") }),
        block("steam_mqtt_connect", { CLIENT: shadowText("esp32"), BROKER: shadowText("broker.hivemq.com"), PORT: shadowNumber(1883), USER: shadowText(""), PASSWORD: shadowText("") }),
        block("steam_mqtt_publish", { TOPIC: shadowText("steamakers/dato"), MESSAGE: shadowText("hola") }),
        block("steam_mqtt_on_message", { TOPIC: shadowText("steamakers/control") }),
        block("steam_mqtt_message_text"),
        block("steam_blynk_write", { TOKEN: shadowText("TOKEN"), VPIN: shadowNumber(0), VALUE: shadowNumber(1) }),
        block("steam_thingspeak_write", { KEY: shadowText("APIKEY"), FIELD: shadowNumber(1), VALUE: shadowNumber(23) }),
      ]),
      category("Telegram", "#229bd7", [
        block("steam_telegram_token", { TOKEN: shadowText("123456:ABC") }),
        block("steam_telegram_send", { CHAT: shadowText("123456789"), TEXT: shadowText("Hola desde ESP32") }),
        block("steam_telegram_reply", { TEXT: shadowText("OK") }),
        block("steam_telegram_send_ip"),
        block("steam_telegram_on_message"),
        block("steam_telegram_text"),
        block("steam_telegram_chat"),
        block("steam_telegram_sender"),
      ]),
      category("Bluetooth", "#5669d8", [
        block("steam_ble_uart_start", { NAME: shadowText("STEAMakers") }),
        block("steam_ble_uart_send", { TEXT: shadowText("hola") }),
        block("steam_ble_uart_on_rx"),
        block("steam_ble_uart_text"),
        block("steam_ble_scan_names", { MS: shadowNumber(5000) }),
        block("steam_ble_scan_send_telegram", { MS: shadowNumber(5000) }),
        block("steam_bluetooth_hid_note"),
        block("steam_keyboard_mouse_note"),
      ]),
      category("ESP-NOW Mesh LoRa", "#de7b00", [
        block("steam_espnow_init"),
        block("steam_espnow_add_peer", { MAC: shadowText("AA:BB:CC:DD:EE:FF") }),
        block("steam_espnow_send", { MAC: shadowText("AA:BB:CC:DD:EE:FF"), MESSAGE: shadowText("hola") }),
        block("steam_espnow_on_receive"),
        block("steam_espnow_message"),
        block("steam_espnow_mac"),
        block("steam_udp_broadcast_send", { PORT: shadowNumber(4210), MESSAGE: shadowText("mesh") }),
        block("steam_lora_note"),
      ]),
      category("Sensores", "#b77800", [
        block("steam_dht_read"),
        block("steam_ultrasonic_cm"),
        block("steam_ds18b20_read"),
        block("steam_mpu6050_read"),
        block("steam_button_pressed"),
        block("steam_pir_read"),
        block("steam_light_percent"),
        block("steam_sound_percent"),
        block("steam_rain_percent"),
        block("steam_gas_raw"),
        block("steam_rfid_uid"),
        block("steam_ntc_temperature", { BETA: shadowNumber(3950) }),
      ]),
      category("Actuadores", "#c84c70", [
        block("steam_servo_write", { DEGREES: shadowNumber(90) }),
        block("steam_buzzer_tone", { FREQ: shadowNumber(440), MS: shadowNumber(250) }),
        block("steam_relay_write"),
        block("steam_rgb_write", { RV: shadowNumber(255), GV: shadowNumber(60), BV: shadowNumber(0) }),
        block("steam_motor_dc", { SPEED: shadowNumber(700) }),
        block("steam_motor_shield_note"),
      ]),
      category("Pantallas LED MP3", "#725ce6", [
        block("steam_neopixel_init", { COUNT: shadowNumber(8) }),
        block("steam_neopixel_set", { INDEX: shadowNumber(0), R: shadowNumber(255), G: shadowNumber(0), B: shadowNumber(0) }),
        block("steam_neopixel_fill", { R: shadowNumber(0), G: shadowNumber(0), B: shadowNumber(32) }),
        block("steam_neopixel_show"),
        block("steam_oled_init", { WIDTH: shadowNumber(128), HEIGHT: shadowNumber(64), ADDR: shadowText("0x3C") }),
        block("steam_oled_text", { TEXT: shadowText("Hola"), X: shadowNumber(0), Y: shadowNumber(0) }),
        block("steam_oled_fill"),
        block("steam_lcd_text", { TEXT: shadowText("Hola"), ROW: shadowNumber(0), COL: shadowNumber(0) }),
        block("steam_mp3_play", { TRACK: shadowNumber(1) }),
        block("steam_matrix8_note"),
      ]),
      category("Memoria RTC GPS", "#5f8f3a", [
        block("steam_sd_mount", { MOUNT: shadowText("/sd") }),
        block("steam_file_write", { PATH: shadowText("/sd/datos.csv"), TEXT: shadowText("linea"), }),
        block("steam_file_read", { PATH: shadowText("/sd/datos.csv") }),
        block("steam_file_exists", { PATH: shadowText("/sd/datos.csv") }),
        block("steam_file_remove", { PATH: shadowText("/sd/datos.csv") }),
        block("steam_file_listdir", { PATH: shadowText("/") }),
        block("steam_mkdir", { PATH: shadowText("/data") }),
        block("steam_ds3231_now"),
        block("steam_gps_read_line"),
        block("steam_keypad_read", {
          ROWS: shadowText("12,14,27,26"),
          COLS: shadowText("25,33,32,35"),
          KEYS: shadowText("123A456B789C*0#D"),
        }),
      ]),
      category("Datos", "#768700", [
        block("steam_json_get", { TEXT: shadowText('{"temp": 23}'), KEY: shadowText("temp") }),
        block("steam_urlencode", { TEXT: shadowText("hola mundo") }),
        block("steam_csv", { SEP: shadowText(","), A: shadowText("A"), B: shadowText("B"), C: shadowText("C") }),
        block("steam_map_value", { VALUE: shadowNumber(512), IN_MIN: shadowNumber(0), IN_MAX: shadowNumber(1023), OUT_MIN: shadowNumber(0), OUT_MAX: shadowNumber(100) }),
        block("steam_to_int", { VALUE: shadowText("123") }),
        block("steam_to_float", { VALUE: shadowText("12.5") }),
        block("steam_to_string", { VALUE: shadowNumber(42) }),
        block("steam_text_contains", { TEXT: shadowText("hola mundo"), PART: shadowText("hola") }),
        block("steam_text_startswith", { TEXT: shadowText("/led=ON"), PART: shadowText("/led") }),
        block("steam_text_replace", { TEXT: shadowText("a-b"), OLD: shadowText("-"), NEW: shadowText(",") }),
        block("steam_clamp", { VALUE: shadowNumber(120), MIN: shadowNumber(0), MAX: shadowNumber(100) }),
        block("steam_random_float"),
        block("steam_format_float", { NUM: shadowNumber(3.1416) }),
        block("math_number"),
        block("math_arithmetic"),
        block("math_random_int", { FROM: shadowNumber(1), TO: shadowNumber(100) }),
        block("text"),
        block("text_join"),
        block("logic_compare"),
        block("logic_operation"),
        block("logic_boolean"),
      ]),
      category("Listas", "#7b6f99", [
        block("lists_create_with"),
        block("lists_length"),
        block("lists_getIndex"),
        block("lists_setIndex"),
        block("steam_list_append"),
        block("steam_list_pop"),
        block("steam_dict_new"),
        block("steam_dict_set"),
        block("steam_dict_get"),
      ]),
      category("Multitarea", "#7a5a4d", [
        block("steam_ntp_sync", { HOST: shadowText("pool.ntp.org") }),
        block("steam_time_now_tuple"),
        block("steam_time_part"),
        block("steam_system_unique_id"),
        block("steam_system_mem_free"),
        block("steam_system_freq"),
        block("steam_system_set_freq", { FREQ: shadowNumber(240000000) }),
        block("steam_esp32_hall"),
        block("steam_system_reset"),
        block("steam_thread_start"),
        block("steam_mutex"),
      ]),
      TDR_TOOLBOX_CATEGORY,
      DBOT_TOOLBOX_CATEGORY,
      { kind: "category", name: "Variables", custom: "VARIABLE", colour: "#a86bb8" },
      { kind: "category", name: "Funciones", custom: "PROCEDURE", colour: "#a86bb8" },
    ],
  };
}

export function buildMicroPythonCode(workspace) {
  requiredImports.clear();
  requiredHelpers.clear();
  pythonGenerator.addReservedWords("__steam_now,__steam_routes,__steam_request");
  const body = pythonGenerator.workspaceToCode(workspace).trimEnd();
  const imports = Array.from(requiredImports).join("\n");
  const helpers = Array.from(requiredHelpers)
    .map((name) => HELPER_SNIPPETS[name])
    .filter(Boolean)
    .join("\n");
  const usedTypes = new Set(workspace.getAllBlocks(false).map((block) => block.type));
  const boardHelpers = [
    TDR_BLOCK_TYPES.some((type) => usedTypes.has(type)) ? TDR_HELPERS.trim() : "",
    DBOT_BLOCK_TYPES.some((type) => usedTypes.has(type)) ? DBOT_HELPERS.trim() : "",
  ].filter(Boolean).join("\n\n");
  const header = [
    "# Generado por NEW STEAMMAKERS",
    "# Placa objetivo: ESP32 Plus STEAMakers 32-WROOM con MicroPython",
    "# Conexion: Chrome WebSerial sobre REPL USB",
  ].join("\n");

  return [header, imports, helpers, boardHelpers, body || "# Arrastra bloques o escribe MicroPython en el editor."]
    .filter((part) => part && part.trim())
    .join("\n\n")
    .trimEnd() + "\n";
}

export function loadStarterWorkspace(workspace) {
  const xml = Blockly.utils.xml.textToDom(`
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="steam_program" x="28" y="28">
        <statement name="SETUP">
          <block type="steam_print">
            <value name="TEXT">
              <shadow type="text">
                <field name="TEXT">NEW STEAMMAKERS listo</field>
              </shadow>
            </value>
          </block>
        </statement>
        <statement name="LOOP">
          <block type="steam_digital_write">
            <field name="PIN">2</field>
            <field name="STATE">1</field>
            <next>
              <block type="steam_sleep_ms">
                <value name="MS">
                  <shadow type="math_number">
                    <field name="NUM">500</field>
                  </shadow>
                </value>
                <next>
                  <block type="steam_digital_write">
                    <field name="PIN">2</field>
                    <field name="STATE">0</field>
                    <next>
                      <block type="steam_sleep_ms">
                        <value name="MS">
                          <shadow type="math_number">
                            <field name="NUM">500</field>
                          </shadow>
                        </value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </xml>
  `);
  Blockly.Xml.domToWorkspace(xml, workspace);
}
