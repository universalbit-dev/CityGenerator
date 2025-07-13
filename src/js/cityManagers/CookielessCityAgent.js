// src/js/cityManagers/CookielessCityAgent.js

/**
 * CookielessCityAgent
 * -------------------
 * A privacy-focused city manager agent for CityGenerator.
 * Implements required methods for compatibility with the neural net simulation UI.
 *
 * State variables can be adjusted to fit your paradigm.
 */

export default class CookielessCityAgent {
  constructor() {
    // Example state: population, environment, privacy, happiness, economy, security
    this.state = {
      population: 0.5,
      environment: 0.5,
      privacy: 1.0,     // Privacy always prioritized
      happiness: 0.5,
      economy: 0.5,
      security: 0.5
    };
  }

  /**
   * Update city state based on an action.
   * @param {number} action - The action chosen by the neural network agent.
   */
  update(action) {
    // Simple demo logic: actions impact different aspects
    switch (action) {
      case 0: // Invest in privacy infrastructure
        this.state.privacy = Math.min(1, this.state.privacy + 0.1);
        this.state.economy = Math.max(0, this.state.economy - 0.05);
        break;
      case 1: // Boost economy (may reduce privacy)
        this.state.economy = Math.min(1, this.state.economy + 0.1);
        this.state.privacy = Math.max(0, this.state.privacy - 0.05);
        break;
      case 2: // Improve happiness and environment
        this.state.happiness = Math.min(1, this.state.happiness + 0.1);
        this.state.environment = Math.min(1, this.state.environment + 0.1);
        break;
      default:
        // No-op or random decay
        Object.keys(this.state).forEach(key => {
          this.state[key] = Math.max(0, Math.min(1, this.state[key] + (Math.random() - 0.5) * 0.01));
        });
        break;
    }
  }

  /**
   * Get the current state as an array (for neural net input).
   * @returns {number[]} Array of state values in fixed order.
   */
  getStateArray() {
    return [
      this.state.population,
      this.state.environment,
      this.state.privacy,
      this.state.happiness,
      this.state.economy,
      this.state.security
    ];
  }
}
