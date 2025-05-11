import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PasswordSection from "@/components/profile/PasswordSection";
import { updateUserPassword } from "@/lib/services/userService";

// Mock the userService module
jest.mock("@/lib/services/userService", () => ({
  updateUserPassword: jest.fn(),
}));

describe("PasswordSection", () => {
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the password update form", async () => {
    render(<PasswordSection onError={mockOnError} />);

    expect(
      screen.getByRole("heading", { name: "Update Password" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

    // Use getByRole to get the submit button - look for a button containing No Changes text since form is initially empty
    const submitButton = screen.getByRole("button", { name: /no changes/i });

    expect(submitButton).toBeDisabled();
  });

  it("shows password toggle buttons for each password field", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Find all password visibility toggle buttons (should be 3)
    const toggleButtons = document.querySelectorAll('button[type="button"]');

    expect(toggleButtons.length).toBe(3);

    // Get password inputs
    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");

    // Check initial type is password (hidden)
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Toggle visibility for all fields
    await user.click(toggleButtons[0]);
    await user.click(toggleButtons[1]);
    await user.click(toggleButtons[2]);

    // Check type is now text (visible)
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(newPasswordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
  });

  it("validates that new password must be different from current password", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with the same password for current and new
    await user.type(screen.getByLabelText("Current Password"), "samepassword");
    await user.type(screen.getByLabelText("New Password"), "samepassword");
    await user.type(screen.getByLabelText("Confirm Password"), "samepassword");

    // Error message should be displayed
    expect(
      screen.getByText(
        "New password must be different from your current password",
      ),
    ).toBeInTheDocument();

    // Button should be disabled - now using getByRole
    const submitButton = screen.getByRole("button", {
      name: /update password|no changes/i,
    });

    expect(submitButton).toBeDisabled();
  });

  it("validates that new password must be at least 8 characters", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with a short password
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "short");

    // Error message should be displayed
    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();

    // Button should be disabled - now using getByRole
    const submitButton = screen.getByRole("button", {
      name: /update password|no changes/i,
    });

    expect(submitButton).toBeDisabled();
  });

  it("validates that passwords match", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with non-matching passwords
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "newpassword456",
    );

    // Error message should be displayed
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();

    // Button should be disabled - now using getByRole
    const submitButton = screen.getByRole("button", {
      name: /update password|no changes/i,
    });

    expect(submitButton).toBeDisabled();
  });

  it("enables the button when all validations pass", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "newpassword123",
    );

    // Button should be enabled - now using getByRole
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    expect(submitButton).not.toBeDisabled();
  });

  it("calls updateUserPassword with form data on submit", async () => {
    (updateUserPassword as jest.Mock).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "newpassword123",
    );

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(updateUserPassword).toHaveBeenCalledWith({
        current_password: "current123",
        password: "newpassword123",
        password_confirmation: "newpassword123",
      });

      // Success message should be displayed
      expect(
        screen.getByText("Password updated successfully"),
      ).toBeInTheDocument();

      // Form should be reset
      expect(screen.getByLabelText("Current Password")).toHaveValue("");
      expect(screen.getByLabelText("New Password")).toHaveValue("");
      expect(screen.getByLabelText("Confirm Password")).toHaveValue("");
    });
  });

  it("handles validation in the submit handler", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Set up the form with non-matching passwords
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "different");

    // Manually enable the button (simulate bypassing client validation)
    const button = screen.getByRole("button", {
      name: /update password|no changes/i,
    });

    Object.defineProperty(button, "disabled", { value: false, writable: true });

    // Try to submit the form
    await user.click(button);

    // Should show error and not call API
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("validates same password in the submit handler", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Set up the form with same current and new password
    await user.type(screen.getByLabelText("Current Password"), "samepassword");
    await user.type(screen.getByLabelText("New Password"), "samepassword");
    await user.type(screen.getByLabelText("Confirm Password"), "samepassword");

    // Manually enable the button (simulate bypassing client validation)
    const button = screen.getByRole("button", {
      name: /update password|no changes/i,
    });

    Object.defineProperty(button, "disabled", { value: false, writable: true });

    // Try to submit the form
    await user.click(button);

    // Should show error and not call API
    expect(
      screen.getByText(
        "New password must be different from your current password",
      ),
    ).toBeInTheDocument();
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("handles errors when update password fails", async () => {
    const errorMessage = "Incorrect current password";

    (updateUserPassword as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "newpassword123",
    );

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it("clears error messages when user types", async () => {
    const user = userEvent.setup();

    render(<PasswordSection onError={mockOnError} />);

    // Set error message by submitting invalid form
    await user.type(screen.getByLabelText("Current Password"), "current123");
    await user.type(screen.getByLabelText("New Password"), "short");

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();

    // Clear field and type again to clear error
    await user.clear(screen.getByLabelText("New Password"));
    await user.type(
      screen.getByLabelText("New Password"),
      "long_enough_password",
    );

    // Error should be cleared
    expect(
      screen.queryByText("Password must be at least 8 characters"),
    ).not.toBeInTheDocument();
  });
});
