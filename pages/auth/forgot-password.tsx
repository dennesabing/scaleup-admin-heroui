import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { forgotPassword } from "@/lib/auth";
import { useAuth } from "@/lib/authMiddleware";

export default function ForgotPassword() {
  // Redirect to admin dashboard if already authenticated
  useAuth({ redirectIfFound: true });

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");

      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // For security reasons, we don't want to reveal if an email exists or not
      // So we still show success message even if the API returns an error
      console.error("Password reset error:", err);
      setIsSubmitted(true); // Always show success message
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
                <h1 className="text-2xl font-bold tracking-tight">
                  Reset your password
                </h1>
                <p className="mt-2 text-default-500">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-danger-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-danger"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium" htmlFor="email">
                    Email Address
                  </label>
                  <Input
                    required
                    className="mt-1 block w-full"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Button
                    className="w-full"
                    color="primary"
                    isLoading={isLoading}
                    type="submit"
                  >
                    Send Reset Link
                  </Button>
                </div>

                <div className="text-center">
                  <Link className="text-sm text-primary" href="/auth/login">
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-success">
                Check your email
              </h1>
              <p className="mt-4 text-default-600">
                If <strong>{email}</strong> is associated with an account, we've
                sent a password reset link to this address.
              </p>
              <p className="mt-2 text-default-500">
                If you don't see it in your inbox, please check your spam folder
                or try again with the correct email address.
              </p>
              <div className="mt-6">
                <Link className="text-primary" href="/auth/login">
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
