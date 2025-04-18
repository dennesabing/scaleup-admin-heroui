/**
 * CSRF Debug Utility
 * 
 * This module provides debugging functions for CSRF token issues.
 */

/**
 * Get the current CSRF token from cookies
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
      return decodeURIComponent(match[2]);
    }
    return null;
  } catch (error) {
    console.error('Error getting CSRF token from cookies:', error);
    return null;
  }
}

/**
 * Get all cookies as a formatted string
 */
export function getAllCookies(): string {
  if (typeof document === 'undefined') return '';
  
  return document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .join('\n');
}

/**
 * Log complete CSRF debug information
 */
export function logCSRFDebug(): void {
  // console.group('CSRF Debug Information');
  // console.log('CSRF Token:', getCSRFToken());
  // console.log('All Cookies:', getAllCookies());
  // console.log('URL:', window.location.href);
  // console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
  // console.groupEnd();
}

/**
 * Fetch a new CSRF token
 */
export async function refreshCSRFToken(): Promise<string | null> {
  try {
    console.log('Fetching new CSRF token...');
    
    const response = await fetch(`/api/proxy/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    const data = await response.json();
    console.log('CSRF debug: Received response:', data);
    
    // Check if we have a token in the response
    const token = data.csrf_token;
    if (!token) {
      console.error('CSRF debug: No token found in response');
      return null;
    }
    
    console.log('CSRF debug: Token found in response:', token);
    
    // Check if cookie was set correctly
    const cookies = document.cookie;
    console.log('CSRF debug: All cookies after request:', cookies);
    
    // Set meta tag for fallback purposes
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      meta.setAttribute('content', token);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'csrf-token';
      newMeta.content = token;
      document.head.appendChild(newMeta);
    }
    
    return token;
  } catch (error) {
    console.error('Error refreshing CSRF token:', error);
    return null;
  }
}

export default {
  getCSRFToken,
  getAllCookies,
  logCSRFDebug,
  refreshCSRFToken
}; 