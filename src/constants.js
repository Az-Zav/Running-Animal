// src/constants.js — Single source of truth
// All values verified from Phase 0 analysis of existing codebase

// ── Canvas Resolution ──────────────────────────────────────────────
// Matches existing code: 1920×1080 (full HD, same as asset dimensions)
export const GAME_WIDTH  = 1920;
export const GAME_HEIGHT = 1080;

// ── Game States ────────────────────────────────────────────────────
export const STATES = {
  START   : 'START',
  BETTING : 'BETTING',
  RACING  : 'RACING',
  RESULTS : 'RESULTS',
};

// ── Animal Configs ─────────────────────────────────────────────────
// Order = lane order top → bottom
export const ANIMALS = [
  { id: 'rabbit', label: 'Rabbit', baseSpeed: 2.8, burstChance: 0.55, burstMin: 1.2, burstMax: 1.8,  winWeight: 35, basePayout: 1.5, animFrames: { idle: 2, run: 8, win: 4, lose: 2 } },
  { id: 'monkey', label: 'Monkey', baseSpeed: 2.5, burstChance: 0.50, burstMin: 1.3, burstMax: 2.0,  winWeight: 25, basePayout: 2.0, animFrames: { idle: 2, run: 4, win: 4, lose: 2 } },
  { id: 'panda',  label: 'Panda',  baseSpeed: 2.2, burstChance: 0.45, burstMin: 1.4, burstMax: 2.2,  winWeight: 20, basePayout: 2.5, animFrames: { idle: 2, run: 6, win: 4, lose: 2 } },
  { id: 'hippo',  label: 'Hippo',  baseSpeed: 2.0, burstChance: 0.40, burstMin: 1.5, burstMax: 2.5,  winWeight: 13, basePayout: 3.5, animFrames: { idle: 2, run: 7, win: 4, lose: 2 } },
  { id: 'lion',   label: 'Lion',   baseSpeed: 1.8, burstChance: 0.35, burstMin: 1.8, burstMax: 3.2,  winWeight: 7,  basePayout: 6.0, animFrames: { idle: 2, run: 7, win: 4, lose: 2 } },
];

export const PORTRAITS = [
  { id: 'rabbit_port', animalId: 'rabbit', file: 'Rabbit_Portrait.png' },
  { id: 'monkey_port', animalId: 'monkey', file: 'Monkey_Portrait.png' },
  { id: 'panda_port',  animalId: 'panda',  file: 'Panda_Portrait.png' },
  { id: 'hippo_port',  animalId: 'hippo',  file: 'Hippo_Portrait.png' },
  { id: 'lion_port',   animalId: 'lion',   file: 'Lion_Portrait.png' },
];

// ── Animation Row Mapping ──────────────────────────────────────────
// Row index in the spritesheet for each animation state
// Frame counts differ per animal — stored in ANIMALS[].animFrames
export const ANIM_ROWS = {
  idle: 0,
  run:  1,
  win:  2,
  lose: 3,
};

// ── Sprite Dimensions ──────────────────────────────────────────────
export const SPRITE_FRAME_W = 256;
export const SPRITE_FRAME_H = 256;

// ── Lane Positions ─────────────────────────────────────────────────
// Track.png: track area starts ~490px from top, 5 lanes separated by white lines
// Each lane is ~90px tall. Y values target the center of each lane.
// Fine-tuned to align animals within track lanes (anchor bottom-center)
export const LANE_Y_POSITIONS = [580, 670, 760, 850, 940];

// ── Race Mechanics ─────────────────────────────────────────────────
export const RACE_DURATION_MS = 10000;  // Exact 10-second race duration
export const FINISH_LINE_X    = 1800;  // near right edge of 1920 canvas
export const ANIMAL_START_X   = 50;    // left side of track

export const BURST_INTERVAL_MS = 800;
export const BURST_DURATION_MS = 400;
export const DECEL_RATE        = 0.97;

// ── Wallet ─────────────────────────────────────────────────────────
export const WALLET_KEY     = 'gbRace_wallet';
export const WALLET_START   = 50;
export const MAX_BET_TOKENS = 20;

/** Passive regen: 1 token per minute while below this count (wins may exceed). */
export const PASSIVE_REGEN_CAP = 10;
export const PASSIVE_REGEN_INTERVAL_MS = 60_000;

/** Hidden redeem: sequential cycle, 25 tokens each, persisted index. */
export const REDEEM_CODE_CYCLE = ['RUNANIMALS', 'RAWRLION', 'STILLYOU'];
export const REDEEM_CODE_REWARD = 25;

// ── Parallax Layer Speeds ──────────────────────────────────────────
// From existing code: gameSpeed=5, modifiers: Sky=0.5, Mountains=1, Track=1.5, Fence=1.5
export const PARALLAX_BASE_SPEED = 5;
export const PARALLAX_LAYERS = [
  { key: 'sky',       file: 'Sky.png',       speedMod: 0.5 },
  { key: 'mountains', file: 'Mountains.png', speedMod: 1.0 },
  { key: 'track',     file: 'Track.png',     speedMod: 1.5 },
  { key: 'fence',     file: 'Fence.png',     speedMod: 1.5 },
];
