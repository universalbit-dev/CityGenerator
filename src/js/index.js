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
 * - Supports modular City Manager files.
 * - Enhanced UI: Manager info, state chart, action/reward log.
 *
 * Dependencies:
 * - convnet.js, deepqlearn.js, vis.js, chart.js
 * - Modular City Managers: see /src/js/cityManagers/
 *
 * Author: universalbit-dev
 * Repository: https://github.com/universalbit-dev/CityGenerator
 */

// Import styles and dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';
import Chart from 'chart.js/auto';

// City Managers
import UrbanFabricManager from './cityManagers/UrbanFabricManager.js';
import CivicEcosystemManager from './cityManagers/CivicEcosystemManager.js';
import CircularCityManager from './cityManagers/CircularCityManager.js';
import SmartCityStateManager from './cityManagers/SmartCityStateManager.js';
import ResilientCityModelManager from './cityManagers/ResilientCityModelManager.js';
import CommunityCommonsManager from './cityManagers/CommunityCommonsManager.js';
import CookielessCityAgent from './cityManagers/CookielessCityAgent.js';

// Privacy: Remove cookies
function removeAllCookies() {
  if (document.cookie) {
    document.cookie.split(";").forEach(cookie => {
      document.cookie = cookie.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  }
}
removeAllCookies();

// Manager registry and descriptions
const MANAGER_CLASSES = [
  UrbanFabricManager,
  CivicEcosystemManager,
  CircularCityManager,
  SmartCityStateManager,
  ResilientCityModelManager,
  CommunityCommonsManager,
  CookielessCityAgent
];
const managerTips = {
  'CookielessCityAgent': 'Privacy-first agent! Your choices boost digital safety.',
  'CircularCityManager': 'Sustainable choices for a greener city.',
  'UrbanFabricManager': 'Shape the flow and growth of your urban landscape.',
  'CivicEcosystemManager': 'Balance wellbeing, participation, and resources.',
  'SmartCityStateManager': 'Build a connected, smart, tech-savvy city.',
  'ResilientCityModelManager': 'Prepare your city for challenges and thrive.',
  'CommunityCommonsManager': 'Share, collaborate, and prosper together!',
};

// Neural Network Parameters
const NUM_INPUTS = 6;
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

// UI State
let CityManager = MANAGER_CLASSES[Math.floor(Math.random() * MANAGER_CLASSES.length)];
let actionHistory = [];
let chartInstance = null;
let rewardHistory = [];
let isPaused = false;

// === UI Functions ===

/**
 * Render manager info and tip in the UI.
 */
function renderManagerInfo(manager) {
  const name = manager.constructor.name;
  const infoDiv = document.getElementById('manager-info');
  if (infoDiv) {
    infoDiv.innerHTML =
      `<b>Current Simulation Model:</b> <span style="color:#007bff">${name}</span><br>
       <small>${managerTips[name] || ''}</small>`;
  }
}

/**
 * Render the manager's current state as a user-friendly bar chart using Chart.js.
 * This chart is smoothly animated and updated in place.
 */
function renderStateChart(manager) {
  const labels = Object.keys(manager.state);
  const data = manager.getStateArray();
  const ctx = document.getElementById('state-chart').getContext('2d');

  if (!chartInstance) {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(lbl => lbl.charAt(0).toUpperCase() + lbl.slice(1)),
        datasets: [{
          label: 'City Features',
          data: data,
          backgroundColor: [
            '#0d6efd', '#20c997', '#ffc107', '#6f42c1', '#fd7e14', '#198754'
          ],
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            title: { display: false },
            ticks: { color: '#333' }
          },
          y: {
            beginAtZero: true,
            max: 1,
            title: { display: false },
            ticks: { stepSize: 0.2, color: '#333' }
          }
        },
        animation: {
          duration: 700, // slightly slower for smoother effect
          easing: 'easeOutQuart'
        }
      }
    });
  } else {
    // Update only data for smooth animation
    chartInstance.data.datasets[0].data = data;
    chartInstance.update('active');
  }
}

/**
 * Log actions and rewards to the UI.
 */
function logAction(action, reward) {
  actionHistory.push({manager: CityManager.name, action, reward});
  if (actionHistory.length > 20) actionHistory.shift();
  const logDiv = document.getElementById('action-log');
  if (logDiv) {
    logDiv.innerHTML =
      actionHistory.map(h =>
        `<div><span style="color:#20c997;">${h.manager}</span>: <b>Action</b> ${h.action}, <b>Reward</b> ${h.reward.toFixed(2)}</div>`
      ).join('');
  }
}

/**
 * Update and display the reward log.
 */
function logReward(reward) {
  rewardHistory.push(reward);
  if (rewardHistory.length > 50) rewardHistory.shift();
  const rewardLog = document.getElementById('reward-log');
  if (rewardLog) {
    rewardLog.innerHTML = rewardHistory.map((r, i) =>
      `Step ${i + 1}: <span style="color:#0d6efd;">${r.toFixed(3)}</span>`
    ).join('<br>');
  }
}

/**
 * Update all simulation UI elements.
 */
function updateSimulationUI(manager) {
  renderManagerInfo(manager);
  renderStateChart(manager);
}

/**
 * Select and instantiate a manager by index or random.
 */
function chooseManager(idx = null) {
  CityManager = idx !== null ?
    MANAGER_CLASSES[idx] :
    MANAGER_CLASSES[Math.floor(Math.random() * MANAGER_CLASSES.length)];
  window.city = new CityManager();
  actionHistory = [];
  rewardHistory = [];
  chartInstance = null; // force re-create chart for new manager
  updateSimulationUI(window.city);
  logReward(0); // Reset reward log visually
}

/**
 * Simulate one step (random action for demo).
 * Replace with agent logic for real training.
 */
function simulateStep() {
  if (!window.city || isPaused) return; // skip if paused
  const action = Math.floor(Math.random() * NUM_ACTIONS);
  window.city.update(action);
  const state = window.city.getStateArray();
  const reward = state.reduce((sum, v) => sum + v, 0);
  logAction(action, reward);
  logReward(reward);
  updateSimulationUI(window.city);
}

/**
 * Setup UI controls for manager switching and Pause/Resume feedback.
 */
function setupUI() {
  // Manager Dropdown for direct selection
  const container = document.getElementById('manager-info');
  if (container && !container.querySelector('select')) {
    const select = document.createElement('select');
    select.style.margin = "8px 0";
    select.className = "form-select form-select-sm";
    MANAGER_CLASSES.forEach((cls, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = cls.name;
      select.appendChild(opt);
    });
    select.onchange = (e) => chooseManager(Number(e.target.value));
    container.appendChild(select);
  }

  // Random Model Button
  const randomBtn = document.getElementById('random-city-model-btn');
  if (randomBtn) randomBtn.onclick = () => chooseManager();

  // Pause/Resume Button logic and feedback
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  if (pauseBtn && resumeBtn) {
    pauseBtn.onclick = () => {
      isPaused = true;
      pauseBtn.classList.add('active');
      resumeBtn.classList.remove('active');
      pauseBtn.disabled = true;
      resumeBtn.disabled = false;
    };
    resumeBtn.onclick = () => {
      isPaused = false;
      resumeBtn.classList.add('active');
      pauseBtn.classList.remove('active');
      resumeBtn.disabled = true;
      pauseBtn.disabled = false;
    };
    // Default state: simulation running, Pause enabled, Resume disabled
    pauseBtn.classList.remove('active');
    resumeBtn.classList.add('active');
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
}

// === Entry Point ===
window.addEventListener('DOMContentLoaded', () => {
  setupUI();
  chooseManager(); // Pick one at start

  // Example: simulate step every 2 seconds
  setInterval(simulateStep, 2000);
});


