import { render, screen } from "@testing-library/react";
import { act } from "react";

import Register from "@/pages/auth/register";

// Mock the auth functions
jest.mock("@/lib/auth", () => ({
  register: jest.fn(),
  autoLogin: jest.fn(),
  formatApiError: jest.fn(),
}));

// Mock the auth middleware
jest.mock("@/lib/authMiddleware", () => ({
  useAuth: jest.fn().mockReturnValue({}),
}));

// Mock organization service
jest.mock("@/lib/services/organizationService", () => ({
  verifyInvitation: jest.fn(),
  acceptInvitationWithRegistration: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    isReady: true,
  }),
}));

// Mock navigation helper
jest.mock("@/lib/navigation", () => ({
  redirectWithMessage: jest.fn(),
}));

// Define types for mock components
type ChildrenProps = { children: React.ReactNode };
type ChipProps = { 
  children: React.ReactNode; 
  className?: string; 
  color?: string; 
  variant?: string;
};
type ButtonProps = { 
  children: React.ReactNode; 
  onPress?: () => void; 
  className?: string;
  variant?: string;
  isLoading?: boolean;
};
type InputProps = { 
  label?: string; 
  name?: string; 
  type?: string; 
  value?: string; 
  onChange?: (e: any) => void;
  required?: boolean;
};
type LinkProps = { 
  children: React.ReactNode; 
  href?: string; 
  className?: string;
};

// Mock HeroUI components
jest.mock("@heroui/button", () => ({
  Button: function Button({ children, onPress, className, variant, isLoading }: ButtonProps) {
    return (
      <button 
        onClick={onPress} 
        className={className}
        data-variant={variant}
        disabled={isLoading}
      >
        {children}
      </button>
    );
  },
}));

jest.mock("@heroui/input", () => ({
  Input: function Input({ label, name, type, value, onChange, required }: InputProps) {
    return (
      <div>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          id={name}
          name={name}
          type={type || "text"}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
    );
  },
}));

jest.mock("@heroui/link", () => ({
  Link: function Link({ children, href, className }: LinkProps) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

jest.mock("@heroui/chip", () => ({
  Chip: function Chip({ children, className, color, variant }: ChipProps) {
    return (
      <div 
        className={className} 
        data-color={color} 
        data-variant={variant} 
        data-testid="chip"
      >
        {children}
      </div>
    );
  },
}));

describe("Register Page", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form correctly", async () => {
    await act(async () => {
      render(<Register />);
    });

    // Check for main elements
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  test("has correct input fields with proper attributes", async () => {
    await act(async () => {
      render(<Register />);
    });

    // Check name field
    const nameInput = screen.getByLabelText(/full name/i);

    expect(nameInput).toHaveAttribute("type", "text");
    expect(nameInput).toHaveAttribute("required");

    // Check email field
    const emailInput = screen.getByLabelText(/email address/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");

    // Check for the presence of password fields
    const passwordInputs = screen.getAllByLabelText(/password/i, {
      exact: false,
    });

    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    passwordInputs.forEach((input) => {
      expect(input).toHaveAttribute("type", "password");
    });

    // Check that there's a checkbox input
    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });
});
