import { useState } from 'react';
import { Button } from '@heroui/button';
import { resendVerificationEmail } from '@/lib/auth';

interface EmailVerificationBannerProps {
  className?: string;
}

export default function EmailVerificationBanner({ className = '' }: EmailVerificationBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail();
      setSuccess(true);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending the verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-warning-50 border border-warning-200 rounded-lg px-4 py-3 mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <svg 
            className="h-5 w-5 text-warning-500 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-warning-800 font-medium">
            Please verify your email address to access all features
          </span>
        </div>
        
        <div className="w-full sm:w-auto">
          <Button
            color="warning"
            size="sm"
            isLoading={isLoading}
            disabled={isLoading || success}
            onClick={handleResendVerification}
            className="w-full sm:w-auto"
          >
            {success ? 'Email sent!' : 'Resend verification email'}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-danger-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-sm text-success-600">
          Verification email sent successfully! Please check your inbox.
        </div>
      )}
    </div>
  );
} 