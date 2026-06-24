// src/game/Animal.js — Phase 2: Animal sprites with animation states
import { AnimatedSprite, Texture, Rectangle } from 'pixi.js';
import {
  ANIM_ROWS,
  SPRITE_FRAME_W,
  SPRITE_FRAME_H,
  ANIMAL_START_X,
  BURST_INTERVAL_MS,
  BURST_DURATION_MS,
  DECEL_RATE,
} from '../constants.js';

export class Animal {
  /**
   * @param {object} config           - One entry from ANIMALS constant
   * @param {PIXI.Texture} sheetTexture - The full spritesheet texture
   * @param {number} laneY            - Y position for this animal's lane
   */
  constructor(config, sheetTexture, laneY) {
    this.id          = config.id;
    this.label       = config.label;
    this.baseSpeed   = config.baseSpeed;
    this.burstChance = config.burstChance;
    this.burstMin    = config.burstMin;
    this.burstMax    = config.burstMax;
    this.winWeight   = config.winWeight;
    this.basePayout  = config.basePayout;

    this.laneY = laneY;

    // ── Build frame arrays per animation state (per-animal frame counts) ──
    this._frames = {};
    for (const [stateName, row] of Object.entries(ANIM_ROWS)) {
      const frameCount = config.animFrames[stateName];
      this._frames[stateName] = Animal.framesFromRow(
        sheetTexture, row, frameCount, SPRITE_FRAME_W, SPRITE_FRAME_H
      );
    }

    // ── Create AnimatedSprite (starts with idle) ────────────────
    this.sprite = new AnimatedSprite(this._frames['idle']);
    this.sprite.animationSpeed = 0.12;
    this.sprite.anchor.set(0.5, 1);  // anchor at bottom center for lane alignment
    this.sprite.x = ANIMAL_START_X;
    this.sprite.y = laneY;
    this.sprite.play();

    // Scale down — 256px sprites are large relative to lane height
    // Will be fine-tuned visually in Phase 2
    this.sprite.scale.set(0.45);

    this._currentState = 'idle';

    // ── Race state ──────────────────────────────────────────────
    this.burstMultiplier  = 1.0;
    this._burstTimer      = 0;
    this._isBursting      = false;
    this._isDecelerating  = false;
    this._isFinished      = false;
    this._currentSpeed    = 0;
  }

  /**
   * Slice a spritesheet row into an array of Textures.
   * @param {PIXI.Texture} baseTexture - The full spritesheet texture
   * @param {number} row               - Row index (0-based)
   * @param {number} frameCount        - Number of frames in this row
   * @param {number} frameW            - Width of each frame in pixels
   * @param {number} frameH            - Height of each frame in pixels
   * @returns {PIXI.Texture[]}
   */
  static framesFromRow(baseTexture, row, frameCount, frameW, frameH) {
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const rect = new Rectangle(i * frameW, row * frameH, frameW, frameH);
      const frame = new Texture({ source: baseTexture.source, frame: rect });
      frames.push(frame);
    }
    return frames;
  }

  /**
   * Switch animation state (idle, run, win, lose).
   * @param {string} stateName
   */
  setState(stateName) {
    if (this._currentState === stateName) return;
    if (!this._frames[stateName]) {
      console.warn(`[Animal] Unknown state "${stateName}" for ${this.id}`);
      return;
    }
    this._currentState = stateName;
    this.sprite.textures = this._frames[stateName];
    this.sprite.gotoAndPlay(0);  // avoid 1-frame flicker (see gotcha #4)
  }

  /**
   * Called every ticker tick during RACING state.
   * @param {number} deltaMS - Milliseconds since last tick
   */
  update(deltaMS) {
    if (this._isFinished) return;

    if (this._isDecelerating) {
      this._decelerate();
      return;
    }

    this._updateBurst(deltaMS);
    this._move(deltaMS);
  }

  /**
   * Burst formula: every BURST_INTERVAL_MS, roll for a speed burst.
   * @param {number} deltaMS
   */
  _updateBurst(deltaMS) {
    this._burstTimer += deltaMS;

    if (this._burstTimer >= BURST_INTERVAL_MS) {
      this._burstTimer = 0;

      if (Math.random() < this.burstChance) {
        // Burst! Random multiplier in [burstMin, burstMax]
        this.burstMultiplier = this.burstMin + Math.random() * (this.burstMax - this.burstMin);
      } else {
        // Normal speed
        this.burstMultiplier = 1.0;
      }
    }
  }

  /**
   * Per-frame position update.
   * position.x += baseSpeed × burstMultiplier × (deltaMS / 16.67)
   * @param {number} deltaMS
   */
  _move(deltaMS) {
    const normalizedDelta = deltaMS / 16.67;  // normalize to 60fps
    this._currentSpeed = this.baseSpeed * this.burstMultiplier;
    this.sprite.x += this._currentSpeed * normalizedDelta;
  }

  /**
   * Apply winner nudge — a small invisible boost for the pre-determined winner.
   * @param {number} deltaMS
   */
  moveWithNudge(deltaMS) {
    const normalizedDelta = deltaMS / 16.67;
    this._currentSpeed = this.baseSpeed * this.burstMultiplier + 0.15;
    this.sprite.x += this._currentSpeed * normalizedDelta;
  }

  /** Triggered when this animal is the winner */
  triggerWin() {
    this._isFinished = true;
    this._isDecelerating = false;
    this.setState('win');
  }

  /** Triggered for all non-winners */
  triggerDecelerate() {
    this._isDecelerating = true;
    this._currentSpeed = this.baseSpeed * this.burstMultiplier;
  }

  /** Gradually slow down non-winners */
  _decelerate() {
    this._currentSpeed *= DECEL_RATE;
    this.sprite.x += this._currentSpeed;

    // Once effectively stopped, switch to lose animation
    if (this._currentSpeed < 0.1) {
      this._currentSpeed = 0;
      this._isDecelerating = false;
      this._isFinished = true;
      this.setState('lose');
    }
  }

  /** Reset animal to starting position for a new race */
  reset() {
    this.sprite.x = ANIMAL_START_X;
    this.burstMultiplier = 1.0;
    this._burstTimer = 0;
    this._isBursting = false;
    this._isDecelerating = false;
    this._isFinished = false;
    this._currentSpeed = 0;
    this.setState('idle');
  }
}
