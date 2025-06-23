/**
 * workers.js
 * 
 * This script is for educational/demo purposes only. It launches a DigiByte CPU miner
 * with a randomly-generated address and strict CPU usage limitation 2%.
 * 
 * Features:
 * - Generates a random DigiByte address for mining payouts.
 * - Starts the minerd process limited to approximately 2% CPU usage using 'cpulimit'.
 * - Restricts mining to a single CPU thread for system safety and demonstration purposes.
 * - Handles clean shutdowns and can be managed by PM2.
 */
 
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

// Generate random DigiByte address
function generateRandomAddress() {
  const ECPair = ECPairFactory(ecc);
  const keyPair = ECPair.makeRandom({ network: digibyteNetwork });
  const pubkeyBuffer = Buffer.from(keyPair.publicKey);
  const { address } = bitcoin.payments.p2pkh({ pubkey: pubkeyBuffer, network: digibyteNetwork });
  console.log('Generated DigiByte Address:', address);
  return address;
}

const randomAddress = generateRandomAddress();

const cpulimitPath = '/usr/bin/cpulimit'; // Update if needed
const minerdPath = path.join(__dirname, 'minerd');

const minerdArgs = [
  '-a', 'sha256d',
  '-o', 'stratum+tcp://eu1.solopool.org:8004',
  `--userpass=${randomAddress}:x`,
  '-t', '1'
];

const cpulimitArgs = [
  '-l', '2',
  '--',
  minerdPath,
  ...minerdArgs
];

console.log('Launching minerd with cpulimit at 2% CPU, 1 thread...');

const minerProcess = spawn(cpulimitPath, cpulimitArgs, { cwd: __dirname });

function filterAndLabel(data) {
  const lines = data.toString().split('\n');
  for (let line of lines) {
    if (!line.trim()) continue;

    // Treat as INFO: Stratum restart and mining stats
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

// Both stdout and stderr use the same filter for INFO lines
minerProcess.stdout.on('data', filterAndLabel);
minerProcess.stderr.on('data', filterAndLabel);

minerProcess.on('close', (code) => {
  console.log(`minerd process exited with code ${code}`);
});

// Clean shutdown
function shutdown() {
  if (!minerProcess.killed) {
    minerProcess.kill('SIGTERM');
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
