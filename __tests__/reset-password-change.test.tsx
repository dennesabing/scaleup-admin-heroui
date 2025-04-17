import { render, screen } from '@testing-library/react';
import { act } from 'react';
import ResetPasswordChange from '@/pages/auth/reset-password/change';

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  resetPassword: jest.fn(),
}));

// Mock the auth middleware
jest.mock('@/lib/authMiddleware', () => ({
  useAuth: jest.fn().mockReturnValue({}),
}));

// Mock Next.js router with query params
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { token: 'valid-token', email: 'test@example.com' },
    isReady: true,
  }),
}));

describe('Reset Password Change Page', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders reset password form correctly with token and email', async () => {
    await act(async () => {
      render(<ResetPasswordChange />);
    });
    
    // Check for main elements
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Please choose a new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  test('has password input fields', async () => {
    await act(async () => {
      render(<ResetPasswordChange />);
    });
    
    // Use getAllByRole to find password inputs
    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    
    // Verify they're password type fields
    passwordInputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'password');
    });
  });
  
  test('displays proper guidance text', async () => {
    await act(async () => {
      render(<ResetPasswordChange />);
    });
    
    expect(screen.getByText(/please choose a new password for your account/i)).toBeInTheDocument();
  });
});

// Test when token is missing or invalid
describe('Reset Password Change Page - Missing Token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('redirects when token is missing', async () => {
    // Override the router mock for this specific test
    const mockPush = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
      query: {},
      isReady: true,
    }));
    
    await act(async () => {
      render(<ResetPasswordChange />);
    });
    
    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
}); 