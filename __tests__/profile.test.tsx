import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '@/pages/profile';
import { useRouter } from 'next/router';

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth middleware
jest.mock('@/lib/authMiddleware', () => ({
  useAuth: jest.fn(),
}));

// Mock the API error hook
jest.mock('@/hooks/useApiError', () => ({
  __esModule: true,
  default: () => ({
    error: null,
    clearError: jest.fn(),
    handleError: jest.fn(),
  }),
}));

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(() => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2023-04-10T12:00:00Z',
  })),
  UserModel: {},
}));

// Mock the user service functions
jest.mock('@/lib/userService', () => ({
  updateUserProfile: jest.fn(),
  updateUserPassword: jest.fn(),
  updateUserEmail: jest.fn(),
  deleteUserAccount: jest.fn(),
  resendUserVerificationEmail: jest.fn(),
}));

// Mock AdminLayout component
jest.mock('../layouts/admin', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

describe('Profile Page', () => {
  beforeEach(() => {
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      query: {},
      isReady: true,
    });
  });

  it('renders the profile page with all sections', () => {
    const { container } = render(<ProfilePage />);
    
    // Check page title and description
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings and preferences')).toBeInTheDocument();
    
    // Check profile section
    const profileSection = screen.getByText('Profile Information').closest('div');
    expect(profileSection).toBeInTheDocument();
    expect(within(profileSection as HTMLElement).getByLabelText('Display Name')).toBeInTheDocument();
    
    // Check password section
    const passwordSection = screen.getByText('Update Password', { selector: 'h2' }).closest('div');
    expect(passwordSection).toBeInTheDocument();
    
    // Check for password input fields by their IDs
    expect(container.querySelector('#current_password')).toBeInTheDocument();
    expect(container.querySelector('#password')).toBeInTheDocument();
    expect(container.querySelector('#password_confirmation')).toBeInTheDocument();
    
    // Check email section
    const emailSection = screen.getByText('Update Email Address').closest('div');
    expect(emailSection).toBeInTheDocument();
    expect(container.querySelector('#new_email')).toBeInTheDocument();
    
    // Check delete account section
    const deleteSection = screen.getByText('Delete Account', { selector: 'h2' }).closest('div');
    expect(deleteSection).toBeInTheDocument();
    expect(container.querySelector('#delete_password')).toBeInTheDocument();
    expect(container.querySelector('#delete_confirm')).toBeInTheDocument();
  });
  
  it('displays verified status for verified email', () => {
    render(<ProfilePage />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
  
  it('handles loading all forms', () => {
    render(<ProfilePage />);
    
    // Check the name field has been populated
    const nameInput = screen.getByLabelText('Display Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Test User');
    
    // Check for the current email displayed in the email section
    const currentEmailLabel = screen.getByText('Current Email:');
    expect(currentEmailLabel.nextElementSibling).toHaveTextContent('test@example.com');
  });
}); 