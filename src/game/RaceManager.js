// src/game/RaceManager.js
import { Graphics, AnimatedSprite, Text, TextStyle } from 'pixi.js';
import {
  ANIMALS,
  FINISH_LINE_X,
  ANIMAL_START_X,
  RACE_DURATION_MS,
  PARALLAX_BASE_SPEED,
} from '../constants.js';

export class RaceManager {
  /**
   * @param {Animal[]} animals       - Array of Animal instances
   * @param {Function} onFinish      - Called immediately when winner crosses line
   * @param {Function} onRaceEnd     - Called when results UI should show
   */
  constructor(animals, onFinish, onRaceEnd) {
    this.animals = animals;
    this.onFinish = onFinish;
    this.onRaceEnd = onRaceEnd;

    this.timer = 0;
    this.isActive = false;
    this.winnerId = null;

    // ── Finish Line UI ──────────────────────────────────────────
    this.finishLine = new Graphics();
    this._drawFinishLine();
    this.finishLine.visible = false;
  }

  _drawFinishLine() {
    const g = this.finishLine;
    g.clear();
    
    // Track area is roughly 535 to 985 (450px high)
    const trackTop = 535;
    const trackHeight = 450;
    
    // Draw checkered pattern
    const stripeHeight = 30;
    for (let i = 0; i < Math.ceil(trackHeight / stripeHeight); i++) {
        g.rect(0, trackTop + (i * stripeHeight), 15, stripeHeight);
        g.fill(i % 2 === 0 ? 0xFFFFFF : 0x000000);
    }
  }

  /**
   * Pre-determines the winner and starts the race.
   */
  startRace() {
    this.timer = 0;
    this.isActive = true;
    this.winnerId = this._pickWinner();
    this.finishLine.visible = true;
    
    // Initial position of finish line: it will arrive at FINISH_LINE_X in 10s
    // Formula: TargetX + (TrackSpeedPerFrame * TotalFrames)
    // Track speed is 1.5 * PARALLAX_BASE_SPEED
    const trackSpeedPerFrame = 1.5 * PARALLAX_BASE_SPEED;
    const totalFrames = RACE_DURATION_MS / 16.67;
    this.finishLine.x = FINISH_LINE_X + (trackSpeedPerFrame * totalFrames);
    
    console.log(`[RaceManager] Race started! Pre-determined winner: ${this.winnerId}`);
  }

  /**
   * Picks a winner based on weighted random.
   * @returns {string} animalId
   */
  _pickWinner() {
    const totalWeight = ANIMALS.reduce((sum, a) => sum + a.winWeight, 0);
    let random = Math.random() * totalWeight;
    
    for (const animal of ANIMALS) {
      if (random < animal.winWeight) return animal.id;
      random -= animal.winWeight;
    }
    return ANIMALS[0].id;
  }

  /**
   * Called every ticker tick.
   * @param {number} deltaMS
   * @param {number} tickerDelta - normalized delta (around 1)
   */
  update(deltaMS, tickerDelta) {
    if (!this.isActive) return;

    this.timer += deltaMS;

    // Move Finish Line left with the track
    const trackSpeedPerFrame = 1.5 * PARALLAX_BASE_SPEED;
    this.finishLine.x -= trackSpeedPerFrame * tickerDelta;

    // Update all animals
    for (const animal of this.animals) {
      // If winner, use a special nudge to ensure it hits the line at exactly 10s
      if (animal.id === this.winnerId) {
          this._updateWinner(animal, deltaMS);
      } else {
          animal.update(deltaMS);
          // Cap non-winners so they don't cross the line before the winner
          if (animal.sprite.x > FINISH_LINE_X - 100) {
              animal.sprite.x = FINISH_LINE_X - 100;
          }
      }
    }

    // Check for race end
    if (this.timer >= RACE_DURATION_MS) {
      this._handleFinish();
    }
  }

  /**
   * Nudges the winner towards the finish line to hit it at exactly 10s.
   */
  _updateWinner(animal, deltaMS) {
    // Normal update first
    animal.update(deltaMS);
    
    // Calculate required speed to hit FINISH_LINE_X at RACE_DURATION_MS
    const remainingTime = RACE_DURATION_MS - this.timer;
    const remainingDist = FINISH_LINE_X - animal.sprite.x;
    
    if (remainingTime > 0) {
        // Nudge: slightly adjust X to stay on track for the 10s mark
        // We don't want a hard snap, just a subtle correction
        const idealX = ANIMAL_START_X + ( (FINISH_LINE_X - ANIMAL_START_X) * (this.timer / RACE_DURATION_MS) );
        const correction = (idealX - animal.sprite.x) * 0.05;
        animal.sprite.x += correction;
    } else {
        animal.sprite.x = FINISH_LINE_X;
    }
  }

  _handleFinish() {
    this.isActive = false;
    
    // 1. Immediately stop background and movement
    if (this.onFinish) this.onFinish();

    // Trigger animations for animals on track
    for (const animal of this.animals) {
      if (animal.id === this.winnerId) {
        animal.triggerWin();
      } else {
        animal.setState('lose');
        animal._isFinished = true;
      }
    }

    // 2. Show Flash immediately
    this._showFlash();

    // 3. Wait 2 seconds before playing the enlarged victory spotlight
    setTimeout(() => {
        this._runVictorySpotlight();
        
        // 4. Wait another 3-4 seconds before showing results UI
        setTimeout(() => {
          if (this.onRaceEnd) this.onRaceEnd(this.winnerId);
        }, 3000);
    }, 2000);
  }

  _showFlash() {
    const winner = this.animals.find(a => a.id === this.winnerId);
    if (!winner) return;

    const flash = new Graphics();
    flash.rect(0, 0, 1920, 1080);
    flash.fill(0xFFFFFF);
    flash.zIndex = 300;
    winner.sprite.parent.addChild(flash);

    this._victoryUI = this._victoryUI || [];
    this._victoryUI.push(flash);

    // Fade flash
    let flashAlpha = 1.0;
    const fadeFlash = () => {
        if (flash.destroyed) return;
        flashAlpha -= 0.05;
        flash.alpha = flashAlpha;
        if (flashAlpha > 0) {
            requestAnimationFrame(fadeFlash);
        } else {
            flash.destroy();
        }
    };
    fadeFlash();
  }

  async _runVictorySpotlight() {
    const winner = this.animals.find(a => a.id === this.winnerId);
    if (!winner) return;

    // 1. Create Dark Overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, 1920, 1080);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    overlay.zIndex = 100;
    winner.sprite.parent.addChild(overlay);

    // 2. Create Enlarged Winner in Center
    const bigWinner = new AnimatedSprite(winner.sprite.textures);
    bigWinner.animationSpeed = 0.15;
    bigWinner.anchor.set(0.5);
    bigWinner.x = 1920 / 2;
    bigWinner.y = 1080 / 2;
    bigWinner.scale.set(1.5);
    bigWinner.zIndex = 150;
    bigWinner.play();
    winner.sprite.parent.addChild(bigWinner);

    // 3. Add Winner Name Text
    const style = new TextStyle({
        fontFamily: '"Press Start 2P", cursive',
        fontSize: 48,
        fill: '#ffcb05',
        stroke: '#333333',
        strokeThickness: 8,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 6,
    });

    const nameText = new Text({ text: `${winner.label.toUpperCase()} WINS!`, style });
    nameText.anchor.set(0.5);
    nameText.x = 1920 / 2;
    nameText.y = 1080 / 2 + 180; // Below the animal
    nameText.zIndex = 160;
    winner.sprite.parent.addChild(nameText);

    this._victoryUI.push(overlay, bigWinner, nameText);
  }

  reset() {
    this.timer = 0;
    this.isActive = false;
    this.finishLine.visible = false;
    this.animals.forEach(a => a.reset());

    // Cleanup Victory UI
    if (this._victoryUI) {
        this._victoryUI.forEach(obj => {
            if (!obj.destroyed) obj.destroy();
        });
        this._victoryUI = null;
    }
  }
}
