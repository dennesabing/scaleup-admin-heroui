# PowerShell script to generate certificates for local development with custom domains

# Ensure the certs directory exists
New-Item -ItemType Directory -Force -Path "certs"
Set-Location -Path "certs"

Write-Host "Certificate generator for custom domains" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host ""

# Check if mkcert is installed
$mkcertExists = $null -ne (Get-Command "mkcert" -ErrorAction SilentlyContinue)

if ($mkcertExists) {
    Write-Host "Using mkcert to generate trusted certificates..." -ForegroundColor Cyan
    
    # Install the local CA if not already installed
    Write-Host "Installing local CA (may ask for administrator access)..." -ForegroundColor Cyan
    mkcert -install
    
    # Generate certificates for custom domains
    Write-Host "Generating certificates for *.local domains..." -ForegroundColor Cyan
    mkcert scaleup-admin.local "*.local" localhost 127.0.0.1 ::1
    
    Write-Host "Success! Trusted certificates were created:" -ForegroundColor Green
    Get-ChildItem "scaleup-admin.local*"
    
    Write-Host ""
    Write-Host "You can now use HTTPS with your custom domains without browser warnings." -ForegroundColor Green
}
else {
    Write-Host "mkcert not found. Falling back to OpenSSL self-signed certificates..." -ForegroundColor Yellow
    Write-Host "Note: These certificates will cause browser security warnings." -ForegroundColor Yellow
    
    # Check if OpenSSL is installed
    $opensslExists = $null -ne (Get-Command "openssl" -ErrorAction SilentlyContinue)
    
    if ($opensslExists) {
        # Create a self-signed certificate for scaleup-admin.local
        Write-Host "Generating self-signed certificate for scaleup-admin.local..." -ForegroundColor Cyan
        
        # Create the certificate with subject alternative names
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout scaleup-admin.local-key.pem `
            -out scaleup-admin.local.pem `
            -subj "/CN=scaleup-admin.local" `
            -addext "subjectAltName=DNS:scaleup-admin.local,DNS:*.local,DNS:localhost,IP:127.0.0.1,IP:::1"
        
        Write-Host "Success! Self-signed certificates were created:" -ForegroundColor Green
        Get-ChildItem "scaleup-admin.local*"
    }
    else {
        Write-Host "ERROR: Neither mkcert nor OpenSSL was found." -ForegroundColor Red
        Write-Host "Please install one of these tools to generate certificates:" -ForegroundColor Red
        Write-Host "  - Install mkcert: 'choco install mkcert'" -ForegroundColor Yellow
        Write-Host "  - Install OpenSSL: 'choco install openssl'" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "WARNING: Since these are self-signed certificates, you'll need to accept security warnings in your browser." -ForegroundColor Yellow
    Write-Host "For a better experience, consider installing mkcert:" -ForegroundColor Yellow
    Write-Host "  choco install mkcert" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Make sure your hosts file is configured with:"
Write-Host "   127.0.0.1 scaleup-admin.local" -ForegroundColor Cyan
Write-Host "   127.0.0.1 scaleup-api.local" -ForegroundColor Cyan
Write-Host "2. Run the HTTPS development server on port 443 (requires administrator privileges):"
Write-Host "   # Run PowerShell as administrator" -ForegroundColor Cyan
Write-Host "   npm run dev:https" -ForegroundColor Cyan
Write-Host "3. Access your app at https://scaleup-admin.local (no port needed)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: To run on port 443 (default HTTPS port), you need administrator privileges." -ForegroundColor Yellow
Write-Host "Alternatively, you can set PORT=3000 in your .env.local file and access via https://scaleup-admin.local:3000" -ForegroundColor Yellow 