# NEW STEAMMAKERS ESP32 Flasher & IDE

Browser-based development environment and flashing tool for ESP32 devices running MicroPython. It utilizes the Web Serial API for direct communication with the board and features a block-based visual programming interface powered by Blockly.

## Technologies Used

<div align="center">
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Blockly-111111?style=for-the-badge&logo=google&logoColor=white" alt="Blockly" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="MicroPython" />
</div>

## Features

- **Block-Based Programming:** Visual coding with Blockly, tailored for hardware control.
- **Code Mode:** View and edit generated MicroPython code, or write manual code.
- **Web Serial Communication:** Direct connection to the ESP32 via USB using the browser's Web Serial API.
- **Integrated Console:** Built-in REPL for debugging and direct command execution.
- **AI Assistant Integration:** Optional integration with Ollama for intelligent coding assistance.
- **Theme Support:** Polished light and dark modes.

## Setup & Execution

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured to be easily deployed to Vercel. 
The Vercel configuration uses the `vercel.json` file for routing rules and SPA handling.
