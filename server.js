const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const getArgValue = (argName) => {
  // Handle both --arg=value and --arg value formats
  const equalFormat = args.find(arg => arg.startsWith(`${argName}=`));
  if (equalFormat) return equalFormat.split('=')[1];
  
  const spaceFormat = args.indexOf(argName);
  if (spaceFormat !== -1 && args.length > spaceFormat + 1) return args[spaceFormat + 1];
  
  return null;
};

const portValue = getArgValue('--port');
const hostValue = getArgValue('--host');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Define host and port
const HOST = hostValue || process.env.HOST || 'scaleup-admin.local';
const PORT = portValue ? parseInt(portValue) : (process.env.PORT || 3000); // Using port 3000 as default

// Check if certificate files exist for custom domain
const certPath = path.join(__dirname, 'certs', 'scaleup-admin.local.pem');
const keyPath = path.join(__dirname, 'certs', 'scaleup-admin.local-key.pem');


let httpsOptions;

// Determine which certificate files to use
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log(`> Using certificates for ${HOST} from certs directory`);
  httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
} else {
  console.error('> Certificate files not found in certs directory!');
  console.error('> Please generate SSL certificates first. See https-setup.md for instructions.');
  process.exit(1);
}

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    // Fix cookie domain issues by improving Set-Cookie header handling
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
      if (name.toLowerCase() === 'set-cookie' && (Array.isArray(value) || typeof value === 'string')) {
        // Ensure value is an array for consistent processing
        const cookies = Array.isArray(value) ? value : [value];
        
        // Process each cookie to fix domain and SameSite issues
        const processedCookies = cookies.map(cookie => {
          // 1. Ensure domain is correct without port
          let processed = cookie.replace(/domain=([^;]+):\d+/g, 'domain=$1');
          
          // 2. Add domain if missing
          if (!processed.includes('domain=')) {
            processed += `; domain=${HOST}`;
          }
          
          // 3. For XSRF-TOKEN cookie specifically, set SameSite=None for cross-domain requests
          if (processed.includes('XSRF-TOKEN')) {
            processed = processed.replace(/samesite=lax/gi, 'samesite=none');
            
            // 4. Ensure secure attribute is present when SameSite=None
            if (!processed.includes('secure')) {
              processed += '; secure';
            }
          }
          
          return processed;
        });
        
        return originalSetHeader.call(this, name, processedCookies);
      }
      return originalSetHeader.call(this, name, value);
    };

    // Add CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-XSRF-TOKEN');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle Next.js requests
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, err => {
    if (err) {
      if (err.code === 'EACCES' && PORT < 1024) {
        console.error(`> Error: Permission denied to bind to port ${PORT}`);
        console.error('> Ports below 1024 require elevated privileges.');
        console.error('> Try one of the following options:');
        console.error('> 1. Run the script with sudo/administrator privileges');
        console.error('> 2. Use PORT=3000 in your .env file and set up a reverse proxy');
        console.error('> 3. On Linux/Mac, you can use: sudo setcap cap_net_bind_service=+ep `which node`');
        process.exit(1);
      } else {
        throw err;
      }
    }
    
    // Always show the port for clarity, except for default HTTPS port 443
    const portDisplay = PORT === 443 ? '' : `:${PORT}`;
    console.log(`> Ready on https://${HOST}${portDisplay}`);
    console.log('> Note: You may need to accept the self-signed certificate in your browser');
    console.log('> Make sure you have added the following to your hosts file:');
    console.log(`> 127.0.0.1 ${HOST}`);
    
    if (PORT === 443) {
      console.log('');
      console.log('> ✅ Using default HTTPS port (443). You can access the site without specifying a port:');
      console.log(`> https://${HOST}`);
    } else if (PORT === 3000) {
      console.log('');
      console.log('> ✅ Using standard development port (3000). Access the site at:');
      console.log(`> https://${HOST}:${PORT}`);
    }
  });
}); 