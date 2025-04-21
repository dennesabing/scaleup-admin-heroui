import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { UserModel } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/userService";
import { useRouter } from "next/router";

interface DeleteAccountSectionProps {
  user: UserModel;
  onError: (error: unknown) => void;
}

export default function DeleteAccountSection({ user, onError }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deletedEmail, setDeletedEmail] = useState("");
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
    const isEmailValid = deleteForm.email.toLowerCase() === (user?.email || "").toLowerCase();
    
    // Check if confirmation is exactly "DELETE MY ACCOUNT"
    const isConfirmationValid = deleteForm.confirmation === "DELETE MY ACCOUNT";
    
    // Check if password is entered
    const isPasswordValid = deleteForm.password.length > 0;
    
    return {
      isEmailValid,
      isConfirmationValid,
      isPasswordValid,
      isValid: isEmailValid && isConfirmationValid && isPasswordValid
    };
  }, [deleteForm, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeleteForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (error) setError("");
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
        confirmation: deleteForm.confirmation
      });
      
      // Show success modal instead of relying on automatic redirect
      setShowSuccessModal(true);
      setIsDeleting(false);
    } catch (err) {
      onError(err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting your account"
      );
      setIsDeleting(false);
    }
  };

  const handleRedirectToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <>
      <div className="bg-background shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium mb-4">Delete Account</h2>
        <p className="text-default-500 mb-4">
          Once your account is deleted, all of your resources and data will be permanently deleted. Before
          deleting your account, please download any data or information that you wish to retain.
        </p>

        {!showDeleteForm ? (
          <Button 
            color="danger" 
            variant="flat"
            onClick={() => setShowDeleteForm(true)}
            className="mt-2"
          >
            Delete Account
          </Button>
        ) : (
          <div className="mt-4">
            <div className="rounded-md bg-danger-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-danger">Warning</h3>
                  <div className="mt-2 text-sm text-danger-700">
                    <p>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor="current_email" className="block text-sm font-medium mb-1">
                  Confirm Your Email
                </label>
                <Input
                  id="current_email"
                  name="email"
                  type="email"
                  value={deleteForm.email}
                  onChange={handleChange}
                  className={`w-full ${!formStatus.isEmailValid && deleteForm.email ? 'border-danger' : ''}`}
                  required
                  placeholder="Enter your current email address"
                />
                {!formStatus.isEmailValid && deleteForm.email && (
                  <p className="mt-1 text-xs text-danger">
                    Please enter your exact email address
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="delete_password" className="block text-sm font-medium mb-1">
                  Your Password
                </label>
                <Input
                  id="delete_password"
                  name="password"
                  type="password"
                  value={deleteForm.password}
                  onChange={handleChange}
                  className="w-full"
                  required
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label htmlFor="delete_confirmation" className="block text-sm font-medium mb-1">
                Type "DELETE MY ACCOUNT" exactly, in uppercase to confirm.
                </label>
                <Input
                  id="delete_confirmation"
                  name="confirmation"
                  type="text"
                  value={deleteForm.confirmation}
                  onChange={handleChange}
                  className={`w-full ${!formStatus.isConfirmationValid && deleteForm.confirmation ? 'border-danger' : ''}`}
                  required
                  placeholder=""
                />
                {!formStatus.isConfirmationValid && deleteForm.confirmation && (
                  <p className="mt-1 text-xs text-danger">
                    Please type "DELETE MY ACCOUNT" exactly, in uppercase to confirm
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-danger-50 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                  type="button"
                  variant="flat"
                  color="default"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setDeleteForm({
                      email: "",
                      password: "",
                      confirmation: "",
                    });
                    setError("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="danger"
                  isLoading={isDeleting}
                  disabled={isDeleting || !formStatus.isValid}
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
                <svg className="h-6 w-6 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-default-900 mb-2">Account Deleted Successfully</h3>
              <div className="text-sm text-default-600 mb-4">
                <p>Your account with email <span className="font-medium">{deletedEmail}</span> has been permanently deleted.</p>
                <p className="mt-2">Thank you for using our service.</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                color="primary" 
                onClick={handleRedirectToLogin}
                className="w-full"
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