/**
 * City Neural Network Simulation
 * ----------------------------------------
 * Interactive city simulation powered by neural network and reinforcement learning.
 *
 * Features:
 * - Initializes city models and DeepQ neural agent.
 * - Trains agent to grow/manage the city.
 * - UI controls for pause/resume and manager switching.
 * - Action/reward logging and live state chart.
 * - Stagnation detection with auto-manager switching.
 * - Modular City Managers, including permaculture design.
 * - Enhanced UI: manager info, state chart, action/reward logs.
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
let chartInstance = null;
let isPaused = false;
let actionHistory = [];
let rewardHistory = [];
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
  const ctx = document.getElementById('state-chart').getContext('2d');

  if (forceNewChart && chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!chartInstance) {
    chartInstance = new Chart(ctx, {
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
function updateSimulationUI(manager, forceNewChart = false) {
  renderManagerInfo(manager);
  renderStateChart(manager, forceNewChart);
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
  updateSimulationUI(window.city, true);
  logReward(0);
}

/**
 * ==== BEGIN: STAGNATION DETECTION AND AUTO-SWITCH ====
 */
const STAGNANT_THRESHOLD = 10;
let stagnantCount = 0;
let lastReward = null;

function autoSwitchIfStagnant(currentReward) {
  if (lastReward !== null && Math.abs(currentReward - lastReward) < 1e-6) {
    stagnantCount++;
  } else {
    stagnantCount = 0;
  }
  lastReward = currentReward;

  if (stagnantCount >= STAGNANT_THRESHOLD) {
    let currentIndex = MANAGER_CLASSES.findIndex(cls => cls === CityManager);
    let nextIndexes = MANAGER_CLASSES.map((cls, i) => i).filter(i => i !== currentIndex);
    let nextIndex = nextIndexes[Math.floor(Math.random() * nextIndexes.length)];
    chooseManager(nextIndex);
    stagnantCount = 0;
    const logDiv = document.getElementById('action-log');
    if (logDiv) {
      logDiv.innerHTML += `<div style="color:#fd7e14;"><b>Auto-switched manager due to stagnation.</b></div>`;
    }
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
  // Use manager's own action space if available
  const actionSpace = window.city.getStateArray().length;
  const action = Math.floor(Math.random() * actionSpace);
  window.city.update(action);
  const state = window.city.getStateArray();
  const reward = state.reduce((sum, v) => sum + v, 0);
  logAction(action, reward);
  logReward(reward);
  updateSimulationUI(window.city);

  autoSwitchIfStagnant(reward);
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

/* End of file: src/js/index.js */
