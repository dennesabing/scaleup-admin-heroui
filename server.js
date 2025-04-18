const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Process command line arguments
const args = process.argv.slice(2);
const getArgValue = (name) => {
  // Handle both formats: --name=value and --name value
  const withEqualArg = args.find(arg => arg.startsWith(`${name}=`));
  if (withEqualArg) return withEqualArg.split('=')[1];
  
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args.length > index + 1) return args[index + 1];
  
  return null;
};

// Get development mode
const dev = process.env.NODE_ENV !== 'production';

// Parse host and port from command line or use defaults
const HOST = getArgValue('host') || 'scaleup-admin.local';
const PORT = parseInt(getArgValue('port') || '3000', 10);

// Initialize Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

// Configure SSL certificate paths
const certsDir = path.join(__dirname, 'certs');
const certFile = path.join(certsDir, `${HOST}.pem`);
const keyFile = path.join(certsDir, `${HOST}-key.pem`);

// Check if directory exists, if not, create it
if (!fs.existsSync(certsDir)) {
  console.log('Creating certs directory...');
  fs.mkdirSync(certsDir);
}

// Check for existing certificates
if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
  console.error('SSL certificates not found!');
  console.error(`Expected certificate files at: ${certFile} and ${keyFile}`);
  console.error('\nTo generate certificates, you can use mkcert (https://github.com/FiloSottile/mkcert):');
  console.error(`  mkcert -install`);
  console.error(`  mkcert ${HOST}`);
  console.error(`Then move the generated files to the certs directory.`);
  process.exit(1);
}

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

// Prepare the Next.js application
app.prepare().then(() => {
  // Create HTTPS server
  createServer(httpsOptions, (req, res) => {
    // Enhance cookies for cross-domain access
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
      if (name.toLowerCase() === 'set-cookie' && value) {
        // Process cookies to fix domain and SameSite attributes
        const cookies = Array.isArray(value) ? value : [value];
        
        const processedCookies = cookies.map(cookie => {
          // Remove any existing domain
          let processed = cookie.replace(/domain=[^;]+;/g, '');
          
          // Remove HttpOnly flag if present
          processed = processed.replace(/httponly(;|\s|$)/gi, '');
          
          // Add our domain
          processed += `; domain=${HOST}`;
          
          // Ensure proper SameSite attribute for cross-origin requests
          if (processed.includes('samesite=lax')) {
            processed = processed.replace(/samesite=lax/gi, 'samesite=none');
          } else if (!processed.includes('samesite=')) {
            processed += '; samesite=none';
          }
          
          // Ensure the secure flag is present with SameSite=None
          if (!processed.includes('secure')) {
            processed += '; secure';
          }
          
          // Ensure path is set to root
          if (!processed.includes('path=')) {
            processed += '; path=/';
          }
          
          return processed;
        });
        
        // Call the original setHeader with processed cookies
        return originalSetHeader.call(this, name, processedCookies);
      }
      
      // For all other headers, pass through unchanged
      return originalSetHeader.call(this, name, value);
    };
    
    // Parse the URL
    const parsedUrl = parse(req.url, true);
    
    // Add custom server logic here
    console.log(`Incoming request: ${req.method} ${req.url}`);
    
    // Let Next.js handle the request
    handle(req, res, parsedUrl);
  }).listen(PORT, err => {
    if (err) throw err;
    
    console.log(`\n> Ready on https://${HOST}:${PORT}`);
    console.log('> Make sure you have the following entry in your hosts file:');
    console.log(`  127.0.0.1  ${HOST}`);
  });
}); 