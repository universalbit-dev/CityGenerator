const http = require('http');

const DEFAULT_PORT = 3000; // Replace with your default port
let currentPort = DEFAULT_PORT;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, world!\n');
});

const startServer = (port) => {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is in use. Trying a new port...`);
            startServer(port + 1); // Increment port and try again
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(currentPort);
