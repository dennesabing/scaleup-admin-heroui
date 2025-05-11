import { render, screen } from "@testing-library/react";
import { act } from "react";

import ForgotPassword from "@/pages/auth/forgot-password";

// Mock the auth functions
jest.mock("@/lib/auth", () => ({
  forgotPassword: jest.fn(),
}));

// Mock the auth middleware
jest.mock("@/lib/authMiddleware", () => ({
  useAuth: jest.fn().mockReturnValue({}),
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    isReady: true,
  }),
}));

describe("Forgot Password Page", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders forgot password form correctly", async () => {
    await act(async () => {
      render(<ForgotPassword />);
    });

    // Check for main elements
    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test("has correct input field with proper attributes", async () => {
    await act(async () => {
      render(<ForgotPassword />);
    });

    // Check email field
    const emailInput = screen.getByLabelText(/email address/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
  });

  test("displays email validation guidance text", async () => {
    await act(async () => {
      render(<ForgotPassword />);
    });

    expect(
      screen.getByText(/enter your email address and we'll send you a link/i),
    ).toBeInTheDocument();
  });
});
