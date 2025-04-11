// Import the HTTP module to create a web server
const http = require('http');

// Set the default port to 3000
const DEFAULT_PORT = 3000; // Replace with your default port

// Variable to keep track of the current port
let currentPort = DEFAULT_PORT;

// Create an HTTP server that sends a plain text response
const server = http.createServer((req, res) => {
    // Set the HTTP status to 200 (OK) and specify the content type as plain text
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Send the response "Hello, world!"
    res.end('Hello, world!\n');
});

// Function to start the server on a specified port
const startServer = (port) => {
    server.listen(port, () => {
        // Log a message indicating the server is running and the URL to access it
        console.log(`Server running at http://localhost:${port}/`);
    }).on('error', (err) => {
        // Handle errors during server startup
        if (err.code === 'EADDRINUSE') {
            // If the port is already in use, log an error and try the next port
            console.error(`Port ${port} is in use. Trying a new port...`);
            startServer(port + 1); // Increment port and try again
        } else {
            // Log any other server errors
            console.error('Server error:', err);
        }
    });
};

// Start the server using the current port
startServer(currentPort);
