/**
 * City Neural Network Simulation with Reinforcement Learning
 *
 * Notes:
 * - Conservative responsive + DPR handling (ResizeObserver + guarded updates).
 * - Avoids absolute/overlapping reward element and IntersectionObserver.
 * - Defensive checks so DOM / missing elements don't break the page render.
 * - Integrated RL agents from rl.js for intelligent city management.
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

/* ── REINFORCEMENT LEARNING INTEGRATION ─────────────────────────────────── */

// RL Environment Wrapper for City Managers
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
      this.numStates = 8; // default fallback
    }
  }

  getNumStates() {
    return this.numStates;
  }

  getMaxNumActions() {
    return this.numActions;
  }

  allowedActions(state) {
    return Array.from({ length: this.numActions }, (_, i) => i);
  }

  nextStateDistribution(s, a) {
    // Simulate action and return next state index
    return Math.floor(Math.random() * this.numStates);
  }

  reward(s, a, ns) {
    // Calculate reward based on state transition
    if (!this.manager || typeof this.manager.getStateArray !== 'function') return 0;
    
    const currentState = this.manager.getStateArray();
    const totalReward = _.sum(currentState);
    
    // Bonus for balanced development
    const mean = totalReward / currentState.length;
    const variance = _.sum(currentState.map(v => Math.pow(v - mean, 2))) / currentState.length;
    const balanceBonus = Math.max(0, 1.0 - variance * 0.1);
    
    return totalReward + balanceBonus;
  }

  // Convert manager state to RL-compatible format
  getStateVector() {
    if (!this.manager || typeof this.manager.getStateArray !== 'function') {
      return new Array(this.numStates).fill(0);
    }
    
    let state = this.manager.getStateArray();
    // Normalize state values to [0,1] range
    const maxVal = Math.max(...state, 1);
    return state.map(v => Math.max(0, Math.min(1, v / maxVal)));
  }

  // Execute action on the city manager
  executeAction(action) {
    if (this.manager && typeof this.manager.update === 'function') {
      this.manager.update(action);
    }
    return this.getStateVector();
  }
}

// RL Agent Types
const RL_AGENT_TYPES = {
  RANDOM: 'random',
  TD_LEARNING: 'td_learning',
  DQN: 'dqn',
  HYBRID: 'hybrid'
};

// Global RL variables
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

// RL Agent Factory
function createRLAgent(agentType, environment) {
  switch (agentType) {
    case RL_AGENT_TYPES.TD_LEARNING:
      return new RL.TDAgent(environment, {
        update: 'qlearn',
        gamma: 0.9,
        epsilon: 0.1,
        alpha: 0.01,
        lambda: 0.9
      });
    
    case RL_AGENT_TYPES.DQN:
      return new RL.DQNAgent(environment, {
        gamma: 0.9,
        epsilon: 0.1,
        alpha: 0.001,
        experience_add_every: 10,
        experience_size: 1000,
        learning_steps_per_iteration: 5,
        num_hidden_units: 64
      });
    
    case RL_AGENT_TYPES.HYBRID:
      return createHybridAgent(environment);
    
    default:
      return null; // Random agent (no RL)
  }
}

function createHybridAgent(environment) {
  const agent = {
    tdAgent: new RL.TDAgent(environment, {
      update: 'qlearn',
      gamma: 0.95,
      epsilon: 0.05,
      alpha: 0.02,
      lambda: 0.8
    }),
    
    explorationStrategy: 'epsilon-greedy',
    performanceHistory: [],
    adaptiveEpsilon: 0.1,
    
    act: function(state) {
      // Adaptive exploration based on recent performance
      this.updateExploration();
      
      if (Math.random() < this.adaptiveEpsilon) {
        // Exploration: random action
        return Math.floor(Math.random() * environment.getMaxNumActions());
      } else {
        // Exploitation: use TD agent's policy
        return this.tdAgent.act(this.convertState(state));
      }
    },
    
    learn: function(reward) {
      this.tdAgent.learn(reward);
      this.performanceHistory.push(reward);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }
    },
    
    updateExploration: function() {
      if (this.performanceHistory.length > 20) {
        const recent = this.performanceHistory.slice(-20);
        const improvement = recent[recent.length - 1] - recent[0];
        
        if (improvement > 0) {
          this.adaptiveEpsilon *= 0.99; // Decrease exploration if improving
        } else {
          this.adaptiveEpsilon *= 1.01; // Increase exploration if stagnating
        }
        
        this.adaptiveEpsilon = Math.max(0.01, Math.min(0.3, this.adaptiveEpsilon));
      }
    },
    
    convertState: function(stateVector) {
      // Convert normalized state to discrete state index for TD agent
      const hash = stateVector.reduce((acc, val, idx) => acc + val * (idx + 1), 0);
      return Math.floor(hash * 1000) % environment.getNumStates();
    },
    
    reset: function() {
      this.tdAgent.reset();
      this.performanceHistory = [];
      this.adaptiveEpsilon = 0.1;
    },

    // Expose properties for stats display
    get epsilon() { return this.adaptiveEpsilon; },
    get alpha() { return this.tdAgent.alpha; }
  };
  
  return agent;
}

// Initialize RL system for current manager
function initializeRL(manager) {
  try {
    currentEnvironment = new CityEnvironment(manager);
    currentRLAgent = createRLAgent(rlMode, currentEnvironment);
    
    // Reset learning statistics
    learningStats = {
      episodes: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: rlMode === RL_AGENT_TYPES.RANDOM ? 1.0 : 0.1,
      learningRate: rlMode === RL_AGENT_TYPES.RANDOM ? 0.0 : 0.01,
      tdError: 0
    };
    
    // Set initial agent parameters
    if (currentRLAgent) {
      if (currentRLAgent.epsilon !== undefined) {
        learningStats.explorationRate = currentRLAgent.epsilon;
      }
      if (currentRLAgent.alpha !== undefined) {
        learningStats.learningRate = currentRLAgent.alpha;
      }
    }
    
    console.log(`RL initialized with ${rlMode} agent for ${manager.constructor.name}`);
    
    // Force immediate chart update
    setTimeout(() => {
      renderRLStatsChart();
    }, 100);
    
  } catch (error) {
    console.error('RL initialization error:', error);
    currentRLAgent = null;
    rlMode = RL_AGENT_TYPES.RANDOM;
    
    // Set fallback stats for random mode
    learningStats = {
      episodes: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: 1.0,
      learningRate: 0.0,
      tdError: 0
    };
  }
}

/* ── ORIGINAL CODE WITH RL ENHANCEMENTS ─────────────────────────────────── */

const managerTips = {
  'UrbanFabricManager':         '🏗️ Invest in roads, power grid & green space to grow the city fabric.',
  'CivicEcosystemManager':      '🏛️ Engage citizens, open data & grow business density for a thriving ecosystem.',
  'CircularCityManager':        '♻️ Boost local production, recycling & renewable energy to close the resource loop!',
  'SmartCityStateManager':      '🤖 Deploy sensors, AI services & connectivity for a smarter city.',
  'ResilientCityModelManager':  '🦾 Build redundancy, diversity & crisis readiness for a resilient city.',
  'CommunityCommonsManager':    '🤝 Share resources, open public spaces & raise community happiness.',
  'PermacultureDesignManager':  '🌱 Learn regenerative city planning and permaculture for a resilient urban future.',
  'CookielessCityAgent':        '🔒 Privacy-first agent! Your choices boost digital safety.',
};

// RL Agent tips
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

/* ---------- Helpers ---------- */

function readableNameFromCtorName(ctorName) {
  if (!ctorName || typeof ctorName !== 'string') return 'Unknown Model';
  const stripped = ctorName.replace(/Manager$/, '');
  const spaced   = stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.trim() || ctorName;
}

function getManagerTipFor(manager) {
  try {
    const ctorName = (typeof manager === 'function')
      ? (manager.name || '')
      : (manager && manager.constructor && manager.constructor.name)
        ? manager.constructor.name : '';
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
  const padded  = maxVal * 1.12;
  const rounded = Math.ceil(padded * 10) / 10;
  return rounded || 1;
}

/* value label plugin */
const valueLabelsPlugin = {
  id: 'valueLabelsPlugin',
  afterDatasetsDraw(chart) {
    try {
      const ctx        = chart.ctx;
      const chartWidth = chart.width || (chart.canvas && chart.canvas.clientWidth) || 0;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || !meta.data) return;
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === null || typeof value === 'undefined') return;
          const isLine      = chart.config && chart.config.type === 'line';
          const totalPoints = dataset.data.length || 0;
          if (isLine && chartWidth < 420 && index !== totalPoints - 1) return;
          const fontSize = Math.max(10, Math.min(14, Math.round(chartWidth / 60)));
          ctx.save();
          ctx.font         = `${fontSize}px sans-serif`;
          ctx.fillStyle    = '#222';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'bottom';
          const padding = 6;
          let position  = { x: 0, y: 0 };
          try   { position = element.tooltipPosition(); }
          catch { position = { x: element.x || 0, y: element.y || 0 }; }
          const displayText = (typeof value === 'number') ? value.toFixed(2) : String(value);
          ctx.fillText(displayText, position.x, Math.max(padding + fontSize, position.y - padding));
          ctx.restore();
        });
      });
    } catch (e) { /* don't let plugin throw */ }
  },
};
Chart.register(valueLabelsPlugin);

/* ---------- Responsive canvas utilities ---------- */

function safeResetTransform(ctx) {
  if (!ctx) return;
  try {
    if      (typeof ctx.resetTransform === 'function') ctx.resetTransform();
    else if (typeof ctx.setTransform   === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0);
  } catch (e) { /* ignore */ }
}

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
      if (ctx) {
        safeResetTransform(ctx);
        if      (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        else if (typeof ctx.scale        === 'function') ctx.scale(dpr, dpr);
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
  } catch (e) { /* ResizeObserver unsupported */ }
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
      chartsContainer    = document.createElement('div');
      chartsContainer.id = 'charts-container';
      chartsContainer.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;' +
        'align-items:flex-start;margin-top:12px;width:100%;box-sizing:border-box;';
      const infoEl = document.getElementById('manager-info');
      if (infoEl && infoEl.parentNode) infoEl.parentNode.insertBefore(chartsContainer, infoEl.nextSibling);
      else if (document.body) document.body.appendChild(chartsContainer);
      else return;
    }

    function createWrapperIfMissing(id, defaultHeight = 320) {
      const existingCanvas = document.getElementById(id);
      if (existingCanvas) {
        const parent = existingCanvas.parentNode;
        if (parent && parent.dataset && parent.dataset.chartWrapper === '1') return parent;
      }

      const wrapper = document.createElement('div');
      wrapper.dataset.chartWrapper = '1';
      wrapper.style.cssText =
        `background:#fff;border-radius:0.75rem;box-shadow:0 2px 10px rgba(0,0,0,0.08);` +
        `padding:1rem;box-sizing:border-box;min-height:${defaultHeight}px;` +
        `display:flex;flex-direction:column;transition:transform 0.2s, box-shadow 0.2s;`;

      // Add special styling for RL stats chart
      if (id === 'rl-stats-chart') {
        wrapper.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)';
        wrapper.style.border = '2px solid rgba(108,117,255,0.15)';
        wrapper.classList.add('rl-stats-wrapper');
      }

      // Add chart title
      const title = document.createElement('div');
      title.className = 'chart-title';
      title.style.cssText = 'font-size:0.9rem;font-weight:600;text-align:center;margin-bottom:0.5rem;color:#495057;';
      
      if (id === 'state-chart') {
        title.textContent = 'City State Features';
      } else if (id === 'rewardTrendChart') {
        title.textContent = 'Reward Trend';
      } else if (id === 'rl-stats-chart') {
        title.textContent = 'RL Agent Statistics';
      }
      
      wrapper.appendChild(title);

      const canvas = document.createElement('canvas');
      canvas.id              = id;
      canvas.style.cssText   = 'flex:1;min-height:200px;max-height:400px;';
      wrapper.appendChild(canvas);

      if (id === 'rewardTrendChart') {
        const rewardDiv = document.createElement('div');
        rewardDiv.id            = 'reward-value';
        rewardDiv.style.cssText = 'margin-top:8px;font-weight:700;text-align:center;' +
                                  'font-size:14px;display:block;background:rgba(32,201,151,0.1);' +
                                  'color:#20c997;padding:6px 12px;border-radius:6px;' +
                                  'border:1px solid rgba(32,201,151,0.3);';
        rewardDiv.innerText     = 'Reward: —';
        wrapper.appendChild(rewardDiv);
      } else if (id === 'rl-stats-chart') {
        const statsDiv = document.createElement('div');
        statsDiv.id            = 'rl-stats-value';
        statsDiv.style.cssText = 'margin-top:8px;font-weight:600;text-align:center;' +
                                 'font-size:12px;display:block;background:rgba(108,117,255,0.15);' +
                                 'color:#6c75ff;padding:6px 12px;border-radius:6px;' +
                                 'border:1px solid rgba(108,117,255,0.3);';
        statsDiv.innerHTML     = 'Initializing RL Stats...';
        wrapper.appendChild(statsDiv);
      }

      chartsContainer.appendChild(wrapper);
      return wrapper;
    }

    createWrapperIfMissing('state-chart',       340);
    createWrapperIfMissing('rewardTrendChart',  340);
    createWrapperIfMissing('rl-stats-chart',   280);
  } catch (e) { console.error('ensureChartElements error', e); }
}

/* ---------- Chart rendering ---------- */

function renderManagerInfo(manager) {
  try {
    // ── Read instance-level modelName/modelTip first (minification-safe) ──
    const displayName = (manager && manager.modelName)
      ? manager.modelName
      : readableNameFromCtorName(
          manager && manager.constructor && manager.constructor.name
            ? manager.constructor.name
            : (typeof manager === 'function' ? manager.name : '')
        );

    const tip = (manager && manager.modelTip)
      ? manager.modelTip
      : getManagerTipFor(manager);

    // ← Add RL agent info
    const rlAgentName = rlMode.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const rlTip = rlAgentTips[rlMode] || 'No RL tip available';

    const infoDiv = document.getElementById('manager-info');
    if (infoDiv) {
      infoDiv.style.textAlign  = 'center';
      infoDiv.style.whiteSpace = 'normal';
      infoDiv.innerHTML =
        `<div style="display:inline-block;max-width:92%;">
           <div style="font-weight:700;font-size:1.05rem;margin-bottom:6px">
             Current Model: <span style="color:#007bff">${displayName}</span>
           </div>
           <div style="font-weight:600;font-size:0.95rem;margin-bottom:4px;color:#28a745">
             RL Agent: ${rlAgentName}
           </div>
           <div id="manager-tip" style="color:#333;margin-top:6px;font-size:0.95rem;">
             ${tip}
           </div>
           <div id="rl-tip" style="color:#666;margin-top:4px;font-size:0.85rem;">
             ${rlTip}
           </div>
         </div>`;
    }
  } catch (e) { /* ignore */ }
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

    const data   = manager.getStateArray().map(v => Number(v) || 0);
    let   labels = (manager.state && typeof manager.state === 'object') ? Object.keys(manager.state) : [];
    if (labels.length !== data.length) labels = data.map((_, i) => `S${i + 1}`);

    const canvas = document.getElementById('state-chart');
    if (!canvas) return;
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);
    const ctx  = canvas.getContext('2d');
    const yMax = computeYAxisMax(data);
    const step = Math.max(0.05, +(yMax / 5).toFixed(3));

    if (forceNewChart && stateChartInstance) {
      disconnectWrapperObserver(wrapper);
      try { stateChartInstance.destroy(); } catch (e) { /* ignore */ }
      stateChartInstance = null;
    }

    if (!stateChartInstance) {
      stateChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.map(l => String(l).charAt(0).toUpperCase() + String(l).slice(1)),
          datasets: [{
            label: 'City Features',
            data,
            backgroundColor: ['#0d6efd','#20c997','#ffc107','#6f42c1','#fd7e14','#198754','#4bc0c0'],
            borderRadius: 6,
            categoryPercentage: 0.6,
            barPercentage: 0.8,
            barThickness: 'flex',
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          layout:  { padding: { top: 12, right: 12, bottom: 6, left: 6 } },
          scales: {
            x: { grid: { display: false, drawBorder: false }, ticks: { color: '#333' } },
            y: { beginAtZero: true, max: yMax, ticks: { stepSize: step, color: '#333' }, grid: { color: 'rgba(0,0,0,0.06)' } },
          },
          animation: { duration: 420, easing: 'easeOutQuart' },
        },
        plugins: [valueLabelsPlugin],
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        try { stateChartInstance?.resize(); } catch (e) { /* ignore */ }
      });
    } else {
      stateChartInstance.data.labels              = labels.map(l => String(l).charAt(0).toUpperCase() + String(l).slice(1));
      stateChartInstance.data.datasets[0].data    = data;
      stateChartInstance.options.scales.y.max     = computeYAxisMax(data);
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
    const ctx     = canvas.getContext('2d');
    const rewards = rewardHistory.slice(-20).map(v => Number(v) || 0);

    if (!rewardTrendChartInstance) {
      const yMax = computeYAxisMax(rewards);
      const step = Math.max(0.05, +(yMax / 5).toFixed(3));
      rewardTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: rewards.map((_, i) => `${i + 1}`),
          datasets: [{
            label: 'Reward',
            data: rewards,
            backgroundColor: 'rgba(32,201,151,0.13)',
            borderColor: '#20c997',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: '#0d6efd',
            tension: 0.18,
            fill: true,
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: true }, tooltip: { enabled: true } },
          layout:  { padding: { top: 8, right: 10, bottom: 6, left: 6 } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#333' } },
            y: { beginAtZero: true, max: yMax, ticks: { stepSize: step, color: '#333' }, grid: { color: 'rgba(0,0,0,0.06)' } },
          },
        },
        plugins: [valueLabelsPlugin],
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        try { rewardTrendChartInstance?.resize(); } catch (e) { /* ignore */ }
      });
    } else {
      rewardTrendChartInstance.data.labels              = rewards.map((_, i) => `${i + 1}`);
      rewardTrendChartInstance.data.datasets[0].data    = rewards;
      rewardTrendChartInstance.options.scales.y.max     = computeYAxisMax(rewards);
      rewardTrendChartInstance.options.scales.y.ticks.stepSize = Math.max(0.05, +(rewardTrendChartInstance.options.scales.y.max / 5).toFixed(3));
      rewardTrendChartInstance.update();
    }

    const rewardEl = wrapper.querySelector('#reward-value') || document.getElementById('reward-value');
    if (rewardEl) {
      const latest = rewards.length ? rewards[rewards.length - 1] : 0;
      rewardEl.innerText = `Reward: ${typeof latest === 'number' ? latest.toFixed(3) : String(latest)}`;
    }
  } catch (e) { console.error('renderRewardTrendChart error', e); }
}

// ← ENHANCED: RL Stats Chart with proper data for all agent types
function renderRLStatsChart() {
  try {
    ensureChartElements();
    const canvas = document.getElementById('rl-stats-chart');
    if (!canvas) return;
    
    const wrapper = canvas.parentNode;
    resizeCanvasForDPR(canvas, wrapper);
    const ctx = canvas.getContext('2d');
    
    let data, labels, chartTitle, statsText;
    
    if (rlMode === RL_AGENT_TYPES.RANDOM) {
      // For random agent, show baseline performance metrics
      data = [
        100, // Random exploration (always 100%)
        0,   // No learning
        Math.min(100, learningStats.episodes / 5), // Episodes scaled
        Math.min(100, Math.max(0, learningStats.averageReward * 20)) // Reward scaled
      ];
      labels = ['Random %', 'Learning Rate', 'Episodes ÷5', 'Performance ×20'];
      chartTitle = 'Random Agent - Baseline Metrics';
      statsText = `Baseline: ${learningStats.episodes} episodes | Avg: ${learningStats.averageReward.toFixed(2)}`;
    } else {
      // For actual RL agents, show learning statistics
      data = [
        (learningStats.explorationRate || 0.1) * 100,
        (learningStats.learningRate || 0.01) * 1000,
        Math.min(100, learningStats.episodes / 10),
        Math.min(100, Math.max(0, learningStats.averageReward * 10))
      ];
      labels = ['Exploration %', 'Learning ×1000', 'Episodes ÷10', 'Avg Reward ×10'];
      chartTitle = `${rlMode.toUpperCase()} Agent - Learning Progress`;
      statsText = `Episodes: ${learningStats.episodes} | Exploration: ${((learningStats.explorationRate || 0.1) * 100).toFixed(1)}% | Avg Reward: ${learningStats.averageReward.toFixed(2)}`;
    }

    if (!rlStatsChartInstance) {
      rlStatsChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: chartTitle,
            data,
            backgroundColor: rlMode === RL_AGENT_TYPES.RANDOM 
              ? 'rgba(108, 117, 125, 0.15)' 
              : 'rgba(108, 117, 255, 0.2)',
            borderColor: rlMode === RL_AGENT_TYPES.RANDOM 
              ? '#6c757d' 
              : '#6c75ff',
            borderWidth: 2,
            pointBackgroundColor: rlMode === RL_AGENT_TYPES.RANDOM 
              ? '#6c757d' 
              : '#6c75ff',
            pointRadius: 4,
            pointHoverRadius: 6,
          }],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { 
            legend: { 
              display: true,
              position: 'top',
              labels: {
                font: { size: 11 },
                color: '#495057'
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label;
                  const value = context.parsed.r;
                  
                  if (rlMode === RL_AGENT_TYPES.RANDOM) {
                    switch(label) {
                      case 'Random %': return `Random Actions: ${value.toFixed(1)}%`;
                      case 'Learning Rate': return 'No Learning (Baseline)';
                      case 'Episodes ÷5': return `Episodes: ${learningStats.episodes}`;
                      case 'Performance ×20': return `Performance: ${(value/20).toFixed(2)}`;
                    }
                  } else {
                    switch(label) {
                      case 'Exploration %': return `Exploration: ${value.toFixed(1)}%`;
                      case 'Learning ×1000': return `Learning Rate: ${(value/1000).toFixed(3)}`;
                      case 'Episodes ÷10': return `Episodes: ${learningStats.episodes}`;
                      case 'Avg Reward ×10': return `Avg Reward: ${(value/10).toFixed(2)}`;
                    }
                  }
                  return `${label}: ${value.toFixed(1)}`;
                }
              }
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { 
                display: false,
                stepSize: 25
              },
              grid: { 
                color: rlMode === RL_AGENT_TYPES.RANDOM 
                  ? 'rgba(108, 117, 125, 0.1)' 
                  : 'rgba(108, 117, 255, 0.1)' 
              },
              angleLines: { 
                color: rlMode === RL_AGENT_TYPES.RANDOM 
                  ? 'rgba(108, 117, 125, 0.1)' 
                  : 'rgba(108, 117, 255, 0.1)' 
              }
            }
          },
          animation: {
            duration: 800,
            easing: 'easeOutQuart'
          }
        },
      });
      observeWrapperResize(wrapper, () => {
        resizeCanvasForDPR(canvas, wrapper);
        try { rlStatsChartInstance?.resize(); } catch (e) { /* ignore */ }
      });
    } else {
      // Update existing chart
      rlStatsChartInstance.data.labels = labels;
      rlStatsChartInstance.data.datasets[0].data = data;
      rlStatsChartInstance.data.datasets[0].label = chartTitle;
      
      // Update colors based on agent type
      const isRandom = rlMode === RL_AGENT_TYPES.RANDOM;
      rlStatsChartInstance.data.datasets[0].backgroundColor = isRandom 
        ? 'rgba(108, 117, 125, 0.15)' 
        : 'rgba(108, 117, 255, 0.2)';
      rlStatsChartInstance.data.datasets[0].borderColor = isRandom 
        ? '#6c757d' 
        : '#6c75ff';
      rlStatsChartInstance.data.datasets[0].pointBackgroundColor = isRandom 
        ? '#6c757d' 
        : '#6c75ff';
      
      rlStatsChartInstance.update();
    }

    const statsEl = wrapper.querySelector('#rl-stats-value') || document.getElementById('rl-stats-value');
    if (statsEl) {
      statsEl.innerHTML = statsText;
      
      // Add performance indicator
      if (rlMode !== RL_AGENT_TYPES.RANDOM && learningStats.episodes > 10) {
        const recentRewards = rewardHistory.slice(-5);
        const trend = recentRewards.length > 1 
          ? recentRewards[recentRewards.length - 1] - recentRewards[0]
          : 0;
        
        const trendIcon = trend > 0.1 ? ' 📈' : trend < -0.1 ? ' 📉' : ' ➡️';
        statsEl.innerHTML += trendIcon;
      }
    }
  } catch (e) { console.error('renderRLStatsChart error', e); }
}

const debouncedRenderRewardTrendChart = _.debounce(renderRewardTrendChart, 160);
const debouncedRenderRLStatsChart = _.debounce(renderRLStatsChart, 300);

function logReward(reward) {
  rewardHistory.push(reward);
  if (rewardHistory.length > 50) rewardHistory.shift();
  
  // ← ENHANCED: Always update statistics for all agent types
  learningStats.episodes++;
  learningStats.totalReward += reward;
  learningStats.averageReward = learningStats.totalReward / learningStats.episodes;
  
  // Update agent-specific statistics
  if (currentRLAgent) {
    if (currentRLAgent.epsilon !== undefined) {
      learningStats.explorationRate = currentRLAgent.epsilon;
    } else if (currentRLAgent.adaptiveEpsilon !== undefined) {
      learningStats.explorationRate = currentRLAgent.adaptiveEpsilon;
    }
    
    if (currentRLAgent.alpha !== undefined) {
      learningStats.learningRate = currentRLAgent.alpha;
    }
    
    // Add performance tracking
    if (currentRLAgent.tderror !== undefined) {
      learningStats.tdError = currentRLAgent.tderror;
    }
  } else {
    // For random agent, set baseline values
    learningStats.explorationRate = 1.0; // 100% random
    learningStats.learningRate = 0.0;     // No learning
  }
  
  debouncedRenderRewardTrendChart();
  debouncedRenderRLStatsChart();
}

/* ---------- Simulation UI and lifecycle ---------- */

function updateSimulationUI(manager, forceNewChart = false) {
  renderManagerInfo(manager);
  renderStateChart(manager, forceNewChart);
}

function resetCurrentModel() {
  try {
    // Reset manager internal state if it supports reset()
    if (window.city && typeof window.city.reset === 'function') {
      window.city.reset();
    }

    // ← Reset RL agent and stats
    if (currentRLAgent && typeof currentRLAgent.reset === 'function') {
      currentRLAgent.reset();
    }
    
    learningStats = {
      episodes: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: rlMode === RL_AGENT_TYPES.RANDOM ? 1.0 : 0.1,
      learningRate: rlMode === RL_AGENT_TYPES.RANDOM ? 0.0 : 0.01,
      tdError: 0
    };

    // Clear simulation history
    rewardHistory = [];
    lastState     = null;
    stagnantCount = 0;

    // Destroy and recreate all charts so axes rescale from zero
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
    if (rlStatsChartInstance) {
      const wrapper = document.getElementById('rl-stats-chart')?.parentNode;
      if (wrapper) disconnectWrapperObserver(wrapper);
      try { rlStatsChartInstance.destroy(); } catch (e) { /* ignore */ }
      rlStatsChartInstance = null;
    }

    ensureChartElements();
    updateSimulationUI(window.city, true);
    logReward(0);
  } catch (e) { console.error('resetCurrentModel error', e); }
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

  // ← Initialize RL for new manager
  initializeRL(window.city);

  rewardHistory = [];
  lastState     = null;

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
  if (rlStatsChartInstance) {
    const wrapper = document.getElementById('rl-stats-chart')?.parentNode;
    if (wrapper) disconnectWrapperObserver(wrapper);
    try { rlStatsChartInstance.destroy(); } catch (e) { /* ignore */ }
    rlStatsChartInstance = null;
  }

  ensureChartElements();
  updateSimulationUI(window.city, true);
  logReward(0);
}

// ← RL Agent switcher
function chooseRLAgent(agentType) {
  rlMode = agentType;
  if (window.city) {
    initializeRL(window.city);
    
    // Force immediate update of all UI elements
    updateSimulationUI(window.city, true);
    
    // Clear and recreate RL stats chart with new agent data
    if (rlStatsChartInstance) {
      const wrapper = document.getElementById('rl-stats-chart')?.parentNode;
      if (wrapper) disconnectWrapperObserver(wrapper);
      try { rlStatsChartInstance.destroy(); } catch (e) { /* ignore */ }
      rlStatsChartInstance = null;
    }
    
    // Ensure charts are present and render immediately
    ensureChartElements();
    setTimeout(() => {
      renderRLStatsChart();
      logReward(0); // Initialize with first reward to trigger chart update
    }, 150);
  }
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
    const shuffled  = _.shuffle(MANAGER_CLASSES);
    const nextClass = shuffled.find(cls => cls !== CityManager) || _.sample(MANAGER_CLASSES);
    chooseManager(MANAGER_CLASSES.indexOf(nextClass));
    stagnantCount = 0;
  }
}

// ← ENHANCED: Intelligent action selection with RL
function simulateStep() {
  if (!window.city || isPaused) return;
  
  const actionSpace = typeof window.city.getStateArray === 'function'
    ? window.city.getStateArray().length : NUM_ACTIONS;
  
  let action;
  
  // ← RL-based action selection
  if (currentRLAgent && currentEnvironment) {
    try {
      const currentState = currentEnvironment.getStateVector();
      action = currentRLAgent.act(currentState);
      
      // Ensure action is within valid range
      action = Math.max(0, Math.min(actionSpace - 1, Math.floor(action)));
    } catch (error) {
      console.warn('RL agent error, falling back to random:', error);
      action = _.random(0, Math.max(0, actionSpace - 1));
    }
  } else {
    // Fallback to random action
    action = _.random(0, Math.max(0, actionSpace - 1));
  }
  
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

  const state = typeof window.city.getStateArray === 'function' ? window.city.getStateArray() : [];
  const reward = _.sum(state);
  
  // ← RL agent learning
  if (currentRLAgent && currentEnvironment && typeof currentRLAgent.learn === 'function') {
    try {
      currentRLAgent.learn(reward);
    } catch (error) {
      console.warn('RL agent learning error:', error);
    }
  }
  
  logReward(reward);
  updateSimulationUI(window.city);
  autoSwitchIfStagnant(state);
}

function setupUI() {
  ensureChartElements();

  // Model selector dropdown inside #manager-info
  const container = document.getElementById('manager-info');
  if (container && !container.querySelector('select')) {
    
    // City Manager selector
    const select = document.createElement('select');
    select.style.margin = '8px 0';
    select.className    = 'form-select form-select-sm';
    MANAGER_CLASSES.forEach((cls, i) => {
      const opt  = document.createElement('option');
      opt.value  = i;
      opt.text   = readableNameFromCtorName(cls.name) || cls.name || `Model ${i}`;
      select.appendChild(opt);
    });
    select.onchange = e => chooseManager(Number(e.target.value));
    container.appendChild(select);
    
    // ← RL Agent selector
    const rlSelect = document.createElement('select');
    rlSelect.style.margin = '8px 0';
    rlSelect.className = 'form-select form-select-sm rl-select';
    
    Object.entries(RL_AGENT_TYPES).forEach(([key, value]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.text = key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Agent';
      if (value === rlMode) opt.selected = true;
      rlSelect.appendChild(opt);
    });
    
    rlSelect.onchange = e => chooseRLAgent(e.target.value);
    container.appendChild(rlSelect);
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
      pauseBtn.classList.add('active');    resumeBtn.classList.remove('active');
      pauseBtn.disabled = true;           resumeBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    resumeBtn.onclick = () => {
      isPaused = false;
      resumeBtn.classList.add('active');   pauseBtn.classList.remove('active');
      resumeBtn.disabled = true;          pauseBtn.disabled = false;
      updateSimulationUI(window.city);
    };
    pauseBtn.classList.remove('active');
    resumeBtn.classList.add('active');
    pauseBtn.disabled  = false;
    resumeBtn.disabled = true;
  }
}

// Expose RL mode and stats to global scope for HTML script access
window.rlMode = rlMode;
window.learningStats = learningStats;
window.isPaused = isPaused;
window.currentRLAgent = currentRLAgent;

window.addEventListener('DOMContentLoaded', () => {
  try {
    setupUI();
    chooseManager(0); // This will also initialize RL
    setInterval(() => { simulateStep(); }, 1100);
  } catch (e) { console.error('init error', e); }
});

export { 
  chooseManager, 
  simulateStep, 
  getManagerTipFor, 
  readableNameFromCtorName,
  // ← RL exports
  chooseRLAgent,
  RL_AGENT_TYPES,
  learningStats
};
