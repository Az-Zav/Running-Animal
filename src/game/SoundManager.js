// src/game/SoundManager.js
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('gbRace_sound') !== 'false';
    this.bgmSource = null;
    this.bgmBuffer = null;
  }

  async _init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('gbRace_sound', this.enabled);
    console.log('[SoundManager] Sound toggled:', this.enabled);
    
    if (!this.enabled) {
      this.stopBGM();
    } else {
      await this.startBGM();
    }
    return this.enabled;
  }

  async _beep(freq, duration, type = 'square', volume = 0.1) {
    if (!this.enabled) return;
    await this._init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Pre-renders a simple melody into a buffer for perfect looping
   */
  async _createBGMBuffer() {
    await this._init();
    const duration = 2.0; // 2 second loop
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; 
    const noteLen = duration / notes.length;

    for (let i = 0; i < notes.length; i++) {
        const freq = notes[i];
        const start = i * noteLen;
        for (let s = 0; s < noteLen * sampleRate; s++) {
            const t = s / sampleRate;
            // Simple triangle-ish wave synthesis
            const val = Math.abs((t * freq % 1) * 2 - 1) * 2 - 1;
            // Apply envelope
            const env = Math.exp(-t * 4); 
            data[Math.floor(start * sampleRate) + s] += val * 0.05 * env;
        }
    }
    this.bgmBuffer = buffer;
  }

  async startBGM() {
    if (!this.enabled) return;
    await this._init();
    
    if (this.bgmSource) return;
    if (!this.bgmBuffer) await this._createBGMBuffer();

    this.bgmSource = this.ctx.createBufferSource();
    this.bgmSource.buffer = this.bgmBuffer;
    this.bgmSource.loop = true;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.5; // Final BGM volume

    this.bgmSource.connect(gain);
    gain.connect(this.ctx.destination);
    
    this.bgmSource.start(0);
    console.log('[SoundManager] BGM Looping Started');
  }

  stopBGM() {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (e) {}
      this.bgmSource = null;
      console.log('[SoundManager] BGM Stopped');
    }
  }

  playBet() { this._beep(440, 0.1, 'square', 0.05); }
  playCountdown() { this._beep(880, 0.05, 'square', 0.05); }
  playRaceStart() { 
    this._beep(220, 0.3, 'sawtooth', 0.1);
    setTimeout(() => this._beep(440, 0.4, 'sawtooth', 0.1), 100);
  }
  playWin() { 
    this._beep(523.25, 0.1); 
    setTimeout(() => this._beep(659.25, 0.1), 100); 
    setTimeout(() => this._beep(783.99, 0.3), 200); 
  }
  playLose() { 
    this._beep(200, 0.2, 'sawtooth');
    setTimeout(() => this._beep(150, 0.4, 'sawtooth'), 200);
  }
  playRedeem() { 
    this._beep(880, 0.1);
    setTimeout(() => this._beep(1760, 0.2), 100);
  }
}

export const sounds = new SoundManager();



