/**
 * CityGenerator Neural Network Training Entry Point
 * -------------------------------------------------
 * Main application logic for initializing, training, and monitoring the neural agent
 * that manages city simulation decisions using deep Q-learning.
 *
 * - Loads and configures ConvNetJS and deepqlearn libraries.
 * - Configures neural network and training parameters.
 * - Provides a meaningful reward function tied to city simulation state.
 * - Logs training progress to the console and the DOM.
 * - Supports pausing and resuming training via UI buttons.
 *
 * Author: universalbit-dev
 * Repo: https://github.com/universalbit-dev/CityGenerator
 */

import './convnet.js';
import './deepqlearn.js';
import './vis.js';

// =================== CONFIGURATION ===================
const NUM_INPUTS = 27;
const NUM_ACTIONS = 5;
const TEMPORAL_WINDOW = 1;
const NETWORK_SIZE = NUM_INPUTS * TEMPORAL_WINDOW + NUM_ACTIONS * TEMPORAL_WINDOW + NUM_INPUTS;

const LAYER_DEFS = [
  {type:'input', out_sx:1, out_sy:1, out_depth:NETWORK_SIZE},
  {type:'fc', num_neurons: 100, activation:'relu'},
  {type:'fc', num_neurons: 100, activation:'relu'},
  {type:'fc', num_neurons: 50, activation:'relu'},
  {type:'regression', num_neurons: NUM_ACTIONS},
];

const TDTRAINER_OPTIONS = {learning_rate:0.01, momentum:0.1, batch_size:32, l2_decay:0.001};

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
  tdtrainer_options: TDTRAINER_OPTIONS,
};

// =================== GLOBALS ===================
let brain = null;
let paused = false;
let currentStep = 1;

// =================== TRAINING LOGIC ===================
window.onload = function() {
  brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
  console.log('Training started automatically with default learning rate:', TDTRAINER_OPTIONS.learning_rate);

  const totalSteps = OPT.learning_steps_total || 10000;
  const logInterval = Math.max(1, Math.floor(totalSteps / 20)); // log 20 times during training
  let rewardSum = 0;
  const rewards = [];

  // Reward log in DOM
  let rewardDiv = document.getElementById('reward-log');
  if (!rewardDiv) {
    rewardDiv = document.createElement('div');
    rewardDiv.id = 'reward-log';
    rewardDiv.style.whiteSpace = 'pre'; // keep linebreaks
    document.body.appendChild(rewardDiv);
  }

  // ========== UI CONTROLS ==========
  let pauseBtn = document.getElementById('pause-btn');
  let resumeBtn = document.getElementById('resume-btn');

  if (!pauseBtn) {
    pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause Training';
    pauseBtn.id = 'pause-btn';
    pauseBtn.onclick = () => { paused = true; };
    document.body.appendChild(pauseBtn);
  }

  if (!resumeBtn) {
    resumeBtn = document.createElement('button');
    resumeBtn.textContent = 'Resume Training';
    resumeBtn.id = 'resume-btn';
    resumeBtn.onclick = () => {
      if (paused) {
        paused = false;
        trainStep(currentStep);
      }
    };
    document.body.appendChild(resumeBtn);
  }

  // ========== TRAINING LOOP ==========
  function trainStep(step) {
    if (paused) {
      currentStep = step;
      return;
    }

    const state = getCurrentState();
    const action = brain.forward(state);
    const reward = getReward(state, action);

    rewardSum += reward;
    brain.backward(reward);

    if (step % logInterval === 0 || step === totalSteps) {
      const avgReward = rewardSum / logInterval;
      rewards.push(avgReward);
      const msg = `Step ${step} / ${totalSteps} | Avg Reward: ${avgReward.toFixed(4)}`;
      console.log(msg);
      rewardDiv.textContent += `\n${msg}`;
      rewardSum = 0;
    }

    if (step < totalSteps) {
      setTimeout(() => trainStep(step + 1), 0);
    } else {
      console.log("Training complete!");
      rewardDiv.textContent += "\nTraining complete!";
    }
  }

  // ========== STATE/REWARD FUNCTIONS ==========
  function getCurrentState() {
    // Simulated city state (replace with real state as needed)
    const city = {
      population: 50000,
      maxPopulation: 100000,
      roadDensity: 0.42,
      avgBuildingHeight: 15,
      maxHeight: 50,
      resourceLevel: 1200,
      maxResource: 5000,
      pollution: 30,
      maxPollution: 100,
      greenSpaceRatio: 0.18,
      riverCount: 1,
    };
    // State vector (normalize values)
    let state = [
      city.population / city.maxPopulation,      // Population ratio
      city.roadDensity,                          // Road density
      city.avgBuildingHeight / city.maxHeight,   // Building height ratio
      city.resourceLevel / city.maxResource,     // Resource ratio
      city.pollution / city.maxPollution,        // Pollution ratio
      city.greenSpaceRatio,                      // Green space
      city.riverCount / 5                        // River count (assume max 5)
    ];
    while (state.length < NUM_INPUTS) state.push(0);
    if (state.length > NUM_INPUTS) state = state.slice(0, NUM_INPUTS);
    return state;
  }

  function getReward(state, action) {
    // Example: reward for population, green space, and resource usage; penalty for pollution.
    const [pop, road, height, res, pollution, green, rivers] = state;
    return (
      (pop * 2) +           // Encourage higher population
      (green * 1.5) -       // Encourage green space
      (pollution * 3) +     // Discourage pollution
      (res * 0.5)           // Encourage resource usage
    );
  }

  // ========== START TRAINING ==========
  trainStep(1);
};


// =================== (OPTIONAL) CONVNETJS SETUP ===================
const CONV_LAYERS = [
  {type:'input', out_sx:24, out_sy:24, out_depth:1},
  {type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'},
  {type:'pool', sx:2, stride:2},
  {type:'conv', sx:5, filters:32, stride:1, pad:2, activation:'relu'},
  {type:'pool', sx:3, stride:3},
  {type:'fc', num_neurons: 100, activation:'relu'},
  {type:'softmax', num_classes:10},
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
