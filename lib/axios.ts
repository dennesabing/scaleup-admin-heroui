import axios, { InternalAxiosRequestConfig } from 'axios';


// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,  // Enable cookies to be sent with cross-domain requests
  timeout: 10000
});

// Enable CSRF debug mode
const CSRF_DEBUG_MODE = true;

// Utility function to get CSRF token from cookies
const getCSRFToken = (): string => {
  if (typeof document === 'undefined') return '';
  
  try {
    // Find the XSRF-TOKEN cookie - use raw token without decoding
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
      // Use the raw token value without decoding
      const rawToken = match[2];
      console.log('Found raw CSRF token in cookie:', rawToken);
      return rawToken;
    }
    
    // Fallback to meta tag if cookie not found
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) {
      console.log('Found CSRF token in meta tag:', metaToken);
      return metaToken;
    }
    
    console.warn('No CSRF token found in cookies or meta tag');
    return '';
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return '';
  }
};

// Add request interceptor to handle CSRF tokens for non-GET requests
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only fetch CSRF token for non-GET requests
    if (config.method?.toLowerCase() !== 'get') {
      // Log request details in debug mode
      if (CSRF_DEBUG_MODE) {
        console.log('CSRF Debug - Request URL:', config.url);
        console.log('CSRF Debug - Request Method:', config.method);
        console.log('CSRF Debug - Request Headers:', config.headers);
      }
      
      // Add CSRF token if it exists
      const token = getCSRFToken();
      
      if (token) {
        console.log('Using CSRF token for request:', token);
        config.headers['X-XSRF-TOKEN'] = token;
        
        // In debug mode, also add the decoded token in a separate header
        if (CSRF_DEBUG_MODE) {
          try {
            const decodedToken = decodeURIComponent(token);
            config.headers['X-XSRF-TOKEN-DECODED'] = decodedToken;
            console.log('Added decoded token for debugging:', decodedToken);
          } catch (err) {
            console.error('Error decoding token:', err);
          }
        }
      } else {
        console.log('No CSRF token found, fetching from API...');
        try {
          // Use the debug endpoint in debug mode
          const endpoint = CSRF_DEBUG_MODE ? '/api/proxy/csrf-debug' : '/api/proxy/csrf';
          
          // Fetch new token if not found - use our proxy
          await axios.get(endpoint, {
            withCredentials: true
          });
          
          // Small delay to ensure cookie is set
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try to get token again
          const newToken = getCSRFToken();
          if (newToken) {
            console.log('New CSRF token fetched:', newToken);
            config.headers['X-XSRF-TOKEN'] = newToken;
            
            // In debug mode, also add the decoded token in a separate header
            if (CSRF_DEBUG_MODE) {
              try {
                const decodedToken = decodeURIComponent(newToken);
                config.headers['X-XSRF-TOKEN-DECODED'] = decodedToken;
                console.log('Added decoded token for debugging:', decodedToken);
              } catch (err) {
                console.error('Error decoding token:', err);
              }
            }
          } else {
            console.error('Failed to get CSRF token even after refresh');
          }
        } catch (error) {
          console.error('Error fetching CSRF token:', error);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log CSRF-related errors for debugging
    if (error.response?.status === 419) {
      console.error('CSRF token mismatch error:', error);
      console.log('Current CSRF token:', getCSRFToken());
    }
    
    // Don't handle 401 errors for login/register requests
    const isAuthRequest = 
      error.config?.url?.includes('/auth/login') || 
      error.config?.url?.includes('/auth/register');

    // Handle 401 Unauthorized errors except for login/register requests
    if (error.response?.status === 401 && !isAuthRequest) {
      // Clear user data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        // Redirect to login page if not already there
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 