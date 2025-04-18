import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { login, resendVerificationEmail } from "@/lib/auth";
import useApiError from "@/hooks/useApiError";
import { useAuth } from "@/lib/authMiddleware";
import { logCSRFDebug, refreshCSRFToken } from "@/lib/csrf-debug";

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

  // Check for messages from different sources
  useEffect(() => {
    // First check for message in session storage
    if (typeof window !== 'undefined') {
      const sessionMessage = sessionStorage.getItem("alertMessage");
      if (sessionMessage) {
        setSuccessMessage(sessionMessage);
        // Remove message after displaying it
        sessionStorage.removeItem("alertMessage");
      }
    }
    
    // For backward compatibility, also check for message in query params
    // and clean up the URL if found
    if (router.isReady && router.query.message) {
      setSuccessMessage(router.query.message as string);
      
      // Clean up the URL by removing the message query parameter
      const { pathname } = router;
      const query = { ...router.query };
      delete query.message;
      
      // Use shallow routing to update the URL without full page reload
      router.replace(
        { pathname, query },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, router.query]);

  // Debug CSRF on page load
  useEffect(() => {
    // Refresh CSRF token when component mounts
    const initCSRF = async () => {
      try {
        await refreshCSRFToken();
        console.log('CSRF token refreshed on page load: login');
        logCSRFDebug();
      } catch (err) {
        console.error('Error refreshing CSRF token on page load:', err);
      }
    };
    
    initCSRF();
  }, []);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear any error message when user starts typing
    if (error) clearError();
    if (successMessage) setSuccessMessage(null);
  }, [error, clearError, successMessage]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    
    try {
      // Log CSRF debug info before login attempt
      logCSRFDebug();
      
      // Call the login function - no need to refresh token here
      await login(formData.email, formData.password);
      
      // Save email to localStorage if rememberMe is checked
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Get return URL from query string or default to /admin
      const returnUrl = 
        typeof router.query.returnUrl === 'string' 
          ? router.query.returnUrl 
          : '/admin';
      
      // Redirect to return URL
      router.push(returnUrl);
    } catch (err) {
      // If error is CSRF related, try to refresh token and provide more info
      if (err instanceof Error && err.message.includes('CSRF')) {
        console.error('CSRF error detected:', err);
        // Log additional debug info
        logCSRFDebug();
        
        // Show more helpful error message
        handleError(new Error('Authentication error: CSRF token mismatch. Please try refreshing the page.'));
      } else {
        handleError(err);
      }
      
      setIsLoading(false);
      
      // If error includes "not verified" text, show resend verification option
      if (
        err instanceof Error && 
        err.message.toLowerCase().includes('not verified')
      ) {
        setSuccessMessage("Email not verified. Click the button below to resend verification email.");
      }
    }
  }, [formData, router, clearError, handleError]);

  const handleResendVerification = useCallback(async () => {
    setIsLoading(true);
    clearError();
    
    try {
      await resendVerificationEmail(formData.email);
      setSuccessMessage("Verification email has been sent. Please check your inbox.");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, clearError, handleError]);

  return (
    <>
      <Head>
        <title>Login | Admin Dashboard</title>
      </Head>
      <div className="flex min-h-screen flex-col justify-center bg-gray-100 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{successMessage}</div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  Sign in
                </Button>
              </div>
            </form>

            {successMessage && successMessage.includes("not verified") && (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="bordered"
                  onClick={handleResendVerification}
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  Resend Verification Email
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 