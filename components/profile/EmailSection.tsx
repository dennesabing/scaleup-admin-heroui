import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { UserModel } from "@/lib/auth";
import { updateUserEmail, resendUserVerificationEmail } from "@/lib/userService";

interface EmailSectionProps {
  user: UserModel;
  onError: (error: unknown) => void;
  onEmailUpdate?: () => void; // Optional callback for parent component refresh
}

export function EmailSection({ user, onError, onEmailUpdate }: EmailSectionProps) {
  // Form state
  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
  });
  
  // Loading and success states
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(user?.email || "");
  const [isEmailVerified, setIsEmailVerified] = useState(!!user?.email_verified_at);
  
  // Update local state when user prop changes
  useEffect(() => {
    setCurrentEmail(user?.email || "");
    setIsEmailVerified(!!user?.email_verified_at);
  }, [user]);
  
  // Check if form is valid
  const formStatus = useMemo(() => {
    // Check if new email is different from current
    const isDifferentEmail = emailForm.email.toLowerCase() !== currentEmail.toLowerCase();
    
    // Check if form has all required fields
    const isComplete = emailForm.email.length > 0 && emailForm.password.length > 0;
    
    // Check if email is valid format
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email);
    
    return {
      isDifferentEmail,
      isComplete,
      isValidEmail,
      isValid: isDifferentEmail && isComplete && isValidEmail
    };
  }, [emailForm, currentEmail]);
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error messages when user types
    if (error) setError("");
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!formStatus.isComplete) {
      setError("Please fill in all fields");
      return;
    }
    
    if (!formStatus.isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (!formStatus.isDifferentEmail) {
      setError("New email must be different from your current email");
      return;
    }
    
    setSuccess("");
    setError("");
    setIsLoading(true);
    
    try {
      await updateUserEmail(emailForm);
      setSuccess("Email updated successfully. Please check your inbox for verification.");
      setEmailForm((prev) => ({ ...prev, password: "", email: "" }));
      
      // Update local state to reflect the change
      setCurrentEmail(emailForm.email);
      setIsEmailVerified(false);
      
      // Clear verification success message since email is now changed
      setVerificationSuccess("");
      
      // Notify parent component if callback provided
      if (onEmailUpdate) {
        onEmailUpdate();
      }
    } catch (err) {
      onError(err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'An error occurred while updating the email'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend verification email
  const handleResendVerification = async () => {
    if (isVerificationLoading) return;
    
    setVerificationError("");
    setVerificationSuccess("");
    setIsVerificationLoading(true);
    
    try {
      await resendUserVerificationEmail();
      setVerificationSuccess("Verification email sent successfully!");
      
      // Notify parent component if callback provided
      if (onEmailUpdate) {
        onEmailUpdate();
      }
    } catch (err) {
      console.error(err);
      setVerificationError("Failed to send verification email. Please try again.");
    }
    
    setIsVerificationLoading(false);
  };
  
  return (
    <div className="bg-background shadow rounded-lg p-6 mt-6">
      <h2 className="text-lg font-medium mb-4">Update Email Address</h2>
      <p className="text-default-500 mb-4">
        Update your email address. A verification link will be sent to your new email.
      </p>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Current Email:</span>
          <span>{currentEmail}</span>
          {isEmailVerified ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
              Unverified
            </span>
          )}
        </div>
        
        {!isEmailVerified && (
          <div className="mt-2">
            {verificationSuccess ? (
              <p className="text-sm text-success">{verificationSuccess}</p>
            ) : (
              <p className="text-sm text-warning-500">
                Your email address is not verified.
                <button 
                  type="button"
                  className="ml-1 text-primary hover:text-primary-dark"
                  onClick={handleResendVerification}
                  disabled={isVerificationLoading}
                >
                  {isVerificationLoading ? "Sending..." : "Resend verification email"}
                </button>
              </p>
            )}
            {verificationError && (
              <p className="text-sm text-danger mt-1">{verificationError}</p>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="new_email" className="block text-sm font-medium">
              New Email
            </label>
            <Input
              id="new_email"
              name="email"
              type="email"
              value={emailForm.email}
              onChange={handleChange}
              required
              placeholder="new@example.com"
              className={`mt-1 w-full ${emailForm.email && !formStatus.isDifferentEmail ? 'border-danger' : ''}`}
            />
            {emailForm.email && !formStatus.isDifferentEmail && (
              <p className="mt-1 text-xs text-danger">
                New email must be different from your current email
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Current Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={emailForm.password}
              onChange={handleChange}
              required
              placeholder="Enter your current password"
              className="mt-1 w-full"
            />
            <p className="mt-1 text-xs text-default-500">
              We need your current password to verify your identity.
            </p>
          </div>
          
          {success && (
            <div className="rounded-md bg-success-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-success">{success}</p>
                </div>
              </div>
            </div>
          )}
          
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
          
          <div className="flex justify-end">
            <Button
              type="submit"
              color={formStatus.isValid ? "success" : "default"}
              isLoading={isLoading}
              disabled={isLoading || !formStatus.isValid}
              className="ml-3"
            >
              Update Email
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 