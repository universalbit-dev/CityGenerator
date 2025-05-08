### Steps to Use SSL Certificates in `CityGenerator`

1. **Prepare SSL Certificates**:
   - SSL certificates are required for secure communication over HTTPS.
   - You can use a **self-signed certificate** for development or obtain a trusted certificate (e.g., via Let's Encrypt) for production.

   **Generate a self-signed certificate** (for development):
   ```bash
   openssl req -nodes -new -x509 -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365
   ```
---

#### As an alternative to the given command, you can generate an SSL certificate using a configuration file (`distinguished.cnf`)

---

   **Command to Use This File:**
   
   ```bash
   openssl req -nodes -new -x509 \
   -keyout ssl/private-key.pem -out ssl/certificate.pem -days 365 \
   -config ssl/distinguished.cnf
   ```

**[Developmet]**

1. **Update `server.js` to Use HTTP/2 with SSL**:
   Modify the `server.js` file in the root directory to use `http2` instead of `http`. Load the SSL certificate and key to enable HTTPS.

2. **Directory Structure**:
   Ensure your project has the following structure:
   ```
   CityGenerator/
   ├── dist/                   # Static files served by the app
   ├── ssl/                    # SSL certificate and key directory
   │   ├── private-key.pem
   │   ├── certificate.pem
   ├── server.js               # Main server file
   ```

3. **Run the Server**:
   Start the server using Node.js:
   ```bash
   node server.js
   ```

4. **Test the Server**:
   - Open your browser and navigate to `https://localhost:8000` (or the selected port).
   - You may need to accept the self-signed certificate warning in your browser (if using a self-signed certificate).

   **Using curl for HTTP/2 testing**:
   ```bash
   curl -k --http2 https://localhost:8000
   ```

---

### Benefits of HTTP/2 for CityGenerator [development]
- **Faster Loading**: Multiplexing allows multiple assets (e.g., JavaScript, CSS) to be loaded simultaneously over a single connection.
- **Reduced Overhead**: Header compression reduces the amount of data transmitted, especially for repetitive requests.
- **Secure Communication**: HTTPS ensures data integrity and encryption.

---
