import { render, screen } from '@testing-library/react';
import { act } from 'react';
import Register from '@/pages/auth/register';

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  register: jest.fn(),
}));

// Mock the auth middleware
jest.mock('@/lib/authMiddleware', () => ({
  useAuth: jest.fn().mockReturnValue({}),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    isReady: true,
  }),
}));

describe('Register Page', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form correctly', async () => {
    await act(async () => {
      render(<Register />);
    });
    
    // Check for main elements
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  test('has correct input fields with proper attributes', async () => {
    await act(async () => {
      render(<Register />);
    });
    
    // Check name field
    const nameInput = screen.getByLabelText(/full name/i);
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('required');
    
    // Check email field
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    
    // Check for the presence of password fields 
    const passwordInputs = screen.getAllByLabelText(/password/i, { exact: false });
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    passwordInputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'password');
    });
    
    // Check that there's a checkbox input
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });
}); 