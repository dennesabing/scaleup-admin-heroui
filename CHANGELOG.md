# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-04-17

### Fixed
- Email verification page now properly displays success message instead of redirecting prematurely
- Added conditional navigation on verification page that shows "Back to Home" for authenticated users or "Continue to Login" for unauthenticated users
- Fixed loading states and transitions on email verification page

### Changed
- Admin dashboard now fetches fresh user data on load to ensure verification status is current
- Updated localStorage with latest user model from API to maintain consistency

### Added
- Improved error handling during email verification process
- Added verification tracking to prevent unnecessary redirects
- Added small delay for smoother UI transitions after verification
- Added user registration

## [0.2.0] - 2025-04-10

### Added
- Authentication implementation with axios
- Login functionality with proper error handling
- Remember me feature for login credentials
- Default credentials in development mode
- Error boundaries for catching and displaying user-friendly errors
- Custom error handling hook (useApiError)
- Global error handling for authentication errors

### Changed
- Updated login form to display proper error messages
- Improved validation on the login form
- Enhanced error messages for API errors
- Implemented better token management in localStorage

### Fixed
- Unhandled runtime errors during failed authentication
- Login form submission handling to prevent uncaught exceptions
- API error display in login form
- Authentication token handling to prevent redirect loops

## [0.1.0] - 2025-04-01

### Added
- Initial project setup with Next.js
- Implementation of HeroUI component library
- Basic page structure and layout
- Authentication page templates (login, register, forgot password)
- Dashboard page structure
- Basic navigation components 