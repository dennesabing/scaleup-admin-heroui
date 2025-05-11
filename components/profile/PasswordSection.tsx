import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { updateUserPassword } from "@/lib/services/userService";

interface PasswordSectionProps {
  onError: (error: unknown) => void;
}

export default function PasswordSection({ onError }: PasswordSectionProps) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [initialPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  // Visibility state for password fields
  const [passwordVisibility, setPasswordVisibility] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  });

  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Check if form has changes and is valid
  const formStatus = useMemo(() => {
    // Check if anything has changed from initial state
    const hasChanges =
      passwordForm.current_password.length > 0 ||
      passwordForm.password.length > 0 ||
      passwordForm.password_confirmation.length > 0;

    // Check if new password is different from current
    const isDifferentPassword =
      passwordForm.current_password.length > 0 &&
      passwordForm.password.length > 0 &&
      passwordForm.current_password !== passwordForm.password;

    // Check for form validity
    const isValid =
      passwordForm.current_password.length > 0 &&
      passwordForm.password.length >= 8 &&
      passwordForm.password === passwordForm.password_confirmation &&
      isDifferentPassword;

    // Check for password mismatch
    const passwordsMatch =
      passwordForm.password === passwordForm.password_confirmation ||
      passwordForm.password.length === 0 ||
      passwordForm.password_confirmation.length === 0;

    return {
      hasChanges,
      isValid,
      passwordsMatch,
      isDifferentPassword,
    };
  }, [passwordForm]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    // Clear error messages when user types
    if (passwordError) setPasswordError("");
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if no changes or validation errors
    if (!formStatus.hasChanges || !formStatus.isValid) return;

    // Check for password mismatch
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError("Passwords do not match");

      return;
    }

    // Check if new password is same as current password
    if (!formStatus.isDifferentPassword) {
      setPasswordError(
        "New password must be different from your current password",
      );

      return;
    }

    setPasswordSuccess("");
    setPasswordError("");
    setIsPasswordLoading(true);

    try {
      await updateUserPassword(passwordForm);
      setPasswordSuccess("Password updated successfully");
      // Reset form after successful update
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      onError(err);
      setPasswordError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the password",
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="bg-background rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Update Password</h2>
      <p className="text-default-500 mb-4">
        Ensure your account is using a secure password.
      </p>

      <form className="space-y-4" onSubmit={handleUpdatePassword}>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="current_password"
          >
            Current Password
          </label>
          <div className="relative">
            <Input
              required
              className="w-full pr-10"
              id="current_password"
              name="current_password"
              type={passwordVisibility.current_password ? "text" : "password"}
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              type="button"
              onClick={() => togglePasswordVisibility("current_password")}
            >
              {passwordVisibility.current_password ? (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    clipRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    fillRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    fillRule="evenodd"
                  />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <Input
              required
              className={`w-full pr-10 ${
                (passwordForm.password.length > 0 &&
                  passwordForm.password.length < 8) ||
                (passwordForm.password &&
                  passwordForm.current_password &&
                  !formStatus.isDifferentPassword)
                  ? "border-danger"
                  : ""
              }`}
              id="password"
              name="password"
              type={passwordVisibility.password ? "text" : "password"}
              value={passwordForm.password}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              type="button"
              onClick={() => togglePasswordVisibility("password")}
            >
              {passwordVisibility.password ? (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    clipRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    fillRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    fillRule="evenodd"
                  />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-default-500">
            Use 8+ characters with a mix of letters, numbers & symbols
          </p>
          {passwordForm.password.length > 0 &&
            passwordForm.password.length < 8 && (
              <p className="mt-1 text-xs text-danger">
                Password must be at least 8 characters
              </p>
            )}
          {passwordForm.password &&
            passwordForm.current_password &&
            !formStatus.isDifferentPassword && (
              <p className="mt-1 text-xs text-danger">
                New password must be different from your current password
              </p>
            )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="password_confirmation"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Input
              required
              className={`w-full pr-10 ${passwordForm.password_confirmation.length > 0 && !formStatus.passwordsMatch ? "border-danger" : ""}`}
              id="password_confirmation"
              name="password_confirmation"
              type={
                passwordVisibility.password_confirmation ? "text" : "password"
              }
              value={passwordForm.password_confirmation}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              type="button"
              onClick={() => togglePasswordVisibility("password_confirmation")}
            >
              {passwordVisibility.password_confirmation ? (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    clipRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    fillRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-default-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    fillRule="evenodd"
                  />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          {passwordForm.password_confirmation.length > 0 &&
            !formStatus.passwordsMatch && (
              <p className="mt-1 text-xs text-danger">Passwords do not match</p>
            )}
        </div>

        {passwordSuccess && (
          <div className="mb-4 rounded-md bg-success-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-success">{passwordSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 rounded-md bg-danger-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-danger"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger">{passwordError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 flex justify-end">
          <Button
            className="ml-3"
            color={
              formStatus.hasChanges && formStatus.isValid
                ? "success"
                : "default"
            }
            disabled={
              isPasswordLoading || !formStatus.hasChanges || !formStatus.isValid
            }
            isLoading={isPasswordLoading}
            type="submit"
          >
            {formStatus.hasChanges ? "Update Password" : "No Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
