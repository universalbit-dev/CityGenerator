/**
 * CityGenerator Neural Network Training Entry Point
 * -------------------------------------------------
 * Main application logic for initializing, training, and monitoring the neural agent
 * that manages city simulation decisions using deep Q-learning.
 *
 * - Loads and configures ConvNetJS and deepqlearn libraries.
 * - Configures neural network and training parameters.
 * - Contains a dynamic city state affected by agent actions.
 * - Provides a meaningful reward function tied to city simulation state.
 * - Logs training progress to the console and the DOM.
 * - Supports pausing and resuming training via UI buttons.
 * - Automatically restarts training after completion.
 *
 * Author: universalbit-dev
 * Repo: https://github.com/universalbit-dev/CityGenerator
 */

import './convnet.js';
import './deepqlearn.js';
import './vis.js';

// =================== CONFIGURATION ===================
const NUM_INPUTS = 7;
const NUM_ACTIONS = 3; // Expand as needed for more city actions
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

// =================== CITY STATE ===================
function createInitialCity() {
  return {
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
}
let city = createInitialCity();

// =================== GLOBALS ===================
let brain = null;
let paused = false;
let currentStep = 1;
let trainingRuns = 0;

// =================== UI CONTROLS & LOGGING ===================
function setupUI() {
  // Reward log in DOM
  let rewardDiv = document.getElementById('reward-log');
  if (!rewardDiv) {
    rewardDiv = document.createElement('div');
    rewardDiv.id = 'reward-log';
    rewardDiv.style.whiteSpace = 'pre'; // keep linebreaks
    rewardDiv.style.marginTop = '12px';
    document.body.appendChild(rewardDiv);
  }

  // Pause/Resume Buttons
  let pauseBtn = document.getElementById('pause-btn');
  let resumeBtn = document.getElementById('resume-btn');

  if (!pauseBtn) {
    pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause Training';
    pauseBtn.id = 'pause-btn';
    pauseBtn.style.marginRight = '10px';
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
}

function logMessage(msg) {
  const rewardDiv = document.getElementById('reward-log');
  if (rewardDiv) rewardDiv.textContent += `\n${msg}`;
}

// =================== STATE, ACTION, REWARD ===================
function getCurrentState() {
  // Return normalized state vector
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

// Actions: 0 = build road, 1 = build park, 2 = build factory (expand as needed)
function applyAction(action) {
  switch(action) {
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
    // Add more actions as needed
  }
}

function getReward(state, action) {
  // Encourage high population, low pollution, high green space, and good resource balance
  const [pop, road, height, res, pollution, green, rivers] = state;
  return (
    (pop * 2) +           // Encourage higher population
    (green * 1.5) -       // Encourage more green space
    (pollution * 3) +     // Discourage pollution
    (res * 0.5)           // Encourage resource usage/generation
  );
}

// =================== TRAINING LOGIC ===================
function trainStep(step) {
  if (paused) {
    currentStep = step;
    return;
  }

  const state = getCurrentState();
  const action = brain.forward(state);
  applyAction(action); // Update city state
  const reward = getReward(getCurrentState(), action);
  brain.backward(reward);

  // Logging
  const totalSteps = OPT.learning_steps_total || 10000;
  const logInterval = Math.max(1, Math.floor(totalSteps / 20));
  if (!trainStep.rewardSum) trainStep.rewardSum = 0;
  trainStep.rewardSum += reward;

  if (step % logInterval === 0 || step === totalSteps) {
    const avgReward = trainStep.rewardSum / logInterval;
    const msg = `Step ${step} / ${totalSteps} | Avg Reward: ${avgReward.toFixed(4)}`;
    console.log(msg);
    logMessage(msg);
    trainStep.rewardSum = 0;
  }

  if (step < totalSteps) {
    setTimeout(() => trainStep(step + 1), 0);
  } else {
    console.log("Training complete!");
    logMessage("Training complete!");

    // === AUTO-RESTART LOGIC ===
    trainingRuns++;
    logMessage(`\n=== Restarting Training (#${trainingRuns + 1}) ===`);
    // Optionally, re-initialize the city and brain (or comment out next 2 lines if you want to keep learned weights)
    city = createInitialCity(); // Reset city
    brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT); // Fresh brain (or comment this to keep learning)
    currentStep = 1;
    setTimeout(() => trainStep(1), 1000); // Wait 1s before restarting
  }
}

// =================== MAIN ===================
window.onload = function() {
  brain = new window.deepqlearn.Brain(NUM_INPUTS, NUM_ACTIONS, OPT);
  console.log('Training started automatically with default learning rate:', TDTRAINER_OPTIONS.learning_rate);

  setupUI();
  logMessage(`=== Training Run #1 ===`);
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
