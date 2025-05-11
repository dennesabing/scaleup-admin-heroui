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
  DeleteAccountSection,
} from "@/components/profile";
import { TabNavigation, TabItem } from "@/components/ui/TabNavigation";

// Tab IDs
const TABS = {
  PROFILE: "profile",
  PASSWORD: "password",
  EMAIL: "email",
  DELETE: "delete",
};

export default function ProfilePage() {
  useAuth(); // Protect the page

  const { error, clearError, handleError } = useApiError();
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

  // User profile state
  const [user, setUser] = useState<UserModel>({
    id: 0,
    name: "",
    email: "",
    email_verified_at: null,
  });

  // Tab configuration
  const tabs: TabItem[] = [
    { id: TABS.PROFILE, label: "Profile Information" },
    { id: TABS.PASSWORD, label: "Password" },
    { id: TABS.EMAIL, label: "Email" },
    { id: TABS.DELETE, label: "Delete Account" },
  ];

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

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.PROFILE:
        return <ProfileSection user={user} onError={handleComponentError} />;
      case TABS.PASSWORD:
        return <PasswordSection onError={handleComponentError} />;
      case TABS.EMAIL:
        return (
          <EmailSection
            user={user}
            onEmailUpdate={refreshUser}
            onError={handleComponentError}
          />
        );
      case TABS.DELETE:
        return (
          <DeleteAccountSection user={user} onError={handleComponentError} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>My Profile - ScaleUp CRM</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-default-500">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          tabs={tabs}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        <div className="mt-6">{renderTabContent()}</div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-danger-50 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-danger"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    fillRule="evenodd"
                  />
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
