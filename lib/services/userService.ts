import axiosInstance from "../axios";
import {
  formatApiError,
  getCurrentUser,
  setCurrentUser,
  getUser,
  logout,
  UserProfile,
} from "../auth";
import { resendVerificationEmail } from "../auth";

import { getAvatarUrl } from "@/utils/avatar";

// API endpoints
const USER_ENDPOINTS = {
  PROFILE: "/me/profile",
  PASSWORD: "/me/password",
  EMAIL: "/me/email",
  DELETE: "/me/delete",
  AVATAR: "/me/avatar",
  AVATAR_V2: "/me/avatar",
};

/**
 * Update user profile information
 * @param data Profile data to update
 */
export const updateUserProfile = async (data: {
  name: string;
  profile: UserProfile;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(USER_ENDPOINTS.PROFILE, data);

    // Update user in local storage with updated data
    const currentUser = getCurrentUser();

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: data.name,
        profile: data.profile,
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

/**
 * Upload user avatar image
 * @param file Image file to upload
 * @returns URL of the uploaded avatar
 */
export const updateUserAvatar = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();

    formData.append("avatar", file);

    const response = await axiosInstance.post(USER_ENDPOINTS.AVATAR, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Get avatar URL from response
    const avatarUrl =
      response.data.avatar_url || response.data.user?.profile?.avatar_url;

    if (!avatarUrl) {
      throw new Error("Failed to get avatar URL from server response");
    }

    // Format the avatar URL to use the new path
    const formattedAvatarUrl = getAvatarUrl(avatarUrl);

    // Update user in local storage with new avatar URL
    const currentUser = getCurrentUser();

    if (currentUser) {
      // Create profile object if it doesn't exist
      if (!currentUser.profile) {
        currentUser.profile = {};
      }

      // Update avatar URL
      currentUser.profile.avatar_url = formattedAvatarUrl;
      console.log("currentUser", currentUser);
      setCurrentUser(currentUser);

      // Dispatch a custom event that other components can listen for
      if (typeof window !== "undefined") {
        const avatarUpdateEvent = new CustomEvent("user:avatar-updated", {
          detail: {
            avatarUrl: formattedAvatarUrl,
            userId: currentUser.id,
          },
        });

        window.dispatchEvent(avatarUpdateEvent);
      }
    }

    // Do not refresh user data from server as it might overwrite our changes
    // if server-side processing is not complete yet

    return formattedAvatarUrl;
  } catch (error) {
    const errorMessage = formatApiError(error);

    throw new Error(errorMessage);
  }
};

/**
 * Upload user avatar image using the new V2 API endpoint
 * @param file Image file to upload
 * @returns URL of the uploaded avatar
 */
export const updateUserAvatarV2 = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();

    formData.append("avatar", file);

    const response = await axiosInstance.post(
      USER_ENDPOINTS.AVATAR_V2,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    // Get avatar URL from response
    const avatarUrl = response.data.user?.profile?.avatar_url;

    if (!avatarUrl) {
      throw new Error("Failed to get avatar URL from server response");
    }

    // Format the avatar URL to use the new path
    const formattedAvatarUrl = getAvatarUrl(avatarUrl);

    // Update user in local storage with new avatar URL
    const currentUser = response.data.user;

    if (currentUser) {
      // Create profile object if it doesn't exist
      if (!currentUser.profile) {
        currentUser.profile = {};
      }

      // Update avatar URL
      currentUser.profile.avatar_url = formattedAvatarUrl;
      setCurrentUser(currentUser);

      // Dispatch a custom event that other components can listen for
      if (typeof window !== "undefined") {
        const avatarUpdateEvent = new CustomEvent("user:avatar-updated", {
          detail: {
            avatarUrl: formattedAvatarUrl,
            userId: currentUser.id,
          },
        });

        window.dispatchEvent(avatarUpdateEvent);
      }
    }

    // Do not refresh user data from server as it might overwrite our changes
    // if server-side processing is not complete yet

    return formattedAvatarUrl;
  } catch (error) {
    const errorMessage = formatApiError(error);

    throw new Error(errorMessage);
  }
}; 