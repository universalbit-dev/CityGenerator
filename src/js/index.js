/**
 * City Neural Network Simulation
 * ----------------------------------------
 * This script powers an interactive city simulation using a neural network and reinforcement learning.
 *
 * Features:
 * - Initializes a city model and a DeepQ neural network agent.
 * - Automatically trains the agent to grow and manage the city by making decisions (e.g., building roads, parks, factories).
 * - Provides UI controls for pausing/resuming training and displays live stats about agent progress.
 * - Logs important events and training milestones to the web page.
 * - Visually renders training statistics and progress on a canvas.
 * - Supports plug-and-play paradigms through modular City Manager files in /src/js/cityManagers/.
 *
 * How to use:
 * - Open the web page; training starts automatically.
 * - Use the Pause/Resume buttons to control the simulation.
 * - Use the "Random City Model" button to instantly switch to a new random city paradigm.
 * - Watch stats and logs update live as the agent learns.
 *
 * Dependencies:
 * - convnet.js, deepqlearn.js, vis.js
 * - Modular City Managers: see /src/js/cityManagers/ for alternative city models.
 *
 * Author: universalbit-dev
 * Repository: https://github.com/universalbit-dev/CityGenerator
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';

// ====== City Managers ======
import UrbanFabricManager from './cityManagers/UrbanFabricManager.js';
import CivicEcosystemManager from './cityManagers/CivicEcosystemManager.js';
import CircularCityManager from './cityManagers/CircularCityManager.js';
import SmartCityStateManager from './cityManagers/SmartCityStateManager.js';
import ResilientCityModelManager from './cityManagers/ResilientCityModelManager.js';
import CommunityCommonsManager from './cityManagers/CommunityCommonsManager.js';

const MANAGER_CLASSES = [
  UrbanFabricManager,
  CivicEcosystemManager,
  CircularCityManager,
  SmartCityStateManager,
  ResilientCityModelManager,
  CommunityCommonsManager
];

// Default to a random manager at load
let CityManager = MANAGER_CLASSES[Math.floor(Math.random() * MANAGER_CLASSES.length)];

const NUM_INPUTS = 6; // Adjust if your managers have a different state vector length
const NUM_ACTIONS = 3;
const TEMPORAL_WINDOW = 1;
const NETWORK_SIZE = NUM_INPUTS * TEMPORAL_WINDOW + NUM_ACTIONS * TEMPORAL_WINDOW + NUM_INPUTS;
const LAYER_DEFS = [
  { type: 'input', out_sx: 1, out_sy: 1, out_depth: NETWORK_SIZE },
  { type: 'fc', num_neurons: 100, activation: 'relu' },
  { type: 'fc', num_neurons: 100, activation: 'relu' },
  { type: 'fc', num_neurons: 50, activation: 'relu' },
  { type: 'regression', num_neurons: NUM_ACTIONS }
];
const TDTRAINER_OPTIONS = {
  learning_rate: 0.01,
  momentum: 0.1,
  batch_size: 32,
  l2_decay: 0.001
};
const OPT = {
  temporal_window: TEMPORAL_WINDOW,
  experience_size: 50000,
  start_learn_threshold: 500,
  gamma: 0.9,
  learning_steps_total: 300000,
  learning_steps_burnin: 1000,
  epsilon_min: 0.01,
  epsilon_test_time: 0.01,
  layer_defs: LAYER_DEFS,
  tdtrainer_options: TDTRAINER_OPTIONS
};

class NeuralNetUI {
  constructor() {
    this.init();
    this.setupUI();
  }

  // (Re)initialize city, brain, and training loop
  init() {
    this.city = new CityManager();
    this.brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
    this.paused = false;
    this.currentStep = 1;
    this.trainingRuns = 0;
    this.trainStepRewardSum = 0;
    this.logMessage(`=== Training Run (${CityManager.name}) ===`);
    this.renderStatsOnCanvas({
      runNumber: 1,
      step: 0,
      totalSteps: OPT.learning_steps_total,
      avgReward: 0,
      learningRate: TDTRAINER_OPTIONS.learning_rate
    });
    this.trainStep(1);
    // If displaying the model name somewhere else in your UI, you could update it here too.
  }

  setupUI() {
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    if (pauseBtn) pauseBtn.onclick = () => { this.paused = true; };
    if (resumeBtn) resumeBtn.onclick = () => {
      if (this.paused) {
        this.paused = false;
        this.trainStep(this.currentStep);
      }
    };

    // Random City Model Button functionality
    const randomBtn = document.getElementById('random-city-model-btn');
    if (randomBtn) {
      randomBtn.onclick = () => {
        CityManager = MANAGER_CLASSES[Math.floor(Math.random() * MANAGER_CLASSES.length)];
        this.logMessage(`\n--- Switched to random model: ${CityManager.name} ---\n`);
        this.init(); // restart everything with the new paradigm
      };
    }
  }

  logMessage(msg) {
    const rewardDiv = document.getElementById('reward-log');
    if (rewardDiv) {
      rewardDiv.textContent += (rewardDiv.textContent ? "\n" : "") + msg;
      rewardDiv.scrollTop = rewardDiv.scrollHeight;
    }
  }

  renderStatsOnCanvas({ runNumber, step, totalSteps, avgReward, learningRate }) {
    const canvas = document.getElementById('stats-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Main title
    ctx.font = 'bold 20px Segoe UI, monospace';
    ctx.fillStyle = '#0d6efd';
    ctx.fillText(`Training Run #${runNumber}`, 20, 32);

    // Manager name just below
    ctx.font = 'italic 14px monospace';
    ctx.fillStyle = '#6c757d';
    ctx.fillText(`(${CityManager.name})`, 22, 52);

    // Restore font for stats
    ctx.font = '16px monospace';
    ctx.fillStyle = '#212529';
    ctx.fillText(`Step: ${step} / ${totalSteps}`, 20, 76);
    ctx.fillStyle = '#198754';
    ctx.fillText(`Avg Reward: ${avgReward.toFixed(4)}`, 220, 76);
    ctx.fillStyle = '#fd7e14';
    ctx.fillText(`LR: ${learningRate}`, 20, 106);

    // Progress bar
    let barX = 150, barY = 90, barW = 300, barH = 14;
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#0d6efd';
    ctx.fillRect(barX, barY, barW * (step / totalSteps), barH);
    ctx.strokeStyle = '#adb5bd';
    ctx.strokeRect(barX, barY, barW, barH);
  }

  getCurrentState() {
    return this.city.getStateArray();
  }

  applyAction(action) {
    this.city.update(action);
  }

  getReward(state) {
    // Simple: sum of all normalized values (customize per paradigm if desired)
    return state.reduce((sum, v) => sum + v, 0);
  }

  trainStep(step) {
    if (this.paused) {
      this.currentStep = step;
      return;
    }
    const state = this.getCurrentState();
    const action = this.brain.forward(state);
    this.applyAction(action);
    const reward = this.getReward(this.getCurrentState(), action);
    this.brain.backward(reward);

    const totalSteps = OPT.learning_steps_total;
    const logInterval = Math.max(1, Math.floor(totalSteps / 20));
    this.trainStepRewardSum += reward;

    if (step % logInterval === 0 || step === totalSteps) {
      const avgReward = this.trainStepRewardSum / logInterval;
      const msg = `Step ${step} / ${totalSteps} | Avg Reward: ${avgReward.toFixed(4)}`;
      console.log(msg);
      this.logMessage(msg);
      this.renderStatsOnCanvas({
        runNumber: this.trainingRuns + 1,
        step,
        totalSteps,
        avgReward,
        learningRate: TDTRAINER_OPTIONS.learning_rate
      });
      this.trainStepRewardSum = 0;
    }

    if (step < totalSteps) {
      setTimeout(() => this.trainStep(step + 1), 0);
    } else {
      console.log("Training complete!");
      this.logMessage("Training complete!");
      this.trainingRuns++;
      this.logMessage(`\n=== Restarting Training (#${this.trainingRuns + 1}) ===`);
      this.city = new CityManager();
      this.brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
      this.currentStep = 1;
      setTimeout(() => this.trainStep(1), 1000);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ui = new NeuralNetUI();
});
