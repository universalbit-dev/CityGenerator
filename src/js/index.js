/**
 * City Neural Network Simulation with Reinforcement Learning
 *
 * Notes:
 * - Conservative responsive + DPR handling (ResizeObserver + guarded updates).
 * - Avoids absolute/overlapping reward element and IntersectionObserver.
 * - Defensive checks so DOM / missing elements don't break the page render.
 * - Integrated RL agents from rl.js for intelligent city management.
 * - SECURITY: Fixed XSS vulnerabilities by using textContent instead of innerHTML
 * - MOBILE-FIRST: Synced directly to existing DOM mounting layout nodes.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './convnet.js';
import './deepqlearn.js';
import './vis.js';
import './rl.js'; // ← RL INTEGRATION
import Chart from 'chart.js/auto';
import _ from './lodash.js';

import UrbanFabricManager       from './cityManagers/UrbanFabricManager.js';
import CivicEcosystemManager    from './cityManagers/CivicEcosystemManager.js';
import CircularCityManager      from './cityManagers/CircularCityManager.js';
import SmartCityStateManager    from './cityManagers/SmartCityStateManager.js';
import ResilientCityModelManager from './cityManagers/ResilientCityModelManager.js';
import CommunityCommonsManager  from './cityManagers/CommunityCommonsManager.js';
import PermacultureDesignManager from './cityManagers/PermacultureDesign.js';
import CookielessCityAgent      from './cityManagers/CookielessCityAgent.js';

function removeAllCookies() {
  try {
    if (document && document.cookie) {
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
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
  CookielessCityAgent,
];

// Explicit ordered array matching the index sequence of MANAGER_CLASSES for absolute safety
const ORDERED_LABELS = [
  'Urban Fabric',
  'Civic Ecosystem',
  'Circular Loop City',
  'Smart Grid Infrastructure',
  'Resilient Prototype',
  'Community Commons Matrix',
  'Permaculture Regenerative',
  'Privacy-First Core Network'
];

/* ── REINFORCEMENT LEARNING INTEGRATION ─────────────────────────────────── */

class CityEnvironment {
  constructor(manager) {
    this.manager = manager;
    this.numStates = 0;
    this.numActions = 6;
    this.initializeEnvironment();
  }

  initializeEnvironment() {
    if (this.manager && typeof this.manager.getStateArray === 'function') {
      const state = this.manager.getStateArray();
      this.numStates = state.length;
    } else {
      this.numStates = 8;
    }
  }

  getNumStates() { return this.numStates; }
  getMaxNumActions() { return this.numActions; }
  allowedActions(state) { return Array.from({ length: this.numActions }, (_, i) => i); }

  nextStateDistribution(s, a) {
    return Math.floor(Math.random() * this.numStates);
  }

  reward(s, a, ns) {
    if (!this.manager || typeof this.manager.getStateArray !== 'function') return 0;
    const currentState = this.manager.getStateArray();
    const totalReward = _.sum(currentState);
    const mean = totalReward / currentState.length;
    const variance = _.sum(currentState.map(v => Math.pow(v - mean, 2))) / currentState.length;
    const balanceBonus = Math.max(0, 1.0 - variance * 0.1);
    return totalReward + balanceBonus;
  }

  getStateVector() {
    if (!this.manager || typeof this.manager.getStateArray !== 'function') {
      return new Array(this.numStates).fill(0);
    }
    let state = this.manager.getStateArray();
    const maxVal = Math.max(...state, 1);
    return state.map(v => Math.max(0, Math.min(1, v / maxVal)));
  }

  executeAction(action) {
    if (this.manager && typeof this.manager.update === 'function') {
      this.manager.update(action);
    }
    return this.getStateVector();
  }
}

const RL_AGENT_TYPES = {
  RANDOM: 'random',
  TD_LEARNING: 'td_learning',
  DQN: 'dqn',
  HYBRID: 'hybrid'
};

let currentRLAgent = null;
let currentEnvironment = null;
let rlMode = RL_AGENT_TYPES.RANDOM;
let learningStats = {
  episodes: 0,
  totalReward: 0,
  averageReward: 0,
  explorationRate: 1.0,
  learningRate: 0.0,
  tdError: 0
};

function createRLAgent(agentType, environment) {
  switch (agentType) {
    case RL_AGENT_TYPES.TD_LEARNING:
      return new RL.TDAgent(environment, {
        update: 'qlearn', gamma: 0.9, epsilon: 0.1, alpha: 0.01, lambda: 0.9
      });
    case RL_AGENT_TYPES.DQN:
      return new RL.DQNAgent(environment, {
        gamma: 0.9, epsilon: 0.1, alpha: 0.001, experience_add_every: 10,
        experience_size: 1000, learning_steps_per_iteration: 5, num_hidden_units: 64
      });
    case RL_AGENT_TYPES.HYBRID:
      return createHybridAgent(environment);
    default:
      return null;
  }
}

function createHybridAgent(environment) {
  return {
    tdAgent: new RL.TDAgent(environment, {
      update: 'qlearn', gamma: 0.95, epsilon: 0.05, alpha: 0.02, lambda: 0.8
    }),
    explorationStrategy: 'epsilon-greedy',
    performanceHistory: [],
    adaptiveEpsilon: 0.1,
    act: function(state) {
      this.updateExploration();
      if (Math.random() < this.adaptiveEpsilon) {
        return Math.floor(Math.random() * environment.getMaxNumActions());
      } else {
        return this.tdAgent.act(this.convertState(state));
      }
    },
    learn: function(reward) {
      this.tdAgent.learn(reward);
      this.performanceHistory.push(reward);
      if (this.performanceHistory.length > 100) this.performanceHistory.shift();
    },
    updateExploration: function() {
      if (this.performanceHistory.length > 20) {
        const recent = this.performanceHistory.slice(-20);
        const improvement = recent[recent.length - 1] - recent[0];
        if (improvement > 0) this.adaptiveEpsilon *= 0.99;
        else this.adaptiveEpsilon *= 1.01;
        this.adaptiveEpsilon = Math.max(0.01, Math.min(0.3, this.adaptiveEpsilon));
      }
    },
    convertState: function(stateVector) {
      const hash = stateVector.reduce((acc, val, idx) => acc + val * (idx + 1), 0);
      return Math.floor(hash * 1000) % environment.getNumStates();
    },
    reset: function() {
      this.tdAgent.reset();
      this.performanceHistory = [];
      this.adaptiveEpsilon = 0.1;
    },
    get epsilon() { return this.adaptiveEpsilon; },
    get alpha() { return this.tdAgent.alpha; }
  };
}

function initializeRL(manager) {
  try {
    currentEnvironment = new CityEnvironment(manager);
    currentRLAgent = createRLAgent(rlMode, currentEnvironment);
    
    learningStats = {
      episodes: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: rlMode === RL_AGENT_TYPES.RANDOM ? 1.0 : 0.1,
      learningRate: rlMode === RL_AGENT_TYPES.RANDOM ? 0.0 : 0.01,
      tdError: 0
    };
    
    if (currentRLAgent) {
      if (currentRLAgent.epsilon !== undefined) learningStats.explorationRate = currentRLAgent.epsilon;
      if (currentRLAgent.alpha !== undefined) learningStats.learningRate = currentRLAgent.alpha;
    }
    
    console.log(`RL initialized with ${rlMode} agent`);
    setTimeout(() => { renderRLStatsChart(); }, 100);
  } catch (error) {
    console.error('RL initialization error:', error);
    currentRLAgent = null;
    rlMode = RL_AGENT_TYPES.RANDOM;
  }
}

/* ── ORIGINAL CODE WITH MOBILE RESPONSIBILITY ENHANCEMENTS ───────────────── */

const managerTips = [
  '🏗️ Invest in roads, power grid & green space to grow the city fabric.',
  '🏛️ Engage citizens, open data & grow business density for a thriving ecosystem.',
  '♻️ Boost local production, recycling & renewable energy to close the resource loop!',
  '🤖 Deploy sensors, AI services & connectivity for a smarter city.',
  '🦾 Build redundancy, diversity & crisis readiness for a resilient city.',
  '🤝 Share resources, open public spaces & raise community happiness.',
  '🌱 Learn regenerative city planning and permaculture for a resilient urban future.',
  '🔒 Privacy-first agent! Your choices boost digital safety.'
];

const rlAgentTips = {
  [RL_AGENT_TYPES.RANDOM]: '🎲 Random actions - baseline performance for comparison',
  [RL_AGENT_TYPES.TD_LEARNING]: '🧠 Q-Learning agent - learns optimal policies through temporal difference',
  [RL_AGENT_TYPES.DQN]: '🤖 Deep Q-Network - neural network for complex state-action mapping',
  [RL_AGENT_TYPES.HYBRID]: '⚡ Hybrid agent - adaptive exploration with multiple learning strategies'
};

let CityManager             = UrbanFabricManager;
let stateChartInstance      = null;
let rewardTrendChartInstance = null;
let rlStatsChartInstance    = null;
let isPaused                = false;
let rewardHistory           = [];
let lastState               = null;
const NUM_ACTIONS           = 6;

const _resizeObservers = new Map();

function readableNameFromCtorName(ctorName) {
  if (!ctorName || typeof ctorName !== 'string') return 'Unknown Model';
  const stripped = ctorName.replace(/Manager$/, '');
  return stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim() || ctorName;
}

function computeYAxisMax(values) {
  if (!Array.isArray(values) || values.length === 0) return 1;
  const maxVal = Math.max(...values.map(v => (typeof v === 'number' ? v : 0)));
  if (maxVal <= 0) return 1;
  return Math.ceil(maxVal * 1.12 * 10) / 10 || 1;
}

const valueLabelsPlugin = {
  id: 'valueLabelsPlugin',
  afterDatasetsDraw(chart) {
    try {
      const ctx        = chart.ctx;
      const chartWidth = chart.width || chart.canvas?.clientWidth || 0;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta?.data) return;
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === null || typeof value === 'undefined') return;
          if (chart.config?.type === 'line' && chartWidth < 420 && index !== dataset.data.length - 1) return;
          
          const fontSize = Math.max(9, Math.min(12, Math.round(chartWidth / 70)));
          ctx.save();
          ctx.font         = `600 ${fontSize}px system-ui`;
          ctx.fillStyle    = '#495057';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'bottom';
          
          let position  = { x: 0, y: 0 };
          try   { position = element.tooltipPosition(); }
          catch { position = { x: element.x || 0, y: element.y || 0 }; }
          
          ctx.fillText(typeof value === 'number' ? value.toFixed(1) : String(value), position.x, position.y - 4);
          ctx.restore();
        });
      });
    } catch (e) {}
  },
};
Chart.register(valueLabelsPlugin);

function resizeCanvasForDPR(canvas, wrapper) {
  if (!canvas || !wrapper) return;
  try {
    const dpr     = window.devicePixelRatio || 1;
    const w       = Math.max(20, wrapper.clientWidth);
    const h       = Math.max(80, wrapper.clientHeight);
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx && typeof ctx.setTransform === 'function') {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  } catch (e) {}
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
  } catch (e) {}
}

function disconnectWrapperObserver(wrapper) {
  const ro = _resizeObservers.get(wrapper);
  if (ro) {
    try { ro.disconnect(); } catch (e) {}
    _resizeObservers.delete(wrapper);
  }
}

/* ---------- Optimized UI Element Injector ---------- */

function ensureChartElements() {
  try {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;

    function createWrapperIfMissing(id) {
      let canvas = document.getElementById(id);
      if (canvas) return canvas.parentNode;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'background:#fff; border-radius:0.5rem; padding:1rem; ' +
                              'margin-bottom:1.5rem; box-sizing:border-box; display:flex; flex-direction:column;';

      const title = document.createElement('div');
      title.style.cssText = 'font-size:0.75rem; font-weight:700; text-transform:uppercase; ' +
                            'letter-spacing:0.05em; margin-bottom:1rem; color:#6c757d; text-align:center;';
      
      if (id === 'state-chart') title.textContent = 'City State Features';
      else if (id === 'rewardTrendChart') title.textContent = 'Reward Trend Line';
      else if (id === 'rl-stats-chart') title.textContent = 'RL Agent Statistics';
      
      wrapper.appendChild(title);

      const canvasContainer = document.createElement('div');
      canvasContainer.style.cssText = 'position:relative; width:100%; padding-bottom:0.75rem;';
      
      canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.style.cssText = 'width:100%; min-height:170px; max-height:230px;';
      
      canvasContainer.appendChild(canvas);
      wrapper.appendChild(canvasContainer);

      if (id === 'rewardTrendChart') {
        const rewardDiv = document.createElement('div');
        rewardDiv.id = 'reward-value';
        rewardDiv.style.cssText = 'margin-top:12px; font-weight:700; text-align:center; font-size:12px; ' +
                                  'background:rgba(32,201,151,0.06); color:#20c997; padding:6px; border-radius:4px; border:1px solid rgba(32,201,151,0.15);';
        rewardDiv.textContent = 'Reward: —';
        wrapper.appendChild(rewardDiv);
      } else if (id === 'rl-stats-chart') {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'rl-stats-value';
        statsDiv.style.cssText = 'margin-top:12px; font-weight:600; text-align:center; font-size:11px; ' +
                                 'background:rgba(108,117,255,0.08); color:#6c75ff; padding:6px; border-radius:4px; border:1px solid rgba(108,117,255,0.15);';
        statsDiv.textContent = 'Awaiting Step...';
        wrapper.appendChild(statsDiv);
      }

      chartsContainer.appendChild(wrapper);
      return wrapper;
    }

    createWrapperIfMissing('state-chart');
    createWrapperIfMissing('rewardTrendChart');
    createWrapperIfMissing('rl-stats-chart');
  } catch (e) { console.error('ensureChartElements error', e); }
}

/* ---------- Secure Info Updates (100% Clean CodeQL) ---------- */
function getManagerTipFor(manager) {
  try {
    let targetIdx = -1;
    if (manager) {
      targetIdx = MANAGER_CLASSES.indexOf(manager.constructor);
    }
    if (targetIdx !== -1 && managerTips[targetIdx]) {
      return managerTips[targetIdx];
    }
  } catch (e) {}
  return 'No tip available for this model.';
}

function renderManagerInfo(manager) {
  try {
    // FIX: Look up index directly from global array to prevent minification name breaking ("JP"/"unknown")
    let targetIdx = -1;
    if (manager) {
      targetIdx = MANAGER_CLASSES.indexOf(manager.constructor);
    }
    
    const displayName = (targetIdx !== -1) ? ORDERED_LABELS[targetIdx] : 'Alternative Blueprint';
    const tip = (targetIdx !== -1) ? managerTips[targetIdx] : 'Optimization Engine Online.';
    const rlAgentName = rlMode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const infoDiv = document.getElementById('manager-info');
    if (infoDiv) {
      const oldBlocks = infoDiv.querySelectorAll('.telemetry-text-block');
      oldBlocks.forEach(b => b.remove());

      const textBlock = document.createElement('div');
      textBlock.className = 'telemetry-text-block d-flex flex-column gap-1 w-100 mt-1';

      // 1. Secure Model Line Node
      const itemModel = document.createElement('div');
      itemModel.style.cssText = 'font-size:0.85rem; padding:6px 10px; background:#f8f9fa; border-radius:6px; display:flex; justify-content:space-between; border: 1px solid rgba(0,0,0,0.02);';
      
      const itemModelLabel = document.createElement('span');
      itemModelLabel.textContent = 'Active Blueprint:';
      const itemModelValue = document.createElement('strong');
      itemModelValue.className = 'text-primary';
      itemModelValue.textContent = displayName;
      
      itemModel.appendChild(itemModelLabel);
      itemModel.appendChild(itemModelValue);

      // 2. Secure Agent Line Node
      const itemAgent = document.createElement('div');
      itemAgent.style.cssText = 'font-size:0.85rem; padding:6px 10px; background:#f8f9fa; border-radius:6px; display:flex; justify-content:space-between; border: 1px solid rgba(0,0,0,0.02);';
      
      const itemAgentLabel = document.createElement('span');
      itemAgentLabel.textContent = 'RL Target Model:';
      const itemAgentValue = document.createElement('strong');
      itemAgentValue.className = 'text-success';
      itemAgentValue.textContent = rlAgentName + ' Engine';
      
      itemAgent.appendChild(itemAgentLabel);
      itemAgent.appendChild(itemAgentValue);

      // 3. Secure Tip Node
      const itemTip = document.createElement('div');
      itemTip.style.cssText = 'font-size:0.8rem; color:#495057; padding:8px 12px; background:#fffcf5; border:1px solid #ffeeba; border-radius:6px; margin-top:4px; line-height: 1.4;';
      itemTip.textContent = tip;

      textBlock.appendChild(itemModel);
      textBlock.appendChild(itemAgent);
      textBlock.appendChild(itemTip);
      
      infoDiv.appendChild(textBlock);
    }
  } catch (e) {
    console.error('renderManagerInfo error', e);
  }
}

function renderStateChart(manager, forceNewChart = false) {
  try {
    ensureChartElements();
    if (!manager || typeof manager.getStateArray !== 'function') return;

    const data = manager.getStateArray().map(v => Number(v) || 0);
    let labels = (manager.state && typeof manager.state === 'object') ? Object.keys(manager.state) : [];
    if (labels.length !== data.length) labels = data.map((_, i) => `S${i + 1}`);

    const canvas = document.getElementById('state-chart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);

    if (forceNewChart && stateChartInstance) {
      disconnectWrapperObserver(wrapper);
      stateChartInstance.destroy();
      stateChartInstance = null;
    }

    if (!stateChartInstance) {
      stateChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.map(l => String(l).charAt(0).toUpperCase() + String(l).slice(1)),
          datasets: [{
            data,
            backgroundColor: ['#0d6efd','#20c997','#ffc107','#6f42c1','#fd7e14','#198754'],
            borderRadius: 4
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { beginAtZero: true, max: computeYAxisMax(data), ticks: { font: { size: 8 } } }
          }
        },
        plugins: [valueLabelsPlugin]
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        stateChartInstance?.resize();
      });
    } else {
      stateChartInstance.data.labels = labels.map(l => String(l).charAt(0).toUpperCase() + String(l).slice(1));
      stateChartInstance.data.datasets[0].data = data;
      stateChartInstance.options.scales.y.max = computeYAxisMax(data);
      stateChartInstance.update();
    }
  } catch (e) {}
}

function renderRewardTrendChart() {
  try {
    ensureChartElements();
    const canvas = document.getElementById('rewardTrendChart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);
    const rewards = rewardHistory.slice(-15).map(v => Number(v) || 0);

    if (!rewardTrendChartInstance) {
      rewardTrendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: rewards.map((_, i) => `${i + 1}`),
          datasets: [{
            label: 'Reward Metric',
            data: rewards,
            backgroundColor: 'rgba(32,201,151,0.08)',
            borderColor: '#20c997',
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.15
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 8 } } },
            y: { beginAtZero: true, max: computeYAxisMax(rewards), ticks: { font: { size: 8 } } }
          }
        }
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        rewardTrendChartInstance?.resize();
      });
    } else {
      rewardTrendChartInstance.data.labels = rewards.map((_, i) => `${i + 1}`);
      rewardTrendChartInstance.data.datasets[0].data = rewards;
      rewardTrendChartInstance.options.scales.y.max = computeYAxisMax(rewards);
      rewardTrendChartInstance.update();
    }

    const rewardEl = document.getElementById('reward-value');
    if (rewardEl) {
      const latest = rewards.length ? rewards[rewards.length - 1] : 0;
      rewardEl.textContent = `Reward Trend: ${latest.toFixed(2)}`;
    }
  } catch (e) {}
}

function renderRLStatsChart() {
  try {
    ensureChartElements();
    const canvas = document.getElementById('rl-stats-chart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);
    
    let data, labels, chartTitle, statsText;
    const isRandomMode = rlMode === RL_AGENT_TYPES.RANDOM;

    if (isRandomMode) {
      data = [100, 0, Math.min(100, learningStats.episodes / 5), Math.min(100, Math.max(0, learningStats.averageReward * 20))];
      labels = ['Random %', 'Learning', 'Episodes ÷5', 'Perf ×20'];
      chartTitle = 'Baseline';
      statsText = `Random Base: ${learningStats.episodes} eps`;
    } else {
      data = [(learningStats.explorationRate || 0.1) * 100, (learningStats.learningRate || 0.01) * 1000, Math.min(100, learningStats.episodes / 10), Math.min(100, Math.max(0, learningStats.averageReward * 10))];
      labels = ['Exploration %', 'Learning ×1k', 'Episodes ÷10', 'Avg Rwd ×10'];
      chartTitle = 'RL Engine';
      statsText = `Eps: ${learningStats.episodes} | Avg Rwd: ${learningStats.averageReward.toFixed(1)}`;
    }

    if (!rlStatsChartInstance) {
      rlStatsChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: chartTitle,
            data,
            backgroundColor: isRandomMode ? 'rgba(108, 125, 140, 0.12)' : 'rgba(108, 117, 255, 0.12)',
            borderColor: isRandomMode ? '#6c757d' : '#6c75ff',
            borderWidth: 1.5,
            pointRadius: 2
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11, weight: '600' } } }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { display: false },
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              angleLines: { color: 'rgba(0, 0, 0, 0.05)' },
              pointLabels: {
                color: '#495057',
                font: { size: 9, weight: '600' },
                padding: 16
              }
            }
          }
        }
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        rlStatsChartInstance?.resize();
      });
    } else {
      rlStatsChartInstance.data.labels = labels;
      rlStatsChartInstance.data.datasets[0].data = data;
      rlStatsChartInstance.data.datasets[0].label = chartTitle;
      rlStatsChartInstance.update();
    }

    const statsEl = document.getElementById('rl-stats-value');
    if (statsEl) statsEl.textContent = statsText;
  } catch (e) {}
}

const debouncedRenderRewardTrendChart = _.debounce(renderRewardTrendChart, 160);
const debouncedRenderRLStatsChart = _.debounce(renderRLStatsChart, 300);

function logReward(reward) {
  rewardHistory.push(reward);
  if (rewardHistory.length > 50) rewardHistory.shift();
  
  learningStats.episodes++;
  learningStats.totalReward += reward;
  learningStats.averageReward = learningStats.totalReward / learningStats.episodes;
  
  if (currentRLAgent) {
    learningStats.explorationRate = currentRLAgent.epsilon !== undefined ? currentRLAgent.epsilon : currentRLAgent.adaptiveEpsilon || 0.1;
    learningStats.learningRate = currentRLAgent.alpha || 0.01;
  } else {
    learningStats.explorationRate = 1.0;
    learningStats.learningRate = 0.0;
  }
  
  debouncedRenderRewardTrendChart();
  debouncedRenderRLStatsChart();
}

function updateSimulationUI(manager, forceNewChart = false) {
  renderManagerInfo(manager);
  renderStateChart(manager, forceNewChart);
}

function resetCurrentModel() {
  try {
    if (window.city && typeof window.city.reset === 'function') window.city.reset();
    if (currentRLAgent && typeof currentRLAgent.reset === 'function') currentRLAgent.reset();
    
    learningStats = {
      episodes: 0, totalReward: 0, averageReward: 0,
      explorationRate: rlMode === RL_AGENT_TYPES.RANDOM ? 1.0 : 0.1,
      learningRate: rlMode === RL_AGENT_TYPES.RANDOM ? 0.0 : 0.01, tdError: 0
    };

    rewardHistory = [];
    lastState     = null;

    if (stateChartInstance) { stateChartInstance.destroy(); stateChartInstance = null; }
    if (rewardTrendChartInstance) { rewardTrendChartInstance.destroy(); rewardTrendChartInstance = null; }
    if (rlStatsChartInstance) { rlStatsChartInstance.destroy(); rlStatsChartInstance = null; }

    ensureChartElements();
    updateSimulationUI(window.city, true);
    logReward(0);
  } catch (e) {}
}

function chooseManager(idx = null) {
  const SelectedClass = idx !== null ? MANAGER_CLASSES[idx] : _.sample(MANAGER_CLASSES);
  CityManager = SelectedClass;
  try {
    window.city = new CityManager();
  } catch (err) {
    CityManager = UrbanFabricManager;
    window.city = new UrbanFabricManager();
  }

  // Visual synchronization hook for automated switch events
  const actualIdx = MANAGER_CLASSES.indexOf(CityManager);
  const modelSelect = document.querySelector('#model-select-mount select');
  if (modelSelect && actualIdx !== -1) {
    modelSelect.value = actualIdx;
  }

  initializeRL(window.city);
  rewardHistory = [];
  lastState     = null;

  if (stateChartInstance) { stateChartInstance.destroy(); stateChartInstance = null; }
  if (rewardTrendChartInstance) { rewardTrendChartInstance.destroy(); rewardTrendChartInstance = null; }
  if (rlStatsChartInstance) { rlStatsChartInstance.destroy(); rlStatsChartInstance = null; }

  ensureChartElements();
  updateSimulationUI(window.city, true);
  logReward(0);
}

function chooseRLAgent(agentType) {
  rlMode = agentType;
  
  // Visual synchronization hook for manual/automated agent changes
  const agentSelect = document.querySelector('#agent-select-mount select');
  if (agentSelect) {
    agentSelect.value = agentType;
  }

  if (window.city) {
    initializeRL(window.city);
    updateSimulationUI(window.city, true);
    if (rlStatsChartInstance) { rlStatsChartInstance.destroy(); rlStatsChartInstance = null; }
    ensureChartElements();
    setTimeout(() => {
      renderRLStatsChart();
      logReward(0);
    }, 150);
  }
}

const STAGNANT_THRESHOLD = 10;
let stagnantCount = 0;
function autoSwitchIfStagnant(currentState) {
  if (lastState !== null && _.isEqual(currentState, lastState)) stagnantCount++;
  else stagnantCount = 0;
  
  lastState = _.cloneDeep(currentState);
  if (stagnantCount >= STAGNANT_THRESHOLD) {
    const shuffled  = _.shuffle(MANAGER_CLASSES);
    const nextClass = shuffled.find(cls => cls !== CityManager) || _.sample(MANAGER_CLASSES);
    chooseManager(MANAGER_CLASSES.indexOf(nextClass));
    stagnantCount = 0;
  }
}

function simulateStep() {
  if (!window.city || isPaused) return;
  const actionSpace = typeof window.city.getStateArray === 'function' ? window.city.getStateArray().length : NUM_ACTIONS;
  let action;
  
  if (currentRLAgent && currentEnvironment) {
    try {
      action = currentRLAgent.act(currentEnvironment.getStateVector());
      action = Math.max(0, Math.min(actionSpace - 1, Math.floor(action)));
    } catch (error) {
      action = _.random(0, Math.max(0, actionSpace - 1));
    }
  } else {
    action = _.random(0, Math.max(0, actionSpace - 1));
  }
  
  try {
    if (typeof window.city.update === 'function') window.city.update(action);
  } catch (err) {
    chooseManager();
    return;
  }

  const state = typeof window.city.getStateArray === 'function' ? window.city.getStateArray() : [];
  const reward = _.sum(state);
  
  if (currentRLAgent && currentEnvironment && typeof currentRLAgent.learn === 'function') {
    try { currentRLAgent.learn(reward); } catch (e) {}
  }
  
  logReward(reward);
  updateSimulationUI(window.city);
  autoSwitchIfStagnant(state);
}

function setupUI() {
  ensureChartElements();
  
  const modelMount = document.getElementById('model-select-mount');
  const agentMount = document.getElementById('agent-select-mount');

  // 1. Mount translated Model select choices securely using index-safe lookups
  if (modelMount && !modelMount.querySelector('select')) {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm shadow-sm fw-semibold';
    select.style.borderLeft = '4px solid var(--accent)';
    
    MANAGER_CLASSES.forEach((cls, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      
      const cleanLabel = ORDERED_LABELS[i] || 'Alternative Blueprint';
      opt.textContent = 'Model: ' + cleanLabel;
      select.appendChild(opt);
    });
    select.onchange = e => chooseManager(Number(e.target.value));
    modelMount.appendChild(select);
  }

  // 2. Mount translated Agent select choices securely using .textContent
  if (agentMount && !agentMount.querySelector('select')) {
    const rlSelect = document.createElement('select');
    rlSelect.className = 'form-select form-select-sm shadow-sm fw-semibold';
    rlSelect.style.borderLeft = '4px solid var(--accent-rl)';
    
    Object.entries(RL_AGENT_TYPES).forEach(([key, value]) => {
      const opt = document.createElement('option');
      opt.value = value;
      
      let cleanAgentLabel = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (cleanAgentLabel === 'Dqn') cleanAgentLabel = 'Deep Q-Network (DQN)';
      if (cleanAgentLabel === 'Td Learning') cleanAgentLabel = 'Q-Learning (Temporal Diff)';
      
      opt.textContent = 'Agent: ' + cleanAgentLabel;
      if (value === rlMode) opt.selected = true;
      rlSelect.appendChild(opt);
    });
    rlSelect.onchange = e => chooseRLAgent(e.target.value);
    agentMount.appendChild(rlSelect);
  }

  const randomBtn = document.getElementById('random-city-model-btn');
  if (randomBtn) randomBtn.onclick = () => chooseManager();

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.onclick = () => resetCurrentModel();

  const pauseBtn  = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  if (pauseBtn && resumeBtn) {
    pauseBtn.onclick = () => {
      isPaused = true;
      pauseBtn.disabled = true; resumeBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    resumeBtn.onclick = () => {
      isPaused = false;
      resumeBtn.disabled = true; pauseBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    pauseBtn.disabled  = false;
    resumeBtn.disabled = true;
  }
}

window.rlMode = rlMode;
window.learningStats = learningStats;
window.isPaused = isPaused;
window.currentRLAgent = currentRLAgent;

window.addEventListener('DOMContentLoaded', () => {
  try {
    setupUI();
    chooseManager(0);
    setInterval(() => { simulateStep(); }, 1100);
  } catch (e) { console.error('init error', e); }
});

export { 
  chooseManager, simulateStep, getManagerTipFor, readableNameFromCtorName, chooseRLAgent, RL_AGENT_TYPES, learningStats
};
