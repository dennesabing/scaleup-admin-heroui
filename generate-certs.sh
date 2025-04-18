#!/bin/bash

# Script to generate certificates for local development with custom domains

# Ensure the certs directory exists
mkdir -p certs
cd certs

echo "Certificate generator for custom domains"
echo "----------------------------------------"
echo 

# Check if mkcert is installed
if command -v mkcert &> /dev/null; then
    echo "Using mkcert to generate trusted certificates..."
    
    # Install the local CA if not already installed
    echo "Installing local CA (may ask for your password)..."
    mkcert -install
    
    # Generate certificates for custom domains
    echo "Generating certificates for *.local domains..."
    mkcert scaleup-admin.local "*.local" localhost 127.0.0.1 ::1
    
    echo "Success! Trusted certificates were created:"
    ls -la scaleup-admin.local*
    
    echo 
    echo "You can now use HTTPS with your custom domains without browser warnings."

else
    echo "mkcert not found. Falling back to OpenSSL self-signed certificates..."
    echo "Note: These certificates will cause browser security warnings."
    
    # Create a self-signed certificate for scaleup-admin.local
    echo "Generating self-signed certificate for scaleup-admin.local..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout scaleup-admin.local-key.pem \
        -out scaleup-admin.local.pem \
        -subj "/CN=scaleup-admin.local" \
        -addext "subjectAltName=DNS:scaleup-admin.local,DNS:*.local,DNS:localhost,IP:127.0.0.1,IP:::1"
    
    echo "Success! Self-signed certificates were created:"
    ls -la scaleup-admin.local*
    
    echo 
    echo "⚠️  WARNING: Since these are self-signed certificates, you'll need to accept security warnings in your browser."
    echo "For a better experience, consider installing mkcert:"
    echo "  - Windows: choco install mkcert"
    echo "  - macOS: brew install mkcert"
    echo "  - Linux: See https://github.com/FiloSottile/mkcert#linux"
fi

echo
echo "Next steps:"
echo "1. Make sure your hosts file is configured with:"
echo "   127.0.0.1 scaleup-admin.local"
echo "   127.0.0.1 scaleup-api.local"
echo "2. Run the HTTPS development server on port 443 (requires root/administrator privileges):"
echo "   sudo npm run dev:https"
echo "3. Access your app at https://scaleup-admin.local (no port needed)"
echo
echo "Note: To run on port 443 (default HTTPS port), you need root/administrator privileges."
echo "Alternatively, you can use PORT=3000 in your .env.local file and access via https://scaleup-admin.local:3000"
echo 