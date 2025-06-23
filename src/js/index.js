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
 *
 * How to use:
 * - Open the web page; training starts automatically.
 * - Use the Pause/Resume buttons to control the simulation.
 * - Watch stats and logs update live as the agent learns.
 *
 * Dependencies:
 * - convnet.js, deepqlearn.js, vis.js
 *
 * Author: universalbit-dev
 * Repository: https://github.com/universalbit-dev/CityGenerator
 */
// === Import Dependencies ===
import * as log from 'loglevel';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';

// === Neural Net Config ===
const NUM_INPUTS = 7;
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

// === City State Model ===
function createInitialCity() {
  return {
    population: 50000, maxPopulation: 100000,
    roadDensity: 0.42,
    avgBuildingHeight: 15, maxHeight: 50,
    resourceLevel: 1200, maxResource: 5000,
    pollution: 30, maxPollution: 100,
    greenSpaceRatio: 0.18,
    riverCount: 1
  };
}

// === Main NeuralNet Class ===
class NeuralNetUI {
  constructor() {
    this.city = createInitialCity();
    this.brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
    this.paused = false;
    this.currentStep = 1;
    this.trainingRuns = 0;
    this.trainStepRewardSum = 0;

    this.setupUI();

    this.logMessage(`=== Training Run ===`);
    this.renderStatsOnCanvas({
      runNumber: 1,
      step: 0,
      totalSteps: OPT.learning_steps_total,
      avgReward: 0,
      learningRate: TDTRAINER_OPTIONS.learning_rate
    });
    this.trainStep(1);
  }

  // --- UI Setup (pause/resume binding) ---
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
  }

  // --- Logging ---
  logMessage(msg) {
    const rewardDiv = document.getElementById('reward-log');
    if (rewardDiv) {
      rewardDiv.textContent += (rewardDiv.textContent ? "\n" : "") + msg;
      rewardDiv.scrollTop = rewardDiv.scrollHeight;
    }
  }

  // --- Stats Canvas Rendering ---
  renderStatsOnCanvas({ runNumber, step, totalSteps, avgReward, learningRate }) {
    const canvas = document.getElementById('stats-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 20px Segoe UI, monospace';
    ctx.fillStyle = '#0d6efd';
    ctx.fillText(`Training Run #${runNumber}`, 20, 32);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#212529';
    ctx.fillText(`Step: ${step} / ${totalSteps}`, 20, 66);
    ctx.fillStyle = '#198754';
    ctx.fillText(`Avg Reward: ${avgReward.toFixed(4)}`, 220, 66);
    ctx.fillStyle = '#fd7e14';
    ctx.fillText(`LR: ${learningRate}`, 20, 98);
    // Progress bar
    let barX = 150, barY = 80, barW = 300, barH = 14;
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#0d6efd';
    ctx.fillRect(barX, barY, barW * (step / totalSteps), barH);
    ctx.strokeStyle = '#adb5bd';
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // --- State Calculation ---
  getCurrentState() {
    const city = this.city;
    return [
      city.population / city.maxPopulation,
      city.roadDensity,
      city.avgBuildingHeight / city.maxHeight,
      city.resourceLevel / city.maxResource,
      city.pollution / city.maxPollution,
      city.greenSpaceRatio,
      city.riverCount / 5
    ];
  }

  // --- Environment Update ---
  applyAction(action) {
    const city = this.city;
    switch (action) {
      case 0: // Build road
        city.roadDensity = Math.min(1, city.roadDensity + 0.01);
        city.population = Math.min(city.maxPopulation, city.population + 60);
        city.pollution = Math.min(city.maxPollution, city.pollution + 0.3);
        city.resourceLevel = Math.max(0, city.resourceLevel - 10);
        break;
      case 1: // Build park
        city.greenSpaceRatio = Math.min(1, city.greenSpaceRatio + 0.01);
        city.pollution = Math.max(0, city.pollution - 0.8);
        city.population = Math.min(city.maxPopulation, city.population + 20);
        city.resourceLevel = Math.max(0, city.resourceLevel - 5);
        break;
      case 2: // Build factory
        city.resourceLevel = Math.min(city.maxResource, city.resourceLevel + 50);
        city.pollution = Math.min(city.maxPollution, city.pollution + 1.2);
        city.population = Math.min(city.maxPopulation, city.population + 80);
        break;
    }
  }

  // --- Reward Calculation ---
  getReward(state) {
    const [pop, road, height, res, pollution, green, rivers] = state;
    return (
      (pop * 2) +
      (green * 1.5) -
      (pollution * 3) +
      (res * 0.5)
    );
  }

  // --- Training Loop ---
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
      this.city = createInitialCity();
      this.brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
      this.currentStep = 1;
      setTimeout(() => this.trainStep(1), 1000);
    }
  }

  // --- (Optional) ConvNetJS Demo Setup ---
  setupConvNetDemo() {
    const CONV_LAYERS = [
      { type: 'input', out_sx: 24, out_sy: 24, out_depth: 1 },
      { type: 'conv', sx: 5, filters: 16, stride: 1, pad: 2, activation: 'relu' },
      { type: 'pool', sx: 2, stride: 2 },
      { type: 'conv', sx: 5, filters: 32, stride: 1, pad: 2, activation: 'relu' },
      { type: 'pool', sx: 3, stride: 3 },
      { type: 'fc', num_neurons: 100, activation: 'relu' },
      { type: 'softmax', num_classes: 10 }
    ];
    const net = new window.convnetjs.Net();
    net.makeLayers(CONV_LAYERS);
    const trainer = new window.convnetjs.Trainer(net, {
      method: 'sgd',
      learning_rate: 0.001,
      l2_decay: 0.0001,
      momentum: 0.9,
      batch_size: 20,
      l1_decay: 0.0001
    });
    // For future: add UI for convnet demo if needed
  }
}

// === App Initialization ===
window.log = log;
window.addEventListener('DOMContentLoaded', () => {
  new NeuralNetUI();
});
