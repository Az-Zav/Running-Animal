// src/game/BettingUI.js
import { ANIMALS, PORTRAITS } from '../constants.js';
import { sounds } from './SoundManager.js';

export class BettingUI {
  constructor(wallet, onStartRace, onBetChange) {
    this.wallet = wallet;
    this.onStartRace = onStartRace;
    this.onBetChange = onBetChange;
    this.container = null;
    this.timerValue = 15;
    this.timerInterval = null;
    this._init();
    console.log('[BettingUI] Initialized');
  }

  _init() {
    this.container = document.createElement('div');
    this.container.className = 'retro-ui';
    document.getElementById('game-container').appendChild(this.container);
    this.render();
  }

  show() {
    console.log('[BettingUI] Showing UI');
    this.container.classList.remove('hidden');
    this.timerValue = 15;
    this.render();
    this._startTimer();
  }

  hide() {
    this.container.classList.add('hidden');
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
  }

  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    console.log('[BettingUI] Timer starting...');
    this.timerInterval = setInterval(() => {
      this.timerValue--;
      this._updateTimerDisplay();
      
      if (this.timerValue > 0 && this.timerValue <= 3) {
        sounds.playCountdown();
      }

      if (this.timerValue <= 0) {
        console.log('[BettingUI] Timer reached zero, starting race');
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.onStartRace();
      }
    }, 1000);
  }

  _updateTimerDisplay() {
    const el = this.container.querySelector('#countdown-timer');
    if (el) el.textContent = `NEXT RACE: ${this.timerValue}s`;
  }

  render() {
    this.container.innerHTML = `
      <!-- History in the Sky -->
      <div class="history-strip">
        ${this.wallet.history.map(id => `
          <div class="history-item">
            <img src="/assets/portraits/${id.charAt(0).toUpperCase() + id.slice(1)}_Portrait.png" alt="${id}">
          </div>
        `).join('')}
      </div>

      <!-- Status Bar (Timer Only) -->
      <div class="status-bar">
        <div class="timer-card" id="countdown-timer">NEXT RACE: ${this.timerValue}s</div>
      </div>

      <!-- Minimalist Floating Betting Strip in the Grass -->
      <div class="betting-strip">
        ${ANIMALS.map(animal => this._renderAnimalUnit(animal)).join('')}
      </div>
    `;

    this._bindEvents();
  }

  _renderAnimalUnit(animal) {
    const portrait = PORTRAITS.find(p => p.animalId === animal.id);
    const bet = this.wallet.getBet(animal.id);
    
    return `
      <div class="animal-bet-unit">
        <div class="bet-label">${animal.label} (${animal.basePayout}x)</div>
        <div class="portrait-mini">
          <img src="/assets/portraits/${portrait.file}" alt="${animal.label}">
        </div>
        <div class="bet-controls">
          <button class="btn-bet" data-id="${animal.id}" data-action="minus">-</button>
          <span class="bet-amount">${bet}</span>
          <button class="btn-bet" data-id="${animal.id}" data-action="plus">+</button>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.container.querySelectorAll('.btn-bet').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        sounds.playBet();
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const current = this.wallet.getBet(id);
        
        if (action === 'plus') {
          this.wallet.placeBet(id, current + 1);
        } else if (action === 'minus' && current > 0) {
          this.wallet.placeBet(id, current - 1);
        }
        
        if (this.onBetChange) this.onBetChange();
        this.render();
      };
    });
  }
}



