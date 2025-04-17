import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState, useEffect } from "react";
import Head from "next/head";
import { register, formatApiError, getAuth } from "../../lib/auth";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/authMiddleware";

export default function Register() {
  const router = useRouter();
  
  // Redirect to admin dashboard if already authenticated
  useAuth({ redirectIfFound: true });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    accept_terms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill form with fake data when in development environment
  useEffect(() => {
    // Only auto-fill in development mode
    if (process.env.NODE_ENV === 'development') {
      // Generate random data to avoid duplicate emails
      const randomNum = Math.floor(Math.random() * 10000);
      setFormData({
        name: `Test User ${randomNum}`,
        email: `test.user${randomNum}@example.com`,
        password: "Password123!",
        password_confirmation: "Password123!",
        accept_terms: true
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

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

    // Validate terms acceptance
    if (!formData.accept_terms) {
      newErrors.accept_terms = "You must accept the terms and conditions";
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
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.password_confirmation,
        formData.accept_terms
      );
      
      // Redirect to login page with success message
      router.push({
        pathname: "/admin",
        query: { 
          message: "Registration successful! Please check your email to verify your account." 
        }
      });
    } catch (error) {
      // Handle API errors
      const errorMessage = error instanceof Error ? error.message : formatApiError(error);
      setErrors({ form: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - ScaleUp CRM</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-content1 p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-default-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary">
                Sign in
              </Link>
            </p>
          </div>

          {errors.form && (
            <div className="mt-4 rounded-md bg-danger-100 p-3 text-danger-700">
              {errors.form}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full ${errors.name ? "border-danger" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-500">{errors.name}</p>
                )}
              </div>

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
                  className={`mt-1 block w-full ${errors.email ? "border-danger" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full ${errors.password ? "border-danger" : ""}`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className={`mt-1 block w-full ${errors.password_confirmation ? "border-danger" : ""}`}
                />
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-danger-500">{errors.password_confirmation}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="accept_terms"
                  name="accept_terms"
                  type="checkbox"
                  checked={formData.accept_terms}
                  onChange={handleChange}
                  className={`h-4 w-4 rounded border-default text-primary focus:ring-primary ${errors.accept_terms ? "border-danger" : ""}`}
                />
                <label htmlFor="accept_terms" className="ml-2 block text-sm text-default-600">
                  I accept the Terms of Service and Privacy Policy
                </label>
              </div>
              {errors.accept_terms && (
                <p className="text-sm text-danger-500">{errors.accept_terms}</p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </div>

            <div className="text-center text-sm text-default-500">
              By clicking "Create Account", you agree to our{" "}
              <Link href="/terms" className="text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary">
                Privacy Policy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 