const express = require('express');
const path = require('path');

const app = express();
const defaultPort = 8000;
let port = process.env.PORT || defaultPort;

app.use(express.static(path.join(__dirname, "dist/")));

function startServer(currentPort) {
  const server = app.listen(currentPort, () => {
    console.log(`Server started at http://localhost:${currentPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${currentPort} is in use. Trying another port...`);
      server.close(() => {
        startServer(currentPort + 1); // Try the next port
      });
    } else {
      console.error('Server error:', err);
    }
  });

  // Handle graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit();
    });
  });
}

// Start the server
startServer(port);
