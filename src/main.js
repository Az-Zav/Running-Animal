// src/main.js — Phase 4: Betting UI & Wallet
import { Application } from 'pixi.js';
import {
  GAME_WIDTH, GAME_HEIGHT,
  PARALLAX_LAYERS, ANIMALS, LANE_Y_POSITIONS, STATES
} from './constants.js';
import { AssetLoader } from './game/AssetLoader.js';
import { ParallaxLayer } from './game/ParallaxLayer.js';
import { Animal } from './game/Animal.js';
import { GameStateMachine } from './game/GameStateMachine.js';
import { RaceManager } from './game/RaceManager.js';
import { WalletManager } from './game/WalletManager.js';
import { BettingUI } from './game/BettingUI.js';
import { TitleScreen } from './game/TitleScreen.js';
import { GlobalUI } from './game/GlobalUI.js';
import { RedeemPanel } from './game/RedeemPanel.js';
import { sounds } from './game/SoundManager.js';
import './style.css';

(async () => {
  // ── Create PixiJS Application ──────────────────────────────────
  const app = new Application();

  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x000000,
    resolution: 1,
    autoDensity: true,
  });

  document.getElementById('game-container').appendChild(app.canvas);
  app.stage.sortableChildren = true;

  // ── Responsive canvas scaling + overlay sync ────────────────────
  const resize = () => {
    const windowWidth  = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);
    const scaledW = Math.floor(GAME_WIDTH * scale);
    const scaledH = Math.floor(GAME_HEIGHT * scale);

    app.canvas.style.width  = `${scaledW}px`;
    app.canvas.style.height = `${scaledH}px`;

    // Sync all HTML overlays to match canvas dimensions
    const container = document.getElementById('game-container');
    container.style.width  = `${scaledW}px`;
    container.style.height = `${scaledH}px`;
  };

  window.addEventListener('resize', resize);
  // Also listen for orientation changes on mobile
  if (screen.orientation) {
    screen.orientation.addEventListener('change', resize);
  }
  resize();

  // ── Load all assets ────────────────────────────────────────────
  await AssetLoader.loadAll();

  // ── Build parallax layers ──────────────────────────────────────
  const layers = [];
  for (const layerConfig of PARALLAX_LAYERS) {
    const texture = AssetLoader.get(layerConfig.key);
    const layer = new ParallaxLayer(texture, layerConfig.speedMod);
    layers.push(layer);
    app.stage.addChild(layer.sprite);
    layer.pause();
  }

  // ── Build animals ──────────────────────────────────────────────
  const animals = [];
  for (let i = 0; i < ANIMALS.length; i++) {
    const config  = ANIMALS[i];
    const texture = AssetLoader.get(config.id);
    const laneY   = LANE_Y_POSITIONS[i];
    const animal  = new Animal(config, texture, laneY);
    animals.push(animal);
  }

  // ── State Machine, Wallet, UI ──────────────────────────────────
  const fsm = new GameStateMachine();
  const wallet = new WalletManager();

  let globalUI;
  const redeemPanel = new RedeemPanel(wallet, () => globalUI?.update());
  globalUI = new GlobalUI(wallet, {
    onWalletTripleTap: () => redeemPanel.toggle(),
  });
  
  const raceManager = new RaceManager(
    animals, 
    () => {
        layers.forEach(l => l.pause());
    },
    (winnerId) => {
        const winnings = wallet.processRaceResults(winnerId, ANIMALS);
        console.log(`[Main] Race finished! Winner: ${winnerId}, Payout: ${winnings}`);
        
        if (winnings > 0) sounds.playWin();
        else sounds.playLose();

        globalUI.update();
        fsm.transition(STATES.RESULTS);
    }
  );
  
  app.stage.addChild(raceManager.finishLine);
  animals.forEach(a => app.stage.addChild(a.sprite));

  const bettingUI = new BettingUI(
    wallet, 
    () => {
        sounds.playRaceStart();
        fsm.transition(STATES.RACING);
    },
    () => globalUI.update()
  );

  const titleScreen = new TitleScreen(async () => {
    await sounds.playBet(); // Start audio context on first click
    await sounds.startBGM(); // Start background music
    fsm.transition(STATES.BETTING);
  });

  // ── State Transitions ──────────────────────────────────────────
  fsm.on(STATES.START, () => {
    titleScreen.show();
    bettingUI.hide();
  });

  fsm.on(STATES.BETTING, () => {
    layers.forEach(l => l.pause());
    raceManager.reset();
    wallet.clearBets(); 
    globalUI.update();
    bettingUI.show();
  });

  fsm.on(STATES.RACING, () => {
    bettingUI.hide();
    layers.forEach(l => l.resume());
    raceManager.startRace();
    animals.forEach(a => a.setState('run'));
  });

  fsm.on(STATES.RESULTS, () => {
    layers.forEach(l => l.pause());
    
    // Auto-return to betting after a few seconds of glory
    setTimeout(() => {
        fsm.transition(STATES.BETTING);
    }, 6000);
  });

  // ── Passive token regen + redeem hotkey ───────────────────────
  setInterval(() => {
    wallet.tickPassiveRegen();
    globalUI.update();
  }, 1000);

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key !== 'r' && e.key !== 'R') return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (wallet.tokens <= 10) redeemPanel.toggle();
  });

  globalUI.update();

  // ── Game loop ──────────────────────────────────────────────────
  app.ticker.add((ticker) => {
    for (const layer of layers) {
      layer.update(ticker.deltaTime);
    }
    
    if (fsm.current === STATES.RACING) {
      raceManager.update(ticker.elapsedMS, ticker.deltaTime);
    }
  });

  // Initial state
  fsm.transition(STATES.START);

  console.log('[Phase 4] Title Screen & Persistence Ready ✅');
})();
