import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter } from "next/router";

import { UserModel } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/services/userService";

interface DeleteAccountSectionProps {
  user: UserModel;
  onError: (error: unknown) => void;
}

export default function DeleteAccountSection({
  user,
  onError,
}: DeleteAccountSectionProps) {
  const router = useRouter();
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deletedEmail, setDeletedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    email: "",
    password: "",
    confirmation: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  // Validate form inputs
  const formStatus = useMemo(() => {
    // Check if email matches user's email
    const isEmailValid =
      deleteForm.email.toLowerCase() === (user?.email || "").toLowerCase();

    // Check if confirmation is exactly "DELETE MY ACCOUNT"
    const isConfirmationValid = deleteForm.confirmation === "DELETE MY ACCOUNT";

    // Check if password is entered
    const isPasswordValid = deleteForm.password.length > 0;

    return {
      isEmailValid,
      isConfirmationValid,
      isPasswordValid,
      isValid: isEmailValid && isConfirmationValid && isPasswordValid,
    };
  }, [deleteForm, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setDeleteForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formStatus.isValid) {
      setError("Please ensure all fields are filled correctly.");

      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      // Save email before account is deleted
      setDeletedEmail(deleteForm.email);

      await deleteUserAccount({
        email: deleteForm.email,
        password: deleteForm.password,
        confirmation: deleteForm.confirmation,
      });

      // Show success modal instead of relying on automatic redirect
      setShowSuccessModal(true);
      setIsDeleting(false);
    } catch (err) {
      onError(err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting your account",
      );
      setIsDeleting(false);
    }
  };

  const handleRedirectToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <>
      <div className="bg-background rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Delete Account</h2>
        <p className="text-default-500 mb-4">
          Once your account is deleted, all of your resources and data will be
          permanently deleted. Before deleting your account, please download any
          data or information that you wish to retain.
        </p>

        {!showDeleteForm ? (
          <Button
            className="mt-2"
            color="danger"
            variant="flat"
            onClick={() => setShowDeleteForm(true)}
          >
            Delete Account
          </Button>
        ) : (
          <div className="mt-4">
            <div className="rounded-md bg-danger-50 p-4 mb-6">
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
                  <h3 className="text-sm font-medium text-danger">Warning</h3>
                  <div className="mt-2 text-sm text-danger-700">
                    <p>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleDeleteAccount}>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="current_email"
                >
                  Confirm Your Email
                </label>
                <Input
                  required
                  className={`w-full ${!formStatus.isEmailValid && deleteForm.email ? "border-danger" : ""}`}
                  id="current_email"
                  name="email"
                  placeholder="Enter your current email address"
                  type="email"
                  value={deleteForm.email}
                  onChange={handleChange}
                />
                {!formStatus.isEmailValid && deleteForm.email && (
                  <p className="mt-1 text-xs text-danger">
                    Please enter your exact email address
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="delete_password"
                >
                  Your Password
                </label>
                <div className="relative">
                  <Input
                    required
                    className="w-full pr-10"
                    id="delete_password"
                    name="password"
                    placeholder="Enter your current password"
                    type={showPassword ? "text" : "password"}
                    value={deleteForm.password}
                    onChange={handleChange}
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-default-500 hover:text-default-700 focus:outline-none"
                    type="button"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
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
                        className="h-5 w-5"
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
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="delete_confirmation"
                >
                  Type "DELETE MY ACCOUNT" exactly, in uppercase to confirm.
                </label>
                <Input
                  required
                  className={`w-full ${!formStatus.isConfirmationValid && deleteForm.confirmation ? "border-danger" : ""}`}
                  id="delete_confirmation"
                  name="confirmation"
                  placeholder=""
                  type="text"
                  value={deleteForm.confirmation}
                  onChange={handleChange}
                />
                {!formStatus.isConfirmationValid && deleteForm.confirmation && (
                  <p className="mt-1 text-xs text-danger">
                    Please type "DELETE MY ACCOUNT" exactly, in uppercase to
                    confirm
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-danger-50 p-3">
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
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3">
                <Button
                  color="default"
                  disabled={isDeleting}
                  type="button"
                  variant="flat"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setDeleteForm({
                      email: "",
                      password: "",
                      confirmation: "",
                    });
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  disabled={isDeleting || !formStatus.isValid}
                  isLoading={isDeleting}
                  type="submit"
                >
                  Permanently Delete Account
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
                <svg
                  className="h-6 w-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-default-900 mb-2">
                Account Deleted Successfully
              </h3>
              <div className="text-sm text-default-600 mb-4">
                <p>
                  Your account with email{" "}
                  <span className="font-medium">{deletedEmail}</span> has been
                  permanently deleted.
                </p>
                <p className="mt-2">Thank you for using our service.</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                className="w-full"
                color="primary"
                onClick={handleRedirectToLogin}
              >
                Return to Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
