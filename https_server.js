const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const defaultPort = 8000;
let port = process.env.PORT || defaultPort;

// Paths to SSL/TLS key and certificate
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/private-key.pem')), // Path to private key
    cert: fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem')), // Path to certificate
};

// Serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, "dist/")));

// Example route
app.get('/', (req, res) => {
    res.send('NOOP');
});

function startServer(currentPort) {
    const server = https.createServer(sslOptions, app);

    // Start listening on the specified port
    server.listen(currentPort, () => {
        console.log(`HTTPS server running at https://localhost:${currentPort}`);
    });

    // Handle server errors
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${currentPort} is in use. Trying another port...`);
            server.close(() => {
                startServer(currentPort + 1); // Try the next port
            });
        } else {
            console.error('Server error:', err);
            process.exit(1);
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

    // Handle uncaught exceptions globally
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        process.exit(1);
    });

    // Handle unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// Start the server
try {
    startServer(port);
} catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
}
