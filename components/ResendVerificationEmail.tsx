import { useState, useCallback } from 'react';
import { Button } from '@heroui/button';
import { resendVerificationEmail, formatApiError } from '../lib/auth';

interface ResendVerificationEmailProps {
  className?: string;
  onSuccess?: () => void;
  buttonText?: string;
  buttonVariant?: 'solid' | 'ghost' | 'light' | 'flat' | 'faded';
  buttonColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  buttonSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function ResendVerificationEmail({
  className = '',
  onSuccess,
  buttonText = 'Resend verification email',
  buttonVariant = 'solid',
  buttonColor = 'primary',
  buttonSize = 'md',
  fullWidth = false,
}: ResendVerificationEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = useCallback(async () => {
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail();
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      const errorMessage = err instanceof Error ? err.message : formatApiError(err);
      setError(errorMessage || 'Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 text-sm text-danger">{error}</p>
      )}
      
      {success && (
        <p className="mb-2 text-sm text-success">Verification email sent! Please check your inbox.</p>
      )}
      
      <Button
        color={buttonColor}
        variant={buttonVariant}
        size={buttonSize}
        isLoading={isLoading}
        disabled={isLoading}
        onClick={handleResend}
        className={fullWidth ? 'w-full' : ''}
      >
        {buttonText}
      </Button>
    </div>
  );
} 