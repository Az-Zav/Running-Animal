// src/game/TitleScreen.js
export class TitleScreen {
  /**
   * @param {Function} onStart - Callback when the screen is clicked/dismissed
   */
  constructor(onStart) {
    this.onStart = onStart;
    this.container = null;
    this._init();
  }

  _init() {
    this.container = document.createElement('div');
    this.container.className = 'title-screen-overlay';
    this.container.innerHTML = `
      <div class="title-content">
        <h1 class="game-title">RUNNING<br>ANIMALS</h1>
        <button class="btn-start-game" id="title-start-btn">START GAME</button>
        <div class="press-start">READY TO BET?</div>
      </div>
    `;
    
    document.body.appendChild(this.container); // Append to body to ensure top level
    
    const startBtn = this.container.querySelector('#title-start-btn');
    startBtn.onclick = (e) => {
        e.stopPropagation();
        this.hide();
        this.onStart();
    };
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
