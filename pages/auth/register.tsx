import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState, useEffect } from "react";
import Head from "next/head";
import { register, formatApiError, getAuth, autoLogin } from "../../lib/auth";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/authMiddleware";
import { redirectWithMessage } from "../../lib/navigation";
import { Chip } from "@heroui/chip";
import { acceptInvitationWithRegistration, verifyInvitation } from "../../lib/services/organizationService";

export default function Register() {
  const router = useRouter();
  const { email: queryEmail, invitation_token, organization_id } = router.query;
  
  // Redirect to admin dashboard if already authenticated
  useAuth({ redirectIfFound: true });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    accept_terms: false,
    token: "",
    organizationId: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInvitation, setIsInvitation] = useState(false);
  const [isVerifyingInvitation, setIsVerifyingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Set invitation data from query parameters and verify invitation
  useEffect(() => {
    if (invitation_token && organization_id && typeof invitation_token === 'string' && typeof organization_id === 'string') {
      setIsVerifyingInvitation(true);
      
      // Verify the invitation token and organization ID
      verifyInvitation(organization_id, invitation_token)
        .then(isValid => {
          if (!isValid) {
            setInvitationError('The invitation is invalid or has expired. Please contact the organization administrator for a new invitation.');
          } else if (queryEmail && typeof queryEmail === 'string') {
            let isInvite = true;
            
            // Update invitation-related fields from query params with correct field names
            setFormData(prev => ({ 
              ...prev, 
              token: invitation_token as string,
              organizationId: organization_id as string,
              email: queryEmail 
            }));
            
            setIsInvitation(isInvite);
          }
        })
        .finally(() => {
          setIsVerifyingInvitation(false);
        });
    } else if (queryEmail && typeof queryEmail === 'string') {
      // Set email from query if there's no invitation data
      setFormData(prev => ({ 
        ...prev, 
        email: queryEmail 
      }));
    }
  }, [queryEmail, invitation_token, organization_id]);

  // Auto-fill form with fake data when in development environment
  useEffect(() => {
    // Only auto-fill in development mode and when not handling an invitation
    if (process.env.NODE_ENV === 'development' && !isInvitation) {
      // Generate random data to avoid duplicate emails
      const randomNum = Math.floor(Math.random() * 10000);
      setFormData(prev => ({
        ...prev,
        name: `Test User ${randomNum}`,
        email: `test.user${randomNum}@example.com`,
        password: "Password123!",
        password_confirmation: "Password123!",
        accept_terms: true
      }));
    }
  }, [isInvitation]);

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
    
    // Block submission if the invitation is invalid
    if (invitationError) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call register with or without invitation data
      if (isInvitation && formData.token && formData.organizationId) {
        // For invitations, use the direct invitation acceptance endpoint
        await acceptInvitationWithRegistration(
          formData.organizationId,
          formData.token,
          formData
        );
        
        // Auto-login the user after successful registration
        try {
          await autoLogin(formData.email, formData.password);
          
          // Redirect directly to the organization page
          router.push(`/organizations/${formData.organizationId}`);
          return; // Exit early to avoid the login page redirect below
        } catch (loginError) {
          console.error("Auto-login failed:", loginError);
          // If auto-login fails, we'll just redirect to login page
        }
      } else {
        // Normal registration flow
        await register(
          formData.email,
          formData.password,
          formData.name,
          formData.password_confirmation,
          formData.accept_terms
        );
      }
      
      // Redirect to login page with success message
      redirectWithMessage(
        router,
        "/auth/login",
        "Registration successful! Please check your email to verify your account."
      );
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
            {isInvitation && !invitationError && (
              <Chip color="primary" variant="flat" className="mt-2">
                Organization Invitation
              </Chip>
            )}
            <p className="mt-2 text-default-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary">
                Sign in
              </Link>
            </p>
          </div>

          {isVerifyingInvitation && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-default-500">Verifying invitation...</p>
            </div>
          )}

          {invitationError && (
            <div className="mt-4 rounded-md bg-danger-100 p-4 text-danger-700">
              <h3 className="text-lg font-semibold mb-1">Invalid Invitation</h3>
              <p>{invitationError}</p>
              <Button 
                className="mt-4"
                variant="flat"
                onPress={() => router.push('/auth/login')}
              >
                Go to Login
              </Button>
            </div>
          )}

          {errors.form && (
            <div className="mt-4 rounded-md bg-danger-100 p-3 text-danger-700">
              {errors.form}
            </div>
          )}

          {!invitationError && !isVerifyingInvitation && (
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
                    isReadOnly={isInvitation}
                    disabled={isInvitation}
                  />
                  {isInvitation && (
                    <p className="mt-1 text-xs text-default-500">
                      Email address from invitation cannot be changed
                    </p>
                  )}
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
                  {isInvitation ? "Accept Invitation & Create Account" : "Create Account"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 