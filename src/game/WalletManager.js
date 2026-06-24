// src/game/WalletManager.js
import {
  WALLET_KEY,
  WALLET_START,
  PASSIVE_REGEN_CAP,
  PASSIVE_REGEN_INTERVAL_MS,
  REDEEM_CODE_CYCLE,
  REDEEM_CODE_REWARD,
} from '../constants.js';

const PASSIVE_MS_KEY = `${WALLET_KEY}_passiveMs`;
const REDEEM_INDEX_KEY = `${WALLET_KEY}_redeemIdx`;

export class WalletManager {
  constructor() {
    this.tokens = this._loadTokens();
    this.history = this._loadHistory();
    this.currentBets = {};
    this._lastPassiveMs = this._loadPassiveMs();
    this._redeemCycleIndex = this._loadRedeemIndex();
  }

  _loadTokens() {
    const saved = localStorage.getItem(WALLET_KEY);
    return saved !== null ? parseInt(saved, 10) : WALLET_START;
  }

  _saveTokens() {
    localStorage.setItem(WALLET_KEY, this.tokens.toString());
  }

  _loadPassiveMs() {
    const raw = localStorage.getItem(PASSIVE_MS_KEY);
    return raw !== null ? parseInt(raw, 10) : null;
  }

  _savePassiveMs() {
    if (this._lastPassiveMs == null) {
      localStorage.removeItem(PASSIVE_MS_KEY);
    } else {
      localStorage.setItem(PASSIVE_MS_KEY, String(this._lastPassiveMs));
    }
  }

  _loadRedeemIndex() {
    const raw = localStorage.getItem(REDEEM_INDEX_KEY);
    const n = raw !== null ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? ((n % REDEEM_CODE_CYCLE.length) + REDEEM_CODE_CYCLE.length) % REDEEM_CODE_CYCLE.length : 0;
  }

  _saveRedeemIndex() {
    localStorage.setItem(REDEEM_INDEX_KEY, String(this._redeemCycleIndex));
  }

  _syncPassiveClockAfterTokenChange() {
    if (this.tokens >= PASSIVE_REGEN_CAP) {
      this._lastPassiveMs = null;
      this._savePassiveMs();
      return;
    }
    if (this._lastPassiveMs == null) {
      this._lastPassiveMs = Date.now();
      this._savePassiveMs();
    }
  }

  _loadHistory() {
    const saved = localStorage.getItem(`${WALLET_KEY}_history`);
    return saved ? JSON.parse(saved) : [];
  }

  _saveHistory() {
    localStorage.setItem(`${WALLET_KEY}_history`, JSON.stringify(this.history));
  }

  /**
   * Call about once per second. Grants stacked minutes if tab was away.
   */
  tickPassiveRegen() {
    if (this.tokens >= PASSIVE_REGEN_CAP) return;

    const now = Date.now();
    if (this._lastPassiveMs == null) {
      this._lastPassiveMs = now;
      this._savePassiveMs();
      return;
    }

    const elapsed = now - this._lastPassiveMs;
    if (elapsed < PASSIVE_REGEN_INTERVAL_MS) return;

    const intervals = Math.floor(elapsed / PASSIVE_REGEN_INTERVAL_MS);
    const room = PASSIVE_REGEN_CAP - this.tokens;
    const grant = Math.min(intervals, room);
    if (grant <= 0) return;

    this.tokens += grant;
    this._saveTokens();
    this._lastPassiveMs += grant * PASSIVE_REGEN_INTERVAL_MS;
    this._savePassiveMs();
  }

  /** Seconds until next passive token, or null if passive inactive. */
  getSecondsUntilNextPassive() {
    if (this.tokens >= PASSIVE_REGEN_CAP) return null;
    const now = Date.now();
    const last = this._lastPassiveMs ?? now;
    const nextAt = last + PASSIVE_REGEN_INTERVAL_MS;
    return Math.max(0, Math.ceil((nextAt - now) / 1000));
  }

  placeBet(animalId, amount) {
    const currentBet = this.currentBets[animalId] || 0;
    const diff = amount - currentBet;

    if (this.tokens >= diff && amount >= 0) {
      this.tokens -= diff;
      this.currentBets[animalId] = amount;
      this._saveTokens();
      this._syncPassiveClockAfterTokenChange();
      return true;
    }
    return false;
  }

  clearBets() {
    this.currentBets = {};
  }

  processRaceResults(winningId, animalsConfig) {
    let totalWinnings = 0;

    for (const [animalId, betAmount] of Object.entries(this.currentBets)) {
      if (animalId === winningId) {
        const config = animalsConfig.find(a => a.id === animalId);
        const payout = config ? config.basePayout : 2.0;
        totalWinnings += Math.floor(betAmount * payout);
      }
    }

    this.tokens += totalWinnings;
    this._saveTokens();
    this._syncPassiveClockAfterTokenChange();

    this.history.unshift(winningId);
    if (this.history.length > 10) {
      this.history.pop();
    }
    this._saveHistory();

    return totalWinnings;
  }

  getBet(animalId) {
    return this.currentBets[animalId] || 0;
  }

  getTotalBet() {
    return Object.values(this.currentBets).reduce((a, b) => a + b, 0);
  }

  addTokens(amount) {
    this.tokens += amount;
    this._saveTokens();
    this._syncPassiveClockAfterTokenChange();
  }

  /**
   * @returns {{ ok: true } | { ok: false, reason: 'invalid' | 'wrong_order' }}
   */
  tryRedeemCode(raw) {
    const normalized = String(raw).trim().toUpperCase();
    const expected = REDEEM_CODE_CYCLE[this._redeemCycleIndex];

    if (normalized === expected) {
      this.tokens += REDEEM_CODE_REWARD;
      this._saveTokens();
      this._redeemCycleIndex = (this._redeemCycleIndex + 1) % REDEEM_CODE_CYCLE.length;
      this._saveRedeemIndex();
      this._syncPassiveClockAfterTokenChange();
      return { ok: true };
    }

    if (REDEEM_CODE_CYCLE.includes(normalized)) {
      return { ok: false, reason: 'wrong_order' };
    }
    return { ok: false, reason: 'invalid' };
  }
}
