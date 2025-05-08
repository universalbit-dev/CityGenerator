const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const defaultPort = 8000;
let port = process.env.PORT || defaultPort;

// Serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, "dist/")));

function startServer(currentPort) {
    const server = http.createServer(app);

    server.listen(currentPort, () => {
        console.log(`HTTP server running at http://localhost:${currentPort}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${currentPort} is in use. Trying another port...`);
            server.close(() => {
                startServer(currentPort + 1); // Try the next port
            });
        } else {
            console.error('Server error:', err);
            process.exit(1); // Exit on unexpected server errors
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
        process.exit(1); // Exit with failure
    });

    // Handle unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1); // Exit with failure
    });
}

// Start the server
startServer(port);
