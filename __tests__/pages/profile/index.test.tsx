import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/pages/profile/index';
import { getCurrentUser, getUser } from '@/lib/auth';
import { useAuth } from '@/lib/authMiddleware';
import useApiError from '@/hooks/useApiError';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth middleware
jest.mock('@/lib/authMiddleware', () => ({
  useAuth: jest.fn(),
}));

// Mock the auth service
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  getUser: jest.fn(),
  UserModel: {},
}));

// Mock the API error hook
jest.mock('@/hooks/useApiError', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the profile components
jest.mock('@/components/profile', () => ({
  ProfileSection: ({ user, onError }) => (
    <div data-testid="profile-section">
      Profile Section (User ID: {user?.id})
      <button onClick={() => onError(new Error('Test error'))}>Test Error</button>
    </div>
  ),
  PasswordSection: ({ onError }) => (
    <div data-testid="password-section">
      Password Section
      <button onClick={() => onError(new Error('Test error'))}>Test Error</button>
    </div>
  ),
  EmailSection: ({ user, onError, onEmailUpdate }) => (
    <div data-testid="email-section">
      Email Section (Email: {user?.email})
      <button onClick={() => onError(new Error('Test error'))}>Test Error</button>
      <button onClick={onEmailUpdate}>Refresh</button>
    </div>
  ),
  DeleteAccountSection: ({ user, onError }) => (
    <div data-testid="delete-section">
      Delete Account Section (Email: {user?.email})
      <button onClick={() => onError(new Error('Test error'))}>Test Error</button>
    </div>
  ),
}));

// Mock the layout
jest.mock('@/layouts/admin', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

describe('ProfilePage', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2023-01-01',
  };
  
  const mockErrorHook = {
    error: '',
    clearError: jest.fn(),
    handleError: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mocks
    (useAuth as jest.Mock).mockImplementation(() => {});
    (getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (useApiError as jest.Mock).mockReturnValue(mockErrorHook);
  });
  
  it('renders the profile page with default tab (profile information)', () => {
    render(<ProfilePage />);
    
    // Check page title and description
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings and preferences')).toBeInTheDocument();
    
    // Check that tabs are rendered
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    
    // Check that the profile section is shown by default
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
    expect(screen.queryByTestId('password-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-section')).not.toBeInTheDocument();
  });
  
  it('changes tabs when clicked', () => {
    render(<ProfilePage />);
    
    // Click on the Password tab
    fireEvent.click(screen.getByText('Password'));
    
    // Check that password section is now shown
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('password-section')).toBeInTheDocument();
    
    // Click on the Email tab
    fireEvent.click(screen.getByText('Email'));
    
    // Check that email section is now shown
    expect(screen.queryByTestId('password-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('email-section')).toBeInTheDocument();
    
    // Click on the Delete Account tab
    fireEvent.click(screen.getByText('Delete Account'));
    
    // Check that delete account section is now shown
    expect(screen.queryByTestId('email-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('delete-section')).toBeInTheDocument();
    
    // Click back to Profile Information tab
    fireEvent.click(screen.getByText('Profile Information'));
    
    // Check that profile section is shown again
    expect(screen.queryByTestId('delete-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
  });
  
  it('handles errors from child components', () => {
    render(<ProfilePage />);
    
    // Trigger an error in the profile section
    fireEvent.click(screen.getByText('Test Error'));
    
    // Check that error handler was called
    expect(mockErrorHook.handleError).toHaveBeenCalledWith(new Error('Test error'));
  });
  
  it('loads user data on mount', () => {
    render(<ProfilePage />);
    
    // Check that getCurrentUser was called to load initial data
    expect(getCurrentUser).toHaveBeenCalled();
    
    // User data should be passed to components
    expect(screen.getByText('Profile Section (User ID: 1)')).toBeInTheDocument();
  });
  
  it('refreshes user data when email is updated', async () => {
    render(<ProfilePage />);
    
    // Switch to email tab
    fireEvent.click(screen.getByText('Email'));
    
    // Click refresh button on email section
    fireEvent.click(screen.getByText('Refresh'));
    
    // Check that getUser was called to refresh data
    await waitFor(() => {
      expect(getUser).toHaveBeenCalled();
    });
  });
  
  it('renders error message when there is an error', () => {
    // Set up error in the hook
    (useApiError as jest.Mock).mockReturnValue({
      ...mockErrorHook,
      error: 'Something went wrong',
    });
    
    render(<ProfilePage />);
    
    // Check that error message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
}); 