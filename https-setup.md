# Setting Up HTTPS for Frontend Development

## Why HTTPS for Development?

When using HTTP-only cookies for authentication, it's important to test in an HTTPS environment because:

1. Many browsers restrict cookie functionality in insecure contexts
2. The `Secure` flag on cookies requires HTTPS
3. SameSite cookie restrictions are stricter in HTTP environments
4. It better simulates production conditions

## Using Custom Domains Instead of Localhost

Using a custom domain like `scaleup-admin.local` instead of `localhost` offers several advantages:

1. Better mimics production environment
2. Allows proper cookie sharing between subdomains
3. Improves cross-origin resource sharing behavior
4. Works better with multi-domain setups

### Step 1: Set up your hosts file

Add your custom domains to your hosts file:

**Windows:**
Edit `C:\Windows\System32\drivers\etc\hosts` with administrator privileges:
```
127.0.0.1 scaleup-admin.local
127.0.0.1 scaleup-api.local
```

**Mac/Linux:**
Edit `/etc/hosts` with sudo:
```
127.0.0.1 scaleup-admin.local
127.0.0.1 scaleup-api.local
```

## Using Default HTTPS Port (443) - No Port in URL

To access your site without specifying a port (e.g., `https://scaleup-admin.local` instead of `https://scaleup-admin.local:3000`), you need to use the default HTTPS port 443.

### Option 1: Running with Administrator/Root Privileges

Since ports below 1024 require elevated privileges, you'll need to run the server as an administrator:

**Windows:**
```
# Run PowerShell as administrator, then:
npm run dev:https
```

**Mac/Linux:**
```
sudo npm run dev:https
```

### Option 2: Granting Node.js Permission to Use Privileged Ports

**Linux/Mac only:**
```bash
# Grant Node.js permission to use privileged ports
sudo setcap cap_net_bind_service=+ep $(which node)

# Then you can run without sudo
npm run dev:https
```

### Option 3: Use a Reverse Proxy (Recommended for Regular Development)

This lets you run the Next.js server on a regular port (e.g., 3000) while exposing it on port 443:

1. Set PORT=3000 in your .env.local file
2. Run your Next.js server: `npm run dev:https`
3. Use a reverse proxy like Nginx, Caddy, or nginx-proxy-manager to forward traffic from port 443 to 3000

**Sample Nginx Configuration:**
```nginx
server {
    listen 443 ssl;
    server_name scaleup-admin.local;

    ssl_certificate /path/to/certs/scaleup-admin.local.pem;
    ssl_certificate_key /path/to/certs/scaleup-admin.local-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Option 1: Using Next.js HTTPS Development Server with Custom Domain

### Step 1: Generate certificates for your custom domain

```bash
# Create certs directory
mkdir -p certs

# Move to the directory
cd certs

# Generate a self-signed certificate for your custom domain
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout scaleup-admin.local-key.pem -out scaleup-admin.local.pem
```

When prompted, use `scaleup-admin.local` as the Common Name.

### Step 2: Configure environment variables

Create a `.env.local` file based on the example provided:

```
# API Configuration
NEXT_PUBLIC_API_URL=https://scaleup-api.local
NEXT_PUBLIC_APP_URL=https://scaleup-admin.local

# Authentication Settings
NEXT_PUBLIC_COOKIE_DOMAIN=.local
NEXT_PUBLIC_SECURE_COOKIES=true

# Development Server
HOST=scaleup-admin.local
PORT=443  # Use default HTTPS port
```

### Step 3: Start the HTTPS server

```bash
# With administrator/root privileges
sudo npm run dev:https
```

Then visit `https://scaleup-admin.local` in your browser. You'll need to accept the security warning about the self-signed certificate.

## Option 2: Using mkcert with Custom Domains (Recommended)

mkcert creates locally-trusted development certificates that browsers will accept without warnings.

### Step 1: Install mkcert

**Windows (using Chocolatey):**
```bash
choco install mkcert
```

**macOS (using Homebrew):**
```bash
brew install mkcert
brew install nss # if you use Firefox
```

**Linux:**
```bash
# Install certutil first
sudo apt install libnss3-tools

# Then download and install mkcert
# See mkcert GitHub page for latest instructions
```

### Step 2: Create a local CA and generate certificates for your domains

```bash
# Create and install local CA
mkcert -install

# Create certificates for your custom domains
mkdir -p certs
cd certs
mkcert scaleup-admin.local "*.local" localhost 127.0.0.1 ::1
```

This will create certificates that work for all `.local` domains.

### Step 3: Start the server

The server.js file is already configured to look for these certificate files.

```bash
# Run with administrator/root privileges
sudo npm run dev:https
```

## Option 3: Using local-ssl-proxy (Simplest approach)

If you prefer not to modify your Next.js setup, you can use a proxy:

### Step 1: Install local-ssl-proxy

```bash
npm install -g local-ssl-proxy
```

### Step 2: Start your Next.js app normally

```bash
npm run dev
# This starts your app on http://localhost:3000
```

### Step 3: Run the proxy in another terminal

```bash
local-ssl-proxy --source 3001 --target 3000
```

Now you can access your app via HTTPS at `https://localhost:3001`

## Updating Environment Configuration

Update your `.env.local` file to use HTTPS URLs:

```
NEXT_PUBLIC_API_URL=https://scaleup-api.local
NEXT_PUBLIC_APP_URL=https://scaleup-admin.local
```

Ensure your backend is also configured for HTTPS and has the correct CORS settings for your HTTPS frontend origin.

## Troubleshooting

1. **Browser shows certificate warnings**: Expected with self-signed certificates. Click "Advanced" and "Proceed" (or equivalent in your browser). With mkcert, you shouldn't see any warnings.

2. **Cannot access custom domain**: Make sure your hosts file is properly configured and that no other application is using the same port.

3. **Cookies not working across domains**: Ensure you're using a shared parent domain (like `.local`) for cookies and that both sites are using HTTPS.

4. **CORS issues**: Ensure your backend CORS configuration includes your custom domain:
   ```php
   // For Laravel
   config/cors.php:
   'allowed_origins' => ['https://scaleup-admin.local'],
   'supports_credentials' => true,
   ```

5. **Mixed content warnings**: Make sure all resources (APIs, assets) are loaded over HTTPS.

6. **ERR_CERT_COMMON_NAME_INVALID**: This occurs when the certificate domain doesn't match the URL. Ensure your certificate's Common Name matches the domain you're accessing.

7. **Permission denied binding to port 443**: This happens because ports below 1024 require elevated privileges. See the section above on running with administrator/root privileges or using a reverse proxy. 