/**
 * City Neural Network Simulation 
 *
 * Notes:
 * - Conservative responsive + DPR handling (ResizeObserver + guarded updates).
 * - Avoids absolute/overlapping reward element and IntersectionObserver.
 * - Defensive checks so DOM / missing elements don't break the page render.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';
import Chart from 'chart.js/auto';
import _ from './lodash.js';

import UrbanFabricManager from './cityManagers/UrbanFabricManager.js';
import CivicEcosystemManager from './cityManagers/CivicEcosystemManager.js';
import CircularCityManager from './cityManagers/CircularCityManager.js';
import SmartCityStateManager from './cityManagers/SmartCityStateManager.js';
import ResilientCityModelManager from './cityManagers/ResilientCityModelManager.js';
import CommunityCommonsManager from './cityManagers/CommunityCommonsManager.js';
import PermacultureDesignManager from './cityManagers/PermacultureDesign.js';
import CookielessCityAgent from './cityManagers/CookielessCityAgent.js';

function removeAllCookies() {
  try {
    if (document && document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    }
  } catch (e) { /* ignore */ }
}
removeAllCookies();

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
};

let CityManager = UrbanFabricManager;
let stateChartInstance = null;
let rewardTrendChartInstance = null;
let isPaused = false;
let rewardHistory = [];
let lastState = null;
const NUM_ACTIONS = 6;

// keep ResizeObservers so we can disconnect
const _resizeObservers = new Map();

/* ---------- Helpers ---------- */

function readableNameFromCtorName(ctorName) {
  if (!ctorName || typeof ctorName !== 'string') return 'Unknown Model';
  const stripped = ctorName.replace(/Manager$/, '');
  const spaced = stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.trim() || ctorName;
}

function getManagerTipFor(manager) {
  try {
    const ctorName = (typeof manager === 'function') ? (manager.name || '') : (manager && manager.constructor && manager.constructor.name) ? manager.constructor.name : '';
    const candidates = [];
    if (ctorName) {
      candidates.push(ctorName);
      candidates.push(ctorName.replace(/Manager$/, ''));
      candidates.push(readableNameFromCtorName(ctorName));
    }
    candidates.push(...candidates.map(c => c.toLowerCase()));
    for (const key of candidates) {
      if (managerTips[key]) return managerTips[key];
    }
  } catch (e) { /* ignore */ }
  return 'No tip available for this model.';
}

function computeYAxisMax(values) {
  if (!Array.isArray(values) || values.length === 0) return 1;
  const maxVal = Math.max(...values.map(v => (typeof v === 'number' ? v : 0)));
  if (maxVal <= 0) return 1;
  const padded = maxVal * 1.12;
  const rounded = Math.ceil(padded * 10) / 10;
  return rounded || 1;
}

/* value label plugin (kept simple & defensive) */
const valueLabelsPlugin = {
  id: 'valueLabelsPlugin',
  afterDatasetsDraw(chart) {
    try {
      const ctx = chart.ctx;
      const chartWidth = chart.width || (chart.canvas && chart.canvas.clientWidth) || 0;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || !meta.data) return;
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === null || typeof value === 'undefined') return;

          // limit labels on line charts to last point on small screens
          const isLine = chart.config && chart.config.type === 'line';
          const totalPoints = dataset.data.length || 0;
          if (isLine && chartWidth < 420 && index !== totalPoints - 1) return;

          const fontSize = Math.max(10, Math.min(14, Math.round(chartWidth / 60)));
          ctx.save();
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = '#222';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const padding = 6;
          let position = { x: 0, y: 0 };
          try {
            position = element.tooltipPosition();
          } catch (e) {
            position = { x: element.x || 0, y: element.y || 0 };
          }
          const displayText = (typeof value === 'number') ? value.toFixed(2) : String(value);
          ctx.fillText(displayText, position.x, Math.max(padding + fontSize, position.y - padding));
          ctx.restore();
        });
      });
    } catch (e) { /* don't let plugin throw */ }
  }
};
Chart.register(valueLabelsPlugin);

/* ---------- Responsive canvas utilities ---------- */

function safeResetTransform(ctx) {
  if (!ctx) return;
  try {
    if (typeof ctx.resetTransform === 'function') ctx.resetTransform();
    else if (typeof ctx.setTransform === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0);
  } catch (e) { /* ignore */ }
}

function resizeCanvasForDPR(canvas, wrapper) {
  if (!canvas || !wrapper) return;
  try {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(20, wrapper.clientWidth);
    const h = Math.max(80, wrapper.clientHeight);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        safeResetTransform(ctx);
        if (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        else if (typeof ctx.scale === 'function') ctx.scale(dpr, dpr);
      }
    }
  } catch (e) { /* ignore resize errors */ }
}

function observeWrapperResize(wrapper, cb) {
  if (!wrapper) return;
  try {
    let ro = _resizeObservers.get(wrapper);
    if (!ro) {
      ro = new ResizeObserver(() => cb());
      ro.observe(wrapper);
      _resizeObservers.set(wrapper, ro);
    }
    return ro;
  } catch (e) { /* ResizeObserver unsupported or failed */ }
}

function disconnectWrapperObserver(wrapper) {
  const ro = _resizeObservers.get(wrapper);
  if (ro) {
    try { ro.disconnect(); } catch (e) { /* ignore */ }
    _resizeObservers.delete(wrapper);
  }
}

/* ---------- DOM / element creation ---------- */

function ensureChartElements() {
  try {
    let chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) {
      chartsContainer = document.createElement('div');
      chartsContainer.id = 'charts-container';
      chartsContainer.style.display = 'flex';
      chartsContainer.style.flexWrap = 'wrap';
      chartsContainer.style.justifyContent = 'center';
      chartsContainer.style.gap = '24px';
      chartsContainer.style.alignItems = 'flex-start';
      chartsContainer.style.marginTop = '12px';
      chartsContainer.style.width = '100%';
      chartsContainer.style.boxSizing = 'border-box';
      const infoEl = document.getElementById('manager-info');
      if (infoEl && infoEl.parentNode) infoEl.parentNode.insertBefore(chartsContainer, infoEl.nextSibling);
      else if (document.body) document.body.appendChild(chartsContainer);
      else return;
    }

    function createWrapperIfMissing(id, defaultHeight = 320) {
      const canvasId = id;
      const existingCanvas = document.getElementById(canvasId);
      if (existingCanvas) {
        const parent = existingCanvas.parentNode;
        if (parent && parent.dataset && parent.dataset.chartWrapper === '1') return parent;
      }

      const wrapper = document.createElement('div');
      wrapper.dataset.chartWrapper = '1';
      wrapper.style.flex = '1 1 520px';
      wrapper.style.maxWidth = '720px';
      wrapper.style.width = '100%';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.minWidth = '280px';
      wrapper.style.height = `${defaultHeight}px`;
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'stretch';
      wrapper.style.justifyContent = 'flex-start';
      wrapper.style.position = 'relative';
      wrapper.style.margin = '0 auto';

      const canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      wrapper.appendChild(canvas);

      if (canvasId === 'rewardTrendChart' && !wrapper.querySelector('#reward-value')) {
        const rewardDiv = document.createElement('div');
        rewardDiv.id = 'reward-value';
        rewardDiv.style.marginTop = '8px';
        rewardDiv.style.fontWeight = '700';
        rewardDiv.style.textAlign = 'center';
        rewardDiv.style.fontSize = '14px';
        rewardDiv.style.display = 'block';
        rewardDiv.style.background = 'transparent';
        rewardDiv.innerText = 'Reward: —';
        wrapper.appendChild(rewardDiv);
      }

      chartsContainer.appendChild(wrapper);

      return wrapper;
    }

    createWrapperIfMissing('state-chart', 340);
    createWrapperIfMissing('rewardTrendChart', 340);
  } catch (e) { /* if DOM access fails, bail gracefully */ }
}

/* ---------- Chart rendering ---------- */

function renderManagerInfo(manager) {
  try {
    const ctorName = manager && manager.constructor && manager.constructor.name ? manager.constructor.name : (typeof manager === 'function' ? manager.name : '');
    const displayName = readableNameFromCtorName(ctorName);
    const tip = getManagerTipFor(manager);

    const infoDiv = document.getElementById('manager-info');
    if (infoDiv) {
      infoDiv.style.textAlign = 'center';
      infoDiv.style.whiteSpace = 'normal';
      infoDiv.innerHTML =
        `<div style="display:inline-block;max-width:92%;">
           <div style="font-weight:700;font-size:1.05rem;margin-bottom:6px">
             Current Simulation Model: <span style="color:#007bff">${displayName}</span>
           </div>
           <div id="manager-tip" style="color:#333;margin-top:6px; font-size:0.95rem;">
             ${tip}
           </div>
         </div>`;
    }
  } catch (e) { /* ignore rendering error */ }
}

function renderStateChart(manager, forceNewChart = false) {
  try {
    ensureChartElements();
    if (!manager || typeof manager.getStateArray !== 'function') {
      if (stateChartInstance) {
        const wrapper = document.getElementById('state-chart')?.parentNode;
        if (wrapper) disconnectWrapperObserver(wrapper);
        try { stateChartInstance.destroy(); } catch (e) { /* ignore */ }
        stateChartInstance = null;
      }
      return;
    }

    const data = Array.isArray(manager.getStateArray()) ? manager.getStateArray().map(v => Number(v) || 0) : [];
    let labels = (manager.state && typeof manager.state === 'object') ? Object.keys(manager.state) : [];
    if (labels.length !== data.length) labels = data.map((_, i) => `S${i + 1}`);

    const canvas = document.getElementById('state-chart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;

    resizeCanvasForDPR(canvas, wrapper);

    const ctx = canvas.getContext('2d');
    const yMax = computeYAxisMax(data);
    const step = Math.max(0.05, +(yMax / 5).toFixed(3));

    if (forceNewChart && stateChartInstance) {
      const oldWrapper = document.getElementById('state-chart')?.parentNode;
      if (oldWrapper) disconnectWrapperObserver(oldWrapper);
      try { stateChartInstance.destroy(); } catch (e) { /* ignore */ }
      stateChartInstance = null;
    }

    if (!stateChartInstance) {
      stateChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.map(lbl => String(lbl).charAt(0).toUpperCase() + String(lbl).slice(1)),
          datasets: [{
            label: 'City Features',
            data: data,
            backgroundColor: [
              '#0d6efd', '#20c997', '#ffc107', '#6f42c1', '#fd7e14', '#198754', '#4bc0c0'
            ],
            borderRadius: 6,
            categoryPercentage: 0.6,
            barPercentage: 0.8,
            barThickness: 'flex'
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          layout: { padding: { top: 12, right: 12, bottom: 6, left: 6 } },
          scales: {
            x: { grid: { display: false, drawBorder: false }, ticks: { color: '#333' } },
            y: {
              beginAtZero: true,
              max: yMax,
              ticks: { stepSize: step, color: '#333' },
              grid: { color: 'rgba(0,0,0,0.06)' }
            }
          },
          animation: { duration: 420, easing: 'easeOutQuart' }
        },
        plugins: [valueLabelsPlugin]
      });

      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        try { stateChartInstance?.resize(); } catch (e) { /* ignore */ }
      });
    } else {
      stateChartInstance.data.labels = labels.map(lbl => String(lbl).charAt(0).toUpperCase() + String(lbl).slice(1));
      stateChartInstance.data.datasets[0].data = data;
      stateChartInstance.options.scales.y.max = computeYAxisMax(data);
      stateChartInstance.options.scales.y.ticks.stepSize = Math.max(0.05, +(stateChartInstance.options.scales.y.max / 5).toFixed(3));
      stateChartInstance.update();
    }
  } catch (e) { console.error('renderStateChart error', e); }
}

function renderRewardTrendChart() {
  try {
    ensureChartElements();
    const canvas = document.getElementById('rewardTrendChart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);

    const ctx = canvas.getContext('2d');
    const rewards = rewardHistory.slice(-20).map(v => Number(v) || 0);

    if (!rewardTrendChartInstance) {
      const yMax = computeYAxisMax(rewards);
      const step = Math.max(0.05, +(yMax / 5).toFixed(3));
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
            pointRadius: 5,
            pointBackgroundColor: '#0d6efd',
            tension: 0.18,
            fill: true
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: true }, tooltip: { enabled: true } },
          layout: { padding: { top: 8, right: 10, bottom: 6, left: 6 } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#333' } },
            y: {
              beginAtZero: true,
              max: yMax,
              ticks: { stepSize: step, color: '#333' },
              grid: { color: 'rgba(0,0,0,0.06)' }
            }
          }
        },
        plugins: [valueLabelsPlugin]
      });

      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        try { rewardTrendChartInstance?.resize(); } catch (e) { /* ignore */ }
      });
    } else {
      rewardTrendChartInstance.data.labels = rewards.map((v, i) => `${i + 1}`);
      rewardTrendChartInstance.data.datasets[0].data = rewards;
      rewardTrendChartInstance.options.scales.y.max = computeYAxisMax(rewards);
      rewardTrendChartInstance.options.scales.y.ticks.stepSize = Math.max(0.05, +(rewardTrendChartInstance.options.scales.y.max / 5).toFixed(3));
      rewardTrendChartInstance.update();
    }

    // numeric display update (inside wrapper)
    const rewardEl = wrapper.querySelector('#reward-value') || document.getElementById('reward-value');
    if (rewardEl) {
      const latest = rewards.length ? rewards[rewards.length - 1] : 0;
      rewardEl.innerText = `Reward: ${(typeof latest === 'number') ? latest.toFixed(3) : String(latest)}`;
    }
  } catch (e) { console.error('renderRewardTrendChart error', e); }
}

const debouncedRenderRewardTrendChart = _.debounce(renderRewardTrendChart, 160);

function logReward(reward) {
  rewardHistory.push(reward);
  if (rewardHistory.length > 50) rewardHistory.shift();
  debouncedRenderRewardTrendChart();
}

/* ---------- Simulation UI and lifecycle ---------- */

function updateSimulationUI(manager, forceNewChart = false) {
  renderManagerInfo(manager);
  renderStateChart(manager, forceNewChart);
  // reward chart will be debounced via logReward
}

function chooseManager(idx = null) {
  const SelectedClass = idx !== null ? MANAGER_CLASSES[idx] : _.sample(MANAGER_CLASSES);
  CityManager = SelectedClass;
  try {
    window.city = new CityManager();
  } catch (err) {
    console.error('Failed to instantiate manager class. Falling back to UrbanFabricManager.', err);
    CityManager = UrbanFabricManager;
    window.city = new UrbanFabricManager();
  }

  rewardHistory = [];
  lastState = null;

  // destroy existing charts and their observers
  if (stateChartInstance) {
    const wrapper = document.getElementById('state-chart')?.parentNode;
    if (wrapper) disconnectWrapperObserver(wrapper);
    try { stateChartInstance.destroy(); } catch (e) { /* ignore */ }
    stateChartInstance = null;
  }
  if (rewardTrendChartInstance) {
    const wrapper = document.getElementById('rewardTrendChart')?.parentNode;
    if (wrapper) disconnectWrapperObserver(wrapper);
    try { rewardTrendChartInstance.destroy(); } catch (e) { /* ignore */ }
    rewardTrendChartInstance = null;
  }

  ensureChartElements();
  updateSimulationUI(window.city, true);
  logReward(0);
}

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
    const shuffled = _.shuffle(MANAGER_CLASSES);
    const nextClass = shuffled.find(cls => cls !== CityManager) || _.sample(MANAGER_CLASSES);
    const nextIndex = MANAGER_CLASSES.indexOf(nextClass);
    chooseManager(nextIndex);
    stagnantCount = 0;
  }
}

function simulateStep() {
  if (!window.city || isPaused) return;
  const actionSpace = (typeof window.city.getStateArray === 'function') ? window.city.getStateArray().length : NUM_ACTIONS;
  const action = _.random(0, Math.max(0, actionSpace - 1));
  try {
    if (typeof window.city.update === 'function') {
      window.city.update(action);
    } else {
      console.warn('Current manager has no update(action) method.');
    }
  } catch (err) {
    console.error('Manager update error, switching manager:', err);
    chooseManager();
    return;
  }

  const state = (typeof window.city.getStateArray === 'function') ? window.city.getStateArray() : [];
  const reward = _.sum(state);
  logReward(reward);
  updateSimulationUI(window.city);
  autoSwitchIfStagnant(state);
}

function setupUI() {
  ensureChartElements();

  const container = document.getElementById('manager-info');
  if (container && !container.querySelector('select')) {
    const select = document.createElement('select');
    select.style.margin = "8px 0";
    select.className = "form-select form-select-sm";
    MANAGER_CLASSES.forEach((cls, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = readableNameFromCtorName(cls.name) || cls.name || `Model ${i}`;
      select.appendChild(opt);
    });
    select.onchange = (e) => {
      chooseManager(Number(e.target.value));
    };
    container.appendChild(select);
  }

  const randomBtn = document.getElementById('random-city-model-btn');
  if (randomBtn) randomBtn.onclick = () => { chooseManager(); };

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

window.addEventListener('DOMContentLoaded', () => {
  try {
    setupUI();
    chooseManager(0);
    setInterval(() => { simulateStep(); }, 1100);
  } catch (e) { console.error('init error', e); }
});

// exported for debugging
export {
  chooseManager,
  simulateStep,
  getManagerTipFor,
  readableNameFromCtorName
};
