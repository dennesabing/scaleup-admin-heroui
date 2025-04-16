import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState } from "react";
import Head from "next/head";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Connect to API
    setIsLoading(true);
    
    try {
      // Placeholder for API call
      console.log("Reset password for:", email);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set submitted state to show success message
      setIsSubmitted(true);
    } catch (error) {
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - ScaleUp CRM</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md">
          {!isSubmitted ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
                <p className="mt-2 text-default-500">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full"
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-primary">
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-success">Check your email</h1>
              <p className="mt-4 text-default-600">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="mt-2 text-default-500">
                If you don't see it in your inbox, please check your spam folder.
              </p>
              <div className="mt-6">
                <Link href="/auth/login" className="text-primary">
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 