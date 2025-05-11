import { UserModel } from "../lib/auth";

import ResendVerificationEmail from "./ResendVerificationEmail";

interface EmailVerificationStatusProps {
  user: UserModel;
  className?: string;
  showResendButton?: boolean;
}

export default function EmailVerificationStatus({
  user,
  className = "",
  showResendButton = true,
}: EmailVerificationStatusProps) {
  // Assuming the user model has an email_verified_at field
  const isVerified = !!user.email_verified_at;

  return (
    <div className={`rounded-md p-4 ${className}`}>
      {isVerified ? (
        <div className="flex items-center space-x-2 text-success-700 bg-success-50 p-3 rounded-md">
          <svg
            className="h-5 w-5 text-success"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              fillRule="evenodd"
            />
          </svg>
          <span>Email verified</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-warning-700 bg-warning-50 p-3 rounded-md">
            <svg
              className="h-5 w-5 text-warning"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                fillRule="evenodd"
              />
            </svg>
            <span>Email not verified</span>
          </div>

          {showResendButton && (
            <div className="mt-2">
              <ResendVerificationEmail
                buttonSize="sm"
                buttonText="Resend verification email"
                buttonVariant="light"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
