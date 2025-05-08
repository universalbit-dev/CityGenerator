const digibyte = require('digibyte-js');

/**
 * Generates a random Digibyte address.
 * @returns {string} The generated Digibyte address.
 */
function generateRandomAddress() {
    const privateKey = new digibyte.PrivateKey();
    const address = privateKey.toAddress().toString();
    console.log('Generated Address:', address);
    return address;
}

// Export the function to make it reusable
module.exports = {
    generateRandomAddress
};
