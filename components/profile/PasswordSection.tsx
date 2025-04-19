import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { updateUserPassword } from "../../lib/userService";

interface PasswordSectionProps {
  onError: (error: unknown) => void;
}

export default function PasswordSection({ onError }: PasswordSectionProps) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setIsPasswordLoading(true);
    
    try {
      if (passwordForm.password !== passwordForm.password_confirmation) {
        throw new Error("Passwords do not match");
      }
      
      await updateUserPassword(passwordForm);
      setPasswordSuccess("Password updated successfully");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      onError(err);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Update Password</h2>
      <p className="text-default-500 mb-6">Ensure your account is using a secure password.</p>
      
      {passwordSuccess && (
        <div className="mb-4 rounded-md bg-success-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-success-700">{passwordSuccess}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={passwordForm.password}
            onChange={handlePasswordChange}
            className="w-full"
            required
          />
          <p className="mt-1 text-xs text-default-500">
            Use 8+ characters with a mix of letters, numbers & symbols
          </p>
        </div>
        
        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <Input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            value={passwordForm.password_confirmation}
            onChange={handlePasswordChange}
            className="w-full"
            required
          />
        </div>
        
        <div className="pt-3">
          <Button
            type="submit"
            color="primary"
            isLoading={isPasswordLoading}
            isDisabled={isPasswordLoading}
          >
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
} 