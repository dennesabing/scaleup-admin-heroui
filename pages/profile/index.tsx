import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useAuth } from "@/lib/authMiddleware";
import { getCurrentUser, UserModel, getUser } from "@/lib/auth";
import useApiError from "@/hooks/useApiError";
import AdminLayout from "@/layouts/admin";
import { 
  ProfileSection,
  PasswordSection,
  EmailSection,
  DeleteAccountSection
} from "@/components/profile";

export default function ProfilePage() {
  useAuth(); // Protect the page
  
  const { error, clearError, handleError } = useApiError();
  
  // User profile state
  const [user, setUser] = useState<UserModel>({
    id: 0,
    name: "",
    email: "",
    email_verified_at: null,
  });
  
  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await getUser();
      setUser(updatedUser);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);
  
  // Fetch user data on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);
  
  // Error handler function for child components
  const handleComponentError = (err: unknown) => {
    clearError();
    handleError(err);
  };
  
  return (
    <>
      <Head>
        <title>My Profile - ScaleUp CRM</title>
      </Head>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-default-500">Manage your account settings and preferences</p>
        </div>
        
        {/* Profile Information */}
        <ProfileSection
          user={user}
          onError={handleComponentError}
        />
        
        {/* Update Password */}
        <PasswordSection
          onError={handleComponentError}
        />
        
        {/* Update Email */}
        <EmailSection
          user={user}
          onError={handleComponentError}
          onEmailUpdate={refreshUser}
        />
        
        {/* Delete Account */}
        <DeleteAccountSection
          user={user}
          onError={handleComponentError}
        />
        
        {/* Error message */}
        {error && (
          <div className="rounded-md bg-danger-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

ProfilePage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
}; 