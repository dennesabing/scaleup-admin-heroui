import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import { deleteUserAccount } from '@/lib/userService';

// Mock Next.js router
const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock the userService module
jest.mock('@/lib/userService', () => ({
  deleteUserAccount: jest.fn(),
}));

describe('DeleteAccountSection', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };
  
  const mockOnError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the initial delete account button', async () => {
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Permanently Delete Account' })).not.toBeInTheDocument();
  });
  
  it('shows the confirmation form when Delete Account button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    expect(screen.getByRole('button', { name: 'Permanently Delete Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Your Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/)).toBeInTheDocument();
  });
  
  it('validates form inputs correctly', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    const emailInput = screen.getByLabelText('Confirm Your Email');
    const passwordInput = screen.getByLabelText('Your Password');
    const confirmationInput = screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/);
    const submitButton = screen.getByRole('button', { name: 'Permanently Delete Account' });
    
    // Initially the button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Fill form with invalid data
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmationInput, 'delete');
    
    // Button should still be disabled
    expect(submitButton).toBeDisabled();
    
    // Display validation errors
    expect(screen.getByText('Please enter your exact email address')).toBeInTheDocument();
    expect(screen.getByText(/Please type "DELETE MY ACCOUNT" exactly/)).toBeInTheDocument();
    
    // Clear fields and fill form with valid data
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    await user.clear(confirmationInput);
    await user.type(confirmationInput, 'DELETE MY ACCOUNT');
    
    // Button should be enabled
    expect(submitButton).not.toBeDisabled();
  });
  
  it('shows success modal when account is deleted successfully', async () => {
    (deleteUserAccount as jest.Mock).mockResolvedValueOnce(undefined);
    
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    // Fill form with valid data
    await user.type(screen.getByLabelText('Confirm Your Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Your Password'), 'password123');
    await user.type(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/), 'DELETE MY ACCOUNT');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));
    
    await waitFor(() => {
      expect(deleteUserAccount).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmation: 'DELETE MY ACCOUNT'
      });
      
      // Success modal should be shown
      expect(screen.getByText('Account Deleted Successfully')).toBeInTheDocument();
      expect(screen.getByText(/Your account with email/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to Login' })).toBeInTheDocument();
    });
  });
  
  it('redirects to login page when clicking button in success modal', async () => {
    (deleteUserAccount as jest.Mock).mockResolvedValueOnce(undefined);
    
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    // Fill form with valid data
    await user.type(screen.getByLabelText('Confirm Your Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Your Password'), 'password123');
    await user.type(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/), 'DELETE MY ACCOUNT');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));
    
    // Wait for success modal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Return to Login' })).toBeInTheDocument();
    });
    
    // Click on return to login button
    await user.click(screen.getByRole('button', { name: 'Return to Login' }));
    
    // Check that router.push was called with login path
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/login');
  });
  
  it('handles errors when delete fails', async () => {
    const errorMessage = 'Invalid password';
    (deleteUserAccount as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    // Fill form with valid data
    await user.type(screen.getByLabelText('Confirm Your Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Your Password'), 'password123');
    await user.type(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/), 'DELETE MY ACCOUNT');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
      
      // Success modal should not be shown
      expect(screen.queryByText('Account Deleted Successfully')).not.toBeInTheDocument();
    });
  });
  
  it('allows cancelling the deletion process', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));
    
    // Fill form with some data
    await user.type(screen.getByLabelText('Confirm Your Email'), 'test@example.com');
    
    // Click cancel
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Form should be hidden again
    expect(screen.queryByLabelText('Confirm Your Email')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
  });
}); 