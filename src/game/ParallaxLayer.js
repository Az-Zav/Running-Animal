// src/game/ParallaxLayer.js
import { TilingSprite } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, PARALLAX_BASE_SPEED } from '../constants.js';

export class ParallaxLayer {
  /**
   * @param {PIXI.Texture} texture     - The background texture
   * @param {number} speedModifier     - Multiplier for scroll speed (lower = slower = further back)
   */
  constructor(texture, speedModifier) {
    this.speedModifier = speedModifier;
    this._paused = false;

    // Create a TilingSprite that fills the entire game canvas
    this.sprite = new TilingSprite({
      texture: texture,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    });
  }

  /**
   * Called every ticker tick. Scrolls the tile position leftward.
   * @param {number} delta - deltaTime from PixiJS ticker (frame-normalized)
   */
  update(delta) {
    if (this._paused) return;
    const speed = PARALLAX_BASE_SPEED * this.speedModifier * delta;
    this.sprite.tilePosition.x -= speed;
  }

  /** Pause scrolling (used during BETTING and RESULTS states) */
  pause() {
    this._paused = true;
  }

  /** Resume scrolling (used during RACING state) */
  resume() {
    this._paused = false;
  }

  /** @returns {boolean} Whether the layer is currently paused */
  get isPaused() {
    return this._paused;
  }
}
