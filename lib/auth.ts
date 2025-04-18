import axios, { AxiosError } from 'axios';
import axiosInstance from './axios';

// Remove token-related interfaces
export interface AuthModel {
  // No longer storing tokens in localStorage
}

export interface UserModel {
  id: number;
  email: string;
  name?: string;
  email_verified_at?: string | null;
  // Add other user properties as needed
}

export interface ApiError {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

const USER_STORAGE_KEY = 'user';

// Authentication helpers
export const getCurrentUser = (): UserModel | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userString = localStorage.getItem(USER_STORAGE_KEY);
    if (!userString) return null;
    return JSON.parse(userString) as UserModel;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setCurrentUser = (user: UserModel): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const removeCurrentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
};

// Helper function to format error messages
export const formatApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    if (axiosError.response?.data) {
      const { message, error: errorMsg, errors } = axiosError.response.data;
      
      // If there are field validation errors, format them
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        if (errorMessages.length > 0) {
          return errorMessages.join(', ');
        }
      }
      
      // Use provided message or error
      if (message) return message;
      if (errorMsg) return errorMsg;
    }
    
    // Status code based messages
    const status = axiosError.response?.status;
    if (status === 401) {
      return 'Invalid email or password';
    } else if (status === 403) {
      return 'You do not have permission to access this resource';
    } else if (status === 404) {
      return 'Resource not found';
    } else if (status === 429) {
      return 'Too many requests. Please try again later';
    } else if (status && status >= 500) {
      return 'Server error. Please try again later';
    }
    
    return axiosError.message || 'An error occurred';
  } else if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// API endpoints
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  VERIFY_EMAIL_SEND: '/auth/verify-email/send',
  LOGOUT: '/auth/logout',
  ME: '/me',
  SANCTUM_CSRF_COOKIE: '/csrf',
};

// Auth service functions
export const login = async (email: string, password: string): Promise<{ user: UserModel }> => {
  // Remove any existing user data before attempting login
  removeCurrentUser();
  
  try {
    console.log('Starting login process with enhanced CSRF handling');
    
    // Make multiple attempts to get a valid CSRF token
    let attempts = 0;
    const maxAttempts = 3;
    let loginSuccess = false;
    let lastError = null;
    
    while (!loginSuccess && attempts < maxAttempts) {
      attempts++;
      console.log(`Login attempt ${attempts} of ${maxAttempts}`);
      
      try {
        // Get CSRF token before login using our proxy
        const response = await axios.get(`/api/proxy/csrf`, {
          withCredentials: true
        });
        
        console.log(`Login attempt ${attempts}: Received CSRF response:`, response.data);
        
        // Wait longer for cookie to be properly set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Log all cookies for debugging
        console.log(`Login attempt ${attempts}: All cookies:`, document.cookie);
        
        // Collection of token formats to try
        const tokenFormats = [];
        
        // Raw token from cookie
        const rawToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN='))
          ?.split('=')[1];
        
        if (rawToken) {
          tokenFormats.push({ 
            type: 'raw-cookie', 
            token: rawToken, 
            headers: { 'X-XSRF-TOKEN': rawToken }
          });
          
          // Also try decoded version
          tokenFormats.push({ 
            type: 'decoded-cookie', 
            token: decodeURIComponent(rawToken), 
            headers: { 'X-XSRF-TOKEN': decodeURIComponent(rawToken) }
          });
        }
        
        // Token from response
        if (response.data?.raw_csrf_token) {
          tokenFormats.push({ 
            type: 'raw-response', 
            token: response.data.raw_csrf_token, 
            headers: { 'X-XSRF-TOKEN': response.data.raw_csrf_token }
          });
        }
        
        if (response.data?.csrf_token) {
          tokenFormats.push({ 
            type: 'decoded-response', 
            token: response.data.csrf_token, 
            headers: { 'X-XSRF-TOKEN': response.data.csrf_token }
          });
        }
        
        // Meta tag token
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
          tokenFormats.push({ 
            type: 'meta', 
            token: metaToken, 
            headers: { 'X-XSRF-TOKEN': metaToken }
          });
        }
        
        if (tokenFormats.length === 0) {
          console.error('No CSRF tokens available to try');
          throw new Error('CSRF token not found. Please ensure cookies are enabled in your browser and try again.');
        }
        
        console.log(`Login attempt ${attempts}: Found ${tokenFormats.length} token formats to try`);
        
        // Try each token format
        let tokenSuccess = false;
        let tokenError = null;
        
        for (const format of tokenFormats) {
          try {
            console.log(`Login attempt ${attempts}: Trying ${format.type} token:`, format.token);
            
            // Make login request with this token format
            await axiosInstance.post(
              API_ENDPOINTS.LOGIN,
              { email, password },
              { headers: format.headers }
            );
            
            console.log(`Login attempt ${attempts}: Success with ${format.type} token!`);
            tokenSuccess = true;
            loginSuccess = true;
            break;
          } catch (err) {
            console.error(`Login attempt ${attempts}: Failed with ${format.type} token:`, err);
            tokenError = err;
          }
        }
        
        if (!tokenSuccess) {
          console.error(`Login attempt ${attempts}: All token formats failed`);
          throw tokenError || new Error('All CSRF token formats failed');
        }
        
      } catch (err) {
        console.error(`Login attempt ${attempts} failed:`, err);
        lastError = err;
        
        // Wait before retry
        if (attempts < maxAttempts) {
          console.log(`Waiting before retry attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!loginSuccess) {
      console.error('All login attempts failed');
      throw lastError || new Error('Login failed after multiple attempts');
    }
    
    // If we got here, the login was successful
    // Fetch user data with separate error handling
    try {
      const userResponse = await axiosInstance.get(API_ENDPOINTS.ME);
      const user = userResponse.data.data as UserModel;
      setCurrentUser(user);
      return { user };
    } catch (userError) {
      // If user fetch fails, return a minimal user object
      console.warn('Error fetching user data:', userError);
      const minimalUser: UserModel = {
        id: 0,
        email,
        name: '',
      };
      return { user: minimalUser };
    }
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const register = async (
  email: string, 
  password: string, 
  name: string,
  password_confirmation: string,
  accept_terms: boolean
): Promise<{ user: UserModel }> => {
  try {
    // Make a dedicated CSRF token request with our proxy
    await axios.get(`/api/proxy/csrf`, {
      withCredentials: true
    });
    
    // Wait a moment for the cookie to be properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await axiosInstance.post(API_ENDPOINTS.REGISTER, {
      email,
      password,
      name,
      password_confirmation,
      accept_terms
    });
    
    // Fetch user data
    const userResponse = await axiosInstance.get(API_ENDPOINTS.ME);
    const user = userResponse.data.data as UserModel;
    setCurrentUser(user);
    
    return { user };
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const forgotPassword = async (email: string): Promise<void> => {
  try {
    // Make a dedicated CSRF token request with our proxy
    await axios.get(`/api/proxy/csrf`, {
      withCredentials: true
    });
    
    // Wait a moment for the cookie to be properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const resetPassword = async (
  email: string,
  token: string,
  password: string
): Promise<void> => {
  try {
    // Make a dedicated CSRF token request with our proxy
    await axios.get(`/api/proxy/csrf`, {
      withCredentials: true
    });
    
    // Wait a moment for the cookie to be properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, {
      email,
      token,
      password,
      password_confirmation: password
    });
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const verifyEmail = async (id: string, hash: string): Promise<void> => {
  try {
    await axiosInstance.get(`${API_ENDPOINTS.VERIFY_EMAIL}/${id}/${hash}`);
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const resendVerificationEmail = async (email: string): Promise<void> => {
  try {
    // Make a dedicated CSRF token request with our proxy
    await axios.get(`/api/proxy/csrf`, {
      withCredentials: true
    });
    
    // Wait a moment for the cookie to be properly set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await axiosInstance.post(API_ENDPOINTS.VERIFY_EMAIL_SEND, { email });
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    removeCurrentUser();
  } catch (error) {
    console.error('Logout error:', error);
    // Still remove the user data even if the server request fails
    removeCurrentUser();
  }
};

export const getUser = async (): Promise<UserModel> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.ME);
    const user = response.data.data as UserModel;
    setCurrentUser(user);
    return user;
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
}; 