import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { useState } from "react";
import { useAuth } from "@/lib/authMiddleware";

import AdminLayout from "@/layouts/admin";

export default function SettingsPage() {
  // Use the useAuth hook for authentication protection
  useAuth();
  
  const [settings, setSettings] = useState({
    siteName: "ScaleUp CRM",
    contactEmail: "support@scaleupcrm.com",
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
    autoBackup: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
  };

  const handleSwitchChange = (name: string, isSelected: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: isSelected }));
    setSuccessMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Settings saved successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-default-500">Manage application settings</p>
      </div>

      {successMessage && (
        <div className="rounded-md bg-success-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-success-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-lg font-medium">General Settings</h2>
        </div>
        <Divider />
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium mb-1">
                  Site Name
                </label>
                <Input
                  id="siteName"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">
                  Contact Email
                </label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
            </div>
            
            <h3 className="font-medium pt-4">Features</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Notifications</h4>
                  <p className="text-sm text-default-500">Enable email notifications for users</p>
                </div>
                <Switch 
                  isSelected={settings.enableNotifications} 
                  onValueChange={(isSelected) => handleSwitchChange('enableNotifications', isSelected)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Analytics</h4>
                  <p className="text-sm text-default-500">Enable usage analytics</p>
                </div>
                <Switch 
                  isSelected={settings.enableAnalytics} 
                  onValueChange={(isSelected) => handleSwitchChange('enableAnalytics', isSelected)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Maintenance Mode</h4>
                  <p className="text-sm text-default-500">Put application in maintenance mode</p>
                </div>
                <Switch 
                  isSelected={settings.maintenanceMode} 
                  onValueChange={(isSelected) => handleSwitchChange('maintenanceMode', isSelected)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Auto Backup</h4>
                  <p className="text-sm text-default-500">Enable automatic data backups</p>
                </div>
                <Switch 
                  isSelected={settings.autoBackup} 
                  onValueChange={(isSelected) => handleSwitchChange('autoBackup', isSelected)}
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                color="primary"
                isLoading={isLoading}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

SettingsPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
}; 