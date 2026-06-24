# Implementation Plan: Pokémon-Style Race Betting Game
> **Stack:** Vite + PixiJS | **Resolution:** 512×288 (16-bit / GameBoy aesthetic) | **Deployment:** Vercel  
> **Agent Instructions:** Treat every `- [ ]` item as an atomic task. **Complete phases in strict order. Do not skip ahead. Phase 0 (Analysis) is mandatory and must be completed in full before writing a single line of new code.**

---

## ⚠️ AGENT — READ THIS FIRST: MANDATORY ANALYSIS PROTOCOL

**Do not begin implementation until you have completed all steps in Phase 0.**

The plan below contains assumed values for canvas dimensions, lane positions, sprite frame sizes, and animation state structure. These are intentional placeholders derived from a design brief — they are **not ground truth**. Your job before touching any code is to audit the actual project files and replace every assumption with what you observe.

After completing Phase 0, you must **pause and report your findings** in the following format before proceeding to Phase 1:

```
=== ANALYSIS REPORT ===

1. CANVAS / RENDERER
   - Detected game resolution: ?
   - PixiJS version: ?
   - How the canvas is scaled to viewport: ?

2. BACKGROUND LAYERS
   - Asset filenames and paths: ?
   - Actual image dimensions (w × h): ?
   - How ParallaxLayer.js currently tiles/scrolls them: ?
   - TilingSprite vs Sprite: ?
   - Scroll speed values currently in use: ?

3. SPRITESHEET STRUCTURE (per animal)
   - Frame dimensions (w × h): ?
   - Number of rows and what each row represents: ?
   - Number of columns (frames per row): ?
   - How the existing animation system slices frames: ?

4. ANIMATION STATE SYSTEM
   - File(s) that define animation states: ?
   - Structure of the animation config objects: ?
   - How states are switched at runtime (method name / event): ?
   - Which states currently exist (e.g. walk, idle, victory): ?

5. LANE SYSTEM
   - Are lanes currently defined? Where?: ?
   - Current Y positions or how they are calculated: ?
   - How many lanes are active: ?

6. DEVIATIONS FROM PLAN
   - List every section of this plan that needs adjustment based on your findings.
   - For each deviation, state: PLAN ASSUMED → ACTUAL OBSERVED → PROPOSED FIX

7. AGENT'S IMPLEMENTATION TAKE
   - Summarize your own reading of how the new systems (RaceManager, BettingUI,
     GameStateMachine) should integrate with the existing code given what you found.
   - Flag any risks or ambiguities before you start.
   - Explicitly confirm: "I am ready to proceed to Phase 1" only after this report
     has been reviewed or you have been told to continue.
=== END REPORT ===
```

**Wait for confirmation (or an explicit "proceed" instruction) before starting Phase 1.**

---

## 0. Project Context & Assumptions

> These are **design-brief defaults**, not observed values. Phase 0 will replace them.

| Item | Detail |
|------|--------|
| Internal resolution | 512 × 288 px (scaled up via CSS to fill viewport) |
| Animals | Monkey, Panda, Lion, Rabbit, Hippo (5 lanes, all race simultaneously) |
| Spritesheet format | Single PNG per animal, rows = animation states (walk, idle, victory) |
| Existing assets | Parallax layers (Sky, Hills, Fence, Track), all 5 animal spritesheets |
| Existing code | Parallax scrolling system, PixiJS AnimatedSprite walk animations |
| Wallet | localStorage, starts at 100 tokens |
| Betting input | +/− buttons per animal, 1 token per increment |
| Payout model | Dynamic odds per animal (see Section 6) |
| Finish event | Animals decelerate → winner plays victory anim → RESULTS screen |

---

## 1. Directory Structure

```
/
├── public/
│   └── assets/
│       ├── backgrounds/
│       │   ├── sky.png          # 1024px wide, 288px tall (2× tile for seamless scroll)
│       │   ├── hills.png        # 1024px wide, 288px tall
│       │   ├── fence.png        # 1024px wide, 288px tall
│       │   └── track.png        # 512px wide, 288px tall (static or slow scroll)
│       ├── sprites/
│       │   ├── monkey.png       # Spritesheet — rows: walk, idle, victory
│       │   ├── panda.png
│       │   ├── lion.png
│       │   ├── rabbit.png
│       │   └── hippo.png
│       └── ui/
│           ├── font_gameboy.png # BitmapFont texture (optional)
│           └── cursor.png       # GameBoy-style arrow cursor
├── src/
│   ├── main.js                  # Vite entry — boots PixiJS app
│   ├── constants.js             # All magic numbers in one place
│   ├── game/
│   │   ├── AssetLoader.js
│   │   ├── GameStateMachine.js
│   │   ├── RaceManager.js
│   │   ├── Animal.js
│   │   └── ParallaxLayer.js     # Already exists — extend, do not rewrite
│   ├── ui/
│   │   ├── BettingUI.js
│   │   ├── HUD.js               # Token wallet display, race countdown
│   │   └── ResultsScreen.js
│   └── utils/
│       └── WalletManager.js     # localStorage read/write
├── index.html
├── vite.config.js
└── vercel.json
```

---

## 2. Asset Specifications

> ✅ **Confirmed by project owner — do not override these during Phase 0 analysis:**

| Asset | Width | Height | Notes |
|-------|-------|--------|-------|
| sky.png | 1920px | 1080px | Tiles horizontally; scroll speed TBD from Phase 0 |
| hills.png | 1920px | 1080px | Scroll speed TBD from Phase 0 |
| fence.png | 1920px | 1080px | Scroll speed TBD from Phase 0 |
| track.png | 1920px | 1080px | Contains 5 lane markers; verify lane Y positions during Phase 0 |
| Animal spritesheets | 256px × 256px per frame | — | Confirmed frame size; row-per-state structure — verify row count + frame count per row during Phase 0 |

**Spritesheet row convention — verify against existing animation config objects in Phase 0:**
```
Row 0 → walk     (frame count: confirm from existing anim state objects)
Row 1 → idle     (frame count: confirm from existing anim state objects)
Row 2 → victory  (frame count: confirm from existing anim state objects)
```

> **Agent note:** The existing codebase already has animation state config objects that define frame ranges per state. **Read and reuse that structure — do not invent a new one.** Document the exact object shape in your Phase 0 report.

---

## 3. `constants.js` — Single Source of Truth

> **Agent note:** Values marked `⚠️ VERIFY` are placeholders derived from the design brief. Replace them with observed values from your Phase 0 analysis before creating this file. Values marked `✅ CONFIRMED` are locked by the project owner.

```js
// src/constants.js

// ⚠️ VERIFY — set after Phase 0 confirms how the canvas is scaled
export const GAME_WIDTH  = 512;   // internal render resolution
export const GAME_HEIGHT = 288;

export const STATES = {           // ✅ CONFIRMED
  BETTING : 'BETTING',
  RACING  : 'RACING',
  RESULTS : 'RESULTS',
};

export const ANIMALS = [          // ✅ CONFIRMED — order = lane order top→bottom
  { id: 'rabbit', label: 'Rabbit', baseSpeed: 2.8, burstChance: 0.55, burstMin: 1.2, burstMax: 1.8,  winWeight: 35, basePayout: 1.5 },
  { id: 'monkey', label: 'Monkey', baseSpeed: 2.5, burstChance: 0.50, burstMin: 1.3, burstMax: 2.0,  winWeight: 25, basePayout: 2.0 },
  { id: 'panda',  label: 'Panda',  baseSpeed: 2.2, burstChance: 0.45, burstMin: 1.4, burstMax: 2.2,  winWeight: 20, basePayout: 2.5 },
  { id: 'hippo',  label: 'Hippo',  baseSpeed: 2.0, burstChance: 0.40, burstMin: 1.5, burstMax: 2.5,  winWeight: 13, basePayout: 3.5 },
  { id: 'lion',   label: 'Lion',   baseSpeed: 1.8, burstChance: 0.35, burstMin: 1.8, burstMax: 3.2,  winWeight: 7,  basePayout: 6.0 },
];

// ⚠️ VERIFY — derive from actual track.png lane markers and canvas scale
// Background assets are 1920×1080; sprites are 256×256 per frame.
// These Y values must map correctly once you know the canvas→screen scale factor.
export const LANE_Y_POSITIONS = [52, 96, 140, 184, 228]; // PLACEHOLDER — recalculate in Phase 0

// ⚠️ VERIFY — recalculate based on actual canvas width after Phase 0
export const FINISH_LINE_X  = 460;   // PLACEHOLDER
export const ANIMAL_START_X = 24;    // PLACEHOLDER

// ✅ CONFIRMED — game mechanic values
export const BURST_INTERVAL_MS  = 800;
export const BURST_DURATION_MS  = 400;
export const DECEL_RATE         = 0.97;

export const WALLET_KEY     = 'gbRace_wallet';  // ✅
export const WALLET_START   = 100;              // ✅
export const MAX_BET_TOKENS = 20;               // ✅

// ⚠️ VERIFY — confirm actual frame dimensions from spritesheet during Phase 0
export const SPRITE_FRAME_W = 256;  // confirmed by project owner
export const SPRITE_FRAME_H = 256;  // confirmed by project owner
```

---

## 4. Module Definitions & Class Skeletons

### 4.1 `AssetLoader.js`

```js
// src/game/AssetLoader.js
import { Assets } from 'pixi.js';
import { ANIMALS } from '../constants.js';

export class AssetLoader {
  /**
   * Loads all textures into the PixiJS asset cache.
   * Call once before creating the PixiJS Application.
   * @returns {Promise<void>}
   */
  static async loadAll() { }

  /**
   * Returns a texture by key from the cache.
   * @param {string} key
   * @returns {PIXI.Texture}
   */
  static get(key) { }

  /**
   * Builds a manifest array for PIXI.Assets.load().
   * Keys: 'sky', 'hills', 'fence', 'track', 'rabbit', 'monkey', etc.
   * @returns {Array<{alias: string, src: string}>}
   */
  static _buildManifest() { }
}
```

**Checklist:**
- [ ] Define manifest with all background + sprite keys
- [ ] Call `Assets.load(manifest)` and await
- [ ] Export singleton cache via `AssetLoader.get(key)`
- [ ] Add error boundary: throw descriptive error if asset 404s

---

### 4.2 `ParallaxLayer.js` (extend existing — do NOT rewrite)

> **Agent note:** Before touching this file, read it fully in Phase 0. Document the current scroll method, speed values, and whether it uses `TilingSprite` or a double-sprite trick. Background layers are **1920×1080** — confirm the tiling strategy handles this correctly at the internal canvas resolution.

```js
// src/game/ParallaxLayer.js  — extend your existing implementation
import { TilingSprite } from 'pixi.js';

export class ParallaxLayer {
  /**
   * @param {PIXI.Texture} texture
   * @param {number} scrollSpeed   — pixels per frame
   * @param {number} y             — vertical position
   */
  constructor(texture, scrollSpeed, y) { }

  /** Call every ticker tick. Increments tilePosition.x. */
  update(delta) { }

  /** Pause scroll (used during BETTING and RESULTS states) */
  pause() { }

  /** Resume scroll */
  resume() { }
}
```

**Checklist:**
- [ ] **Phase 0 first:** Read existing `ParallaxLayer.js` and document its full API in your report
- [ ] Confirm existing implementation uses `TilingSprite` (required for seamless tiling of 1920px-wide assets)
- [ ] Add `pause()` / `resume()` only if not already present — do not duplicate existing methods
- [ ] Verify scroll stops in BETTING state and resumes in RACING

---

### 4.3 `Animal.js`

> **Agent note:** The existing codebase already defines animation state objects (e.g. structs with frame start/end indices or texture arrays per state). **Read that system in Phase 0 before writing this class.** `Animal.js` must consume whatever shape those objects already are — do not invent a parallel system. The `framesFromRow()` helper should use `SPRITE_FRAME_W = 256` and `SPRITE_FRAME_H = 256` confirmed by the project owner.

```js
// src/game/Animal.js
import { AnimatedSprite, Texture } from 'pixi.js';
import { BURST_INTERVAL_MS, BURST_DURATION_MS, DECEL_RATE } from '../constants.js';

export class Animal {
  /**
   * @param {object} config        — one entry from ANIMALS constant
   * @param {PIXI.Texture[]} walkFrames
   * @param {PIXI.Texture[]} idleFrames
   * @param {PIXI.Texture[]} victoryFrames
   * @param {number} laneY
   */
  constructor(config, walkFrames, idleFrames, victoryFrames, laneY) {
    this.id          = config.id;
    this.baseSpeed   = config.baseSpeed;
    this.burstChance = config.burstChance;
    this.burstMin    = config.burstMin;
    this.burstMax    = config.burstMax;
    this.x           = ANIMAL_START_X;
    this.burstMultiplier = 1.0;
    this._burstTimer = 0;
    this._isBursting = false;
    this._isDecelerating = false;
    this._isFinished = false;
    // sprite setup...
  }

  /** Slice spritesheet row into array of Textures */
  static framesFromRow(baseTexture, row, frameCount, frameW, frameH) { }

  /** Called every ticker tick during RACING state */
  update(deltaMS) {
    if (this._isFinished) return;
    if (this._isDecelerating) { this._decelerate(); return; }
    this._updateBurst(deltaMS);
    this._move();
  }

  /**
   * Burst formula:
   *   position += baseSpeed × burstMultiplier
   *   burstMultiplier recalculated every BURST_INTERVAL_MS:
   *     if (Math.random() < burstChance)  → multiplier = rand(burstMin, burstMax)
   *     else                              → multiplier = 1.0  (normal speed)
   */
  _move() { }
  _updateBurst(deltaMS) { }

  /** Triggered when this animal crosses FINISH_LINE_X */
  triggerWin() {
    this._isFinished     = true;
    this._isDecelerating = false;
    // swap to victory animation
  }

  /** Triggered for all non-winners */
  triggerDecelerate() {
    this._isDecelerating = true;
  }

  reset() { /* restore x, multiplier, stop victory anim */ }
}
```

**Checklist:**
- [ ] Implement `framesFromRow()` using `Texture.from()` with rect cropping
- [ ] Implement `_updateBurst()` using `BURST_INTERVAL_MS` timer
- [ ] Implement `_move()` — add `baseSpeed × burstMultiplier` to `this.x` each frame
- [ ] Swap `AnimatedSprite.textures` on state change (walk ↔ idle ↔ victory)
- [ ] Implement `_decelerate()` — multiply current speed by `DECEL_RATE` per frame until near-zero

---

### 4.4 `RaceManager.js`

```js
// src/game/RaceManager.js
import { ANIMALS, FINISH_LINE_X } from '../constants.js';

export class RaceManager {
  constructor(animals /* Animal[] */, onRaceEnd /* callback(winnerId) */) { }

  /** Begin race: resume parallax, start animal updates, start finish-line polling */
  startRace() { }

  /**
   * Called every ticker tick during RACING state.
   * Updates all animals, checks finish line.
   * @param {number} deltaMS
   */
  update(deltaMS) { }

  /**
   * Weighted-random winner selection.
   * Uses winWeight from ANIMALS config (rabbit=35, ..., lion=7).
   * Called ONCE at race start to pre-determine winner — avoids mid-race manipulation.
   * @returns {string} winnerId
   */
  _pickWinner() { }

  /**
   * When pre-determined winner crosses FINISH_LINE_X:
   *   1. Call winner.triggerWin()
   *   2. Call triggerDecelerate() on all others
   *   3. After DECEL_DURATION_MS, call onRaceEnd(winnerId)
   */
  _handleFinish(winnerId) { }

  /** Resets all Animal positions for a new race */
  reset() { }
}
```

**Checklist:**
- [ ] Pre-determine winner at `startRace()` via `_pickWinner()`
- [ ] In `update()`, only check finish for the pre-determined winner (prevents ties)
- [ ] Non-winners decelerate but never reach finish line (cap their x at `FINISH_LINE_X - 10`)
- [ ] Fire `onRaceEnd` callback after winner victory anim plays (~1.5s delay)

---

### 4.5 `GameStateMachine.js`

```js
// src/game/GameStateMachine.js
import { STATES } from '../constants.js';

export class GameStateMachine {
  constructor() {
    this.current = STATES.BETTING;
    this._listeners = {};
  }

  transition(newState) {
    const prev = this.current;
    this.current = newState;
    this._emit(newState, prev);
  }

  on(state, fn)  { /* register listener */ }
  _emit(s, prev) { /* call registered listeners */ }
}
```

**State Transition Map:**
```
BETTING ──[startRace()]──► RACING ──[onRaceEnd()]──► RESULTS ──[playAgain()]──► BETTING
```

**Per-state responsibilities:**

| State | Parallax | Animals | UI Visible |
|-------|----------|---------|------------|
| BETTING | paused | idle anim, start X | BettingUI |
| RACING | scrolling | walk + burst | HUD (wallet, progress) |
| RESULTS | paused | winner victory anim | ResultsScreen |

**Checklist:**
- [ ] On → BETTING: reset all animals, show BettingUI, pause parallax
- [ ] On → RACING: hide BettingUI, start parallax, call `RaceManager.startRace()`
- [ ] On → RESULTS: pause parallax, show ResultsScreen with win/loss breakdown

---

### 4.6 `WalletManager.js`

```js
// src/utils/WalletManager.js
import { WALLET_KEY, WALLET_START } from '../constants.js';

export class WalletManager {
  static getBalance()              { return parseInt(localStorage.getItem(WALLET_KEY) ?? WALLET_START); }
  static setBalance(n)             { localStorage.setItem(WALLET_KEY, n); }
  static deduct(amount)            { this.setBalance(this.getBalance() - amount); }
  static credit(amount)            { this.setBalance(this.getBalance() + amount); }
  static reset()                   { this.setBalance(WALLET_START); }
}
```

**Checklist:**
- [ ] Initialize wallet on first load if key absent
- [ ] Guard: prevent bet if `totalBet > getBalance()`
- [ ] Guard: prevent negative balance

---

### 4.7 `BettingUI.js`

```js
// src/ui/BettingUI.js
// GameBoy minimal overlay: no borders, pixel font, cursor-based nav
export class BettingUI {
  /**
   * Renders 5 rows (one per animal):
   *   [Animal Name]   [-] [bet amount] [+]   Odds: Nx
   *
   * Plus: [RACE] button at bottom, wallet display top-right
   */
  constructor(container /* PIXI.Container */, wallet /* WalletManager */, onRaceStart) { }

  /** Re-render odds labels based on current bet distribution */
  updateOdds(bets /* {id: tokenCount} */) { }

  /** Called by +/- buttons. Clamps to [0, MAX_BET_TOKENS] and wallet balance */
  adjustBet(animalId, delta) { }

  show() { }
  hide() { }
}
```

**UI Layout (512×288 canvas):**
```
┌─────────────────────────────────────────┐
│  WALLET: 100 ◆          PLACE YOUR BETS │
│  ─────────────────────────────────────  │
│  Rabbit  [-] 0 [+]          Odds: 1.5x  │
│  Monkey  [-] 0 [+]          Odds: 2.0x  │
│  Panda   [-] 0 [+]          Odds: 2.5x  │
│  Hippo   [-] 0 [+]          Odds: 3.5x  │
│  Lion    [-] 0 [+]          Odds: 6.0x  │
│                                          │
│              [ START RACE ]              │
└─────────────────────────────────────────┘
```

**Checklist:**
- [ ] Use PixiJS `BitmapText` or `Text` with a pixel/monospace font
- [ ] +/− buttons: `PIXI.Graphics` rectangle + pointer event listener
- [ ] Disable START RACE if total bets = 0
- [ ] Odds update dynamically as bets are placed (see Section 6)

---

### 4.8 `ResultsScreen.js`

```js
// src/ui/ResultsScreen.js
export class ResultsScreen {
  /**
   * @param {string} winnerId
   * @param {{ [animalId]: number }} bets     — tokens bet per animal
   * @param {number} payout                   — total tokens won (0 if loss)
   * @param {number} newBalance
   * @param {Function} onPlayAgain
   */
  show(winnerId, bets, payout, newBalance, onPlayAgain) { }
  hide() { }
}
```

**Layout:**
```
  [WINNER: LION!]
  You bet: 3 on Lion
  Payout:  18 tokens  (6.0x)
  Balance: 115 ◆
  [ PLAY AGAIN ]
```

**Checklist:**
- [ ] Display winner animal name + highlight its lane
- [ ] Show payout calculation breakdown
- [ ] "Play Again" button triggers `GameStateMachine.transition(STATES.BETTING)`
- [ ] If balance = 0, show "Out of tokens!" with auto-reset button (`WalletManager.reset()`)

---

## 5. Burst Movement Formula

### Mathematical Definition

```
Every BURST_INTERVAL_MS milliseconds, for each animal:

  roll = Math.random()

  if (roll < burstChance):
    burstMultiplier = burstMin + Math.random() × (burstMax - burstMin)
    // animal accelerates
  else:
    burstMultiplier = 1.0
    // animal runs at base speed

Per-frame position update:
  position.x += baseSpeed × burstMultiplier × (deltaMS / 16.67)
                                              └─ normalize to 60fps
```

### Animal Speed Profile

| Animal | baseSpeed | burstChance | burstMin | burstMax | Effective feel |
|--------|-----------|-------------|----------|----------|----------------|
| Rabbit | 2.8 | 55% | 1.2× | 1.8× | Fast, consistent |
| Monkey | 2.5 | 50% | 1.3× | 2.0× | Fast, moderate bursts |
| Panda  | 2.2 | 45% | 1.4× | 2.2× | Medium, decent bursts |
| Hippo  | 2.0 | 40% | 1.5× | 2.5× | Slow, big bursts |
| Lion   | 1.8 | 35% | 1.8× | 3.2× | Slow, rare explosive bursts |

> **Note:** Winner is pre-determined via weighted random at race start. Speed values create *visual plausibility* — the pre-determined winner receives a slight invisible boost in `_move()` to guarantee it crosses first despite RNG variance.

### Winner Nudge (invisible correction)

```js
// In Animal._move(), if this.id === raceManager.predeterminedWinnerId:
const nudge = this._isFinished ? 0 : 0.15;
this.x += (this.baseSpeed * this.burstMultiplier + nudge) * normalizedDelta;
```

---

## 6. Dynamic Odds System

Odds are calculated live based on total tokens wagered per animal:

```js
// For each animal:
totalPool   = sum of all bets across all animals
animalShare = bets[animal.id] / totalPool  (0 if no bets yet)

// If no bets placed on animal, display basePayout from constants
displayOdds = animalShare > 0
  ? clamp(totalPool / bets[animal.id], animal.basePayout, animal.basePayout * 3)
  : animal.basePayout

// Payout on win:
winnings = bets[winnerId] * displayOdds   (floor to integer)
```

**Checklist:**
- [ ] Recalculate and re-render odds in `BettingUI.updateOdds()` on every +/− press
- [ ] Cap max odds at `basePayout × 3` to prevent exploit
- [ ] Minimum odds = `basePayout` (floor, never below base)

---

## 7. Phase Breakdown

### Phase 0 — MANDATORY ANALYSIS (complete before any implementation)

> **Do not write or modify any code during this phase. Read only.**

**Codebase audit:**
- [ ] List every file in `src/` and `public/assets/` — record full paths and file sizes
- [ ] Open and read `main.js` (or equivalent entry point) — document how PixiJS app is initialized, canvas dimensions set, and how the game loop runs
- [ ] Open and read `ParallaxLayer.js` (or equivalent) — document scroll method, speed values, layer count, and TilingSprite vs Sprite usage
- [ ] Open and read all sprite/animation-related files — document the exact shape of the animation state config objects (property names, value types, how frame ranges are stored)
- [ ] Open and read all 5 animal spritesheet PNGs — confirm 256×256 frame size, count total rows and columns per sheet, map each row to its animation state
- [ ] Open and read all 4 background layer PNGs — confirm 1920×1080 dimensions; note if any differ
- [ ] Check if a `constants.js` or equivalent config file already exists — if so, read and list all current values
- [ ] Check if lane positions are defined anywhere — if so, document exact values and coordinate system used
- [ ] Check PixiJS version in `package.json` — note v7 vs v8 API differences if relevant

**Report:**
- [ ] Write the full `=== ANALYSIS REPORT ===` block as defined at the top of this document
- [ ] For every `⚠️ VERIFY` value in Section 3 (`constants.js`), provide the corrected value
- [ ] List every section of this plan that needs adjustment based on findings
- [ ] State your own read on how the new systems integrate with existing code
- [ ] **Explicitly write: "I am ready to proceed to Phase 1" — then wait for confirmation**

---

### Phase 1 — Foundation (scaffolding, no new game logic)
- [ ] Confirm PixiJS app boots in Vite dev server — verify canvas resolution matches Phase 0 findings
- [ ] Confirm parallax layers scroll correctly with existing `ParallaxLayer` code at 1920×1080 asset dimensions
- [ ] Confirm all 5 animal walk animations play via `AnimatedSprite` using the existing anim state objects
- [ ] Add `pause()` / `resume()` to `ParallaxLayer` only if missing
- [ ] Create `constants.js` using **Phase 0 verified values** — not the placeholders from Section 3
- [ ] Create `WalletManager.js` with localStorage logic
- [ ] Create `AssetLoader.js`; migrate asset loading from `main.js` into it

### Phase 2 — Animal & Race Logic
- [ ] Implement `Animal.js` fully (burst, decel, win anim, reset)
- [ ] Implement `RaceManager.js` (pre-determined winner, finish detection, callbacks)
- [ ] Unit-test burst formula manually: log `position.x` each frame for 5s race
- [ ] Verify all 5 animals decelerate correctly after winner crosses finish
- [ ] Verify winner plays victory animation, others stop at lane positions

### Phase 3 — State Machine
- [ ] Implement `GameStateMachine.js`
- [ ] Wire state transitions in `main.js`
- [ ] Confirm parallax pauses/resumes on state change
- [ ] Confirm animals reset to start positions on BETTING state

### Phase 4 — Betting UI
- [ ] Implement `BettingUI.js` with 5-row layout
- [ ] Wire +/− buttons to `adjustBet()` and `WalletManager`
- [ ] Implement live odds recalculation
- [ ] Implement START RACE button → `GameStateMachine.transition(STATES.RACING)`
- [ ] Implement `HUD.js`: wallet balance visible during race

### Phase 5 — Results & Polish
- [ ] Implement `ResultsScreen.js`
- [ ] Wire payout calculation on race end
- [ ] Implement "Play Again" flow
- [ ] Implement zero-balance reset flow
- [ ] Add `vercel.json` (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`)
- [ ] Production build: `vite build` → confirm no asset 404s
- [ ] Deploy to Vercel

---

## 8. `main.js` Boot Sequence

```js
// src/main.js
import { Application }      from 'pixi.js';
import { AssetLoader }      from './game/AssetLoader.js';
import { GameStateMachine } from './game/GameStateMachine.js';
import { RaceManager }      from './game/RaceManager.js';
import { Animal }           from './game/Animal.js';
import { ParallaxLayer }    from './game/ParallaxLayer.js';
import { BettingUI }        from './ui/BettingUI.js';
import { ResultsScreen }    from './ui/ResultsScreen.js';
import { WalletManager }    from './utils/WalletManager.js';
import { GAME_WIDTH, GAME_HEIGHT, STATES, ANIMALS, LANE_Y_POSITIONS } from './constants.js';

(async () => {
  const app = new Application();
  await app.init({ width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: 0x9bbc0f });
  document.body.appendChild(app.canvas);
  // CSS: scale canvas to fill viewport maintaining aspect ratio

  await AssetLoader.loadAll();

  // 1. Build parallax layers (existing code, wrapped)
  const layers = buildParallaxLayers(app);

  // 2. Build animals
  const animals = ANIMALS.map((cfg, i) =>
    new Animal(cfg, /* frames from spritesheet */, LANE_Y_POSITIONS[i])
  );
  animals.forEach(a => app.stage.addChild(a.sprite));

  // 3. State machine
  const fsm = new GameStateMachine();
  const wallet = WalletManager;

  const bettingUI   = new BettingUI(app.stage, wallet, () => fsm.transition(STATES.RACING));
  const resultsUI   = new ResultsScreen(app.stage);
  const raceManager = new RaceManager(animals, (winnerId) => {
    const payout = calculatePayout(winnerId, currentBets);
    wallet.credit(payout);
    fsm.transition(STATES.RESULTS);
    resultsUI.show(winnerId, currentBets, payout, wallet.getBalance(), () => fsm.transition(STATES.BETTING));
  });

  fsm.on(STATES.BETTING, () => { layers.forEach(l => l.pause()); bettingUI.show(); resultsUI.hide(); raceManager.reset(); });
  fsm.on(STATES.RACING,  () => { layers.forEach(l => l.resume()); bettingUI.hide(); wallet.deduct(totalBets(currentBets)); raceManager.startRace(); });
  fsm.on(STATES.RESULTS, () => { layers.forEach(l => l.pause()); });

  fsm.transition(STATES.BETTING); // initial state

  app.ticker.add((ticker) => {
    layers.forEach(l => l.update(ticker.deltaMS));
    if (fsm.current === STATES.RACING) raceManager.update(ticker.deltaMS);
  });
})();
```

---

## 9. `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

---

## 10. Known Gotchas & Agent Notes

| # | Issue | Resolution |
|---|-------|------------|
| 1 | PixiJS v8 `Application.init()` is async | Always `await app.init(...)` before any stage access |
| 2 | 1920×1080 background assets in a sub-1080p canvas | `TilingSprite` will scale the texture — confirm `tileScale` is set to match canvas→asset ratio, or pre-scale textures |
| 3 | 256×256 sprite frames may appear too large at small canvas resolutions | Set `sprite.scale` after Phase 0 confirms the canvas resolution and lane height |
| 4 | `AnimatedSprite.textures` swap causes 1-frame flicker | Call `sprite.gotoAndPlay(0)` after texture swap |
| 5 | `localStorage` unavailable in some iframe contexts | Wrap in try/catch, fall back to in-memory wallet |
| 6 | Burst RNG can cause non-winner to lead visually | Apply winner nudge (Section 5) + cap non-winner at `FINISH_LINE_X - 10` |
| 7 | Existing animation state objects may use a different API than assumed | Phase 0 must document exact shape — `Animal.js` must consume it as-is |
| 8 | 5 lanes must align with track.png lane art | Derive `LANE_Y_POSITIONS` from track asset geometry, not arithmetic |
| 9 | Vercel SPA routing | `vercel.json` rewrite rule (Section 9) required |
