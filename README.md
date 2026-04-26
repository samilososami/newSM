# NEW STEAMMAKERS ESP32 Flasher & IDE

Entorno de desarrollo y herramienta de flasheo desde el navegador para placas ESP32 con MicroPython. Utiliza la Web Serial API para comunicarse directamente con la placa y cuenta con una interfaz de programación visual por bloques impulsada por Blockly.

## Tecnologías Utilizadas

<div align="center">
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Blockly-111111?style=for-the-badge&logo=google&logoColor=white" alt="Blockly" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="MicroPython" />
</div>

## Características

- **Programación por Bloques:** Codificación visual con Blockly, adaptada para el control de hardware.
- **Modo Código:** Visualiza y edita el código MicroPython generado, o escribe código de forma manual.
- **Comunicación Web Serial:** Conexión directa al ESP32 por USB usando la Web Serial API del navegador.
- **Consola Integrada:** REPL incorporado para depuración y ejecución directa de comandos.
- **Asistente IA Integrado:** Integración opcional con Ollama para asistencia de código inteligente.
- **Soporte de Temas:** Modos claro y oscuro pulidos y modernos.

## Configuración y Ejecución

1. Clona este repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue

Este proyecto está configurado para desplegarse fácilmente en Vercel. 
La configuración de Vercel utiliza el archivo `vercel.json` para las reglas de enrutamiento y el manejo de la SPA (Single Page Application).
