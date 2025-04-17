import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { login, resendVerificationEmail } from "@/lib/auth";
import useApiError from "@/hooks/useApiError";
import { useAuth } from "@/lib/authMiddleware";

export default function Login() {
  // Redirect to admin dashboard if already authenticated
  useAuth({ redirectIfFound: true });
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { error, clearError, handleError } = useApiError();

  // Set default credentials in development mode or get remembered email
  useEffect(() => {
    // Get remembered email if it exists
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem("rememberedEmail");
      
      if (process.env.NODE_ENV === 'development') {
        setFormData(prev => ({
          ...prev,
          email: "admin@example.com",
          password: "password12345GG$$",
          rememberMe: true
        }));
      } else if (rememberedEmail) {
        setFormData(prev => ({
          ...prev,
          email: rememberedEmail,
          rememberMe: true
        }));
      }
    }
  }, []);

  // Check for success message in query params
  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
    }
  }, [router.query]);

  // Error handling for uncaught errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error("Global error caught:", event.error);
      handleError(event.error || "An unexpected error occurred");
      setIsLoading(false);
    };

    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors or success messages
    clearError();
    setSuccessMessage(null);
    setIsLoading(true);

    // Wrap in try-catch to ensure all errors are handled
    try {
      // Call login function from auth service
      const { email, password, rememberMe } = formData;
      await login(email, password);
      
      // Save email in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      // Redirect to dashboard/admin page
      router.push("/admin");
    } catch (err: unknown) {
      // Check if the error is due to unverified email
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('verify')) {
        // Show a special error message for unverified email
        handleError(new Error('Please verify your email address before logging in.'));
        // Store the email in session storage to use for resending verification
        if (typeof window !== 'undefined' && formData.email) {
          sessionStorage.setItem('pendingVerificationEmail', formData.email);
        }
      } else {
        handleError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, router, clearError, handleError]);

  // Function to handle resending verification email
  const handleResendVerification = useCallback(async () => {
    try {
      await resendVerificationEmail();
      setSuccessMessage('Verification email has been sent. Please check your inbox.');
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  return (
    <>
      <Head>
        <title>Login - ScaleUp CRM</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
            <p className="mt-2 text-default-500">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary">
                Sign up
              </Link>
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Dev Mode:</strong> Using default credentials
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {error && (
            <div className="rounded-md bg-danger-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-danger">{error}</p>
                  {error.toLowerCase().includes('verify') && (
                    <button 
                      onClick={handleResendVerification}
                      className="mt-2 text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-primary">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-default text-primary focus:ring-primary"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-default-600">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 