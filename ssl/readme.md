[OpenSSL](https://github.com/openssl/openssl) **Repository**

**Install OpenSSL**
   - OpenSSL is required for generating the self-signed SSL certificates.
   - Install it using:
     ```bash
     sudo apt update
     sudo apt install openssl -y
     ```
**Clones**  (downloads) the GitHub repository HArmadillium from the account universalbit-dev onto your local machine
```bash
git clone https://github.com/universalbit-dev/HArmadillium/
cd ~/HArmadillium/ssl
```

### Explanation of Self-Signed Certificate (HTTPS) with OpenSSL for Nginx and Apache2

A self-signed SSL certificate is a certificate that is not signed by a trusted Certificate Authority (CA) but is created and signed by the organization or individual that owns the domain or server. Self-signed certificates are useful for testing purposes or internal use where trust chains aren't necessary.

---
#### self-signed certificate (HTTPS) with OpenSSL  Nginx

```bash

#!/bin/bash

# Set the dynamic CN
export DYNAMIC_CN=$(hostname)  # Use the hostname command or any logic to set the CN dynamically

# Generate the certificate
openssl req -new -x509 -config distinguished.cnf -keyout /etc/nginx/ssl/host.key -out /etc/nginx/ssl/host.cert -days 365
echo "Certificate generated with CN: $DYNAMIC_CN"
```


#### self-signed certificate (HTTPS) with OpenSSL  Apache2

```bash

#!/bin/bash

# Set the dynamic CN
export DYNAMIC_CN=$(hostname)  # Use the hostname command or any logic to set the CN dynamically

# Generate the certificate
openssl req -new -x509 -config distinguished.cnf -keyout /etc/apache2/ssl/host.key -out /etc/apache2/ssl/host.cert -days 365
echo "Certificate generated with CN: $DYNAMIC_CN"
```

Both scripts generate a self-signed SSL certificate dynamically using OpenSSL. The differences lie in the path where the certificate and key are stored, depending on whether you're configuring Nginx or Apache2.

#### **Common Steps in Both Scripts**
1. **Dynamic Common Name (CN)**
   - The script dynamically sets the `Common Name (CN)` of the SSL certificate using the `hostname` command. 
   - The CN is a critical part of the SSL certificate, as it specifies the domain name or server name that the certificate is valid for.
   - Example: If the server's hostname is `armadillium01`, the CN will be set to `armadillium01`.

   ```bash
   export DYNAMIC_CN=$(hostname)  # Dynamically set the CN using the server's hostname
   ```

2. **Generate the Certificate**
   - The `openssl req` command is used to create a new self-signed certificate.
   - Key options used:
     - `-new`: Generate a new certificate request.
     - `-x509`: Output a self-signed certificate instead of a certificate request.
     - `-config distinguished.cnf`: Use the specified configuration file (`distinguished.cnf`) for certificate details (e.g., country, state, organization, CN).
     - `-keyout /path/to/host.key`: Specify the output path for the private key.
     - `-out /path/to/host.cert`: Specify the output path for the self-signed certificate.
     - `-days 365`: Set the certificate's validity to 365 days.

   ```bash
   openssl req -new -x509 -config distinguished.cnf -keyout /path/to/host.key -out /path/to/host.cert -days 365
   ```

3. **Output the Result**
   - The script echoes a message to confirm the certificate generation and displays the dynamic CN.

   ```bash
   echo "Certificate generated with CN: $DYNAMIC_CN"
   ```

---

#### **Differences Between Nginx and Apache2 Scripts**

| Aspect                  | Nginx Script                                    | Apache2 Script                                |
|-------------------------|------------------------------------------------|----------------------------------------------|
| **Private Key Path**    | `/etc/nginx/ssl/host.key`                       | `/etc/apache2/ssl/host.key`                  |
| **Certificate Path**    | `/etc/nginx/ssl/host.cert`                      | `/etc/apache2/ssl/host.cert`                 |
| **Purpose**             | Configures SSL for Nginx web server             | Configures SSL for Apache2 web server        |

---

### **How to Use These Scripts**

1. **Prepare the Environment**
   - Ensure OpenSSL is installed on your server.
   - Create the necessary directories for storing the SSL certificate and private key:
     - Nginx: `/etc/nginx/ssl/`
     - Apache2: `/etc/apache2/ssl/`

     Example:
     ```bash
     mkdir -p /etc/nginx/ssl
     mkdir -p /etc/apache2/ssl
     ```

2. **Place the `distinguished.cnf` File**
   - Ensure the `distinguished.cnf` file is available and correctly configured for your organization details and dynamic CN support.

3. **Run the Script**
   - Make the script executable and run it:
     ```bash
     chmod +x generate_cert.sh
     ./generate_cert.sh
     ```

4. **Configure the Web Server**
   - **Nginx Configuration**
     - Edit the Nginx site configuration file to use the generated certificate and key:
       ```
       server {
           listen 443 ssl;
           ssl_certificate /etc/nginx/ssl/host.cert;
           ssl_certificate_key /etc/nginx/ssl/host.key;
           ...
       }
       ```
     - Restart Nginx:
       ```bash
       sudo systemctl restart nginx
       ```

   - **Apache2 Configuration**
     - Edit the Apache2 site configuration file to use the generated certificate and key:
       ```
       <VirtualHost *:4433>
           SSLEngine on
           SSLCertificateFile /etc/apache2/ssl/host.cert
           SSLCertificateKeyFile /etc/apache2/ssl/host.key
           ...
       </VirtualHost>
       ```
     - Restart Apache2:
       ```bash
       sudo systemctl restart apache2
       ```

5. **Test the Configuration**
   - Access your server via HTTPS to verify that the SSL certificate is working. For example:
     ```
     https://your-server-domain-or-ip
     ```

---

### **Key Considerations**
- **Browser Warnings**: Since this is a self-signed certificate, browsers will show a warning indicating the certificate is not trusted. This is expected behavior for self-signed certificates.
- **Use Cases**: Self-signed certificates are ideal for internal or testing environments but should not be used for public-facing websites.
- **Expiration**: The certificate is valid for 365 days. Ensure to regenerate it before expiration to avoid service interruptions.
