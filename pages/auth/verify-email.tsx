import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import { verifyEmail, formatApiError, getAuth } from "../../lib/auth";
import ResendVerificationEmail from "../../components/ResendVerificationEmail";

export default function VerifyEmail() {
  const router = useRouter();
  const { id, hash } = router.query;

  // Only redirect to admin if we don't have id & hash and no verification is in progress
  // This allows both:
  // 1. Already authenticated users to verify a new email
  // 2. Successful verification to show the success message
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const shouldRedirect = false; //(!id || !hash) && !verificationAttempted;

  // Redirect to admin dashboard only if already authenticated and missing verification parameters
  // and no verification has been attempted
  // useAuth({ redirectIfFound: shouldRedirect });

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const auth = getAuth();

    setIsAuthenticated(!!auth);
  }, []);

  // Effect to verify token when available
  useEffect(() => {
    if (!id || !hash || typeof id !== "string" || typeof hash !== "string")
      return;

    const verifyEmailHash = async () => {
      setVerificationAttempted(true);
      try {
        await verifyEmail(id, hash);
        // Add a small delay to ensure the UI transition feels natural
        setTimeout(() => {
          setStatus("success");
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error("Email verification error:", err);
        const errorMessage =
          err instanceof Error ? err.message : formatApiError(err);

        setError(
          errorMessage ||
            "The verification link is invalid or has expired. Please request a new verification link.",
        );
        setStatus("error");
        setIsLoading(false);
      }
    };

    verifyEmailHash();
  }, [id, hash]);

  // Handle navigation based on authentication status
  const handleNavigation = () => {
    if (isAuthenticated) {
      router.push("/admin");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email - ScaleUp CRM</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md text-center">
          {status === "loading" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Verifying your email
              </h1>
              <p className="mt-2 text-default-500">
                Please wait while we verify your email address...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
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
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-success">
                Email verified!
              </h1>
              <p className="mt-2 text-default-600">
                Your email has been successfully verified. You can now access
                all features of the application.
              </p>
              <div className="mt-6">
                <Button
                  className="w-full"
                  color="primary"
                  onClick={handleNavigation}
                >
                  {isAuthenticated ? "Back to Home" : "Continue to Login"}
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
                <svg
                  className="h-6 w-6 text-danger"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-danger">
                Verification failed
              </h1>
              <p className="mt-2 text-default-600">{error}</p>
              <div className="mt-6 space-y-4">
                <ResendVerificationEmail
                  fullWidth
                  buttonText="Resend Verification Email"
                />
                <div>
                  <Link
                    className="text-primary"
                    href={isAuthenticated ? "/admin" : "/auth/login"}
                  >
                    {isAuthenticated ? "Back to Home" : "Back to Login"}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
