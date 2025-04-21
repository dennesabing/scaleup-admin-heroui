import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { EmailSection } from '@/components/profile/EmailSection';
import { updateUserEmail, resendUserVerificationEmail } from '@/lib/userService';

// Mock the userService module
jest.mock('@/lib/userService', () => ({
  updateUserEmail: jest.fn(),
  resendUserVerificationEmail: jest.fn(),
}));

describe('EmailSection', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };
  
  const mockUserUnverified = {
    id: 1,
    email: 'unverified@example.com',
    name: 'Test User',
    email_verified_at: null,
  };
  
  const mockUserVerified = {
    id: 1,
    email: 'verified@example.com',
    name: 'Test User',
    email_verified_at: '2023-01-01T00:00:00.000Z',
  };
  
  const mockOnError = jest.fn();
  const mockOnEmailUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with user email properly', () => {
    render(<EmailSection user={mockUser} onError={mockOnError} />);
    
    expect(screen.getByText('Update Email Address')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('shows verified badge when email is verified', () => {
    render(<EmailSection user={mockUserVerified} onError={mockOnError} />);
    
    expect(screen.getByText('verified@example.com')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.queryByText('Unverified')).not.toBeInTheDocument();
    expect(screen.queryByText('Resend verification email')).not.toBeInTheDocument();
  });
  
  it('shows unverified badge and resend option when email is not verified', () => {
    render(<EmailSection user={mockUserUnverified} onError={mockOnError} />);
    
    expect(screen.getByText('unverified@example.com')).toBeInTheDocument();
    expect(screen.getByText('Unverified')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    expect(screen.getByText('Resend verification email')).toBeInTheDocument();
  });
  
  it('validates that new email must be different from current email', () => {
    render(<EmailSection user={mockUser} onError={mockOnError} />);
    
    // Fill form with same email
    fireEvent.change(screen.getByLabelText('New Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Current Password'), { 
      target: { value: 'password123' } 
    });
    
    // Error message should be displayed
    expect(screen.getByText('New email must be different from your current email')).toBeInTheDocument();
    
    // Button should be disabled
    expect(screen.getByText('Update Email').closest('button')).toBeDisabled();
  });
  
  it('calls updateUserEmail with form data on submit', async () => {
    (updateUserEmail as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(
      <EmailSection 
        user={mockUser} 
        onError={mockOnError} 
        onEmailUpdate={mockOnEmailUpdate} 
      />
    );
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('New Email'), { 
      target: { value: 'new@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Current Password'), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Email'));
    
    await waitFor(() => {
      expect(updateUserEmail).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123'
      });
      
      // Success message should be displayed
      expect(screen.getByText(/Email updated successfully/)).toBeInTheDocument();
      
      // Form should be reset
      expect(screen.getByLabelText('New Email')).toHaveValue('');
      expect(screen.getByLabelText('Current Password')).toHaveValue('');
      
      // onEmailUpdate callback should be called
      expect(mockOnEmailUpdate).toHaveBeenCalled();
    });
  });
  
  it('updates local state immediately after email change', async () => {
    (updateUserEmail as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(
      <EmailSection 
        user={mockUserVerified} 
        onError={mockOnError} 
        onEmailUpdate={mockOnEmailUpdate} 
      />
    );
    
    // Initially shows verified status
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('New Email'), { 
      target: { value: 'new@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Current Password'), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Email'));
    
    await waitFor(() => {
      // Email should be updated
      expect(screen.queryByText('verified@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
      
      // Status should now be unverified
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
      expect(screen.getByText('Unverified')).toBeInTheDocument();
      
      // Resend option should be visible
      expect(screen.getByText('Resend verification email')).toBeInTheDocument();
    });
  });
  
  it('calls resendUserVerificationEmail when resend button is clicked', async () => {
    (resendUserVerificationEmail as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(
      <EmailSection 
        user={mockUserUnverified} 
        onError={mockOnError} 
        onEmailUpdate={mockOnEmailUpdate} 
      />
    );
    
    // Click resend verification button
    fireEvent.click(screen.getByText('Resend verification email'));
    
    await waitFor(() => {
      expect(resendUserVerificationEmail).toHaveBeenCalled();
      
      // Success message should be displayed
      expect(screen.getByText('Verification email sent successfully!')).toBeInTheDocument();
      
      // onEmailUpdate callback should be called
      expect(mockOnEmailUpdate).toHaveBeenCalled();
    });
  });
  
  it('handles errors when update email fails', async () => {
    const errorMessage = 'Invalid password';
    (updateUserEmail as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<EmailSection user={mockUser} onError={mockOnError} />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('New Email'), { 
      target: { value: 'new@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Current Password'), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Email'));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });
  });
  
  it('handles errors when resend verification fails', async () => {
    (resendUserVerificationEmail as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<EmailSection user={mockUserUnverified} onError={mockOnError} />);
    
    // Click resend verification button
    fireEvent.click(screen.getByText('Resend verification email'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send verification email. Please try again.')).toBeInTheDocument();
    });
  });
  
  it('updates component state when user prop changes', () => {
    const { rerender } = render(<EmailSection user={mockUser} onError={mockOnError} />);
    
    // Initially shows the original email
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Rerender with a different user
    rerender(<EmailSection user={mockUserVerified} onError={mockOnError} />);
    
    // Should show the new email and verification status
    expect(screen.getByText('verified@example.com')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
}); 