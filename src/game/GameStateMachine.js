// src/game/GameStateMachine.js
import { STATES } from '../constants.js';

export class GameStateMachine {
  constructor() {
    this.current = null;
    this._listeners = {};
  }

  /**
   * Transition to a new state.
   * @param {string} newState
   */
  transition(newState) {
    if (this.current === newState) return;
    
    const prevState = this.current;
    this.current = newState;
    
    console.log(`[FSM] Transition: ${prevState} -> ${newState}`);
    this._emit(newState, prevState);
  }

  /**
   * Register a listener for a state entry.
   * @param {string} state - State from STATES constant
   * @param {Function} fn - Callback (newState, prevState)
   */
  on(state, fn) {
    if (!this._listeners[state]) {
      this._listeners[state] = [];
    }
    this._listeners[state].push(fn);
  }

  /**
   * Emit event to listeners.
   * @param {string} newState
   * @param {string} prevState
   */
  _emit(newState, prevState) {
    if (this._listeners[newState]) {
      this._listeners[newState].forEach(fn => fn(newState, prevState));
    }
  }
}
