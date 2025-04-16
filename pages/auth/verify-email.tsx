import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Effect to verify token when available
  useEffect(() => {
    if (!token) return;

    const verifyEmailToken = async () => {
      try {
        // TODO: Connect to API to verify token
        console.log("Verifying token:", token);
        
        // Simulate API delay and success
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set success state
        setStatus("success");
      } catch (error) {
        console.error("Email verification error:", error);
        setError("The verification link is invalid or has expired. Please request a new verification link.");
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmailToken();
  }, [token]);

  const resendVerificationEmail = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Connect to API to resend verification email
      console.log("Resending verification email");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("A new verification email has been sent. Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      alert("Failed to resend verification email. Please try again later.");
    } finally {
      setIsLoading(false);
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
              <h1 className="text-2xl font-bold tracking-tight">Verifying your email</h1>
              <p className="mt-2 text-default-500">Please wait while we verify your email address...</p>
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
                <svg className="h-6 w-6 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-success">Email verified!</h1>
              <p className="mt-2 text-default-600">
                Your email has been successfully verified. You can now access all features of the application.
              </p>
              <div className="mt-6">
                <Button 
                  color="primary" 
                  className="w-full"
                  onClick={() => router.push("/auth/login")}
                >
                  Continue to Login
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
                <svg className="h-6 w-6 text-danger" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-danger">Verification failed</h1>
              <p className="mt-2 text-default-600">{error}</p>
              <div className="mt-6 space-y-4">
                <Button 
                  color="primary" 
                  className="w-full"
                  onClick={resendVerificationEmail}
                  isLoading={isLoading}
                >
                  Resend Verification Email
                </Button>
                <div>
                  <Link href="/auth/login" className="text-primary">
                    Back to login
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