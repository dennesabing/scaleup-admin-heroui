import axios, { AxiosError } from 'axios';
import axiosInstance from './axios';

export interface AuthModel {
  access_token: string;
  api_token?: string;
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  birthdate?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  phone?: string;
}

export interface UserModel {
  id: number;
  email: string;
  name?: string;
  email_verified_at?: string | null;
  roles?: string[];
  profile?: UserProfile;
}

export interface ApiError {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

const AUTH_STORAGE_KEY = 'auth';
const USER_STORAGE_KEY = 'user';

// Authentication helpers
export const getAuth = (): AuthModel | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authString = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authString) return null;
    return JSON.parse(authString) as AuthModel;
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
};

export const setAuth = (auth: AuthModel): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

export const removeAuth = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

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
  ME: '/me',
};

// Auth service functions
export const login = async (email: string, password: string): Promise<{ auth: AuthModel, user: UserModel }> => {
  // Remove any existing auth data before attempting login
  removeAuth();
  removeCurrentUser();
  
  try {
    // Make login request with proper error handling
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, { email, password })
      .catch((error) => {
        // Handle 401 errors explicitly
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          throw new Error('Invalid email or password');
        }
        
        // Format and throw other errors
        const errorMessage = formatApiError(error);
        throw new Error(errorMessage);
      });
    
    // If we got here, the login was successful
    const auth = response.data as AuthModel;
    setAuth(auth);
    
    // Fetch user data with separate error handling
    try {
      const userResponse = await axiosInstance.get(API_ENDPOINTS.ME);
      const user = userResponse.data.data as UserModel;
      setCurrentUser(user);
      return { auth, user };
    } catch (userError) {
      // If user fetch fails, return a minimal user object
      console.warn('Error fetching user data:', userError);
      const minimalUser: UserModel = {
        id: 0,
        email,
        name: '',
      };
      return { auth, user: minimalUser };
    }
  } catch (error) {
    // Make sure auth data is cleared on error
    removeAuth();
    removeCurrentUser();
    
    // Re-throw the error to be handled by the component
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred during login');
    }
  }
};

export const logout = (): void => {
  removeAuth();
  removeCurrentUser();
};

export const register = async (
  email: string, 
  password: string, 
  name: string,
  password_confirmation: string,
  accept_terms: boolean
): Promise<{ auth: AuthModel, user: UserModel }> => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, {
      email,
      password,
      name,
      password_confirmation,
      accept_terms
    });
    
    const auth = response.data as AuthModel;
    setAuth(auth);
    
    // Fetch user data
    const userResponse = await axiosInstance.get(API_ENDPOINTS.ME);
    const user = userResponse.data.data as UserModel;
    setCurrentUser(user);
    
    return { auth, user };
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

export const forgotPassword = async (email: string): Promise<void> => {
  try {
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

export const resendVerificationEmail = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.VERIFY_EMAIL_SEND);
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
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