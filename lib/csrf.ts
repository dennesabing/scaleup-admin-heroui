import axios from 'axios';

/**
 * Get the CSRF token from cookies
 * @returns The CSRF token or null if not found
 */
export const getCSRFToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  try {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
      return decodeURIComponent(match[2]);
    }
    return null;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
};

/**
 * Refresh the CSRF token by making a request to the server
 * @returns The new CSRF token or null if an error occurred
 */
export const refreshCSRFToken = async (): Promise<string | null> => {
  try {
    // Use our proxy endpoint instead of the direct API
    await axios.get(`/api/proxy/csrf`, {
      withCredentials: true
    });

    
    
    // Wait a moment for the cookie to be properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return the newly set token
    return getCSRFToken();
  } catch (error) {
    console.error('Error refreshing CSRF token:', error);
    return null;
  }
};

/**
 * Ensure a valid CSRF token is available
 * @returns The CSRF token or null if it couldn't be obtained
 */
export const ensureCSRFToken = async (): Promise<string | null> => {
  const token = getCSRFToken();
  if (token) return token;
  
  // If no token found, try to refresh it
  return await refreshCSRFToken();
}; 