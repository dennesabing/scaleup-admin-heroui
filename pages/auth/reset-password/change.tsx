import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";

import { resetPassword } from "@/lib/auth";
import { useAuth } from "@/lib/authMiddleware";

export default function ResetPasswordChange() {
  // Redirect to admin dashboard if already authenticated
  useAuth({ redirectIfFound: true });

  const router = useRouter();
  const { token, email } = router.query;

  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Ensure we have token and email from URL
  useEffect(() => {
    if (router.isReady && (!token || !email)) {
      router.push("/auth/login");
    }
  }, [router, token, email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing again
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };

        delete newErrors[name];

        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Validate password confirmation
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email as string, token as string, formData.password);

      setIsComplete(true);
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";

      // Check for token expiration error
      if (errorMessage.toLowerCase().includes("invalid or expired token")) {
        setIsTokenExpired(true);
      } else {
        setErrors({ form: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenExpired) {
    return (
      <>
        <Head>
          <title>Reset Link Expired - ScaleUp CRM</title>
        </Head>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Reset Link Expired
              </h1>
              <p className="mt-2 text-default-500">
                This password reset link has expired or is invalid.
              </p>
              <p className="mt-1 text-default-500">
                Password reset links are only valid for a limited time for
                security reasons.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full" color="primary">
                    Request a new reset link
                  </Button>
                </Link>
                <Link className="text-sm text-primary" href="/auth/login">
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password - ScaleUp CRM</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md">
          {!isComplete ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Reset Your Password
                </h1>
                <p className="mt-2 text-default-500">
                  Please choose a new password for your account.
                </p>
              </div>

              {errors.form && (
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
                      <p className="text-sm text-danger">{errors.form}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="password"
                  >
                    New Password
                  </label>
                  <Input
                    required
                    autoComplete="new-password"
                    className={`mt-1 block w-full ${errors.password ? "border-danger" : ""}`}
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-danger">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="password_confirmation"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    required
                    autoComplete="new-password"
                    className={`mt-1 block w-full ${errors.password_confirmation ? "border-danger" : ""}`}
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                  />
                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-danger">
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>

                <div>
                  <Button
                    className="w-full"
                    color="primary"
                    isLoading={isLoading}
                    type="submit"
                  >
                    Reset Password
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-success">
                Password Reset Complete
              </h1>
              <p className="mt-4 text-default-600">
                Your password has been successfully reset.
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
