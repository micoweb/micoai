# MICO AI — Futuristic 3D Study Buddy

A responsive React + Vite frontend with an Express backend that connects to the OpenAI API. Includes Sinhala/English response preference, browser voice input, read-aloud support, and local chat history.

## Requirements
- Node.js 18 or newer
- An OpenAI API key for real AI replies

## Run locally
1. Extract the ZIP and open the `MICO_AI_Study_Buddy` folder in a terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`.
4. Open `.env` and set your API key:
   ```env
   OPENAI_API_KEY=your_real_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   PORT=3001
   ```
5. Start both the frontend and backend:
   ```bash
   npm run dev
   ```
6. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Production build
```bash
npm run build
```
Set `NODE_ENV=production` and start the server with `npm start`; Express serves the built frontend from `dist`.

## Included features
- Futuristic dark UI with animated 3D-style orb and ambient gradients
- Responsive mobile layout and navigation drawer
- Chat sessions and history stored in this browser's localStorage
- Browser speech recognition (browser/device support varies)
- Read-aloud using browser speech synthesis
- Auto / Sinhala / English answer preference
- Backend endpoint `/api/chat`; API key stays on the server

## Important notes
- Voice input support varies by browser. Chrome generally has the broadest Web Speech API support. Speech recognition may require an internet connection and microphone permission.
- Browser speech synthesis voices depend on the device. Sinhala speech may not be available on every device.
- Chat history is saved only in the current browser/device. It is not synced across devices and clearing browser storage removes it.
- Do not commit `.env` or expose your API key in frontend code.
- An API key and API usage may incur charges according to your provider's current pricing and account setup.
- The starter project does not include user accounts, cloud-synced history, or file/image uploads.
