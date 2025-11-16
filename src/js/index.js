/**
 * City Neural Network Simulation
 * ----------------------------------------
 * Interactive city simulation powered by neural network and reinforcement learning.
 *
 * Enhancements:
 * - Integrates an uploaded lodash.js (assumed at ./lodash.js) for robust, concise utilities.
 * - Uses _.sum for reward calculation, _.shuffle/_.random for randomness, _.isEqual for stagnation detection,
 *   _.cloneDeep to reset manager state if needed, and _.debounce to reduce chart re-render churn.
 *
 * Author: universalbit-dev
 */

// Import styles and dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';
import Chart from 'chart.js/auto';

// Lodash (uploaded to src/js/lodash.js)
import _ from './lodash.js'; 

// City Managers
import UrbanFabricManager from './cityManagers/UrbanFabricManager.js';
import CivicEcosystemManager from './cityManagers/CivicEcosystemManager.js';
import CircularCityManager from './cityManagers/CircularCityManager.js';
import SmartCityStateManager from './cityManagers/SmartCityStateManager.js';
import ResilientCityModelManager from './cityManagers/ResilientCityModelManager.js';
import CommunityCommonsManager from './cityManagers/CommunityCommonsManager.js';
import PermacultureDesignManager from './cityManagers/PermacultureDesign.js';
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
  PermacultureDesignManager,
  CookielessCityAgent
];

const managerTips = {
  'CookielessCityAgent': 'Privacy-first agent! Your choices boost digital safety.',
  'PermacultureDesignManager': 'Learn regenerative city planning and permaculture for a resilient urban future.',
  // Add other manager tips here as needed
};

// Simulation state
let CityManager = UrbanFabricManager;
let stateChartInstance = null;
let rewardTrendChartInstance = null;
let isPaused = false;
let rewardHistory = [];
let lastState = null; // use to detect state stagnation
const NUM_ACTIONS = 6; // Updated to match PermacultureDesignManager actions

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
 */
function renderStateChart(manager, forceNewChart = false) {
  const labels = Object.keys(manager.state);
  const data = manager.getStateArray();
  const ctxEl = document.getElementById('state-chart');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');

  if (forceNewChart && stateChartInstance) {
    stateChartInstance.destroy();
    stateChartInstance = null;
  }

  if (!stateChartInstance) {
    stateChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(lbl => lbl.charAt(0).toUpperCase() + lbl.slice(1)),
        datasets: [{
          label: 'City Features',
          data: data,
          backgroundColor: [
            '#0d6efd', '#20c997', '#ffc107', '#6f42c1', '#fd7e14', '#198754', '#4bc0c0'
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
          duration: 700,
          easing: 'easeOutQuart'
        }
      }
    });
  } else {
    stateChartInstance.data.datasets[0].data = data;
    stateChartInstance.update('active');
  }
}

/**
 * Render the Reward Trend Chart using Chart.js.
 * Now only updates data/labels instead of destroying and recreating chart.
 */
function renderRewardTrendChart() {
  const ctxEl = document.getElementById('rewardTrendChart');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  const rewards = rewardHistory.slice(-20);

  // Only create the chart once, then update data/labels
  if (!rewardTrendChartInstance) {
    rewardTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: rewards.map((v, i) => `${i + 1}`),
        datasets: [{
          label: 'Reward',
          data: rewards,
          backgroundColor: 'rgba(32,201,151,0.13)',
          borderColor: '#20c997',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#0d6efd',
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        },
        scales: {
          x: { 
            title: { display: true, text: "Step" },
            ticks: { color: '#333' } 
          },
          y: { 
            title: { display: true, text: "Reward" }, 
            min: rewards.length ? Math.min(...rewards) - 0.05 : 0,
            ticks: { color: '#333' } 
          }
        }
      }
    });
  } else {
    rewardTrendChartInstance.data.labels = rewards.map((v, i) => `${i + 1}`);
    rewardTrendChartInstance.data.datasets[0].data = rewards;
    rewardTrendChartInstance.update();
  }
}

// Debounced renderer to limit chart thrashing
const debouncedRenderRewardTrendChart = _.debounce(renderRewardTrendChart, 180);

/**
 * Log rewards and update the Reward Trend chart.
 */
function logReward(reward) {
  rewardHistory.push(reward);
  if (rewardHistory.length > 50) rewardHistory.shift();
  debouncedRenderRewardTrendChart();
}

/**
 * Update all simulation UI elements.
 */
function updateSimulationUI(manager, forceNewChart = false) {
  renderManagerInfo(manager);
  renderStateChart(manager, forceNewChart);
}

/**
 * Select and instantiate a manager by index or random.
 */
function chooseManager(idx = null) {
  const SelectedClass = idx !== null ? MANAGER_CLASSES[idx] : _.sample(MANAGER_CLASSES);
  CityManager = SelectedClass;
  // Make a fresh instance. Use cloneDeep if you want to copy a blueprint instead.
  window.city = new CityManager();
  rewardHistory = [];
  lastState = null;
  if (stateChartInstance) {
    stateChartInstance.destroy();
    stateChartInstance = null;
  }
  updateSimulationUI(window.city, true);
  logReward(0);
}

/**
 * ==== BEGIN: STAGNATION DETECTION AND AUTO-SWITCH ====
 */
const STAGNANT_THRESHOLD = 10;
let stagnantCount = 0;

function autoSwitchIfStagnant(currentState) {
  if (lastState !== null && _.isEqual(currentState, lastState)) {
    stagnantCount++;
  } else {
    stagnantCount = 0;
  }
  lastState = _.cloneDeep(currentState);

  if (stagnantCount >= STAGNANT_THRESHOLD) {
    // Choose a different manager randomly (shuffle then pick first different item)
    const shuffled = _.shuffle(MANAGER_CLASSES);
    const nextClass = shuffled.find(cls => cls !== CityManager) || _.sample(MANAGER_CLASSES);
    const nextIndex = MANAGER_CLASSES.indexOf(nextClass);
    chooseManager(nextIndex);
    stagnantCount = 0;
  }
}
/**
 * ==== END: STAGNATION DETECTION AND AUTO-SWITCH ====
 */

/**
 * Simulate one step (random action for demo).
 */
function simulateStep() {
  if (!window.city || isPaused) return;
  const actionSpace = window.city.getStateArray().length || NUM_ACTIONS;
  const action = _.random(0, Math.max(0, actionSpace - 1));
  try {
    window.city.update(action);
  } catch (err) {
    // If a manager throws, try to recover by switching manager
    console.error('Manager update error, switching manager:', err);
    chooseManager();
    return;
  }

  const state = window.city.getStateArray();
  // reward as sum of state values (use lodash sum for clarity)
  const reward = _.sum(state);
  logReward(reward);
  updateSimulationUI(window.city);

  autoSwitchIfStagnant(state);
}

/**
 * Setup UI controls for manager selection and Pause/Resume.
 */
function setupUI() {
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
    select.onchange = (e) => {
      chooseManager(Number(e.target.value));
    };
    container.appendChild(select);
  }

  const randomBtn = document.getElementById('random-city-model-btn');
  if (randomBtn) randomBtn.onclick = () => {
    chooseManager();
  };

  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  if (pauseBtn && resumeBtn) {
    pauseBtn.onclick = () => {
      isPaused = true;
      pauseBtn.classList.add('active');
      resumeBtn.classList.remove('active');
      pauseBtn.disabled = true;
      resumeBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    resumeBtn.onclick = () => {
      isPaused = false;
      resumeBtn.classList.add('active');
      pauseBtn.classList.remove('active');
      resumeBtn.disabled = true;
      pauseBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    pauseBtn.classList.remove('active');
    resumeBtn.classList.add('active');
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
}

// === Entry Point ===
window.addEventListener('DOMContentLoaded', () => {
  setupUI();
  chooseManager(0);
  setInterval(() => {
    simulateStep();
  }, 1100);
});
