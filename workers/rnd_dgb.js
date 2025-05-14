const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1'); // Required for ECPairFactory
const { ECPairFactory } = require('ecpair'); // Import ECPairFactory

// Create ECPair instance
const ECPair = ECPairFactory(ecc);

// DigiByte network parameters
const digibyteNetwork = {
    messagePrefix: '\x19DigiByte Signed Message:\n',
    bech32: 'dgb', // Bech32 prefix for SegWit addresses (if needed)
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x1e, // Prefix for P2PKH addresses (starts with 'D')
    scriptHash: 0x3f, // Prefix for P2SH addresses
    wif: 0x80,        // Wallet Import Format prefix
};

// Generate random key pair
const keyPair = ECPair.makeRandom({ network: digibyteNetwork });

// Convert public key to Buffer (if necessary)
const pubkeyBuffer = Buffer.from(keyPair.publicKey);

// Get the public key and address
const { address } = bitcoin.payments.p2pkh({
    pubkey: pubkeyBuffer,
    network: digibyteNetwork,
});

console.log('DigiByte Address:', address);
