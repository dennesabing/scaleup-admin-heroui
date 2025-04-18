import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';

/**
 * CSRF token proxy endpoint
 * This endpoint acts as a proxy for CSRF token requests to handle cross-domain cookie issues
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('CSRF proxy: Received request');
  console.log('Host:', req.headers.host);

  try {
    // Create an HTTPS agent that ignores SSL certificate validation for local development
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // Ignore SSL certificate validation
    });

    console.log('CSRF proxy: Fetching token from API:', `${process.env.NEXT_PUBLIC_API_URL}/csrf`);

    // Fetch CSRF token from the backend API
    const apiResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/csrf`, {
      withCredentials: true,
      httpsAgent // Use the custom HTTPS agent to ignore SSL validation
    });

    console.log('CSRF proxy: Received response from API');
    console.log('Response status:', apiResponse.status);
    console.log('Response data:', apiResponse.data);
    console.log('Response headers:', apiResponse.headers);

    // Extract all cookies from the backend response
    const cookies = apiResponse.headers['set-cookie'] || [];
    console.log('All cookies from response:', cookies);

    // Process each cookie to ensure JavaScript accessibility
    const processedCookies = cookies.map(cookie => {
      // Remove HttpOnly flag if present
      let processed = cookie.replace(/httponly(;|\s|$)/gi, '');
      
      // Remove domain restrictions
      processed = processed.replace(/domain=[^;]+;/g, '');
      
      // Set the domain to our frontend domain
      const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 
                    req.headers.host?.split(':')[0] || 
                    'scaleup-admin.local';
      
      processed += `; domain=${domain}`;
      
      // Ensure path is set to root
      if (!processed.includes('path=')) {
        processed += '; path=/';
      }
      
      // If this is the XSRF token, ensure SameSite is set properly
      if (processed.includes('XSRF-TOKEN')) {
        processed = processed.replace(/samesite=lax/gi, 'samesite=none');
        
        // Ensure secure flag is present with SameSite=None
        if (!processed.includes('secure')) {
          processed += '; secure';
        }
      }
      
      return processed;
    });

    // Set all the processed cookies
    if (processedCookies.length > 0) {
      res.setHeader('Set-Cookie', processedCookies);
      console.log('Setting processed cookies:', processedCookies);
    } else {
      console.warn('No cookies to process from API response');
    }

    // Return the CSRF token
    return res.status(200).json(apiResponse.data);
  } catch (error) {
    console.error('CSRF proxy error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch CSRF token', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
} 