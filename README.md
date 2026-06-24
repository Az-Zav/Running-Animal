# Running Animal

A retro pixel-art animal racing and betting game built with **Vite** and **PixiJS**.

## 🎮 Overview

Place bets on your favorite animal and watch the race unfold across a vibrant, animated track. The game includes a title screen, betting UI, racing simulation, and reward mechanics with persistent wallet balance.

## 🚀 Stack

- ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
- ![PixiJS](https://img.shields.io/badge/PixiJS-5C9E31?style=for-the-badge&logo=pixijs&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
- ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## ✨ Features

- Retro pixel-art styling with layered parallax backgrounds
- Animal racing simulation with dynamic speed bursts and finish-line victory behavior
- Betting UI with token-based wagers and payout handling
- Wallet persistence using `localStorage`
- Responsive canvas scaling for full-window display
- Sound effects and background music controls

## 📁 Project Structure

- `index.html` — entry page and game container
- `package.json` — project scripts and dependencies
- `vite.config.js` — Vite configuration
- `public/` — static assets and manifest
- `src/` — game source code
  - `constants.js` — shared game values and settings
  - `main.js` — app bootstrap and loop
  - `style.css` — global game styles
  - `game/` — core game logic modules
  - `ui/` — user interface components
  - `utils/` — utility helpers

## 🛠️ Local Setup

1. Install dependencies

```bash
npm install
```

2. Start the development server

```bash
npm run dev
```

3. Open the local URL shown in the terminal

## 📦 Build

```bash
npm run build
```

## 🔍 Preview

```bash
npm run preview
```

## 🎯 Deployment

This project is already configured for deployment on Vercel.

- `vercel.json` contains deployment metadata
- `public/` hosts static assets and manifest
- Live demo: [Running Animal — Race Betting Game](https://running-animals.vercel.app/)

## 💡 Notes

- The game canvas scales responsively while keeping the correct internal aspect ratio.
- Bets and wallet state are restored between sessions using browser storage.
- Press `R` to open the redeem panel when your token balance is low.

## 🧾 License

This project is licensed under the terms of the `MIT` license.
