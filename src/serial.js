const encoder = new TextEncoder();
const decoder = new TextDecoder();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pyString(value) {
  return JSON.stringify(value);
}

function normaliseCode(code) {
  return code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd() + "\n";
}

export class MicroPythonSerial extends EventTarget {
  constructor() {
    super();
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.reading = false;
    this.connected = false;
    this._lastBaudRate = 115200;
    this._rxBuffer = "";
  }

  isSupported() {
    return "serial" in navigator;
  }

  async connect(baudRate = 115200) {
    if (!this.isSupported()) {
      throw new Error("WebSerial solo esta disponible en Chrome/Edge sobre localhost o HTTPS.");
    }
    if (this.connected) return;
    this._lastBaudRate = baudRate;
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate });
    this.writer = this.port.writable.getWriter();
    this.connected = true;
    this.dispatch("status", { connected: true, message: "ESP32 conectado" });
    this.readLoop();
  }

  async reconnect() {
    if (this.connected) return;
    const ports = await navigator.serial.getPorts();
    if (ports.length === 0) throw new Error("No hay puertos guardados. Usa 'Conectar' para elegir el puerto.");
    // Clean up any leftover state
    this.reader = null;
    this.writer = null;
    this.reading = false;
    this.port = ports[0];
    try {
      await this.port.open({ baudRate: this._lastBaudRate });
    } catch (e) {
      if (!e.message?.includes("already open")) throw e;
    }
    this.writer = this.port.writable.getWriter();
    this.connected = true;
    this.dispatch("status", { connected: true, message: "ESP32 reconectado" });
    this.readLoop();
  }

  async disconnect() {
    this.connected = false;
    this.reading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
      }
    } catch { /* reader may already be released */ }
    this.reader = null;
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
      }
    } catch { /* writer may already be closed */ }
    this.writer = null;
    try {
      if (this.port) await this.port.close();
    } catch { /* port may already be closed */ }
    this.port = null;
    this.dispatch("status", { connected: false, message: "Desconectado" });
  }

  async readLoop() {
    if (!this.port?.readable || this.reading) return;
    this.reading = true;
    this.reader = this.port.readable.getReader();
    try {
      while (this.connected) {
        const { value, done } = await this.reader.read();
        if (done) {
          if (this.connected) {
            this.connected = false;
            this.dispatch("status", { connected: false, message: "Placa desconectada" });
          }
          break;
        }
        if (value) {
          const text = decoder.decode(value);
          this._rxBuffer = (this._rxBuffer + text).slice(-12000);
          this.dispatch("data", text);
        }
      }
    } catch (error) {
      if (this.connected) {
        this.connected = false;
        this.dispatch("status", { connected: false, message: "Conexión perdida — pulsa Reconectar" });
        this.dispatch("error", { message: error.message || String(error) });
      }
    } finally {
      this.reading = false;
      try { this.reader?.releaseLock(); } catch { /* ignore */ }
      this.reader = null;
    }
  }

  async write(text) {
    if (!this.writer) throw new Error("No hay una placa conectada.");
    await this.writer.write(encoder.encode(text));
  }

  async writeBytes(bytes) {
    if (!this.writer) throw new Error("No hay una placa conectada.");
    await this.writer.write(new Uint8Array(bytes));
  }

  async command(text) {
    await this.write(text.endsWith("\r") || text.endsWith("\n") ? text : `${text}\r`);
  }

  clearBuffer() {
    this._rxBuffer = "";
  }

  recentOutput() {
    return this._rxBuffer;
  }

  async verifyMicroPython(timeoutMs = 2200) {
    if (!this.connected) return false;
    const marker = `NSM_MP_${Date.now()}`;
    this.clearBuffer();
    try {
      await this.writeBytes([3, 3]);
      await delay(250);
      await this.command(`import sys; print("${marker}", sys.implementation.name)`);
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        await delay(120);
        const output = this.recentOutput();
        if (output.includes(marker) && /micropython/i.test(output)) return true;
        if (output.includes(marker) && /cpython|python/i.test(output)) return false;
      }
    } catch {
      return false;
    }
    return false;
  }

  async interrupt() {
    await this.writeBytes([3, 3]);
    await delay(300);
  }

  async stopCurrentProgram() {
    // Multiple Ctrl-C + Ctrl-B to cancel any running code and exit paste/raw modes
    await this.writeBytes([3]);
    await delay(150);
    await this.writeBytes([3]);
    await delay(200);
    await this.writeBytes([2]); // exit raw/paste mode back to normal REPL
    await delay(100);
    await this.writeBytes([3]);
    await delay(200);
    await this.writeBytes([3]); // extra safety interrupt
    await delay(250);
  }

  async softReset() {
    await this.writeBytes([4]);
    await delay(2200); // extra time for MicroPython to fully boot and reach REPL
  }

  async softResetAndInterrupt() {
    await this.stopCurrentProgram();
    await this.softReset();
    await this.interrupt();
  }

  async pasteExec(source) {
    await this.writeBytes([3]); // ensure REPL is ready
    await delay(150);
    await this.writeBytes([5]); // Ctrl-E: enter paste mode
    await delay(220);           // wait for paste mode to activate
    await this.write(normaliseCode(source));
    await delay(180);           // wait for all bytes to flush
    await this.writeBytes([4]); // Ctrl-D: execute paste buffer
    await delay(450);           // wait for execution to start
  }

  async runInMemory(code) {
    await this.stopCurrentProgram();
    await this.pasteExec([
      "import os",
      "try:",
      "    os.remove('__steam_main_saved.py')",
      "except OSError:",
      "    pass",
      "try:",
      "    os.rename('main.py', '__steam_main_saved.py')",
      "    print('main.py pausado para ejecutar en RAM')",
      "except OSError:",
      "    pass",
    ].join("\n"));
    await delay(650);
    await this.softReset();
    const payload = [
      "import gc, os",
      "try:",
      "    os.rename('__steam_main_saved.py', 'main.py')",
      "    print('main.py restaurado; ejecutando codigo temporal')",
      "except OSError:",
      "    pass",
      "gc.collect()",
      `__steam_code = ${pyString(normaliseCode(code))}`,
      "compile(__steam_code, '<new-steammakers-ram>', 'exec')",
      "exec(__steam_code, globals())",
    ].join("\n");
    await this.pasteExec(payload);
  }

  async saveMainAndRun(code) {
    await this.stopCurrentProgram();
    const payload = [
      "import gc, os",
      "gc.collect()",
      `__steam_code = ${pyString(normaliseCode(code))}`,
      "compile(__steam_code, 'main.py', 'exec')",
      "try:",
      "    os.remove('main.py')",
      "except OSError:",
      "    pass",
      "with open('main.py', 'w') as __steam_file:",
      "    __steam_file.write(__steam_code)",
      "gc.collect()",
      "print('main.py guardado. Reiniciando con el programa nuevo...')",
    ].join("\n");
    await this.pasteExec(payload);
    await delay(800);
    await this.softReset();
  }

  dispatch(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
