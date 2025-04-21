import axios from 'axios';
import axiosInstance from './axios';
import { formatApiError, getCurrentUser, setCurrentUser, getUser, logout, UserProfile } from './auth';
import { resendVerificationEmail } from './auth';

// API endpoints
const USER_ENDPOINTS = {
  PROFILE: '/me/profile',
  PASSWORD: '/me/password',
  EMAIL: '/me/email',
  DELETE: '/me/delete',
};

/**
 * Update user profile information
 * @param data Profile data to update
 */
export const updateUserProfile = async (data: { name: string; profile: UserProfile }): Promise<void> => {
  try {
    const response = await axiosInstance.put(USER_ENDPOINTS.PROFILE, data);
    
    // Update user in local storage with updated data
    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: data.name,
        profile: data.profile
      });
    }
    
    // Refresh user data from server
    await getUser();
    
    return response.data;
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

/**
 * Update user password
 * @param data Password update data
 */
export const updateUserPassword = async (data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(USER_ENDPOINTS.PASSWORD, data);
    return response.data;
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

/**
 * Update user email address
 * @param data Email update data
 */
export const updateUserEmail = async (data: {
  email: string;
  password: string;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(USER_ENDPOINTS.EMAIL, data);
    
    // Update user in local storage with new email
    const currentUser = getCurrentUser();
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        email: data.email,
        email_verified_at: null, // Reset verification status
      });
    }
    
    return response.data;
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

/**
 * Delete user account
 * @param data Account deletion confirmation data
 */
export const deleteUserAccount = async (data: {
  email: string;
  password: string;
  confirmation: string;
}): Promise<void> => {
  try {
    await axiosInstance.post(USER_ENDPOINTS.DELETE, data);
    
    // Log out the user
    logout();
  } catch (error) {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }
};

/**
 * Resend verification email to current user's email
 */
export const resendUserVerificationEmail = async (): Promise<void> => {
  return resendVerificationEmail();
}; 