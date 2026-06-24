// src/game/GlobalUI.js
import { sounds } from './SoundManager.js';

const TRIPLE_TAP_MS = 500;

export class GlobalUI {
  constructor(wallet, { onWalletTripleTap } = {}) {
    this.wallet = wallet;
    this._onWalletTripleTap = onWalletTripleTap;
    this.container = null;
    this._tapTimes = [];
    this._init();
  }

  _init() {
    this.container = document.createElement('div');
    this.container.className = 'global-ui';
    this.container.innerHTML = `
      <div class="persistent-status">
        <div class="wallet-stack">
          <div class="wallet-mini" id="global-wallet">WALLET: ${this.wallet.tokens}T</div>
          <div class="wallet-passive hidden" id="wallet-passive-line"></div>
        </div>
        <button type="button" class="btn-bet sound-btn" id="global-sound-toggle">
          SOUND: ${sounds.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.container);
    this._bindEvents();
    this.update();
  }

  _bindEvents() {
    const btn = this.container.querySelector('#global-sound-toggle');
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isEnabled = await sounds.toggle();
      btn.textContent = `SOUND: ${isEnabled ? 'ON' : 'OFF'}`;
    });

    const walletEl = this.container.querySelector('#global-wallet');
    walletEl.addEventListener('pointerdown', () => {
      if (this.wallet.tokens > 10) {
        this._tapTimes = [];
        return;
      }
      const now = Date.now();
      this._tapTimes = this._tapTimes.filter((t) => now - t < TRIPLE_TAP_MS);
      this._tapTimes.push(now);
      if (this._tapTimes.length >= 3) {
        this._tapTimes = [];
        this._onWalletTripleTap?.();
      }
    });
  }

  update() {
    const walletEl = this.container.querySelector('#global-wallet');
    if (walletEl) walletEl.textContent = `WALLET: ${this.wallet.tokens}T`;

    const passiveEl = this.container.querySelector('#wallet-passive-line');
    if (!passiveEl) return;

    const secs = this.wallet.getSecondsUntilNextPassive();
    if (secs === null) {
      passiveEl.classList.add('hidden');
      return;
    }

    passiveEl.classList.remove('hidden');
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    passiveEl.textContent =
      m > 0 ? `+1 in ${m}:${String(s).padStart(2, '0')}` : `+1 in ${s}s`;
  }
}
