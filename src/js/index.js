
import './convnet.js';
import './deepqlearn.js';

// Neural network and training setup
var num_inputs = 27;
var num_actions = 5;
var temporal_window = 1;
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 100, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 100, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

var tdtrainer_options = {learning_rate:0.01, momentum:0.1, batch_size:32, l2_decay:0.001};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 50000;
opt.start_learn_threshold = 500;
opt.gamma = 0.9;
opt.learning_steps_total = 300000;
opt.learning_steps_burnin = 1000;
opt.epsilon_min = 0.01;
opt.epsilon_test_time = 0.01;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

var brain;

window.onload = function() {
  brain = new deepqlearn.Brain(num_inputs, num_actions, opt);
  console.log('Training started automatically with default learning rate:', tdtrainer_options.learning_rate);

  let totalSteps = opt.learning_steps_total || 10000;
  let logInterval = Math.max(1, Math.floor(totalSteps / 20)); // log 20 times during training
  let rewards = [];
  let rewardSum = 0;

  function trainStep(step) {
    let state = getCurrentState();
    let action = brain.forward(state);
    let reward = getReward(state, action);
    rewardSum += reward;
    brain.backward(reward);

    if (step % logInterval === 0 || step === totalSteps) {
      let avgReward = rewardSum / logInterval;
      rewards.push(avgReward);
      console.log(`Step ${step} / ${totalSteps} | Avg Reward: ${avgReward.toFixed(4)}`);
      rewardSum = 0;
      // Optionally: update a chart or UI here
    }

    if (step < totalSteps) {
      setTimeout(() => trainStep(step + 1), 0);
    } else {
      console.log("Training complete!");
    }
  }

  trainStep(1);

  function getCurrentState() {
    // --- City Environment State Representation ---
    let city = {
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
    let state = [
      city.population / city.maxPopulation,
      city.roadDensity,
      city.avgBuildingHeight / city.maxHeight,
      city.resourceLevel / city.maxResource,
      city.pollution / city.maxPollution,
      city.greenSpaceRatio,
      city.riverCount / 5
    ];
    while (state.length < num_inputs) state.push(0);
    if (state.length > num_inputs) state = state.slice(0, num_inputs);
    return state;
  }

  function getReward(state, action) {
    return Math.random() * 2 - 1;
  }
};

// Optionally, include your convnetjs setup if you use it elsewhere in your app:
var conv_layers = [];
conv_layers.push({type:'input', out_sx:24, out_sy:24, out_depth:1});
conv_layers.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
conv_layers.push({type:'pool', sx:2, stride:2});
conv_layers.push({type:'conv', sx:5, filters:32, stride:1, pad:2, activation:'relu'});
conv_layers.push({type:'pool', sx:3, stride:3});
conv_layers.push({type:'fc', num_neurons: 100, activation:'relu'});
conv_layers.push({type:'softmax', num_classes:10});

var net = new convnetjs.Net();
net.makeLayers(conv_layers);
var trainer = new convnetjs.Trainer(net, {
  method: 'sgd',
  learning_rate: 0.001,
  l2_decay: 0.0001,
  momentum: 0.9,
  batch_size: 20,
  l1_decay: 0.0001
});
