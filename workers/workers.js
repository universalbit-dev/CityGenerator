/**
 * Usage Instructions:
 * 
 * 1. Install required system packages:
 *    sudo apt install cpulimit
 *
 * 2. Install PM2 globally (for process management):
 *    npm i pm2 -g
 *
 * 3. Set execute permissions on this script:
 *    chmod 755 workers/workers.js
 *
 * This script launches a DigiByte CPU miner with a randomly-generated address
 * and strict CPU usage limitation (2%). See features below for details.
 *
 * Features:
 * - Generates a random DigiByte address for mining payouts.
 * - Starts the minerd process limited to approximately 2% CPU usage using 'cpulimit'.
 * - Restricts mining to a single CPU thread for system safety and demonstration purposes.
 * - Handles clean shutdowns and can be managed by PM2.
 */

// Interval definitions in milliseconds
const INTERVALS = {
  '1m': 1 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};
//=================================================
const INTERVAL_MS = 60 * 60 * 1000; // <== 1 HOUR
//=================================================
// Example: setup interval loop for each interval
Object.entries(INTERVALS).forEach(([label, ms]) => {
  setInterval(() => {
    console.log(`Interval [${label}] triggered at ${new Date().toISOString()}`);
  }, ms);
});

// --- Miner setup code as in your original file ---

const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');
const { spawn } = require('child_process');
const path = require('path');

// DigiByte network parameters
const digibyteNetwork = {
  messagePrefix: '\x19DigiByte Signed Message:\n',
  bech32: 'dgb',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x3f,
  wif: 0x80,
};

function generateRandomAddress() {
  const ECPair = ECPairFactory(ecc);
  const keyPair = ECPair.makeRandom({ network: digibyteNetwork });
  const pubkeyBuffer = Buffer.from(keyPair.publicKey);
  const { address } = bitcoin.payments.p2pkh({ pubkey: pubkeyBuffer, network: digibyteNetwork });
  console.log('Generated DigiByte Address:', address);
  return address;
}

const cpulimitPath = '/usr/bin/cpulimit'; // Update if needed
const minerdPath = path.join(__dirname, 'minerd');

let minerProcess = null;

// Function to start miner with a new random address
function startMiner() {
  const randomAddress = generateRandomAddress();

  const minerdArgs = [
    '-a', 'sha256d',
    '-o', 'stratum+tcp://eu1.solopool.org:8004',
    `--userpass=${randomAddress}:x`,
    '-t', '1'
  ];

  const cpulimitArgs = [
    '-l', '2', //<== CPU LIMITED 2%
    '--',
    minerdPath,
    ...minerdArgs
  ];

  console.log('Launching minerd with cpulimit at 2% CPU, 1 thread...');

  minerProcess = spawn(cpulimitPath, cpulimitArgs, { cwd: __dirname });

  function filterAndLabel(data) {
    const lines = data.toString().split('\n');
    for (let line of lines) {
      if (!line.trim()) continue;
      if (
        line.includes('Stratum requested work restart') ||
        /^thread \d+:.*hash(es|\/s)/.test(line)
      ) {
        process.stdout.write(`[minerd INFO] ${line}\n`);
      } else {
        process.stdout.write(`[minerd] ${line}\n`);
      }
    }
  }

  minerProcess.stdout.on('data', filterAndLabel);
  minerProcess.stderr.on('data', filterAndLabel);

  minerProcess.on('close', (code) => {
    console.log(`minerd process exited with code ${code}`);
  });
}

// Initial miner start
startMiner();

// Restart miner and generate a new address every INTERVAL_MS
setInterval(() => {
  console.log('Restarting miner to use a new random address...');
  if (minerProcess && !minerProcess.killed) {
    minerProcess.kill('SIGTERM');
  }
  startMiner();
}, INTERVAL_MS);

// Clean shutdown
function shutdown() {
  if (minerProcess && !minerProcess.killed) {
    minerProcess.kill('SIGTERM');
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
