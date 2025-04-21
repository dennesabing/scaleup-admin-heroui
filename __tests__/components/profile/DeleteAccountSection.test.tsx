import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import { deleteUserAccount } from '@/lib/userService';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
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
  
  it('renders the initial delete account button', () => {
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.queryByText('Permanently Delete Account')).not.toBeInTheDocument();
  });
  
  it('shows the confirmation form when Delete Account button is clicked', () => {
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    fireEvent.click(screen.getByText('Delete Account'));
    
    expect(screen.getByText('Permanently Delete Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Your Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/)).toBeInTheDocument();
  });
  
  it('validates form inputs correctly', async () => {
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    fireEvent.click(screen.getByText('Delete Account'));
    
    const emailInput = screen.getByLabelText('Confirm Your Email');
    const passwordInput = screen.getByLabelText('Your Password');
    const confirmationInput = screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/);
    const submitButton = screen.getByText('Permanently Delete Account');
    
    // Initially the button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Fill form with invalid data
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmationInput, { target: { value: 'delete' } });
    
    // Button should still be disabled
    expect(submitButton).toBeDisabled();
    
    // Display validation errors
    expect(screen.getByText('Please enter your exact email address')).toBeInTheDocument();
    expect(screen.getByText(/Please type "DELETE MY ACCOUNT" exactly/)).toBeInTheDocument();
    
    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmationInput, { target: { value: 'DELETE MY ACCOUNT' } });
    
    // Button should be enabled
    expect(submitButton).not.toBeDisabled();
  });
  
  it('shows success modal when account is deleted successfully', async () => {
    (deleteUserAccount as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    fireEvent.click(screen.getByText('Delete Account'));
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Confirm Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Your Password'), { 
      target: { value: 'password123' } 
    });
    fireEvent.change(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/), { 
      target: { value: 'DELETE MY ACCOUNT' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Permanently Delete Account'));
    
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
      expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });
  });
  
  it('handles errors when delete fails', async () => {
    const errorMessage = 'Invalid password';
    (deleteUserAccount as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    fireEvent.click(screen.getByText('Delete Account'));
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Confirm Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Your Password'), { 
      target: { value: 'password123' } 
    });
    fireEvent.change(screen.getByLabelText(/Type "DELETE MY ACCOUNT" exactly/), { 
      target: { value: 'DELETE MY ACCOUNT' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Permanently Delete Account'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
      
      // Success modal should not be shown
      expect(screen.queryByText('Account Deleted Successfully')).not.toBeInTheDocument();
    });
  });
  
  it('allows cancelling the deletion process', () => {
    render(<DeleteAccountSection user={mockUser} onError={mockOnError} />);
    
    // Open the form
    fireEvent.click(screen.getByText('Delete Account'));
    
    // Fill form with some data
    fireEvent.change(screen.getByLabelText('Confirm Your Email'), { 
      target: { value: 'test@example.com' } 
    });
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Form should be hidden again
    expect(screen.queryByLabelText('Confirm Your Email')).not.toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });
}); 