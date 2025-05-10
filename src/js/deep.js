const fs = require('fs-extra');
const path = require('path');

// Define the files to be copied and their destinations
const filesToCopy = [
  { src: path.join(__dirname, 'convnet.js'), dest: path.join(__dirname, '../../dist/convnet.js') },
  { src: path.join(__dirname, 'deepqlearn.js'), dest: path.join(__dirname, '../../dist/deepqlearn.js') },
];

// Copy each file
filesToCopy.forEach(file => {
  fs.copy(file.src, file.dest)
    .then(() => console.log(`Copied ${file.src} to ${file.dest}`))
    .catch(err => console.error(`Failed to copy ${file.src}:`, err));
});
