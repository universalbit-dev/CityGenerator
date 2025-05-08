### Steps to Use SSL Certificates in `CityGenerator`

1. **Prepare SSL Certificates**:
   - SSL certificates are required for secure communication over HTTPS.
   - You can use a **self-signed certificate** for development or obtain a trusted certificate (e.g., via Let's Encrypt) for production.

   **Generate a self-signed certificate** (for development):
   ```bash
   openssl req -nodes -new -x509 -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365
   ```

---

#### Alternative: Generate an SSL Certificate Using a Configuration File (`distinguished.cnf`)

---

   **Command to Use This File**:
   ```bash
   openssl req -nodes -new -x509 \
   -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365 \
   -config ssl/distinguished.cnf
   ```

---

### Using `https_server.js` for HTTPS Integration

1. **About `https_server.js`**:
   - The `https_server.js` file is located in the root directory `/`.
   - It uses the `https` module to create a secure HTTPS server.
   - SSL certificates (key and certificate files) must be placed in the `/ssl` directory.

   Example `https_server.js` content:
   ```javascript
   const express = require('express');
   const https = require('https');
   const fs = require('fs');
   const path = require('path');

   const app = express();

   // Serve static files from the "dist" directory
   app.use(express.static(path.join(__dirname, "dist/")));

   // Example route
   app.get('/', (req, res) => {
       res.send('Noop');
   });

   // SSL Options
   const sslOptions = {
       key: fs.readFileSync(path.join(__dirname, 'ssl/private-key.pem')),
       cert: fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem')),
   };

   // Create HTTPS server
   const port = process.env.PORT || 8000;
   https.createServer(sslOptions, app).listen(port, () => {
       console.log(`HTTPS server running at https://localhost:${port}`);
   });
   ```

2. **Directory Structure**:
   Ensure your project has the following structure:
   ```
   CityGenerator/
   ├── dist/                   # Static files served by the app
   ├── ssl/                    # SSL certificate and key directory
   │   ├── private-key.pem
   │   ├── certificate.pem
   ├── https_server.js         # Main HTTPS server file
   ```

3. **Run the HTTPS Server**:
   Start the server using Node.js:
   ```bash
   node https_server.js
   ```

4. **Test the HTTPS Server**:
   - Open your browser and navigate to `https://localhost:8000` (or the selected port).
   - You may need to accept the self-signed certificate warning in your browser (if using a self-signed certificate).

   **Using curl for HTTPS testing**:
   ```bash
   curl -k https://localhost:8000
   ```

---

### Benefits of Using HTTPS in `CityGenerator`

- **Secure Communication**: HTTPS ensures data integrity and encryption.
- **Browser Compatibility**: Modern browsers enforce HTTPS for many advanced features.
- **Trust**: Trusted certificates provide better user confidence for production environments.

---

### Notes:
- Always ensure your SSL certificate and key files are kept secure, especially in production environments.
- Use a trusted certificate authority (e.g., Let's Encrypt) for production deployments to avoid browser warnings.

---


