import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosResponse } from 'axios';
import https from 'https';

interface DebugInfo {
  request: {
    headers: any;
    cookies: any;
    host: string | undefined;
  };
  response: {
    status: number | null;
    headers: any;
    data: any;
    cookies: string[] | null;
    error: any;
  };
  tokens: {
    backendCookieToken: string | null;
    backendResponseToken: string | null;
    backendCookieTokenDecoded: string | null;
    processedToken: string | null;
    allProcessedCookies?: string[];
  };
}

/**
 * CSRF token debug endpoint
 * This endpoint provides detailed information about CSRF token formats and encoding
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const debug: DebugInfo = {
    request: {
      headers: req.headers,
      cookies: req.cookies,
      host: req.headers.host
    },
    response: {
      status: null,
      headers: null,
      data: null,
      cookies: null,
      error: null
    },
    tokens: {
      backendCookieToken: null,
      backendResponseToken: null,
      backendCookieTokenDecoded: null,
      processedToken: null
    }
  };

  try {
    // Create an HTTPS agent that ignores SSL certificate validation
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    // Fetch CSRF token from the backend API
    const apiResponse: AxiosResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/csrf`, {
      withCredentials: true,
      httpsAgent
    });

    // Update debug info
    debug.response.status = apiResponse.status;
    debug.response.data = apiResponse.data;
    debug.response.headers = apiResponse.headers;

    // Extract all cookies
    const cookies = apiResponse.headers['set-cookie'] || [];
    debug.response.cookies = cookies;

    // Extract the XSRF-TOKEN cookie
    let xsrfCookie = '';
    let rawCsrfToken = '';

    for (const cookie of cookies) {
      if (cookie.includes('XSRF-TOKEN=')) {
        xsrfCookie = cookie;
        
        // Extract the raw token value
        const match = cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match && match[1]) {
          rawCsrfToken = match[1];
          debug.tokens.backendCookieToken = rawCsrfToken;
          try {
            debug.tokens.backendCookieTokenDecoded = decodeURIComponent(rawCsrfToken);
          } catch (e) {
            const err = e as Error;
            debug.tokens.backendCookieTokenDecoded = `Error decoding: ${err.message}`;
          }
        }
        break;
      }
    }

    // Get response token
    if (apiResponse.data && apiResponse.data.csrf_token) {
      debug.tokens.backendResponseToken = apiResponse.data.csrf_token;
    }

    // Process the token for frontend
    if (rawCsrfToken) {
      const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || req.headers.host?.split(':')[0] || 'scaleup-admin.local';
      
      // Create a non-HttpOnly cookie
      const processedCookie = `XSRF-TOKEN=${rawCsrfToken}; path=/; domain=${domain}; secure; samesite=none; max-age=7200`;
      debug.tokens.processedToken = processedCookie;
      
      // Set the cookie
      res.setHeader('Set-Cookie', processedCookie);
    }
    
    // For all cookies in the response, also set them without HttpOnly
    if (cookies.length > 0) {
      const allProcessedCookies = cookies.map(cookie => {
        // Remove any HttpOnly flag
        let processed = cookie.replace(/httponly(;|\s|$)/gi, '');
        
        // Remove domain restrictions
        processed = processed.replace(/domain=[^;]+;/g, '');
        
        // Add our domain
        const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || req.headers.host?.split(':')[0] || 'scaleup-admin.local';
        processed += `; domain=${domain}`;
        
        // Ensure path is set
        if (!processed.includes('path=')) {
          processed += '; path=/';
        }
        
        return processed;
      });
      
      // Add these processed cookies to the debug info
      debug.tokens.allProcessedCookies = allProcessedCookies;
      
      // Don't set the XSRF-TOKEN cookie twice
      const otherCookies = allProcessedCookies.filter(c => !c.includes('XSRF-TOKEN='));
      if (otherCookies.length > 0) {
        const currentCookies = res.getHeader('Set-Cookie');
        const combinedCookies = Array.isArray(currentCookies)
          ? [...currentCookies, ...otherCookies]
          : typeof currentCookies === 'string'
            ? [currentCookies, ...otherCookies]
            : otherCookies;
            
        res.setHeader('Set-Cookie', combinedCookies);
      }
    }

    // Return detailed debug info
    return res.status(200).json({
      message: 'CSRF token debug information',
      debug,
      instructions: `
        1. This endpoint provides detailed CSRF token debugging
        2. The original backend cookie token is: ${debug.tokens.backendCookieToken}
        3. The decoded version is: ${debug.tokens.backendCookieTokenDecoded}
        4. The token from the backend response is: ${debug.tokens.backendResponseToken}
        5. The processed cookie being set is: ${debug.tokens.processedToken}
        
        Try using these exact values as X-XSRF-TOKEN header in your requests.
      `
    });
  } catch (error) {
    if (error instanceof Error) {
      debug.response.error = {
        message: error.message,
        stack: error.stack
      };
    } else {
      debug.response.error = String(error);
    }
    
    return res.status(500).json({
      message: 'Error fetching CSRF token debug information',
      debug
    });
  }
} 