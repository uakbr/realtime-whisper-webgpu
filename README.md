# Whisper WebGPU

Whisper WebGPU is a React + Vite application that brings Whisper speech recognition directly to the browser using WebGPU. It supports real-time transcription from the microphone or uploaded audio files and lets you choose between different model sizes.

1. Install Node.js (v18 or later recommended).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   This launches Vite and serves the app at the local address printed in the console.

## Features

- Real‑time speech recognition in the browser
- Microphone and file upload modes
- Selectable Whisper models (tiny, base, small, medium)
- Language selection and transcription history
- Progress indicators and basic error handling

Once a model is loaded you can transcribe speech without sending audio to a server, all processing happens locally through WebGPU.
