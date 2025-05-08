const express = require('express');
const path = require('path');
const http2 = require('http2');
const fs = require('fs');

const app = express();
const defaultPort = 8000;
let port = process.env.PORT || defaultPort;

// Load SSL certificates
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.pem')),
};

// Serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, "dist/")));

function startServer(currentPort) {
    const server = http2.createSecureServer(sslOptions, app);

    server.listen(currentPort, () => {
        console.log(`HTTP/2 server running at https://localhost:${currentPort}`);
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
