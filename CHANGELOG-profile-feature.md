# User Profile Management Feature - CHANGELOG

## [0.2.0] - Unreleased
This release adds comprehensive user profile management functionality, allowing users to update their profile information, change passwords, update email addresses, and delete their accounts.

### Added
- New user profile page with four major sections:
  - Profile information management
  - Password updates
  - Email address updates
  - Account deletion
- Created `userService.ts` with API services for user profile management:
  - `updateUserProfile()` - Update basic user information (name)
  - `updateUserPassword()` - Update user password with current password verification
  - `updateUserEmail()` - Change email address with verification process
  - `deleteUserAccount()` - Permanently delete user account
  - `resendUserVerificationEmail()` - Resend verification email
- Added email verification status indicator with ability to resend verification emails
- Implemented user-friendly success and error messaging for all operations
- Added tests for profile page rendering and functionality verification

### Technical Details
- API endpoints used:
  - `PUT /me/profile` - Update profile information
  - `PUT /me/password` - Update password
  - `PUT /me/email` - Update email address
  - `POST /me/delete` - Delete account
  - Reused existing verification email functionality
- Ensures consistent error handling across all form submissions
- Provides appropriate loading states for all operations
- Includes confirmation requirements for dangerous operations (password + typing "DELETE" for account deletion)
- All forms include appropriate client-side validation 