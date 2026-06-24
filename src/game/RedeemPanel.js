// src/game/RedeemPanel.js — hidden redeem UI (R / triple-tap wallet)
import { REDEEM_CODE_REWARD } from '../constants.js';
import { sounds } from './SoundManager.js';

const WRONG_ORDER_MSG = 'use the next code in the sequence';

const BACKDROP_CLOSE_SUPPRESS_MS = 600;
const FOCUS_DELAY_MS = 400;

export class RedeemPanel {
  constructor(wallet, onWalletUpdated) {
    this.wallet = wallet;
    this.onWalletUpdated = onWalletUpdated;
    this._root = null;
    this._redeemBusy = false;
    /** Blocks backdrop close to absorb mobile ghost-clicks after triple-tap + keyboard. */
    this._backdropCloseSuppressUntil = 0;
    this._focusTimer = null;
    this._mount();
  }

  _mount() {
    const wrap = document.createElement('div');
    wrap.className = 'redeem-panel-root hidden';
    wrap.innerHTML = `
      <div class="retro-panel redeem-modal redeem-modal-floating">
        <div class="bet-label">REDEEM</div>
        <input type="text" class="redeem-input" id="redeem-code-input" placeholder="ENTER CODE" autocomplete="off">
        <button type="button" class="btn-redeem" id="redeem-submit-btn">REDEEM</button>
        <div id="redeem-feedback" class="redeem-feedback hidden"></div>
      </div>
    `;
    document.getElementById('game-container').appendChild(wrap);
    this._root = wrap;

    const btn = wrap.querySelector('#redeem-submit-btn');
    const input = wrap.querySelector('#redeem-code-input');
    const feedback = wrap.querySelector('#redeem-feedback');

    btn.addEventListener('click', () => this._submit(input, feedback, btn));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._submit(input, feedback, btn);
      }
    });

    const tryBackdropClose = (e) => {
      if (e.target !== wrap) return;
      if (Date.now() < this._backdropCloseSuppressUntil) return;
      this.hide();
    };
    wrap.addEventListener('click', tryBackdropClose);
  }

  isVisible() {
    return this._root && !this._root.classList.contains('hidden');
  }

  show() {
    if (this._focusTimer != null) {
      clearTimeout(this._focusTimer);
      this._focusTimer = null;
    }
    this._backdropCloseSuppressUntil = Date.now() + BACKDROP_CLOSE_SUPPRESS_MS;
    this._root.classList.remove('hidden');
    const input = this._root.querySelector('#redeem-code-input');
    const feedback = this._root.querySelector('#redeem-feedback');
    const btn = this._root.querySelector('#redeem-submit-btn');
    feedback.classList.add('hidden');
    feedback.textContent = '';
    input.value = '';
    btn.disabled = false;
    this._focusTimer = setTimeout(() => {
      this._focusTimer = null;
      input.focus({ preventScroll: true });
    }, FOCUS_DELAY_MS);
  }

  hide() {
    if (this._focusTimer != null) {
      clearTimeout(this._focusTimer);
      this._focusTimer = null;
    }
    this._root.classList.add('hidden');
  }

  toggle() {
    if (this.wallet.tokens > 10) return;
    if (this.isVisible()) this.hide();
    else this.show();
  }

  _submit(input, feedback, btn) {
    if (this._redeemBusy) return;
    this._redeemBusy = true;
    btn.disabled = true;

    const result = this.wallet.tryRedeemCode(input.value);

    if (result.ok) {
      sounds.playRedeem();
      feedback.textContent = `REWARDED: ${REDEEM_CODE_REWARD} TOKENS!`;
      feedback.className = 'redeem-feedback reward-msg';
      this.onWalletUpdated?.();
      setTimeout(() => {
        this.hide();
        feedback.classList.add('hidden');
        this._redeemBusy = false;
        btn.disabled = false;
      }, 1200);
      return;
    }

    feedback.classList.remove('hidden');
    feedback.className =
      result.reason === 'wrong_order'
        ? 'redeem-feedback redeem-feedback-warn'
        : 'redeem-feedback redeem-feedback-error';
    feedback.textContent =
      result.reason === 'wrong_order' ? WRONG_ORDER_MSG : 'INVALID CODE';

    this._redeemBusy = false;
    btn.disabled = false;
  }
}
